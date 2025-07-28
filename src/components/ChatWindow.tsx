"use client";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { SecureAvatar } from "@/components/SecureAvatar";
import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { useUser } from "@clerk/nextjs";
import React, { useState } from "react";
import { isUserVerified } from "@/lib/utils";
import BlueCheckIcon from "@/components/BlueCheckIcon";

// Simple markdown link renderer
function renderMarkdownLinks(text: string) {
  // Replace [text](url) with <a href="url" target="_blank" rel="noopener noreferrer">text</a>
  return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="underline text-blue-200 hover:text-blue-400">$1</a>');
}

export default function ChatWindow({ messages, other, handleSend }: any) {
  const { user } = useUser();
  const [localMessages, setLocalMessages] = useState(messages);

  const handleLocalSend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const content = formData.get("content") as string;
    if (!content?.trim()) return;
    // Optimistically add message
    setLocalMessages((prev: any[]) => [
      ...prev,
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
    ]);
    form.reset();
    // Call backend
    if (typeof handleSend === "function") await handleSend(formData);
  };

  React.useEffect(() => {
    setLocalMessages(messages);
  }, [messages]);

  return (
    <div className="max-w-2xl mx-auto py-8 flex flex-col h-[80vh]">
      <div className="mb-4 flex items-center gap-3 justify-center">
        <SecureAvatar 
          src={other?.image}
          alt={other?.name || "User"}
        />
        <div className="font-bold text-xl flex items-center gap-1">
          {other?.name || other?.username || "User"}
          {isUserVerified(other?.username) && (
            <BlueCheckIcon className="inline-block w-5 h-5 ml-1 align-text-bottom" />
          )}
        </div>
      </div>
      <Card className="flex-1 overflow-y-auto bg-background border-none shadow-none">
        <CardContent className="flex flex-col gap-2 p-4">
          {localMessages.length === 0 && (
            <div className="text-center text-muted-foreground">No messages yet</div>
          )}
          {localMessages.map((msg: any, idx: number) => {
            const isMe = user?.id && msg?.sender && user.id === msg.sender.clerkId;
            if (isMe) {
              return (
                <div key={msg.id} className="flex justify-end items-end gap-2 mb-1">
                  <div className="flex flex-col items-end max-w-xs ml-auto">
                    <div className="rounded-2xl px-4 py-2 inline-block mt-1 mb-1 bg-blue-500 text-white shadow-md text-base">
                      <span dangerouslySetInnerHTML={{ __html: renderMarkdownLinks(msg.content) }} />
                    </div>
                    <div className="text-xs text-muted-foreground pr-2 mt-1">
                      {formatDistanceToNow(new Date(msg.createdAt))} ago
                    </div>
                  </div>
                  <div className="rounded-full bg-blue-100 p-0.5">
                    <SecureAvatar 
                      src={user?.imageUrl}
                      alt={user?.fullName || "User"}
                      className="w-7 h-7"
                    />
                  </div>
                </div>
              );
            } else {
              return (
                <div key={msg.id} className="flex items-end gap-2 mb-1">
                  <div className="rounded-full bg-muted p-0.5">
                                        <SecureAvatar 
                      src={other?.image}
                      alt={other?.name || "User"}
                      className="w-7 h-7"
                    />
                  </div>
                  <div className="flex flex-col items-start max-w-xs">
                    <div className="rounded-2xl px-4 py-2 inline-block mt-1 mb-1 bg-gray-200 dark:bg-gray-700 text-black dark:text-white shadow text-base">
                      <span dangerouslySetInnerHTML={{ __html: renderMarkdownLinks(msg.content) }} />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(msg.createdAt))} ago
                    </div>
                  </div>
                </div>
              );
            }
          })}
        </CardContent>
      </Card>
      <form onSubmit={handleLocalSend} className="flex gap-2 mt-4">
        <input
          name="content"
          type="text"
          placeholder="Type a message..."
          className="flex-1 border rounded px-3 py-2"
          autoComplete="off"
          required
        />
        <button type="submit" className="bg-primary text-white px-4 py-2 rounded">
          Send
        </button>
      </form>
    </div>
  );
} 