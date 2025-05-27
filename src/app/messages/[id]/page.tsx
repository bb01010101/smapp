import { getMessages, sendMessage, getConversations } from "@/actions/dm.action";
import { notFound } from "next/navigation";
import ChatWindow from "@/components/ChatWindow";

interface Props {
  params: { id: string };
}

export default async function ConversationPage({ params }: Props) {
  const { id } = params;
  const messages = await getMessages(id);
  const conversations = await getConversations();
  const conversation = conversations.find((c) => c.id === id);
  if (!conversation) notFound();
  const other = conversation.participants.find(
    (p) => p.user && !messages.some((m) => m.senderId === p.userId)
  )?.user;

  // Get current user ID (client component)
  // We'll use a workaround since this is an async server component
  // and can't use useUser directly. We'll pass the current user ID as a prop in a client wrapper.

  async function handleSend(formData: FormData) {
    "use server";
    const content = formData.get("content") as string;
    await sendMessage(id, content);
    // Optionally revalidate path or use router.refresh in client
  }

  return <ChatWindow messages={messages} other={other} handleSend={handleSend} />;
} 