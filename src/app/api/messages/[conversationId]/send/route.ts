import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest, { params }: { params: { conversationId: string } }) {
  try {
    const { userId } = getAuth(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { text } = await req.json();
    if (!text || !params.conversationId) return NextResponse.json({ error: 'Missing text or conversationId' }, { status: 400 });

    // Get the current user from our database
    const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Check if conversation exists and user is a participant
    const convo = await prisma.conversation.findUnique({
      where: { id: params.conversationId },
      include: { participants: true }
    });
    if (!convo) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    const isParticipant = convo.participants.some(p => p.userId === dbUser.id);
    if (!isParticipant) return NextResponse.json({ error: 'Not a participant' }, { status: 403 });

    // Create the message (no postId)
    const message = await prisma.message.create({
      data: {
        conversationId: convo.id,
        senderId: dbUser.id,
        content: text,
      },
    });
    return NextResponse.json({ message });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
} 