import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    return NextResponse.json({
      email: user.email,
      emailVerified: user.emailVerified,
      isVerified: !!user.emailVerified
    })
  } catch (error) {
    console.error("Error checking verification status:", error)
    return NextResponse.json(
      { error: "Failed to check verification status" },
      { status: 500 }
    )
  }
}