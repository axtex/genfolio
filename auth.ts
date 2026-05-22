import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [GitHub],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      // Capture the GitHub login (username) on first sign-in.
      // profile is only present during the initial OAuth exchange.
      if (profile && "login" in profile) {
        token.login = profile.login as string;
      }
      return token;
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      if (token.login) {
        session.user.login = token.login as string;
      }
      return session;
    },
  },
});
