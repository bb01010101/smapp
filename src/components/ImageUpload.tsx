"use client";

import { UploadDropzone } from "@/lib/uploadthing";
import { XIcon } from "lucide-react";

interface ImageUploadProps {
  onChange: (media: { url: string; type: string } | null) => void;
  value: { url: string; type: string } | null;
  endpoint: "postImage" | "petImage";
}

function ImageUpload({ endpoint, onChange, value }: ImageUploadProps) {
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
  return (
    <UploadDropzone
      endpoint={endpoint}
      onClientUploadComplete={(res) => {
        if (res && res[0]) {
          onChange({ url: res[0].url, type: res[0].type });
        }
      }}
      onUploadError={(error: Error) => {
        console.log(error);
      }}
    />
  );
}
export default ImageUpload;
