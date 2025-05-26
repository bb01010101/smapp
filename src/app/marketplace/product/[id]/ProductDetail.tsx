"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { MapPinIcon, TagIcon, PackageIcon, MoreVertical, Pencil, Trash } from "lucide-react";
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
import EditProductDialog from "@/components/marketplace/EditProductDialog";

type Product = {
  id: string;
  title: string | null;
  description: string | null;
  price: number | null;
  image: string | null;
  category: string | null;
  condition: string | null;
  location: string | null;
  isAffiliate: boolean | null;
  affiliateLink: string | null;
  affiliateCode: string | null;
  author: {
    id: string;
    name: string | null;
    username: string;
    image: string | null;
    clerkId: string;
  };
  createdAt: Date;
};

interface ProductDetailProps {
  product: Product;
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const { user } = useUser();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const result = await deleteListing(product.id);
      if (result?.success) {
        toast.success("Product deleted successfully");
        router.push("/marketplace");
      } else {
        throw new Error(result?.error || "Failed to delete product");
      }
    } catch (error) {
      toast.error("Failed to delete product");
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Image */}
        <div className="relative aspect-square rounded-lg overflow-hidden">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.title?.toString() || ""}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <PackageIcon className="w-16 h-16 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
              <p className="text-2xl font-semibold text-primary">
                ${product.price?.toFixed(2) || ""}
              </p>
            </div>

            {user?.id === product.author.clerkId && (
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
            <Link href={`/profile/${product.author.username}`}>
              <Avatar className="size-10">
                <AvatarImage src={product.author.image ?? "/avatar.png"} />
              </Avatar>
            </Link>
            <div>
              <Link
                href={`/profile/${product.author.username}`}
                className="font-medium hover:underline"
              >
                {product.author.name ?? product.author.username}
              </Link>
              <p className="text-sm text-muted-foreground">
                Listed {formatDistanceToNow(new Date(product.createdAt))} ago
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="font-semibold mb-2">Description</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {product.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <TagIcon className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Category</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {product.category}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <PackageIcon className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Condition</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {product.condition}
                  </p>
                </div>
              </div>

              {product.location && (
                <div className="flex items-center space-x-2">
                  <MapPinIcon className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">
                      {product.location}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {product.isAffiliate ? (
            <a
              href={product.affiliateLink || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button className="w-full" size="lg">
                View Product
              </Button>
            </a>
          ) : (
            <Button className="w-full" size="lg">
              Contact Seller
            </Button>
          )}
        </div>
      </div>

      {isEditing && (
        <EditProductDialog
          open={isEditing}
          onOpenChange={setIsEditing}
          product={product}
        />
      )}
    </div>
  );
} 