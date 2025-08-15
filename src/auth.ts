import CredentialsProvider from "next-auth/providers/credentials";
import { authenticate } from "ldap-authentication";
import type { NextAuthOptions, User } from "next-auth";

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "LDAP",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(
        credentials: Record<"username" | "password", string> | undefined
      ): Promise<User | null> {
        if (!credentials?.username || !credentials?.password) {
          console.error("Authorize: Missing username or password.");
          return null;
        }

        try {
          console.log(
            `Attempting LDAP authentication for: ${credentials.username}`
          );

          // Perform LDAP authentication and retrieve user attributes
          const ldapUser = await authenticate({
            ldapOpts: {
              url: process.env.LDAP_URL!,
              tlsOptions: { rejectUnauthorized: false },
            },
            adminDn: process.env.LDAP_ADMIN_DN!,
            adminPassword: process.env.LDAP_ADMIN_PASSWORD!,
            userPassword: credentials.password,
            userSearchBase: process.env.LDAP_SEARCH_BASE!,
            usernameAttribute: "sAMAccountName",
            username: credentials.username,
            attributes: [
              "cn",
              "mail",
              "displayName",
              "distinguishedName",
              "memberOf",
              "thumbnailPhoto", // User's profile picture (JPEG format)
              "jpegPhoto", // Some AD setups might use this instead of thumbnailPhoto
            ],
          });

          console.log("LDAP User authenticated successfully.");
          console.log("Retrieved LDAP User Attributes (partial):", {
            cn: ldapUser.cn,
            mail: ldapUser.mail,
            displayName: ldapUser.displayName,
            distinguishedName: ldapUser.distinguishedName,
            memberOf: ldapUser.memberOf ? "found" : "not found",
            thumbnailPhoto: ldapUser.thumbnailPhoto ? "found" : "not found",
          });

          let userImage: string | null = null;
          // Check if thumbnailPhoto attribute exists and is a Buffer (binary data)
          if (
            ldapUser.thumbnailPhoto &&
            ldapUser.thumbnailPhoto instanceof Buffer
          ) {
            try {
              // Convert the image Buffer to a Base64 string
              // Prepend with data URI scheme: data:image/jpeg;base64,
              // Assuming 'thumbnailPhoto' is typically a JPEG. If not, adjust 'image/jpeg'.
              userImage = `data:image/jpeg;base64,${ldapUser.thumbnailPhoto.toString(
                "base64"
              )}`;
              console.log(
                "Thumbnail photo successfully converted to Base64 data URI."
              );
              // Log a snippet of the Base64 string for verification (do not log full string in production)
              // console.log("Image Base64 Snippet:", userImage.substring(0, 100) + "...");
            } catch (bufferConversionError) {
              console.error(
                "Error converting thumbnailPhoto Buffer to Base64:",
                bufferConversionError
              );
              userImage = null; // Set to null if conversion fails
            }
          } else if (ldapUser.thumbnailPhoto) {
            // This case would indicate that thumbnailPhoto was returned, but not as a Buffer
            console.warn(
              "thumbnailPhoto attribute exists but is not a Buffer:",
              typeof ldapUser.thumbnailPhoto
            );
            userImage = null;
          } else {
            console.log("No thumbnailPhoto found for this user in Active Directory.");
            userImage = null; // No image found in AD
          }

          // Return the user object in the format NextAuth expects
          const user: User = {
            id: ldapUser.cn, // Unique identifier for the user (NextAuth requires 'id')
            name: ldapUser.displayName || ldapUser.cn, // User's display name
            email: ldapUser.mail, // User's email
            image: userImage, // The Base64 image data URI or null
            username: credentials.username, // Custom field: sAMAccountName
            dn: ldapUser.distinguishedName, // Custom field: Distinguished Name
            groups: Array.isArray(ldapUser.memberOf)
              ? ldapUser.memberOf
              : [],
          };

          console.log("User object prepared for NextAuth session:", {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image ? "Image Data URI Present" : "No Image", // Avoid logging full image data
            username: user.username,
            dn: user.dn,
            groups: user.groups,
          });

          return user;
        } catch (error) {
          console.error("LDAP authentication failed:", error);
          // More specific error messages for user feedback could be added here
          return null;
        }
      },
    }),
  ],

  session: {
    strategy: "jwt", // Use JWT for session management
  },

  callbacks: {
    // The `jwt` callback is called whenever a JWT is created (on sign in)
    // or updated (on subsequent requests if session strategy is jwt).
    async jwt({ token, user }) {
      // `user` is only present on the first call (after `authorize` returns)
      if (user) {
        token.username = user.username;
        token.dn = user.dn;
        token.groups = user.groups;
        token.picture = user.image; // Assign the image to the JWT token's 'picture' field
      }
      console.log("JWT Callback - Token:", {
        sub: token.sub,
        name: token.name,
        email: token.email,
        picture: token.picture ? "Image Data URI Present" : "No Image",
        username: token.username,
        dn: token.dn,
        groups: token.groups,
      });
      return token;
    },

    // The `session` callback is called whenever a session is checked
    // (e.g., via `useSession` or `getSession`).
    async session({ session, token }) {
      // Ensure session.user exists before assigning properties
      if (session.user) {
        session.user.username = token.username;
        session.user.dn = token.dn;
        session.user.groups = token.groups;
        session.user.image = token.picture; // Assign the image from token to session user
      }
      console.log("Session Callback - Session:", {
        expires: session.expires,
        user: {
          name: session.user?.name,
          email: session.user?.email,
          image: session.user?.image ? "Image Data URI Present" : "No Image",
          username: session.user?.username,
          dn: session.user?.dn,
          groups: session.user?.groups,
        },
      });
      return session;
    },
  },

  pages: {
    signIn: "/",
  },
};

export default authOptions;