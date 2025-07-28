"use client";

import { XIcon, Loader2Icon, UploadIcon } from "lucide-react";
import { useState, useRef } from "react";
import toast from "react-hot-toast";
import { SecureImage } from "@/lib/useSecureImage";

interface S3ImageUploadProps {
  onChange: (media: { url: string; type: string } | null) => void;
  value: { url: string; type: string } | null;
  folder?: string;
  accept?: string;
  maxSize?: number; // in MB
}

function S3ImageUpload({ 
  onChange, 
  value, 
  folder = "uploads",
  accept = "image/*,video/*",
  maxSize = 128
}: S3ImageUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    const maxSizeBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast.error(`File too large. Max size: ${maxSize}MB`);
      return;
    }

    // Validate file type
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (!isImage && !isVideo) {
      toast.error('Please select an image or video file');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        onChange({ url: result.url, type: result.type });
        toast.success('File uploaded successfully');
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload file');
    } finally {
      setIsLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    onChange(null);
  };

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
          <SecureImage 
            src={value.url} 
            alt="Upload" 
            className="rounded-md size-40 object-cover"
            fallbackSrc="/default-pet.png"
          />
        )}
        <button
          onClick={handleRemove}
          className="absolute top-0 right-0 p-1 bg-red-500 rounded-full shadow-sm hover:bg-red-600 transition-colors"
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
    <div className="size-40 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center hover:border-gray-400 transition-colors cursor-pointer">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="flex flex-col items-center justify-center w-full h-full text-gray-500 hover:text-gray-700 transition-colors"
        type="button"
      >
        <UploadIcon className="h-8 w-8 mb-2" />
        <span className="text-sm text-center">
          Click to upload<br />
          <span className="text-xs text-gray-400">
            Max {maxSize}MB
          </span>
        </span>
      </button>
    </div>
  );
}

export default S3ImageUpload; 