import { NextResponse } from "next/server";
import ldap from "ldapjs";

export async function POST(request: Request) {
  const { username, oldPassword, newPassword } = await request.json();

  if (!username || !oldPassword || !newPassword) {
    return NextResponse.json(
      { success: false, error: "Missing fields" },
      { status: 400 }
    );
  }

  const ldapUrl = process.env.LDAP_URL!;
  const baseDN = process.env.LDAP_SEARCH_BASE!;
  const userDN = `CN=${username},CN=Users,${baseDN}`;

  const adminDN = process.env.LDAP_ADMIN_DN!;
  const adminPass = process.env.LDAP_ADMIN_PASSWORD!;

  if (!adminDN || !adminPass) {
    return NextResponse.json(
      { success: false, error: "Admin credentials not set in environment" },
      { status: 500 }
    );
  }

  const client = ldap.createClient({
    url: ldapUrl,
    tlsOptions: { rejectUnauthorized: false },
  });

  try {
    // 1️⃣ Bind as the user to verify old password
    await new Promise<void>((resolve, reject) => {
      client.bind(userDN, oldPassword, (err) => {
        if (err) return reject(new Error("Invalid old password"));
        resolve();
      });
    });

    // 2️⃣ Bind as admin to change password
    await new Promise<void>((resolve, reject) => {
      client.bind(adminDN, adminPass, (err) => {
        if (err) return reject(new Error("Admin bind failed: " + err.message));
        resolve();
      });
    });

    // 3️⃣ Format new password for AD
    const newPwdBuffer = Buffer.from(`"${newPassword}"`, "utf16le");

    const change = new ldap.Change({
        operation: "replace",
        modification: new ldap.Attribute({
          type: "unicodePwd",
          values: [newPwdBuffer], // ✅ updated from vals → values
        }),
      });

    // 4️⃣ Apply password change
    await new Promise<void>((resolve, reject) => {
      client.modify(userDN, change, (err) => {
        if (err)
          return reject(
            new Error("Password change failed: " + err.message)
          );
        resolve();
      });
    });

    client.unbind();
    return NextResponse.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    client.unbind();
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 400 }
    );
  }
}
