import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

// Default admin credentials for development (should be overridden by env vars)
const DEFAULT_ADMIN_USERNAME = "admin"
const DEFAULT_ADMIN_PASSWORD = "password"

// Forbid default admin credentials in production
const isProd = process.env.NODE_ENV === "production"
const adminUsername = process.env.ADMIN_USERNAME || (isProd ? undefined : DEFAULT_ADMIN_USERNAME)
const adminPassword = process.env.ADMIN_PASSWORD || (isProd ? undefined : DEFAULT_ADMIN_PASSWORD)

if (isProd && (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD)) {
  throw new Error("Admin credentials must be set in production! Set ADMIN_USERNAME and ADMIN_PASSWORD environment variables.")
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Use only secure credentials in production
        if (!adminUsername || !adminPassword) {
          // Should never happen in production due to the check above
          return null
        }
        // Log warning if using default credentials in development
        if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
          console.warn(
            "Warning: Using default admin credentials. Set ADMIN_USERNAME and ADMIN_PASSWORD environment variables for security.",
          )
        }
        // Check credentials
        if (credentials?.username === adminUsername && credentials?.password === adminPassword) {
          return {
            id: "1",
            name: "Admin",
            email: "admin@example.com",
          }
        }
        return null
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.sub as string
      }
      return session
    },
  },
  // Add a secret if NEXTAUTH_SECRET is not set
  secret: process.env.NEXTAUTH_SECRET || "default-secret-key-change-me",
}

