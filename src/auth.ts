// lib/auth.ts
import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { authenticate } from "ldap-authentication"

// LDAP configuration
const LDAP_CONFIG = {
  ldapOpts: {
    url: process.env.LDAP_URL || "ldaps://your-domain-controller.company.com:636",
    tlsOptions: {
      rejectUnauthorized: false // Set to true in production with proper certificates
    }
  },
  adminDn: process.env.LDAP_BIND_DN || "CN=ldap-service,CN=Users,DC=company,DC=com",
  adminPassword: process.env.LDAP_BIND_PASSWORD || "service-account-password",
  userSearchBase: process.env.LDAP_USER_SEARCH_BASE || "CN=Users,DC=company,DC=com",
  usernameAttribute: "sAMAccountName",
  username: "", // Will be set dynamically
  userDn: "", // Will be set dynamically
  userPassword: "", // Will be set dynamically
  userSearchFilter: "", // Will be set dynamically
  groupsSearchBase: process.env.LDAP_GROUP_SEARCH_BASE || "CN=Users,DC=company,DC=com",
  groupClass: "group",
  groupMemberAttribute: "member",
  groupMemberUserAttribute: "dn",
  attributes: [
    "sAMAccountName",
    "userPrincipalName", 
    "displayName",
    "mail",
    "distinguishedName",
    "memberOf",
    "accountExpires",
    "userAccountControl",
    "pwdLastSet",
    "lastLogon",
    "lockoutTime"
  ]
}

// Types for better TypeScript support
interface LDAPUser {
  sAMAccountName: string
  userPrincipalName?: string
  displayName: string
  mail?: string
  distinguishedName: string
  memberOf?: string[]
  accountExpires?: string
  userAccountControl?: string
  pwdLastSet?: string
  lastLogon?: string
  lockoutTime?: string
}

interface AuthResult {
  success: boolean
  user?: {
    id: string
    username: string
    email: string
    name: string
    dn: string
    groups: string[]
  }
  error?: string
}

// LDAP authentication function
async function authenticateUser(username: string, password: string): Promise<AuthResult> {
  try {
    // Create authentication options
    const authOptions = {
      ...LDAP_CONFIG,
      userDn: `${LDAP_CONFIG.usernameAttribute}=${username},${LDAP_CONFIG.userSearchBase}`,
      userSearchFilter: `(&(objectClass=user)(|(${LDAP_CONFIG.usernameAttribute}=${username})(userPrincipalName=${username})))`,
      username: username,
      userPassword: password
    }

    // Attempt authentication
    const result = await authenticate(authOptions)

    if (result && result.user) {
      const user = result.user as LDAPUser

      // Check if account is disabled
      const userAccountControl = parseInt(user.userAccountControl || "0")
      if (userAccountControl & 0x0002) { // Account disabled flag
        return { success: false, error: "Account is disabled" }
      }

      // Check if account is locked
      const lockoutTime = user.lockoutTime
      if (lockoutTime && parseInt(lockoutTime) > 0) {
        return { success: false, error: "Account is locked" }
      }

      return {
        success: true,
        user: {
          id: user.sAMAccountName,
          username: user.sAMAccountName,
          email: user.mail || "",
          name: user.displayName || user.sAMAccountName,
          dn: user.distinguishedName,
          groups: user.memberOf || []
        }
      }
    }

    return { success: false, error: "Authentication failed" }
  } catch (error) {
    console.error("LDAP authentication error:", error)
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes("InvalidCredentialsError")) {
        return { success: false, error: "Invalid username or password" }
      }
      if (error.message.includes("user not found")) {
        return { success: false, error: "User not found" }
      }
    }

    return { success: false, error: "Authentication failed" }
  }
}

// Function to get user details without authentication (for admin operations)
async function getUserDetails(username: string): Promise<LDAPUser | null> {
  try {
    const searchOptions = {
      ...LDAP_CONFIG,
      userDn: LDAP_CONFIG.adminDn,
      userPassword: LDAP_CONFIG.adminPassword,
      userSearchFilter: `(&(objectClass=user)(|(${LDAP_CONFIG.usernameAttribute}=${username})(userPrincipalName=${username})))`
    }

    const result = await authenticate(searchOptions)
    return result?.user as LDAPUser || null
  } catch (error) {
    console.error("LDAP user lookup error:", error)
    return null
  }
}

const authConfig = {
  providers: [
    CredentialsProvider({
      name: "LDAP",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        try {
          const result = await authenticateUser(
            credentials.username as string, 
            credentials.password as string
          )

          if (result.success && result.user) {
            return {
              id: result.user.id,
              name: result.user.name,
              email: result.user.email,
              username: result.user.username,
              dn: result.user.dn,
              groups: result.user.groups
            }
          }

          return null
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.username = user.username
        token.dn = user.dn
        token.groups = user.groups
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.username = token.username as string
        session.user.dn = token.dn as string
        session.user.groups = token.groups as string[]
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  },
  session: {
    strategy: "jwt" as const
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)

// Export utility functions for use in API routes
export { authenticateUser, getUserDetails, LDAP_CONFIG }