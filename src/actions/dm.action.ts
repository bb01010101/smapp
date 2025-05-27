"use server";

import prisma from "@/lib/prisma";
import { getDbUserId, getUserByClerkId } from "./user.action";

// Get or create a conversation between the current user and another user
export async function getOrCreateConversation(participantId: string) {
  const userId = await getDbUserId();
  if (!userId) throw new Error("Unauthorized");
  if (userId === participantId) throw new Error("You cannot message yourself");

  // Find existing conversation with exactly these two participants
  let conversation = await prisma.conversation.findFirst({
    where: {
      participants: {
        some: { userId },
      },
      AND: {
        participants: {
          some: { userId: participantId },
        },
      },
    },
    include: {
      participants: { include: { user: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (conversation && conversation.participants.length !== 2) {
    conversation = null;
  }

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        participants: {
          create: [
            { userId },
            { userId: participantId },
          ],
        },
      },
      include: {
        participants: { include: { user: true } },
        messages: true,
      },
    });
  }
  return conversation;
}

// Send a message in a conversation
export async function sendMessage(conversationId: string, content: string) {
  const userId = await getDbUserId();
  if (!userId) throw new Error("Unauthorized");
  if (!content.trim()) throw new Error("Message cannot be empty");

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId: userId,
      content,
    },
    include: {
      sender: true,
    },
  });
  return message;
}

// Get all conversations for the current user
export async function getConversations() {
  const userId = await getDbUserId();
  if (!userId) throw new Error("Unauthorized");

  const conversations = await prisma.conversation.findMany({
    where: {
      participants: {
        some: { userId },
      },
    },
    include: {
      participants: { include: { user: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          sender: { select: { id: true, clerkId: true, image: true, name: true, username: true } }
        }
      },
    },
    orderBy: { updatedAt: "desc" },
  });
  return conversations;
}

// Get all messages in a conversation
export async function getMessages(conversationId: string) {
  const userId = await getDbUserId();
  if (!userId) throw new Error("Unauthorized");

  // Optionally, check if user is a participant
  const isParticipant = await prisma.conversationParticipant.findFirst({
    where: { conversationId, userId },
  });
  if (!isParticipant) throw new Error("Forbidden");

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    include: { sender: { select: { id: true, clerkId: true, image: true, name: true, username: true } } },
  });
  return messages;
}

// Delete a conversation and all its messages and participants
export async function deleteConversation(conversationId: string) {
  const userId = await getDbUserId();
  if (!userId) throw new Error("Unauthorized");

  // Check if user is a participant
  const isParticipant = await prisma.conversationParticipant.findFirst({
    where: { conversationId, userId },
  });
  if (!isParticipant) throw new Error("Forbidden");

  // Delete the conversation (cascades to messages and participants)
  await prisma.conversation.delete({
    where: { id: conversationId },
  });
  return { success: true };
} 