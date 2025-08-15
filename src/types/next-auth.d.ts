import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      username: string;
      dn: string;
      groups: string[];
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    username: string;
    dn: string;
    groups: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    username: string;
    dn: string;
    groups: string[];
  }
}
