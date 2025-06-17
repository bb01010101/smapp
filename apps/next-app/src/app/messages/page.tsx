import { getConversations } from "@/actions/dm.action";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import MessagesClient from "@/components/MessagesClient";

export default async function MessagesPage() {
  const conversations = await getConversations();
  return <MessagesClient conversations={conversations} />;
} 