"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
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
import EditProductDialog from "./EditProductDialog";
import { Button } from "@/components/ui/button";

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

interface ProductListProps {
  products: Product[];
}

export default function ProductList({ products }: ProductListProps) {
  const { user } = useUser();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const handleDelete = async (productId: string) => {
    try {
      const result = await deleteListing(productId);
      if (result?.success) {
        toast.success("Product deleted successfully");
      } else {
        throw new Error(result?.error || "Failed to delete product");
      }
    } catch (error) {
      toast.error("Failed to delete product");
    }
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No products listed yet
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => {
        if (typeof window !== "undefined") {
          console.log("Current user ID:", user?.id, "Product author ID:", product.author.id);
        }
        return (
          <Card key={product.id} className="overflow-hidden">
            <CardContent className="p-0">
              {product.image && (
                <div className="relative aspect-square">
                  <Image
                    src={product.image}
                    alt={product.title?.toString() || ""}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Link href={`/profile/${product.author.username}`}>
                      <Avatar className="size-8">
                        <AvatarImage src={product.author.image ?? "/avatar.png"} />
                      </Avatar>
                    </Link>
                    <div>
                      <Link
                        href={`/profile/${product.author.username}`}
                        className="font-medium hover:underline"
                      >
                        {product.author.name}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(product.createdAt))} ago
                      </p>
                    </div>
                  </div>

                  {user?.id === product.author.clerkId && (
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
                          onClick={() => setEditingProduct(product)}
                          className="flex items-center gap-2"
                        >
                          <Pencil className="size-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(product.id)}
                          className="flex items-center gap-2 text-destructive"
                        >
                          <Trash className="size-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                <h3 className="font-semibold text-lg mb-1">{product.title}</h3>
                <p className="text-muted-foreground text-sm mb-2 line-clamp-2">
                  {product.description}
                </p>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold">${product.price?.toFixed(2) || ""}</p>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <span>{product.category}</span>
                      <span>•</span>
                      <span>{product.condition}</span>
                    </div>
                  </div>

                  {product.isAffiliate ? (
                    <a
                      href={product.affiliateLink || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-500 hover:underline"
                    >
                      View Product
                    </a>
                  ) : (
                    <Link
                      href={`/marketplace/product/${product.id}`}
                      className="text-sm text-blue-500 hover:underline"
                    >
                      View Details
                    </Link>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {editingProduct && (
        <EditProductDialog
          open={!!editingProduct}
          onOpenChange={(open) => !open && setEditingProduct(null)}
          product={editingProduct}
        />
      )}
    </div>
  );
} 