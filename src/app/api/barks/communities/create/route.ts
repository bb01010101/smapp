import { NextRequest, NextResponse } from "next/server";
import { createCommunity } from "@/actions/bark.action";

export async function GET(req: NextRequest) {
  return NextResponse.json({ message: "Use POST to create a community" }, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const { name, description } = await req.json();
    const result = await createCommunity({ name, description });
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create community" }, { status: 500 });
  }
} 