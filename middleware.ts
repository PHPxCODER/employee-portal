import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // Allow access to onboarding page
    if (pathname.startsWith("/onboarding")) {
      return NextResponse.next();
    }

    // Allow access to auth pages and API routes
    if (
      pathname.startsWith("/api/") ||
      pathname === "/" ||
      pathname.startsWith("/_next") ||
      pathname.startsWith("/favicon")
    ) {
      return NextResponse.next();
    }

    // If user is authenticated but hasn't completed onboarding
    if (token && !token.onboardingComplete) {
      // Redirect to onboarding for any protected page
      const onboardingUrl = new URL("/onboarding", req.url);
      return NextResponse.redirect(onboardingUrl);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Allow access if user has a token (is authenticated)
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    // Match all routes except API routes, static files, and auth pages
    "/((?!api|_next/static|_next/image|favicon.ico|$).*)",
  ],
};