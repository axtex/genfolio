export { auth as middleware } from "@/auth";

/**
 * Only run the middleware (session check) on protected routes.
 * Unauthenticated requests to /dashboard/* are automatically
 * redirected to the sign-in page by NextAuth v5.
 */
export const config = {
  matcher: ["/dashboard/:path*"],
};
