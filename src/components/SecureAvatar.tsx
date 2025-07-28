"use client";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useSecureImage } from "@/lib/useSecureImage";

interface SecureAvatarProps {
  src: string | null | undefined;
  alt?: string;
  className?: string;
  fallback?: string;
}

export function SecureAvatar({ src, alt, className, fallback }: SecureAvatarProps) {
  const { src: secureUrl, loading, error } = useSecureImage(src);

  return (
    <Avatar className={className}>
      {loading ? (
        <AvatarFallback className="bg-gray-200 animate-pulse">
          {fallback?.charAt(0) || "?"}
        </AvatarFallback>
      ) : error || !secureUrl ? (
        <AvatarFallback>
          {fallback?.charAt(0) || alt?.charAt(0) || "?"}
        </AvatarFallback>
      ) : (
        <AvatarImage src={secureUrl} alt={alt} />
      )}
    </Avatar>
  );
} 