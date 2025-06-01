import { NextRequest, NextResponse } from "next/server";
import { deleteBark } from "@/actions/bark.action";

export async function POST(req: NextRequest, { params }: { params: { barkId: string } }) {
  try {
    const result = await deleteBark(params.barkId);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to delete bark" }, { status: 500 });
  }
} 