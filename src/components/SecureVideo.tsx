"use client";

import { forwardRef } from "react";
import { useSecureImage } from "@/lib/useSecureImage";

interface SecureVideoProps {
  src: string | null | undefined;
  poster?: string | null | undefined;
  className?: string;
  style?: React.CSSProperties;
  controls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  [key: string]: any; // Allow other video props
}

export const SecureVideo = forwardRef<HTMLVideoElement, SecureVideoProps>(function SecureVideo({
  src,
  poster,
  className,
  style,
  controls,
  autoPlay,
  muted,
  loop,
  onLoad,
  onError,
  ...otherProps
}, ref) {
  const { src: secureVideoUrl, loading, error } = useSecureImage(src);
  const { src: securePosterUrl } = useSecureImage(poster);

  if (loading) {
    return (
      <div className={`bg-gray-200 animate-pulse flex items-center justify-center ${className}`} style={style}>
        <span className="text-gray-400 text-sm">Loading video...</span>
      </div>
    );
  }

  if (error || !secureVideoUrl) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`} style={style}>
        <span className="text-gray-400 text-sm">Video unavailable</span>
      </div>
    );
  }

  return (
    <video
      ref={ref}
      src={secureVideoUrl}
      poster={securePosterUrl || undefined}
      className={className}
      style={style}
      controls={controls}
      autoPlay={autoPlay}
      muted={muted}
      loop={loop}
      onLoad={onLoad}
      onError={onError}
      {...otherProps}
    />
  );
}); 