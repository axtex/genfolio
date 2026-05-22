import { auth } from "@/auth";

// NextAuth's auth handler doubles as the Next.js proxy function.
// Unauthenticated requests to /dashboard/* are redirected to sign-in.
export { auth as proxy };

export const config = {
  matcher: ["/dashboard/:path*"],
};
