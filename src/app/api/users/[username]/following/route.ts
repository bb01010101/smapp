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
    const following = await prisma.follows.findMany({
      where: { followerId: user.id },
      include: {
        following: {
          select: { id: true, name: true, username: true, image: true },
        },
      },
    });
    return NextResponse.json(following.map(f => f.following));
  } catch (error) {
    return NextResponse.json([], { status: 500 });
  }
} 