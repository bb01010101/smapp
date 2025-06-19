import { NextResponse } from 'next/server';
import { getOrCreateConversation } from '@/actions/dm.action';

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    const conversation = await getOrCreateConversation(userId);
    return NextResponse.json({ conversationId: conversation.id });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get or create conversation' }, { status: 500 });
  }
} 