import NextAuth, { type DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Extends the built-in session.user type.
   */
  interface Session {
    user: {
      /** The user's unique identifier. */
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  /** Extends the built-in JWT type to include our custom property. */
  interface JWT {
    /** This is the custom property we add in the jwt callback. */
    id?: string;
  }
}