export const runtime = "nodejs";

import { NextResponse } from "next/server";
import ldap from "ldapjs";

export async function POST(request: Request) {
  try {
    const { username } = await request.json();
    if (!username) return NextResponse.json({ exists: false, error: "Username required" });

    const client = ldap.createClient({
      url: process.env.LDAP_URL!,
      tlsOptions: { rejectUnauthorized: false },
      timeout: 5000,
      connectTimeout: 5000,
    });

    // Bind as admin
    await new Promise<void>((resolve, reject) => {
      client.bind(process.env.LDAP_ADMIN_DN!, process.env.LDAP_ADMIN_PASSWORD!, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Search for user
    const found: boolean = await new Promise((resolve, reject) => {
      const opts = {
        scope: "sub" as const,
        filter: `(sAMAccountName=${username})`,
        attributes: ["dn"],
        sizeLimit: 1,
      };

      client.search(process.env.LDAP_SEARCH_BASE!, opts, (err, res) => {
        if (err) return reject(err);

        let exists = false;
        res.on("searchEntry", () => { exists = true; });
        res.on("end", () => resolve(exists));
        res.on("error", (error) => reject(error));
      });
    });

    client.unbind();
    return NextResponse.json({ exists: found });
  } catch (err) {
    return NextResponse.json({ exists: false, error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
