import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/auth";
import ldap from "ldapjs";
import { processImageForAD } from "@/lib/imageUtils";

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

    // Parse the form data
    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: "No image file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Only JPEG and PNG are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: "File size too large. Maximum 5MB allowed." },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // For AD, we need to resize/optimize the image for thumbnailPhoto
    // thumbnailPhoto should be <= 100KB and typically 96x96 pixels
    const processedImage = await processImageForAD(buffer);

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
      // Bind as admin
      await new Promise<void>((resolve, reject) => {
        client.bind(adminDN, adminPass, (err) => {
          if (err) {
            return reject(new Error("Server authentication failed"));
          }
          resolve();
        });
      });

      // Search for the user's DN
      const userDN = await new Promise<string>((resolve, reject) => {
        const searchFilter = `(sAMAccountName=${session.user.username})`;

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

      // Update both thumbnailPhoto and jpegPhoto attributes
      const changes = [
        new ldap.Change({
          operation: "replace",
          modification: new ldap.Attribute({
            type: "thumbnailPhoto",
            values: [processedImage.thumbnail],
          }),
        }),
        new ldap.Change({
          operation: "replace",
          modification: new ldap.Attribute({
            type: "jpegPhoto",
            values: [buffer], // Original image for jpegPhoto
          }),
        }),
      ];

      // Apply changes
      await new Promise<void>((resolve, reject) => {
        client.modify(userDN, changes, (err) => {
          if (err) {
            console.error("LDAP modify error:", err);
            return reject(new Error("Failed to update profile image. Please try again."));
          }
          resolve();
        });
      });

      client.unbind();

      // Create base64 data URI for immediate UI update
      const base64Image = `data:${file.type};base64,${processedImage.thumbnail.toString('base64')}`;
      
      return NextResponse.json({
        success: true,
        message: "Profile image updated successfully",
        imageUrl: base64Image,
      });
      
    } catch (ldapError) {
      client.unbind();
      throw ldapError;
    }
    
  } catch (error) {
    console.error("Image upload error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "An unexpected error occurred" 
      },
      { status: 400 }
    );
  }
}
