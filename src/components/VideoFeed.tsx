"use client";

import { useRef, useState } from "react";
import { Card } from "./ui/card";
import { Avatar, AvatarImage } from "./ui/avatar";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface Post {
  id: string;
  content: string;
  image: string;
  mediaType?: string;
  createdAt: Date;
  author: {
    id: string;
    name: string | null;
    username: string;
    image: string | null;
  };
}

interface VideoFeedProps {
  videos: Post[];
}

export default function VideoFeed({ videos }: VideoFeedProps) {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const handleVideoEnd = () => {
    if (currentVideoIndex < videos.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
    }
  };

  const handleScroll = (event: React.WheelEvent) => {
    if (event.deltaY > 0 && currentVideoIndex < videos.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
    } else if (event.deltaY < 0 && currentVideoIndex > 0) {
      setCurrentVideoIndex(currentVideoIndex - 1);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] overflow-hidden" onWheel={handleScroll}>
      {videos.map((video, index) => (
        <div
          key={video.id}
          className={`h-full transition-transform duration-500 ${
            index === currentVideoIndex ? "translate-y-0" : "translate-y-full"
          }`}
          style={{
            display: Math.abs(index - currentVideoIndex) <= 1 ? "block" : "none",
          }}
        >
          <Card className="h-full relative overflow-hidden">
            <video
              ref={el => { videoRefs.current[index] = el; }}
              src={video.image}
              className="w-full h-full object-cover"
              autoPlay={index === currentVideoIndex}
              loop
              playsInline
              onEnded={handleVideoEnd}
              muted
            />
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
              <div className="flex items-center gap-3">
                <Link href={`/profile/${video.author.username}`}>
                  <Avatar>
                    <AvatarImage src={video.author.image ?? "/avatar.png"} />
                  </Avatar>
                </Link>
                <div>
                  <Link
                    href={`/profile/${video.author.username}`}
                    className="font-semibold text-white hover:underline"
                  >
                    {video.author.name ?? video.author.username}
                  </Link>
                  <p className="text-sm text-white/80">
                    {formatDistanceToNow(new Date(video.createdAt))} ago
                  </p>
                </div>
              </div>
              <h2 className="mt-2 text-lg font-semibold text-white">{video.content}</h2>
            </div>
          </Card>
        </div>
      ))}
    </div>
  );
}