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
          return null;
        }

        try {
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
            ],
          });

          return {
            id: ldapUser.cn,
            name: ldapUser.displayName || ldapUser.cn,
            email: ldapUser.mail,
            image: null,
            username: credentials.username,
            dn: ldapUser.distinguishedName,
            groups: Array.isArray(ldapUser.memberOf)
              ? ldapUser.memberOf
              : [],
          };
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
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.username = token.username;
        session.user.dn = token.dn;
        session.user.groups = token.groups;
      }
      return session;
    },
  },

  pages: {
    signIn: "/auth",
  },
};

export default authOptions;