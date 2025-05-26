"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { updateProduct } from "@/actions/marketplace.action";
import { useUser } from "@clerk/nextjs";
import toast from "react-hot-toast";
import ImageUpload from "../ImageUpload";

interface EditProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    id: string;
    title: string | null;
    description: string | null;
    price: number | null;
    category: string | null;
    condition: string | null;
    location: string | null;
    image: string | null;
    isAffiliate: boolean | null;
    affiliateLink: string | null;
    affiliateCode: string | null;
  };
}

export default function EditProductDialog({ open, onOpenChange, product }: EditProductDialogProps) {
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [image, setImage] = useState<{ url: string; type: string } | null>(
    product.image ? { url: product.image, type: "image" } : null
  );
  const [isAffiliate, setIsAffiliate] = useState(product.isAffiliate);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const formData = new FormData(e.currentTarget);

      // Add image if exists
      if (image?.url) {
        formData.append("image", image.url);
      }

      // Add affiliate flag
      formData.append("isAffiliate", (isAffiliate ?? false).toString());

      const result = await updateProduct(product.id, formData);
      if (result?.success) {
        toast.success("Product updated successfully");
        onOpenChange(false);
      } else {
        throw new Error(result?.error || "Failed to update product");
      }
    } catch (error) {
      toast.error("Failed to update product");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              required
              defaultValue={product.title || ""}
              placeholder="What are you selling?"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              required
              defaultValue={product.description || ""}
              placeholder="Describe your product..."
              className="min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                required
                min="0"
                defaultValue={product.price || ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select name="category" required defaultValue={product.category || ""}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="toys">Toys</SelectItem>
                  <SelectItem value="food">Food</SelectItem>
                  <SelectItem value="accessories">Accessories</SelectItem>
                  <SelectItem value="grooming">Grooming</SelectItem>
                  <SelectItem value="health">Health & Wellness</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="condition">Condition</Label>
              <Select name="condition" required defaultValue={product.condition || ""}>
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="like-new">Like New</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location (optional)</Label>
              <Input
                id="location"
                name="location"
                placeholder="City, State"
                defaultValue={product.location || ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Product Image</Label>
            <ImageUpload
              endpoint="postImage"
              value={image}
              onChange={setImage}
            />
          </div>

          {Boolean((user?.publicMetadata as any)?.isAdmin) && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isAffiliate"
                  checked={isAffiliate ?? false}
                  onChange={(e) => setIsAffiliate(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="isAffiliate">This is an affiliate product</Label>
              </div>

              {isAffiliate && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="affiliateLink">Affiliate Link</Label>
                    <Input
                      id="affiliateLink"
                      name="affiliateLink"
                      type="url"
                      required={isAffiliate}
                      placeholder="https://..."
                      defaultValue={product.affiliateLink || ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="affiliateCode">Affiliate Code (optional)</Label>
                    <Input
                      id="affiliateCode"
                      name="affiliateCode"
                      placeholder="Enter affiliate code"
                      defaultValue={product.affiliateCode || ""}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Listing"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 