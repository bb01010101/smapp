import { NextRequest, NextResponse } from "next/server";
import { createBarkComment, getBarkComments } from "@/actions/bark.action";

export async function GET(req: NextRequest, { params }: { params: { barkId: string } }) {
  try {
    const comments = await getBarkComments(params.barkId);
    return NextResponse.json(comments, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { barkId: string } }) {
  try {
    const { content, parentId } = await req.json();
    const result = await createBarkComment({ barkId: params.barkId, content, parentId });
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
} 