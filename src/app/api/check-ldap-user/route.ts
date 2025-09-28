import { NextResponse } from "next/server";
import ldap from "ldapjs";

export async function POST(request: Request) {
  try {
    const { username } = await request.json();
    
    if (!username) {
      return NextResponse.json({ exists: false, error: "Username required" });
    }

    const ldapUrl = process.env.LDAP_URL!;
    const baseDN = process.env.LDAP_SEARCH_BASE!;
    const adminDN = process.env.LDAP_ADMIN_DN!;
    const adminPass = process.env.LDAP_ADMIN_PASSWORD!;

    console.log('LDAP Check - Starting for username:', username);

    const client = ldap.createClient({
      url: ldapUrl,
      tlsOptions: { rejectUnauthorized: false },
      timeout: 5000, // 5 second timeout
      connectTimeout: 5000,
    });

    try {
      // Bind as admin with timeout
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error('Admin bind timeout'));
        }, 8000);

        client.bind(adminDN, adminPass, (err) => {
          clearTimeout(timer);
          if (err) {
            console.error('Admin bind failed:', err);
            reject(err);
          } else {
            console.log('Admin bind successful');
            resolve();
          }
        });
      });

      // Search for user with timeout
      const userExists = await new Promise<boolean>((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error('User search timeout'));
        }, 8000);

        const searchFilter = `(sAMAccountName=${username})`;
        console.log('Searching with filter:', searchFilter);

        client.search(baseDN, {
          scope: 'sub',
          filter: searchFilter,
          attributes: ['dn'],
          timeLimit: 5,
        }, (err, res) => {
          if (err) {
            clearTimeout(timer);
            console.error('Search error:', err);
            reject(err);
            return;
          }

          let found = false;
          
          res.on('searchEntry', (entry) => {
            console.log('User found:', entry.dn);
            found = true;
          });
          
          res.on('end', () => {
            clearTimeout(timer);
            console.log('Search completed, user found:', found);
            resolve(found);
          });
          
          res.on('error', (error) => {
            clearTimeout(timer);
            console.error('Search stream error:', error);
            reject(error);
          });
        });
      });

      client.unbind();
      console.log('LDAP Check completed successfully:', userExists);
      
      return NextResponse.json({ exists: userExists });

    } catch (ldapError) {
      client.unbind();
      throw ldapError;
    }

  } catch (error) {
    console.error('LDAP Check failed:', error);
    
    return NextResponse.json({ 
      exists: false, 
      error: error instanceof Error ? error.message : "Unknown error",
      debug: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 });
  }
}