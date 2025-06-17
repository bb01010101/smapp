import { NextRequest, NextResponse } from "next/server";
import { voteOnBark } from "@/actions/bark.action";

export async function POST(req: NextRequest) {
  try {
    const { barkId, value } = await req.json();
    if (!barkId || ![1, -1].includes(value)) {
      return NextResponse.json({ success: false, error: "Invalid input" }, { status: 400 });
    }
    const result = await voteOnBark(barkId, value);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to vote" }, { status: 500 });
  }
} 