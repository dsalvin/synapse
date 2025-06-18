import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
 
export const { 
  handlers: { GET, POST }, 
  auth, 
  signIn, 
  signOut 
} = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  ],
  secret: process.env.AUTH_SECRET,
  callbacks: {
    session({ session, token }) {
      // The `token.sub` is the user ID from the provider and is the most reliable source.
      // We also ensure the name and image are passed to the session.
      if (session.user) {
        if (token.sub) {
          session.user.id = token.sub;
        }
        if (token.name) {
          session.user.name = token.name;
        }
        if (token.picture) {
          session.user.image = token.picture;
        }
      }
      return session;
    },
    // The jwt callback is not strictly needed just for passing the ID,
    // as NextAuth automatically populates `token.sub`, `name`, and `picture`.
    // However, if you needed to add more custom data from your database,
    // you would use the jwt callback to add it to the token first.
  },
})