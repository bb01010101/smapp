import { NextRequest, NextResponse } from "next/server";
import { getUserByClerkId } from "@/actions/user.action";

export async function GET(req: NextRequest, { params }: { params: { clerkId: string } }) {
  try {
    const user = await getUserByClerkId(params.clerkId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
} 