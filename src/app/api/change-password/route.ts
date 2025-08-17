import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/auth";
import ldap from "ldapjs";

export async function POST(request: Request) {
  try {
    // Get session to verify user is authenticated
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    const { username, oldPassword, newPassword } = await request.json();

    // Verify the username matches the session (security check)
    if (username !== session.user.username) {
      return NextResponse.json(
        { success: false, error: "Username mismatch" },
        { status: 403 }
      );
    }

    if (!username || !oldPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Basic password validation
    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: "New password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    const ldapUrl = process.env.LDAP_URL!;
    const baseDN = process.env.LDAP_SEARCH_BASE!;
    const adminDN = process.env.LDAP_ADMIN_DN!;
    const adminPass = process.env.LDAP_ADMIN_PASSWORD!;

    if (!adminDN || !adminPass) {
      return NextResponse.json(
        { success: false, error: "Server configuration error" },
        { status: 500 }
      );
    }

    const client = ldap.createClient({
      url: ldapUrl,
      tlsOptions: { rejectUnauthorized: false },
    });

    try {
      // First, bind as admin to search for the user's actual DN
      await new Promise<void>((resolve, reject) => {
        client.bind(adminDN, adminPass, (err) => {
          if (err) {
            return reject(new Error("Server authentication failed"));
          }
          resolve();
        });
      });

      // Search for the user to get their actual DN
      const userDN = await new Promise<string>((resolve, reject) => {
        const searchFilter = `(sAMAccountName=${username})`;

        client.search(baseDN, {
          scope: 'sub',
          filter: searchFilter,
          attributes: ['dn', 'distinguishedName']
        }, (err, res) => {
          if (err) {
            return reject(new Error("User search failed"));
          }

          let userFound = false;
          let foundDN = '';

          res.on('searchEntry', (entry) => {
            userFound = true;
            foundDN = entry.dn.toString();
          });

          res.on('error', () => {
            reject(new Error("User search error"));
          });

          res.on('end', () => {
            if (!userFound) {
              reject(new Error("User not found"));
            } else {
              resolve(foundDN);
            }
          });
        });
      });

      // Now bind as the user with their actual DN to verify password
      await new Promise<void>((resolve, reject) => {
        // Create a new client for user binding
        const userClient = ldap.createClient({
          url: ldapUrl,
          tlsOptions: { rejectUnauthorized: false },
        });

        userClient.bind(userDN, oldPassword, (err) => {
          userClient.unbind(); // Clean up immediately
          
          if (err) {
            return reject(new Error("Current password is incorrect"));
          }
          resolve();
        });
      });

      // Re-bind as admin to change password
      await new Promise<void>((resolve, reject) => {
        client.bind(adminDN, adminPass, (err) => {
          if (err) {
            return reject(new Error("Server authentication failed"));
          }
          resolve();
        });
      });

      // Format new password for AD
      const newPwdBuffer = Buffer.from(`"${newPassword}"`, "utf16le");

      const change = new ldap.Change({
        operation: "replace",
        modification: new ldap.Attribute({
          type: "unicodePwd",
          values: [newPwdBuffer],
        }),
      });

      // Apply password change
      await new Promise<void>((resolve, reject) => {
        client.modify(userDN, change, (err) => {
          if (err) {
            return reject(new Error("Failed to update password. Please try again."));
          }
          resolve();
        });
      });

      client.unbind();
      
      return NextResponse.json({
        success: true,
        message: "Password changed successfully",
      });
      
    } catch (ldapError) {
      client.unbind();
      throw ldapError;
    }
    
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "An unexpected error occurred" 
      },
      { status: 400 }
    );
  }
}