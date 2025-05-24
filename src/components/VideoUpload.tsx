"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { UploadDropzone } from "@/lib/uploadthing";
import { useRouter } from "next/navigation";
import { VideoIcon } from "lucide-react";
import { getDbUserId } from "@/actions/user.action";

export default function VideoUpload() {
  const [videoUrl, setVideoUrl] = useState("");
  const [title, setTitle] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!videoUrl || !title) return;

    try {
      setIsUploading(true);
      const userId = await getDbUserId();
      
      const response = await fetch("/api/videos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          url: videoUrl,
        }),
      });

      if (!response.ok) throw new Error("Failed to create video");

      router.refresh();
      setVideoUrl("");
      setTitle("");
    } catch (error) {
      console.error("Error creating video:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="fixed bottom-4 right-4 z-50">
          <VideoIcon className="mr-2 h-4 w-4" />
          Upload Video
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload a Video</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              placeholder="Enter video title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Video</Label>
            {videoUrl ? (
              <div className="relative aspect-video">
                <video
                  src={videoUrl}
                  className="w-full h-full object-cover rounded-lg"
                  controls
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => setVideoUrl("")}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <UploadDropzone
                endpoint="video"
                onClientUploadComplete={(res) => {
                  setVideoUrl(res?.[0].url);
                }}
                onUploadError={(error: Error) => {
                  console.error(error);
                }}
              />
            )}
          </div>
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={!videoUrl || !title || isUploading}
          >
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}