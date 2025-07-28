"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { SecureAvatar } from "@/components/SecureAvatar";
import { MapPinIcon, TagIcon, ClockIcon, MoreVertical, Pencil, Trash } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { deleteListing } from "@/actions/marketplace.action";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import EditServiceDialog from "@/components/marketplace/EditServiceDialog";
import { getOrCreateConversation } from "@/actions/dm.action";
import { isUserVerified } from "@/lib/utils";
import BlueCheckIcon from "@/components/BlueCheckIcon";

type Service = {
  id: string;
  title: string | null;
  description: string | null;
  price: number | null;
  priceType: string | null;
  category: string | null;
  location: string | null;
  author: {
    id: string;
    name: string | null;
    username: string;
    image: string | null;
    clerkId: string;
  };
  createdAt: Date;
};

interface ServiceDetailProps {
  service: Service;
}

export default function ServiceDetail({ service }: ServiceDetailProps) {
  const { user } = useUser();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this service?")) return;

    try {
      const result = await deleteListing(service.id);
      if (result?.success) {
        toast.success("Service deleted successfully");
        router.push("/marketplace");
      } else {
        throw new Error(result?.error || "Failed to delete service");
      }
    } catch (error) {
      toast.error("Failed to delete service");
    }
  };

  const handleContactProvider = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const conversation = await getOrCreateConversation(service.author.id);
      router.push(`/messages/${conversation.id}`);
    } catch (e) {
      // Optionally show error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{service.title}</h1>
            <p className="text-2xl font-semibold text-primary">
              ${service.price?.toFixed(2) || ""}/{service.priceType}
            </p>
          </div>

          {user?.id === service.author.clerkId && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="size-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2"
                >
                  <Pencil className="size-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="flex items-center gap-2 text-destructive"
                >
                  <Trash className="size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <Link href={`/profile/${service.author.username}`}>
            <SecureAvatar 
              src={service.author.image}
              alt={service.author.name || "User"}
              className="size-10"
            />
          </Link>
          <div>
            <Link
              href={`/profile/${service.author.username}`}
              className="font-medium hover:underline flex items-center gap-1"
            >
              {service.author.name ?? service.author.username}
              {isUserVerified(service.author.username) && (
                <BlueCheckIcon className="inline-block w-4 h-4 ml-1 align-text-bottom" />
              )}
            </Link>
            <p className="text-sm text-muted-foreground">
              Listed {formatDistanceToNow(new Date(service.createdAt))} ago
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="font-semibold mb-2">Description</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {service.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <TagIcon className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Category</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {service.category}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <ClockIcon className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Price Type</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {service.priceType}
                </p>
              </div>
            </div>

            {service.location && (
              <div className="flex items-center space-x-2">
                <MapPinIcon className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">
                    {service.location}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <Button className="w-full" size="lg" onClick={handleContactProvider} disabled={loading}>
          {loading ? "Contacting..." : "Contact Provider"}
        </Button>
      </div>

      {isEditing && (
        <EditServiceDialog
          open={isEditing}
          onOpenChange={setIsEditing}
          service={service}
        />
      )}
    </div>
  );
} 