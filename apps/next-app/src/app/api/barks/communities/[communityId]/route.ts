import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { editCommunity, deleteCommunity } from "@/actions/bark.action";

export async function GET(req: NextRequest, { params }: { params: { communityId: string } }) {
  try {
    const community = await prisma.community.findUnique({
      where: { name: params.communityId },
      select: {
        id: true,
        name: true,
        description: true,
        creatorId: true,
        createdAt: true,
        creator: {
          select: {
            clerkId: true,
          },
        },
      },
    });
    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }
    return NextResponse.json(community, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch community" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { communityId: string } }) {
  try {
    const { name, description } = await req.json();
    const community = await prisma.community.findUnique({ where: { name: params.communityId } });
    if (!community) {
      return NextResponse.json({ success: false, error: "Community not found" }, { status: 404 });
    }
    const result = await editCommunity(community.id, { name, description });
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to edit community" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { communityId: string } }) {
  try {
    const community = await prisma.community.findUnique({ where: { name: params.communityId } });
    if (!community) {
      return NextResponse.json({ success: false, error: "Community not found" }, { status: 404 });
    }
    const result = await deleteCommunity(community.id);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to delete community" }, { status: 400 });
  }
} 