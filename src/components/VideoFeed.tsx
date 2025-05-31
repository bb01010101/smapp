"use client";

import { useRef, useState } from "react";

export default function VideoFeed({ src, poster }: { src: string; poster?: string }) {
  const [showControls, setShowControls] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Hide controls after a few seconds (optional, for better UX)
  // You can uncomment the following lines if you want auto-hide after showing
  // useEffect(() => {
  //   if (showControls) {
  //     const timeout = setTimeout(() => setShowControls(false), 2000);
  //     return () => clearTimeout(timeout);
  //   }
  // }, [showControls]);

  return (
    <div
      className="w-full h-full flex items-center justify-center bg-black relative"
      onClick={() => setShowControls((v) => !v)}
      style={{ cursor: "pointer" }}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        controls={showControls}
        autoPlay
        muted
        playsInline
        className="max-h-[80vh] max-w-full rounded-lg shadow-lg bg-black"
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </div>
  );
}