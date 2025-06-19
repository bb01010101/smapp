"use client";
import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/mousewheel";
import { Button } from "@/components/ui/button";
import { HeartIcon, MessageCircleIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { toggleLike, createComment } from "@/actions/post.action";
import { useUser, SignInButton } from "@clerk/nextjs";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import toast from "react-hot-toast";
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
  const [showSaveNSwipe, setShowSaveNSwipe] = useState(false);
  const [saveNSwipeDogs, setSaveNSwipeDogs] = useState<any[]>([]);
  const [currentDogIdx, setCurrentDogIdx] = useState(0);
  const [isFetchingDogs, setIsFetchingDogs] = useState(false);

  useEffect(() => {
    fetch("/api/plays?limit=10")
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => {
        // Shuffle videos
        for (let i = data.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [data[i], data[j]] = [data[j], data[i]];
        }
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

  // Save-n-swipe trigger on video swipe
  const handleVideoSwipe = async () => {
    if (Math.random() < 0.2 && !showSaveNSwipe) {
      setIsFetchingDogs(true);
      try {
        const res = await fetch('/api/pets/random-posts');
        const data = await res.json();
        setSaveNSwipeDogs(data.posts || []);
        setCurrentDogIdx(0);
        setShowSaveNSwipe(true);
      } catch (e) {
        toast.error('Failed to load dogs for Save-n-swipe');
      } finally {
        setIsFetchingDogs(false);
      }
    }
  };

  // Save-n-swipe actions
  const handleSwipeLeft = () => {
    if (currentDogIdx < saveNSwipeDogs.length - 1) {
      setCurrentDogIdx(currentDogIdx + 1);
    } else {
      setShowSaveNSwipe(false);
    }
  };
  const handleSwipeRight = async () => {
    const dog = saveNSwipeDogs[currentDogIdx];
    if (dog && dog.author) {
      // Get or create conversation
      const convoRes = await fetch('/api/messages/get-or-create-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: dog.author.id }),
      });
      const convoData = await convoRes.json();
      const conversationId = convoData.conversationId;
      if (conversationId) {
        // Send message
        const message = `I'm interested in saving ${dog.pet.name}`;
        await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId, content: message }),
        });
        router.push(`/messages/${conversationId}`);
        // No need to call setShowSaveNSwipe(false) here, redirect will unmount
      } else {
        toast.error('Could not start conversation');
        setShowSaveNSwipe(false);
      }
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  if (!loading && videos.length === 0) {
    return <div className="flex justify-center items-center h-screen">No videos found.</div>;
  }

  return (
    <div className="w-full h-screen bg-black">
      {/* Save-n-swipe Modal */}
      {showSaveNSwipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-xs flex flex-col items-center">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl"
              onClick={() => setShowSaveNSwipe(false)}
              aria-label="Close"
            >
              ×
            </button>
            {isFetchingDogs ? (
              <div className="py-16">Loading...</div>
            ) : saveNSwipeDogs.length === 0 ? (
              <div className="py-16">No dogs found.</div>
            ) : (
              <div className="flex flex-col items-center">
                <img
                  src={saveNSwipeDogs[currentDogIdx]?.image || saveNSwipeDogs[currentDogIdx]?.pet?.imageUrl || '/avatar.png'}
                  alt={saveNSwipeDogs[currentDogIdx]?.pet?.name || 'Dog'}
                  className="w-48 h-48 object-cover rounded-xl mb-4 border-4 border-orange-300"
                />
                <div className="text-xl font-bold mb-2 text-center">
                  {saveNSwipeDogs[currentDogIdx]?.pet?.name || 'Dog'}
                </div>
                <div className="text-gray-600 mb-4 text-center">
                  Owner: {saveNSwipeDogs[currentDogIdx]?.author?.name || saveNSwipeDogs[currentDogIdx]?.author?.username}
                </div>
                <div className="flex gap-10 mt-4">
                  <button
                    className="bg-gray-200 hover:bg-gray-300 rounded-full p-4 text-3xl flex items-center justify-center"
                    onClick={handleSwipeLeft}
                    aria-label="Forget"
                  >
                    <XIcon className="w-8 h-8 text-gray-500" />
                  </button>
                  <button
                    className="bg-pink-100 hover:bg-pink-200 rounded-full p-4 text-3xl flex items-center justify-center"
                    onClick={handleSwipeRight}
                    aria-label="Love"
                  >
                    <HeartIcon className="w-8 h-8 text-pink-500" />
                  </button>
                </div>
                <div className="mt-4 text-sm text-gray-400">{currentDogIdx + 1} / {saveNSwipeDogs.length}</div>
              </div>
            )}
          </div>
        </div>
      )}
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
          handleVideoSwipe(); // <-- trigger Save-n-swipe logic
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
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-auto p-6 relative">
                      <button
                        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl"
                        onClick={() => setShowCommentsIdx(null)}
                        aria-label="Close"
                      >
                        ×
                      </button>
                      <div className="font-semibold text-lg mb-4 text-center">Comments</div>
                      <div className="space-y-4 max-h-64 overflow-y-auto mb-4">
                        {video.comments.length === 0 ? (
                          <div className="text-muted-foreground text-center">No comments yet.</div>
                        ) : (
                          video.comments.map((comment: any) => (
                            <div key={comment.id} className="flex space-x-3">
                              <Avatar className="size-8 flex-shrink-0">
                                <AvatarImage src={comment.author?.image ?? "/avatar.png"} />
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                  <span className="font-medium text-sm">{comment.author?.name || "User"}</span>
                                </div>
                                <p className="text-sm break-words">{comment.content}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      {user ? (
                        <div className="flex space-x-3 mt-2">
                          <Avatar className="size-8 flex-shrink-0">
                            <AvatarImage src={user.imageUrl || "/avatar.png"} />
                          </Avatar>
                          <div className="flex-1">
                            <Textarea
                              placeholder="Write a comment..."
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              className="min-h-[60px] resize-none"
                            />
                            <div className="flex justify-end mt-2">
                              <Button
                                size="sm"
                                onClick={() => handleAddComment(video)}
                                disabled={!newComment.trim() || isCommenting}
                                className="flex items-center gap-2"
                              >
                                {isCommenting ? "Posting..." : "Post"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-center p-4 border rounded-lg bg-muted/50">
                          <SignInButton mode="modal">
                            <Button variant="outline" className="gap-2">Sign in to comment</Button>
                          </SignInButton>
                        </div>
                      )}
                    </div>
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