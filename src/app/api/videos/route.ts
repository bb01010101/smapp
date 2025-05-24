import { getDbUserId } from "@/actions/user.action";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const userId = await getDbUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, url } = await req.json();

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    const post = await prisma.post.create({
      data: {
        content: title || "",
        image: url,
        mediaType: "video",
        authorId: userId,
      },
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error("Error creating video post:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}