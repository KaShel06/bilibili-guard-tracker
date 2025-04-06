import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"

export async function GET() {
  try {
    // Try a simple Redis operation
    const testKey = "test-connection"
    const testValue = "Connection successful at " + new Date().toISOString()

    await kv.set(testKey, testValue, { ex: 60 }) // Expires in 60 seconds
    const retrievedValue = await kv.get(testKey)

    return NextResponse.json({
      success: true,
      message: "Redis connection test successful",
      value: retrievedValue,
    })
  } catch (error) {
    console.error("Redis connection test failed:", error)

    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || "Unknown error",
        stack: process.env.NODE_ENV === "development" ? (error as Error).stack : undefined,
      },
      { status: 500 },
    )
  }
}

