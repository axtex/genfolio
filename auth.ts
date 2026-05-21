import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

/**
 * NextAuth v5 (Auth.js) configuration.
 *
 * `handlers` → the GET/POST route handler for /api/auth/*
 * `auth`     → call in Server Components to get the current session
 * `signIn`   → call in Server Actions to kick off the OAuth flow
 * `signOut`  → call in Server Actions to end the session
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [GitHub],
  callbacks: {
    /**
     * The `jwt` callback runs every time a JWT is created or updated.
     * We capture the GitHub access token from the initial OAuth `account`
     * object so we can attach it to the session for API calls later.
     */
    async jwt({ token, account }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      return token;
    },

    /**
     * The `session` callback shapes what `auth()` returns in Server Components.
     * We expose `accessToken` here so downstream code can call the GitHub API
     * on behalf of the logged-in user.
     */
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      return session;
    },
  },
});
