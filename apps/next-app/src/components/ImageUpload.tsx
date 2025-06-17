"use client";

import { UploadDropzone } from "@/lib/uploadthing";
import { XIcon, Loader2Icon } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

interface ImageUploadProps {
  onChange: (media: { url: string; type: string } | null) => void;
  value: { url: string; type: string } | null;
  endpoint: "postImage" | "petImage";
}

function ImageUpload({ endpoint, onChange, value }: ImageUploadProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (value && value.url) {
    const isVideo = value.type?.startsWith("video");
    return (
      <div className="relative size-40">
        {isVideo ? (
          <video 
            src={value.url} 
            controls 
            className="rounded-md size-40 object-cover"
          />
        ) : (
          <img src={value.url} alt="Upload" className="rounded-md size-40 object-cover" />
        )}
        <button
          onClick={() => onChange(null)}
          className="absolute top-0 right-0 p-1 bg-red-500 rounded-full shadow-sm"
          type="button"
        >
          <XIcon className="h-4 w-4 text-white" />
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center size-40 border-2 border-dashed rounded-md">
        <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <UploadDropzone
      endpoint={endpoint}
      onUploadBegin={() => {
        setIsLoading(true);
        console.log("Upload started");
      }}
      onClientUploadComplete={(res) => {
        setIsLoading(false);
        console.log("Upload complete:", res);
        if (res && res[0]) {
          const url = res[0].ufsUrl || res[0].url;
          onChange({ url, type: res[0].type });
          toast.success("File uploaded successfully");
        }
      }}
      onUploadError={(error: Error) => {
        setIsLoading(false);
        console.error("Upload error:", error);
        toast.error(error.message || "Failed to upload file");
      }}
      config={{
        mode: "auto",
      }}
    />
  );
}

export default ImageUpload;
