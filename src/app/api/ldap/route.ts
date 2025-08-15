import { NextResponse } from "next/server";
import { authenticate } from "ldap-authentication";

export async function POST(request: Request) {
  const { username, password } = await request.json();

  if (!username || !password) {
    return NextResponse.json({ success: false, error: "Missing credentials" });
  }

  try {
    const user = await authenticate({
      ldapOpts: {
        url: process.env.LDAP_URL!,
        tlsOptions: { rejectUnauthorized: false },
      },
      adminDn: process.env.LDAP_ADMIN_DN!,
      adminPassword: process.env.LDAP_ADMIN_PASSWORD!,
      userPassword: password,
      userSearchBase: process.env.LDAP_SEARCH_BASE!,
      usernameAttribute: "sAMAccountName",
      username,
      attributes: ["cn", "mail", "displayName", "memberOf"],
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
