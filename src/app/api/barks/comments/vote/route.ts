import { NextRequest, NextResponse } from "next/server";
import { voteOnBarkComment } from "@/actions/bark.action";

export async function POST(req: NextRequest) {
  try {
    const { commentId, value } = await req.json();
    if (!commentId || ![1, -1].includes(value)) {
      return NextResponse.json({ success: false, error: "Invalid input" }, { status: 400 });
    }
    const result = await voteOnBarkComment(commentId, value);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to vote" }, { status: 500 });
  }
} 