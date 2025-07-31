import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { username: string } }) {
  try {
    const user = await prisma.user.findUnique({
      where: { username: params.username },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json([], { status: 404 });
    }
    const followers = await prisma.follows.findMany({
      where: { followingId: user.id },
      include: {
        follower: {
          select: { id: true, name: true, username: true, image: true, isFirst1000: true },
        },
      },
    });
    return NextResponse.json(followers.map(f => f.follower));
  } catch (error) {
    return NextResponse.json([], { status: 500 });
  }
} 