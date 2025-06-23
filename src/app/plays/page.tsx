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
  const [petCards, setPetCards] = useState<any[]>([]);
  const [skippedPetIdxs, setSkippedPetIdxs] = useState<number[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch videos
        const videoRes = await fetch("/api/plays?limit=10");
        const videoData = await videoRes.json();
        // Fetch pet cards
        const petRes = await fetch('/api/pets/random-posts');
        const petData = await petRes.json();
        // Shuffle videos
        for (let i = videoData.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [videoData[i], videoData[j]] = [videoData[j], videoData[i]];
        }
        setVideos(videoData);
        setPetCards(petData.posts || []);
        // Set initial like state
        const likeState: { [id: string]: boolean } = {};
        const likeCounts: { [id: string]: number } = {};
        videoData.forEach((video: any) => {
          likeState[video.id] = user ? video.likes.some((l: any) => l.userId === user.id) : false;
          likeCounts[video.id] = video._count.likes;
        });
        setHasLiked(likeState);
        setOptimisticLikes(likeCounts);
      } catch (err) {
        console.error("Failed to fetch videos or pets:", err);
        setVideos([]);
        setPetCards([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  // Interleave pet cards into videos array (e.g., every 4th slide)
  function getFeedWithPets() {
    if (!videos.length) return [];
    // Always start with a video if available
    const firstVideo = videos[0];
    const restVideos = videos.slice(1).map(v => ({ ...v, _type: 'video' }));
    const petItems = petCards
      .map((pet, idx) => {
        const imageUrl = pet?.image || pet?.pet?.imageUrl;
        if (imageUrl && !skippedPetIdxs.includes(idx)) {
          return { ...pet, _type: 'pet', _petIdx: idx };
        }
        return null;
      })
      .filter(Boolean);
    // Shuffle the rest (videos + pets)
    const rest = [...restVideos, ...petItems];
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }
    return [{ ...firstVideo, _type: 'video' }, ...rest];
  }

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
      }
    } catch (error) {
      toast.error("Failed to add comment");
    } finally {
      setIsCommenting(false);
    }
  };

  // Save-n-swipe actions
  const handleSwipeLeft = (petIdx: number) => {
    setSkippedPetIdxs((prev) => [...prev, petIdx]);
  };
  const handleSwipeRight = async (pet: any) => {
    if (pet && pet.author) {
      // Get or create conversation
      const convoRes = await fetch('/api/messages/get-or-create-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: pet.author.id }),
      });
      const convoData = await convoRes.json();
      const conversationId = convoData.conversationId;
      if (conversationId) {
        // Send message
        const message = `I'm interested in saving ${pet.pet.name}`;
        await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId, content: message }),
        });
        router.push(`/messages/${conversationId}`);
      } else {
        toast.error('Could not start conversation');
      }
    }
  };

  // Save-n-swipe image error handler
  const handlePetImageError = (petIdx: number) => {
    setSkippedPetIdxs((prev) => [...prev, petIdx]);
  };

  if (loading) return <div className="flex justify-center items-center h-screen bg-black">Loading...</div>;
  if (!loading && videos.length === 0) {
    return <div className="flex justify-center items-center h-screen bg-black">No videos found.</div>;
  }

  const feed = getFeedWithPets();

  return (
    <div className="w-full h-screen bg-black flex items-center justify-center">
      <div className="w-full flex justify-center items-center h-full">
        <div className="w-full max-w-[400px] h-full flex items-center justify-center">
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
              // Play the video in the active slide (if present)
              const currentSlide = swiper.slides[swiper.activeIndex];
              if (currentSlide) {
                const video = currentSlide.querySelector("video");
                if (video) {
                  video.currentTime = 0;
                  video.play().catch(() => {});
                }
              }
            }}
            loop
          >
            {feed.map((item: any, idx: number) => {
              if (item._type === 'video') {
                return (
                  <SwiperSlide key={item.id}>
                    <div className="flex justify-center items-center h-full relative">
                      <VideoPlayer src={item.image} poster={item.poster} />
                      {/* Overlay: Right-side icons */}
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-6 z-10">
                        {user ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`hover:text-red-500 transition text-white text-2xl p-0 m-0 shadow-none border-none bg-transparent ${hasLiked[item.id] ? "text-red-500 hover:text-red-600" : ""}`}
                            onClick={() => handleLike(item)}
                          >
                            <HeartIcon className={`w-20 h-20 ${hasLiked[item.id] ? "fill-current" : ""}`} />
                            <span className="text-base ml-1">{optimisticLikes[item.id]}</span>
                          </Button>
                        ) : (
                          <SignInButton mode="modal">
                            <Button variant="ghost" size="icon" className="hover:text-red-500 transition text-white text-2xl p-0 m-0 shadow-none border-none bg-transparent">
                              <HeartIcon className="w-20 h-20" />
                              <span className="text-base ml-1">{item._count.likes}</span>
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
                          <span className="text-base ml-1">{item._count.comments}</span>
                        </Button>
                      </div>
                      {/* Overlay: Bottom-left blurb */}
                      <div className="absolute left-4 bottom-6 z-10 flex items-end gap-3">
                        <Link href={`/profile/${item.author.username}`}>
                          <Avatar className="w-10 h-10 border-2 border-white">
                            <AvatarImage src={item.author.image ?? "/avatar.png"} />
                          </Avatar>
                        </Link>
                        <div className="flex flex-col">
                          <Link href={`/profile/${item.author.username}`} className="text-white font-semibold text-base hover:underline">
                            {item.author.name ?? item.author.username}
                          </Link>
                          <span className="text-white text-sm line-clamp-2 max-w-xs opacity-90">{item.content || item["content"] || item.title || "No description."}</span>
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
                              {item.comments.length === 0 ? (
                                <div className="text-muted-foreground text-center">No comments yet.</div>
                              ) : (
                                item.comments.map((comment: any) => (
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
                                      onClick={() => handleAddComment(item)}
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
              } else if (item._type === 'pet') {
                const imageUrl = item?.image || item?.pet?.imageUrl;
                if (!imageUrl) return null;
                return (
                  <SwiperSlide key={`pet-${item._petIdx}`}> 
                    <div className="flex justify-center items-center h-full relative">
                      {/* Pet Image */}
                      <img
                        src={imageUrl}
                        alt={item?.pet?.name || 'Dog'}
                        className="w-full h-[70vh] object-cover rounded-xl shadow-lg bg-black"
                        style={{ maxWidth: 400, maxHeight: '70vh', minHeight: 300 }}
                        onError={() => handlePetImageError(item._petIdx)}
                      />
                      {/* Overlay: Right-side icons */}
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-6 z-10">
                        <button
                          className="bg-gray-200 hover:bg-gray-300 rounded-full p-4 text-3xl flex items-center justify-center"
                          onClick={() => handleSwipeLeft(item._petIdx)}
                          aria-label="Forget"
                        >
                          <XIcon className="w-8 h-8 text-gray-500" />
                        </button>
                        <button
                          className="bg-pink-100 hover:bg-pink-200 rounded-full p-4 text-3xl flex items-center justify-center"
                          onClick={() => handleSwipeRight(item)}
                          aria-label="Love"
                        >
                          <HeartIcon className="w-8 h-8 text-pink-500" />
                        </button>
                      </div>
                      {/* Overlay: Bottom-left blurb */}
                      <div className="absolute left-4 bottom-6 z-10 flex items-end gap-3">
                        <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-white">
                          <img
                            src={item?.pet?.imageUrl || '/avatar.png'}
                            alt={item?.pet?.name || 'Pet'}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-white font-semibold text-base">
                            {item?.pet?.name || 'Dog'}
                          </span>
                          <span className="text-white text-sm opacity-90">
                            Owner: {item?.author?.name || item?.author?.username}
                          </span>
                        </div>
                      </div>
                      {/* Overlay: Card count */}
                      <div className="absolute bottom-4 right-4 text-white text-xs bg-black/40 rounded px-2 py-1">
                        Pet Card
                      </div>
                    </div>
                  </SwiperSlide>
                );
              }
              return null;
            })}
          </Swiper>
        </div>
      </div>
    </div>
  );
} 