"use client";
import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/mousewheel";
import { Button } from "@/components/ui/button";
import { HeartIcon, MessageCircleIcon } from "lucide-react";
import Link from "next/link";
import { toggleLike, createComment } from "@/actions/post.action";
import { useUser, SignInButton } from "@clerk/nextjs";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import toast from "react-hot-toast";

// Placeholder for HLS.js video player
const VideoPlayer = dynamic(() => import("@/components/VideoFeed"), { ssr: false });

export default function PlaysPage() {
  const { user } = useUser();
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCommentsIdx, setShowCommentsIdx] = useState<number | null>(null);
  const [newComment, setNewComment] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [optimisticLikes, setOptimisticLikes] = useState<{ [id: string]: number }>({});
  const [hasLiked, setHasLiked] = useState<{ [id: string]: boolean }>({});
  const swiperRef = useRef<any>(null);

  useEffect(() => {
    fetch("/api/plays?limit=10")
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => {
        setVideos(data);
        // Set initial like state
        const likeState: { [id: string]: boolean } = {};
        const likeCounts: { [id: string]: number } = {};
        data.forEach((video: any) => {
          likeState[video.id] = user ? video.likes.some((l: any) => l.userId === user.id) : false;
          likeCounts[video.id] = video._count.likes;
        });
        setHasLiked(likeState);
        setOptimisticLikes(likeCounts);
      })
      .catch((err) => {
        console.error("Failed to fetch videos:", err);
        setVideos([]);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const handleLike = async (video: any) => {
    if (isLiking) return;
    try {
      setIsLiking(true);
      setHasLiked((prev) => ({ ...prev, [video.id]: !prev[video.id] }));
      setOptimisticLikes((prev) => ({ ...prev, [video.id]: prev[video.id] + (hasLiked[video.id] ? -1 : 1) }));
      await toggleLike(video.id);
    } catch (error) {
      setOptimisticLikes((prev) => ({ ...prev, [video.id]: video._count.likes }));
      setHasLiked((prev) => ({ ...prev, [video.id]: video.likes.some((l: any) => l.userId === user?.id) }));
    } finally {
      setIsLiking(false);
    }
  };

  const handleAddComment = async (video: any) => {
    if (!newComment.trim() || isCommenting) return;
    try {
      setIsCommenting(true);
      const result = await createComment(video.id, newComment);
      if (result?.success) {
        toast.success("Comment posted successfully");
        setNewComment("");
        // Optionally, refetch or optimistically update comments
      }
    } catch (error) {
      toast.error("Failed to add comment");
    } finally {
      setIsCommenting(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  if (!loading && videos.length === 0) {
    return <div className="flex justify-center items-center h-screen">No videos found.</div>;
  }

  return (
    <div className="w-full h-screen bg-black">
      <Swiper
        direction="vertical"
        slidesPerView={1}
        mousewheel
        cssMode
        speed={3000}
        className="h-full"
        style={{ height: "100vh" }}
        onSwiper={(swiper) => (swiperRef.current = swiper)}
        onSlideChange={(swiper) => {
          // Pause all videos
          document.querySelectorAll("video").forEach((v) => {
            v.pause();
            v.currentTime = 0;
          });
          // Play the current video
          const currentSlide = swiper.slides[swiper.activeIndex];
          const video = currentSlide.querySelector("video");
          if (video) {
            video.currentTime = 0;
            video.play();
          }
        }}
        loop
      >
        {videos.map((video: any, idx: number) => {
          // Debug log to check content
          console.log("Video object:", video);
          return (
            <SwiperSlide key={video.id}>
              <div className="flex justify-center items-center h-full relative">
                <VideoPlayer src={video.image} poster={video.poster} />
                {/* Overlay: Right-side icons */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-6 z-10">
                  {user ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`hover:text-red-500 transition text-white text-2xl p-0 m-0 shadow-none border-none bg-transparent ${hasLiked[video.id] ? "text-red-500 hover:text-red-600" : ""}`}
                      onClick={() => handleLike(video)}
                    >
                      <HeartIcon className={`w-20 h-20 ${hasLiked[video.id] ? "fill-current" : ""}`} />
                      <span className="text-base ml-1">{optimisticLikes[video.id]}</span>
                    </Button>
                  ) : (
                    <SignInButton mode="modal">
                      <Button variant="ghost" size="icon" className="hover:text-red-500 transition text-white text-2xl p-0 m-0 shadow-none border-none bg-transparent">
                        <HeartIcon className="w-20 h-20" />
                        <span className="text-base ml-1">{video._count.likes}</span>
                      </Button>
                    </SignInButton>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:text-blue-500 transition text-white text-2xl p-0 m-0 shadow-none border-none bg-transparent"
                    onClick={() => setShowCommentsIdx(idx === showCommentsIdx ? null : idx)}
                  >
                    <MessageCircleIcon className={`w-20 h-20 ${showCommentsIdx === idx ? "fill-blue-500 text-blue-500" : ""}`} />
                    <span className="text-base ml-1">{video._count.comments}</span>
                  </Button>
                </div>
                {/* Overlay: Bottom-left blurb */}
                <div className="absolute left-4 bottom-6 z-10 flex items-end gap-3">
                  <Link href={`/profile/${video.author.username}`}>
                    <Avatar className="w-10 h-10 border-2 border-white">
                      <AvatarImage src={video.author.image ?? "/avatar.png"} />
                    </Avatar>
                  </Link>
                  <div className="flex flex-col">
                    <Link href={`/profile/${video.author.username}`} className="text-white font-semibold text-base hover:underline">
                      {video.author.name ?? video.author.username}
                    </Link>
                    <span className="text-white text-sm line-clamp-2 max-w-xs opacity-90">{video.content || video["content"] || video.title || "No description."}</span>
                  </div>
                </div>
                {/* Comments Section (modal style) */}
                {showCommentsIdx === idx && (
                  <div className="absolute bottom-0 left-0 w-full bg-black/80 p-4 z-20 max-h-[60vh] overflow-y-auto rounded-t-xl">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white font-semibold">Comments</span>
                      <Button variant="ghost" size="icon" onClick={() => setShowCommentsIdx(null)}>
                        ×
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {video.comments.length === 0 ? (
                        <div className="text-white/70 text-sm">No comments yet.</div>
                      ) : (
                        video.comments.map((comment: any) => (
                          <div key={comment.id} className="flex items-center gap-2">
                            <Avatar className="w-7 h-7">
                              <AvatarImage src={comment.author?.image ?? "/avatar.png"} />
                            </Avatar>
                            <span className="text-white text-xs font-semibold">{comment.author?.name || "User"}</span>
                            <span className="text-white text-xs">{comment.content}</span>
                          </div>
                        ))
                      )}
                    </div>
                    {user ? (
                      <div className="flex items-center gap-2 mt-2">
                        <Avatar className="w-7 h-7">
                          <AvatarImage src={user.imageUrl || "/avatar.png"} />
                        </Avatar>
                        <Textarea
                          placeholder="Write a comment..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          className="min-h-[40px] resize-none text-xs"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleAddComment(video)}
                          disabled={!newComment.trim() || isCommenting}
                          className="flex items-center gap-2"
                        >
                          {isCommenting ? "Posting..." : "Post"}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-center p-2">
                        <SignInButton mode="modal">
                          <Button variant="outline" className="gap-2 text-xs">Sign in to comment</Button>
                        </SignInButton>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
} 