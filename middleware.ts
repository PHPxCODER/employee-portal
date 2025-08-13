import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    // Check for admin routes
    if (req.nextUrl.pathname.startsWith("/admin")) {
      const token = req.nextauth.token
      const adminGroups = process.env.ADMIN_GROUPS?.split(",") || []
      
      // Check if user is in admin groups
      const userGroups = token?.groups as string[] || []
      const isAdmin = adminGroups.some(adminGroup => 
        userGroups.some(userGroup => userGroup.includes(adminGroup.trim()))
      )

      if (!isAdmin) {
        return NextResponse.redirect(new URL("/unauthorized", req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    // Protect all routes except public ones
    "/((?!api/auth|auth|_next/static|_next/image|favicon.ico|public).*)",
  ]
}