import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role?: string | null
      emailVerified?: Date | null
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    image?: string | null
    role?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string | null
  }
}