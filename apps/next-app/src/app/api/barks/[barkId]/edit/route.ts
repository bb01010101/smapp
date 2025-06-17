import { NextRequest, NextResponse } from "next/server";
import { editBark } from "@/actions/bark.action";

export async function POST(req: NextRequest, { params }: { params: { barkId: string } }) {
  try {
    const { title, content } = await req.json();
    const result = await editBark(params.barkId, { title, content });
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to edit bark" }, { status: 500 });
  }
} 