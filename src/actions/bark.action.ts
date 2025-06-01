import prisma from "@/lib/prisma";
import { getDbUserId } from "./user.action";

export async function createBark({ title, content, communityId }: { title: string; content: string; communityId?: string }) {
  try {
    const userId = await getDbUserId();
    console.log("createBark userId:", userId);
    if (!userId) throw new Error("Not authenticated");
    const bark = await prisma.bark.create({
      data: {
        title,
        content,
        authorId: userId,
        communityId: communityId || null,
      },
    });
    return { success: true, bark };
  } catch (error) {
    console.error("Failed to create bark:", error);
    return { success: false, error: "Failed to create bark" };
  }
}

export async function getBarks({ communityId }: { communityId?: string } = {}) {
  try {
    let barks = await prisma.bark.findMany({
      where: communityId ? { communityId } : undefined,
      include: {
        author: { select: { id: true, clerkId: true, name: true, username: true, image: true } },
        community: { select: { id: true, name: true } },
        votes: true,
        comments: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            author: { select: { id: true, clerkId: true, name: true, username: true, image: true } },
          },
        },
      },
    });
    // Sort by score (sum of votes)
    barks = barks.sort((a, b) => {
      const scoreA = a.votes.reduce((sum, v) => sum + v.value, 0);
      const scoreB = b.votes.reduce((sum, v) => sum + v.value, 0);
      return scoreB - scoreA;
    });
    return barks;
  } catch (error) {
    console.error("Failed to fetch barks:", error);
    throw new Error("Failed to fetch barks");
  }
}

export async function getCommunities() {
  try {
    const communities = await prisma.community.findMany({
      orderBy: { name: "asc" },
    });
    return communities;
  } catch (error) {
    console.error("Failed to fetch communities:", error);
    throw new Error("Failed to fetch communities");
  }
}

export async function voteOnBark(barkId: string, value: 1 | -1) {
  const userId = await getDbUserId();
  if (!userId) throw new Error("Not authenticated");

  // Check if user already voted
  const existingVote = await prisma.barkVote.findUnique({
    where: { userId_barkId: { userId, barkId } },
  });

  if (existingVote) {
    if (existingVote.value === value) {
      // Remove vote (toggle off)
      await prisma.barkVote.delete({
        where: { userId_barkId: { userId, barkId } },
      });
    } else {
      // Change vote
      await prisma.barkVote.update({
        where: { userId_barkId: { userId, barkId } },
        data: { value },
      });
    }
  } else {
    // New vote
    await prisma.barkVote.create({
      data: { userId, barkId, value },
    });
  }

  // Return the new score
  const votes = await prisma.barkVote.findMany({
    where: { barkId },
  });
  const score = votes.reduce((sum, v) => sum + v.value, 0);
  return { success: true, score };
}

// Create a comment (or reply)
export async function createBarkComment({
  barkId,
  content,
  parentId,
}: {
  barkId: string;
  content: string;
  parentId?: string;
}) {
  const userId = await getDbUserId();
  if (!userId) throw new Error("Not authenticated");
  const comment = await prisma.barkComment.create({
    data: {
      barkId,
      content,
      parentId: parentId || null,
      authorId: userId,
    },
    include: {
      author: { select: { id: true, name: true, username: true, image: true } },
    },
  });
  return { success: true, comment };
}

// Get all comments for a Bark, nested
export async function getBarkComments(barkId: string) {
  const comments = await prisma.barkComment.findMany({
    where: { barkId },
    include: {
      author: { select: { id: true, clerkId: true, name: true, username: true, image: true } },
      votes: true,
    },
  });

  // Build nested structure and sort by score
  const map: Record<string, any> = {};
  comments.forEach((c) => (map[c.id] = { ...c, replies: [] }));
  const roots: any[] = [];
  comments.forEach((c) => {
    if (c.parentId) {
      map[c.parentId]?.replies.push(map[c.id]);
    } else {
      roots.push(map[c.id]);
    }
  });

  // Sort comments and replies by score
  function sortByScore(arr: any[]) {
    arr.sort((a, b) => {
      const scoreA = a.votes.reduce((sum: number, v: any) => sum + v.value, 0);
      const scoreB = b.votes.reduce((sum: number, v: any) => sum + v.value, 0);
      return scoreB - scoreA;
    });
    arr.forEach((c) => sortByScore(c.replies));
  }
  sortByScore(roots);

  return roots;
}

