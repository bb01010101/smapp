"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useUser } from "@clerk/nextjs";
import { SecureAvatar } from "@/components/SecureAvatar";
import { MoreVertical, Pencil, Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { deleteListing } from "@/actions/marketplace.action";
import toast from "react-hot-toast";
import EditServiceDialog from "./EditServiceDialog";
import { Button } from "@/components/ui/button";

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

interface ServiceListProps {
  services: Service[];
}

export default function ServiceList({ services }: ServiceListProps) {
  const { user } = useUser();
  const [editingService, setEditingService] = useState<Service | null>(null);

  const handleDelete = async (serviceId: string) => {
    try {
      const result = await deleteListing(serviceId);
      if (result?.success) {
        toast.success("Service deleted successfully");
      } else {
        throw new Error(result?.error || "Failed to delete service");
      }
    } catch (error) {
      toast.error("Failed to delete service");
    }
  };

  if (services.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No services listed yet
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {services.map((service) => (
        <Card key={service.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <Link href={`/profile/${service.author.username}`}>
                  <SecureAvatar 
                    src={service.author.image}
                    alt={service.author.name || "User"}
                    className="size-8"
                  />
                </Link>
                <div>
                  <Link
                    href={`/profile/${service.author.username}`}
                    className="font-medium hover:underline"
                  >
                    {service.author.name}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(service.createdAt))} ago
                  </p>
                </div>
              </div>

              {user?.id === service.author.clerkId && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="gold"
                      size="sm"
                      className="ml-2"
                    >
                      <MoreVertical className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => setEditingService(service)}
                      className="flex items-center gap-2"
                    >
                      <Pencil className="size-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(service.id)}
                      className="flex items-center gap-2 text-destructive"
                    >
                      <Trash className="size-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            <h3 className="font-semibold text-lg mb-1">{service.title}</h3>
            <p className="text-muted-foreground text-sm mb-2 line-clamp-2">
              {service.description}
            </p>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-semibold">
                  ${service.price?.toFixed(2)}/{service.priceType}
                </p>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <span>{service.category}</span>
                  {service.location && (
                    <>
                      <span>•</span>
                      <span>{service.location}</span>
                    </>
                  )}
                </div>
              </div>

              <Link
                href={`/marketplace/service/${service.id}`}
                className="text-sm text-blue-500 hover:underline"
              >
                View Details
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}

      {editingService && (
        <EditServiceDialog
          open={!!editingService}
          onOpenChange={(open) => !open && setEditingService(null)}
          service={editingService}
        />
      )}
    </div>
  );
} 