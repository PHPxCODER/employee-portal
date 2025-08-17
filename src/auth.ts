import CredentialsProvider from "next-auth/providers/credentials";
import { authenticate } from "ldap-authentication";
import type { NextAuthOptions, User } from "next-auth";
import { prisma } from "@/lib/prisma";

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
              "thumbnailPhoto",
              "jpegPhoto",
            ],
          });

          console.log("LDAP User authenticated successfully.");

          // Process image if available
          let userImage: string | null = null;
          if (
            ldapUser.thumbnailPhoto &&
            ldapUser.thumbnailPhoto instanceof Buffer
          ) {
            try {
              userImage = `data:image/jpeg;base64,${ldapUser.thumbnailPhoto.toString(
                "base64"
              )}`;
              console.log("Thumbnail photo successfully converted to Base64 data URI.");
            } catch (bufferConversionError) {
              console.error(
                "Error converting thumbnailPhoto Buffer to Base64:",
                bufferConversionError
              );
              userImage = null;
            }
          }

          // Create or update user in database
          const dbUser = await prisma.user.upsert({
            where: {
              username: credentials.username,
            },
            update: {
              email: ldapUser.mail || null,
              name: ldapUser.displayName || ldapUser.cn,
              distinguishedName: ldapUser.distinguishedName,
              groups: Array.isArray(ldapUser.memberOf) ? ldapUser.memberOf : [],
              lastLoginAt: new Date(),
            },
            create: {
              username: credentials.username,
              email: ldapUser.mail || null,
              name: ldapUser.displayName || ldapUser.cn,
              distinguishedName: ldapUser.distinguishedName,
              groups: Array.isArray(ldapUser.memberOf) ? ldapUser.memberOf : [],
              lastLoginAt: new Date(),
              onboardingComplete: false, // New users need onboarding
            },
          });

          // Log the login attempt
          await prisma.auditLog.create({
            data: {
              userId: dbUser.id,
              action: "login",
              details: {
                username: credentials.username,
                loginMethod: "LDAP",
                groups: dbUser.groups,
              },
            },
          });

          console.log("User created/updated in database:", dbUser.id);

          // Return the user object in the format NextAuth expects
          const user: User = {
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            image: userImage,
            username: credentials.username,
            dn: ldapUser.distinguishedName,
            groups: Array.isArray(ldapUser.memberOf) ? ldapUser.memberOf : [],
            recoveryEmail: dbUser.recoveryEmail,
            onboardingComplete: dbUser.onboardingComplete,
          };

          return user;
        } catch (error) {
          console.error("LDAP authentication failed:", error);
          return null;
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.username = user.username;
        token.dn = user.dn;
        token.groups = user.groups;
        token.picture = user.image;
        token.recoveryEmail = user.recoveryEmail;
        token.onboardingComplete = user.onboardingComplete;
        token.userId = user.id;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.username = token.username;
        session.user.dn = token.dn;
        session.user.groups = token.groups;
        session.user.image = token.picture;
        session.user.recoveryEmail = token.recoveryEmail;
        session.user.onboardingComplete = token.onboardingComplete;
        session.user.id = token.userId;
      }
      return session;
    },
  },

  pages: {
    signIn: "/",
  },
};

export default authOptions;