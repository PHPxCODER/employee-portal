import { NextResponse } from "next/server";
import ldap from "ldapjs";

export async function POST(request: Request) {
  try {
    const { username } = await request.json();
    
    const ldapUrl = process.env.LDAP_URL!;
    const baseDN = process.env.LDAP_SEARCH_BASE!;
    const adminDN = process.env.LDAP_ADMIN_DN!;
    const adminPass = process.env.LDAP_ADMIN_PASSWORD!;

    const client = ldap.createClient({
      url: ldapUrl,
      tlsOptions: { rejectUnauthorized: false },
    });

    // Bind as admin and search for user
    await new Promise<void>((resolve, reject) => {
      client.bind(adminDN, adminPass, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const userExists = await new Promise<boolean>((resolve) => {
      client.search(baseDN, {
        scope: 'sub',
        filter: `(sAMAccountName=${username})`,
        attributes: ['dn']
      }, (err, res) => {
        if (err) {
          resolve(false);
          return;
        }

        let found = false;
        res.on('searchEntry', () => { found = true; });
        res.on('end', () => { resolve(found); });
        res.on('error', () => { resolve(false); });
      });
    });

    client.unbind();

    return NextResponse.json({ exists: userExists });
  } catch {
    return NextResponse.json({ exists: false }, { status: 500 });
  }
}
