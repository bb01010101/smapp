"use client";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import ChatWindow from "@/components/ChatWindow";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MoreVertical, X } from "lucide-react";
import { sendMessage, deleteConversation } from "@/actions/dm.action";
import { useUser } from "@clerk/nextjs";
import { isUserVerified } from "@/lib/utils";
import BlueCheckIcon from "@/components/BlueCheckIcon";

export default function MessagesClient({ conversations }: { conversations: any[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const [mobileView, setMobileView] = useState<'list' | 'chat'>("list");
  const [sending, setSending] = useState(false);
  const [messagesMap, setMessagesMap] = useState(() => {
    const map: Record<string, any[]> = {};
    conversations.forEach((c) => {
      map[c.id] = c.messages || [];
    });
    return map;
  });
  const [convoList, setConvoList] = useState(conversations);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const { user, isLoaded } = useUser();
  if (!isLoaded) return <div>Loading...</div>;

  // Find selected conversation
  const selected = convoList.find((c) => c.id === selectedId) || convoList[0];

  // Find the other participant for a conversation
  const getOther = (conv: any) => {
    if (!user?.id) return undefined;
    return conv.participants.find((p: any) => p.user && p.user.clerkId !== user.id)?.user;
  };

  const handleSend = async (conversationId: string, formData: FormData) => {
    const content = formData.get("content") as string;
    if (!content?.trim()) return;
    setSending(true);
    try {
      // Optimistically update UI with correct sender info
      setMessagesMap((prev) => ({
        ...prev,
        [conversationId]: [
          ...prev[conversationId],
          {
            id: Math.random().toString(),
            content,
            createdAt: new Date().toISOString(),
            sender: {
              clerkId: user?.id,
              image: user?.imageUrl,
              name: user?.fullName,
              username: user?.username || user?.emailAddresses?.[0]?.emailAddress?.split("@")?.[0],
            },
          },
        ],
      }));
      await sendMessage(conversationId, content);
      // Optionally: refetch messages or conversations
    } finally {
      setSending(false);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    await deleteConversation(conversationId);
    setConvoList((prev) => prev.filter((c) => c.id !== conversationId));
    setSelectedId((prev) => (prev === conversationId ? null : prev));
  };

  if (!conversations.length) {
    return <div className="text-center py-12 text-muted-foreground">No conversations yet</div>;
  }

  // Mobile: show list or chat
  if (typeof window !== "undefined" && window.innerWidth < 768) {
    if (mobileView === "chat" && selected) {
      return (
        <div className="h-[100dvh] flex flex-col">
          <div className="flex items-center p-2 border-b">
            <Button variant="ghost" size="icon" onClick={() => setMobileView("list")}> <ArrowLeft /> </Button>
            <div className="ml-2 font-bold text-lg">{getOther(selected)?.name || getOther(selected)?.username || "User"}</div>
          </div>
          <ChatWindow
            messages={selected.messages}
            other={getOther(selected)}
            handleSend={(formData: FormData) => handleSend(selected.id, formData)}
          />
        </div>
      );
    }
    // List view
    return (
      <div className="h-[100dvh] overflow-y-auto">
        <h1 className="text-2xl font-bold p-4">Direct Messages</h1>
        {convoList.map((conv) => {
          const other = getOther(conv);
          const lastMessage = conv.messages[conv.messages.length - 1];
          return (
            <Card
              key={conv.id}
              className="hover:bg-muted transition cursor-pointer"
              onClick={() => {
                setSelectedId(conv.id);
                setMobileView("chat");
              }}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <Avatar>
                  <AvatarImage src={other?.image || "/avatar.png"} />
                </Avatar>
                <div className="flex-1">
                  <div className="font-medium flex items-center gap-1">
                    {other?.name || other?.username || "Unknown User"}
                    {isUserVerified(other?.username) && (
                      <BlueCheckIcon className="inline-block w-4 h-4 ml-1 align-text-bottom" />
                    )}
                  </div>
                  <div className="text-muted-foreground text-sm line-clamp-1">
                    {lastMessage?.content || "No messages yet"}
                  </div>
                </div>
                {lastMessage && (
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(lastMessage.createdAt))} ago
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  // Desktop: show list and chat
  return (
    <div className="flex h-[80vh] max-w-5xl mx-auto mt-8 border rounded-lg overflow-hidden shadow">
      <div className="w-1/3 border-r overflow-y-auto bg-background">
        <h1 className="text-2xl font-bold p-4">Direct Messages</h1>
        {convoList.map((conv) => {
          const other = getOther(conv);
          const lastMessage = conv.messages[conv.messages.length - 1];
          return (
            <Card
              key={conv.id}
              className={`hover:bg-muted transition cursor-pointer ${selectedId === conv.id ? "bg-muted" : ""}`}
              onClick={() => setSelectedId(conv.id)}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <Avatar>
                  <AvatarImage src={other?.image || "/avatar.png"} />
                </Avatar>
                <div className="flex-1">
                  <div className="font-medium flex items-center gap-1">
                    {other?.name || other?.username || "Unknown User"}
                    {isUserVerified(other?.username) && (
                      <BlueCheckIcon className="inline-block w-4 h-4 ml-1 align-text-bottom" />
                    )}
                  </div>
                  <div className="text-muted-foreground text-sm line-clamp-1">
                    {lastMessage?.content || "No messages yet"}
                  </div>
                </div>
                {lastMessage && (
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(lastMessage.createdAt))} ago
                  </div>
                )}
                <div className="relative">
                  <Button
                    variant="gold"
                    size="icon"
                    className="ml-2"
                    onClick={e => { e.stopPropagation(); setOpenMenuId(conv.id === openMenuId ? null : conv.id); }}
                    title="Conversation options"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                  {openMenuId === conv.id && (
                    <div className="absolute right-0 mt-2 bg-white border rounded shadow z-10 min-w-[100px]">
                      <button
                        className="flex items-center gap-2 px-4 py-2 text-destructive hover:bg-muted w-full"
                        onClick={e => { e.stopPropagation(); handleDeleteConversation(conv.id); setOpenMenuId(null); }}
                      >
                        <X className="w-4 h-4" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <div className="flex-1">
        {selected ? (
          <ChatWindow
            messages={selected.messages}
            other={getOther(selected)}
            handleSend={(formData: FormData) => handleSend(selected.id, formData)}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a conversation
          </div>
        )}
      </div>
    </div>
  );
} 