export async function voteOnBarkComment(commentId: string, value: 1 | -1) {
  const userId = await getDbUserId();
  if (!userId) throw new Error("Not authenticated");

  const existingVote = await prisma.barkCommentVote.findUnique({
    where: { userId_commentId: { userId, commentId } },
  });

  if (existingVote) {
    if (existingVote.value === value) {
      await prisma.barkCommentVote.delete({
        where: { userId_commentId: { userId, commentId } },
      });
    } else {
      await prisma.barkCommentVote.update({
        where: { userId_commentId: { userId, commentId } },
        data: { value },
      });
    }
  } else {
    await prisma.barkCommentVote.create({
      data: { userId, commentId, value },
    });
  }

  // Return new score
  const votes = await prisma.barkCommentVote.findMany({ where: { commentId } });
  const score = votes.reduce((sum, v) => sum + v.value, 0);
  return { success: true, score };
}

export async function deleteBark(barkId: string) {
  const userId = await getDbUserId();
  if (!userId) throw new Error("Not authenticated");
  const bark = await prisma.bark.findUnique({ where: { id: barkId } });
  if (!bark) throw new Error("Bark not found");
  if (bark.authorId !== userId) throw new Error("Unauthorized");
  await prisma.bark.delete({ where: { id: barkId } });
  return { success: true };
}

export async function editBark(barkId: string, data: { title: string; content: string }) {
  const userId = await getDbUserId();
  if (!userId) throw new Error("Not authenticated");
  const bark = await prisma.bark.findUnique({ where: { id: barkId } });
  if (!bark) throw new Error("Bark not found");
  if (bark.authorId !== userId) throw new Error("Unauthorized");
  const updated = await prisma.bark.update({
    where: { id: barkId },
    data,
  });
  return { success: true, bark: updated };
}

export async function deleteBarkComment(commentId: string) {
  const userId = await getDbUserId();
  if (!userId) throw new Error("Not authenticated");
  const comment = await prisma.barkComment.findUnique({ where: { id: commentId } });
  if (!comment) throw new Error("Comment not found");
  if (comment.authorId !== userId) throw new Error("Unauthorized");
  await prisma.barkComment.delete({ where: { id: commentId } });
  return { success: true };
}

export async function editBarkComment(commentId: string, content: string) {
  const userId = await getDbUserId();
  if (!userId) throw new Error("Not authenticated");
  const comment = await prisma.barkComment.findUnique({ where: { id: commentId } });
  if (!comment) throw new Error("Comment not found");
  if (comment.authorId !== userId) throw new Error("Unauthorized");
  const updated = await prisma.barkComment.update({
    where: { id: commentId },
    data: { content },
  });
  return { success: true, comment: updated };
}

export async function createCommunity({ name, description }: { name: string; description?: string }) {
  try {
    const creatorId = await getDbUserId();
    if (!creatorId) throw new Error("Not authenticated");
    const community = await prisma.community.create({
      data: {
        name,
        description: description || null,
        creatorId,
      },
    });
    return { success: true, community };
  } catch (error) {
    console.error("Failed to create community:", error);
    return { success: false, error: "Failed to create community" };
  }
}

export async function editCommunity(communityId: string, data: { name: string; description: string }) {
  const userId = await getDbUserId();
  if (!userId) throw new Error("Not authenticated");
  const community = await prisma.community.findUnique({ where: { id: communityId } });
  if (!community) throw new Error("Community not found");
  if (community.creatorId !== userId) throw new Error("Unauthorized");
  const updated = await prisma.community.update({
    where: { id: communityId },
    data: {
      name: data.name,
      description: data.description,
    },
  });
  return { success: true, community: updated };
}

export async function deleteCommunity(communityId: string) {
  const userId = await getDbUserId();
  if (!userId) throw new Error("Not authenticated");
  const community = await prisma.community.findUnique({ where: { id: communityId } });
  if (!community) throw new Error("Community not found");
  if (community.creatorId !== userId) throw new Error("Unauthorized");
  await prisma.community.delete({ where: { id: communityId } });
  return { success: true };
} 