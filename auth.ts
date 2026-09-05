import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    GitHub({
      checks: ["state"], // disable PKCE, use state check only
    }),
  ],
  callbacks: {
    async jwt({ token, profile }) {
      // Capture the GitHub login (username) on first sign-in.
      // profile is only present during the initial OAuth exchange.
      if (profile && "login" in profile) {
        token.login = profile.login as string;
      }
      return token;
    },

    async session({ session, token }) {
      if (token.login) {
        session.user.login = token.login as string;
      }
      return session;
    },
  },
});
