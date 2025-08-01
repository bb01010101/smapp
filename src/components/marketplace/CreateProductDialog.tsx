"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { createProduct } from "@/actions/marketplace.action";
import { useUser } from "@clerk/nextjs";
import toast from "react-hot-toast";
import S3ImageUpload from "../S3ImageUpload";

interface CreateProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateProductDialog({ open, onOpenChange }: CreateProductDialogProps) {
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [image, setImage] = useState<{ url: string; type: string } | null>(null);
  const [isAffiliate, setIsAffiliate] = useState(false);

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
      formData.append("isAffiliate", isAffiliate.toString());

      const result = await createProduct(formData);
      if (result?.success) {
        toast.success("Product listed successfully");
        onOpenChange(false);
        return;
      } else {
        throw new Error(result?.error || "Failed to create product");
      }
    } catch (error) {
      toast.error("Failed to create product");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>List a Product</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              required
              placeholder="What are you selling?"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              required
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
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select name="category" required>
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
              <Select name="condition" required>
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
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Product Image</Label>
            <S3ImageUpload
              folder="marketplace/products"
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
                  checked={isAffiliate}
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
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="affiliateCode">Affiliate Code (optional)</Label>
                    <Input
                      id="affiliateCode"
                      name="affiliateCode"
                      placeholder="Enter affiliate code"
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
              {isSubmitting ? "Creating..." : "Create Listing"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 