"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSecureImage } from "@/lib/useSecureImage";

interface SecureAvatarProps {
  src?: string | null;
  alt?: string;
  className?: string;
  fallback?: string;
  showFirst1000Badge?: boolean;
}

export function SecureAvatar({ src, alt, className, fallback, showFirst1000Badge = false }: SecureAvatarProps) {
  const { src: secureUrl, loading, error } = useSecureImage(src);

  // Calculate badge size to match the perfect ratio from sidebar (w-20 h-20 with w-5 h-5 badge = 25%)
  const getBadgeSize = (avatarClassName?: string) => {
    if (!avatarClassName) return 'w-3 h-3'; // Default w-10 h-10 uses w-3 h-3 (30%)
    
    // All ratios calculated to match the perfect sidebar ratio (~25-30%)
    if (avatarClassName.includes('w-36') || avatarClassName.includes('h-36')) return 'w-9 h-9';   // 25%
    if (avatarClassName.includes('w-28') || avatarClassName.includes('h-28')) return 'w-7 h-7';   // 25%
    if (avatarClassName.includes('w-24') || avatarClassName.includes('h-24')) return 'w-6 h-6';   // 25%
    if (avatarClassName.includes('w-20') || avatarClassName.includes('h-20')) return 'w-5 h-5';   // 25% ← Perfect reference
    if (avatarClassName.includes('w-16') || avatarClassName.includes('h-16')) return 'w-4 h-4';   // 25%
    if (avatarClassName.includes('w-12') || avatarClassName.includes('h-12')) return 'w-3 h-3';   // 25%
    if (avatarClassName.includes('w-11') || avatarClassName.includes('h-11')) return 'w-3 h-3';   // 27%
    if (avatarClassName.includes('w-10') || avatarClassName.includes('h-10')) return 'w-3 h-3';   // 30%
    if (avatarClassName.includes('w-8') || avatarClassName.includes('h-8')) return 'w-2 h-2';     // 25%
    
    // Default fallback matches the perfect ratio
    return 'w-3 h-3';
  };

  const badgeSize = getBadgeSize(className);

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
      
      {/* First 1000 Badge - matching the perfect sidebar ratio */}
      {showFirst1000Badge && (
        <div className={`absolute -bottom-1 -right-1 ${badgeSize} rounded-full overflow-hidden shadow-md`}>
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