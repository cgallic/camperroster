import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    app: "CamperRoster.com",
    version: "1.0.0",
    environment: "production",
    mcp: "active"
  });
}
