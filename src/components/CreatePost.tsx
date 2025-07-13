"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarImage } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import { ImageIcon, Loader2Icon, SendIcon, VideoIcon } from "lucide-react";
import { Button } from "./ui/button";
import { createPost } from "@/actions/post.action";
import toast from "react-hot-toast";
import ImageUpload from "./ImageUpload";

function CreatePost() {
  const { user } = useUser();
  const [content, setContent] = useState("");
  const [media, setMedia] = useState<{ url: string; type: string } | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [pets, setPets] = useState<any[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch pets for the current user
    const fetchPets = async () => {
      const res = await fetch("/api/pets");
      if (res.ok) {
        const data = await res.json();
        setPets(data);
      }
    };
    fetchPets();
  }, []);

  const handleSubmit = async () => {
    if (!content.trim() && !media?.url) return;

    setIsPosting(true);
    try {
      const result = await createPost(content, media?.url || "", selectedPetId, media?.type || "");
      if (result?.success) {
        // reset the form
        setContent("");
        setMedia(null);
        setShowImageUpload(false);
        setSelectedPetId(null);
        toast.success("Post created successfully");
      }
    } catch (error) {
      console.error("Failed to create post:", error);
      toast.error("Failed to create post");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex space-x-4">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user?.imageUrl || "/avatar.png"} />
            </Avatar>
            <Textarea
              placeholder="What's on your mind?"
              className="min-h-[100px] resize-none border-none focus-visible:ring-0 p-0 text-base"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isPosting}
            />
          </div>

          {/* Post as selector */}
          <div>
            <label className="block text-sm font-medium mb-1">Post as</label>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={selectedPetId || ""}
              onChange={e => setSelectedPetId(e.target.value || null)}
              disabled={isPosting}
            >
              <option value="">Yourself</option>
              {pets.map((pet) => (
                <option key={pet.id} value={pet.id}>
                  {pet.name} ({pet.species})
                </option>
              ))}
            </select>
          </div>

          {(showImageUpload || media) && (
            <div className="border rounded-lg p-4">
              <ImageUpload
                endpoint="postImage"
                value={media}
                onChange={(mediaObj) => {
                  setMedia(mediaObj);
                  if (!mediaObj) setShowImageUpload(false);
                }}
              />
            </div>
          )}

          <div className="flex items-center justify-between border-t pt-4">
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="hover:bg-gold-100 hover:text-gold-700"
                onClick={() => setShowImageUpload(!showImageUpload)}
                disabled={isPosting}
              >
                {media && media.type?.startsWith("video") ? (
                  <VideoIcon className="size-4 mr-2" />
                ) : (
                  <ImageIcon className="size-4 mr-2" />
                )}
                {media && media.type?.startsWith("video") ? "Video" : "Media"}
              </Button>
            </div>
            <Button
              className="flex items-center"
              variant="default"
              onClick={handleSubmit}
              disabled={(!content.trim() && !media?.url) || isPosting}
            >
              {isPosting ? (
                <>
                  <Loader2Icon className="size-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <SendIcon className="size-4 mr-2" />
                  Post
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
export default CreatePost;
