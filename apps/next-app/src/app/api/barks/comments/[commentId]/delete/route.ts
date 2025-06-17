import { NextRequest, NextResponse } from "next/server";
import { deleteBarkComment } from "@/actions/bark.action";

export async function POST(req: NextRequest, { params }: { params: { commentId: string } }) {
  try {
    const result = await deleteBarkComment(params.commentId);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to delete comment" }, { status: 500 });
  }
} 