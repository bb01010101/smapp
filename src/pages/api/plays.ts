import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const videos = await prisma.post.findMany({
      where: { mediaType: { startsWith: "video" } },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        image: true,
        title: true,
        description: true,
        content: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        likes: {
          select: { userId: true },
        },
        comments: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        _count: {
          select: { likes: true, comments: true },
        },
      },
    });
    res.status(200).json(videos);
  } catch (error) {
    console.error("API /api/plays error:", error);
    res.status(500).json({ error: "Internal Server Error", details: error instanceof Error ? error.message : error });
  }
} 