import { NextRequest, NextResponse } from "next/server";
import { createBark, getBarks } from "@/actions/bark.action";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const communityId = searchParams.get("communityId");
    let barks;
    if (communityId) {
      barks = await getBarks({ communityId });
    } else {
      barks = await getBarks();
    }
    return NextResponse.json(barks, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch barks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title, content, communityId } = await req.json();
    const result = await createBark({ title, content, communityId });
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create bark" }, { status: 500 });
  }
} 