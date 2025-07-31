"use client";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useSecureImage } from "@/lib/useSecureImage";

interface SecureAvatarProps {
  src: string | null | undefined;
  alt?: string;
  className?: string;
  fallback?: string;
  showFirst1000Badge?: boolean;
}

export function SecureAvatar({ src, alt, className, fallback, showFirst1000Badge = false }: SecureAvatarProps) {
  const { src: secureUrl, loading, error } = useSecureImage(src);

  return (
    <div className="relative inline-block">
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
      
      {/* First 1000 Badge */}
      {showFirst1000Badge && (
        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full overflow-hidden shadow-lg">
          <img 
            src="/first1000.png" 
            alt="First 1000 Badge" 
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </div>
  );
} 