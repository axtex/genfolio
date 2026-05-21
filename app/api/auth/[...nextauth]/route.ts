import { handlers } from "@/auth";

/**
 * NextAuth v5 route handler.
 * This single file handles ALL /api/auth/* routes:
 *   GET  /api/auth/signin        → renders the sign-in page
 *   GET  /api/auth/callback/github → handles the OAuth callback
 *   POST /api/auth/signout       → signs the user out
 *   …and more
 */
export const { GET, POST } = handlers;
