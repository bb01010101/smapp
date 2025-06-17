import { NextRequest, NextResponse } from "next/server";
import { editBarkComment } from "@/actions/bark.action";

export async function POST(req: NextRequest, { params }: { params: { commentId: string } }) {
  try {
    const { content } = await req.json();
    const result = await editBarkComment(params.commentId, content);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to edit comment" }, { status: 500 });
  }
} 