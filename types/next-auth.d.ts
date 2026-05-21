// Extend next-auth's built-in Session and JWT types to include the
// GitHub access token we attach in auth.ts callbacks.
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    /** GitHub OAuth access token — use this to call the GitHub API */
    accessToken: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
  }
}
