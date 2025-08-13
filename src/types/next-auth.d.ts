import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      username: string
      dn: string
      groups: string[]
    }
  }

  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    username: string
    dn: string
    groups: string[]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    username: string
    dn: string
    groups: string[]
  }
}

// types/ldap.ts
export interface LDAPUser {
  id: string
  username: string
  email: string
  name: string
  dn: string
  groups: string[]
  accountExpires?: string
  userAccountControl?: number
  pwdLastSet?: string
  lastLogon?: string
  lockoutTime?: string
}

export interface LDAPAuthResult {
  success: boolean
  user?: LDAPUser
  error?: string
}

export interface PasswordChangeRequest {
  username: string
  currentPassword: string
  newPassword: string
}

export interface PasswordResetRequest {
  username: string
  newPassword: string
}

export interface AccountUnlockRequest {
  username: string
}

export interface UserAccountInfo {
  username: string
  displayName: string
  email: string
  lastLogon?: Date
  passwordLastSet?: Date
  accountExpires?: Date
  isLocked: boolean
  isDisabled: boolean
  groups: string[]
}