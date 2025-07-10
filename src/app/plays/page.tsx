"use client";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { HeartIcon, MessageCircleIcon } from "lucide-react";
import Link from "next/link";
import { toggleLike, createComment } from "@/actions/post.action";
import { useUser, SignInButton } from "@clerk/nextjs";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import toast from "react-hot-toast";
import { isUserVerified } from "@/lib/utils";
import BlueCheckIcon from "@/components/BlueCheckIcon";

// Placeholder for HLS.js video player
const VideoPlayer = dynamic(() => import("@/components/VideoFeed"), { ssr: false });

// Simple seeded random number generator
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

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
  const [dbUserId, setDbUserId] = useState<string | null>(null);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const [lastTapTime, setLastTapTime] = useState<{ [id: string]: number }>({});
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [navigationDirection, setNavigationDirection] = useState<'up' | 'down' | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const [dataFetched, setDataFetched] = useState(false);
  const [mounted, setMounted] = useState(false);
  // Add state for touch positions
  const [touchStart, setTouchStart] = useState<{x: number, y: number} | null>(null);
  const [touchEnd, setTouchEnd] = useState<{x: number, y: number} | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch user data separately from feed data
  useEffect(() => {
    async function fetchUserData() {
      if (user) {
        try {
          const userRes = await fetch(`/api/users/by-clerk-id/${user.id}`);
          const userData = await userRes.json();
          const userId = userData.user?.id || null;
          setDbUserId(userId);
        } catch (err) {
          console.error("Failed to get database user ID:", err);
        }
      }
    }
    fetchUserData();
  }, [user]);

  // Fetch feed data only once
  useEffect(() => {
    async function fetchData() {
      if (dataFetched) return; // Only fetch once
      
      setLoading(true);
      try {
        // Fetch videos
        const videoRes = await fetch("/api/plays?limit=10");
        const videoData = await videoRes.json();
        
        // Shuffle videos with a fixed seed
        const shuffledVideos = [...videoData];
        for (let i = shuffledVideos.length - 1; i > 0; i--) {
          const j = Math.floor(seededRandom(i * 12345) * (i + 1));
          [shuffledVideos[i], shuffledVideos[j]] = [shuffledVideos[j], shuffledVideos[i]];
        }
        
        setVideos(shuffledVideos);
        setDataFetched(true);
      } catch (err) {
        console.error("Failed to fetch videos:", err);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [dataFetched]);

  // Set initial like state when user data is available
  useEffect(() => {
    if (dbUserId && videos.length > 0) {
      const likeState: { [id: string]: boolean } = {};
      const likeCounts: { [id: string]: number } = {};
      videos.forEach((video: any) => {
        likeState[video.id] = video.likes.some((l: any) => l.userId === dbUserId);
        likeCounts[video.id] = video._count.likes;
      });
      setHasLiked(likeState);
      setOptimisticLikes(likeCounts);
    }
  }, [dbUserId, videos]);

  // Prevent body scrolling and lock page
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, []);

  // Handle spacebar navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger navigation if user is typing in comment modal
      const target = e.target as HTMLElement;
      if (target.closest('textarea') || target.closest('input') || showCommentsIdx !== null) {
        return;
      }
      
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        if (videos.length > 1) {
          setNavigationDirection('up');
          setCurrentVideoIndex(prev => (prev + 1) % videos.length);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [videos, showCommentsIdx]);

  // Handle mousewheel navigation with smooth scrolling
  useEffect(() => {
    let isScrolling = false;
    const scrollDelay = 500; // Prevent rapid scrolling

    const handleWheel = (e: WheelEvent) => {
      // Don't trigger navigation if comment modal is open
      if (showCommentsIdx !== null) {
        return;
      }
      
      e.preventDefault();
      
      if (isScrolling) return;
      
      if (videos.length > 1) {
        isScrolling = true;
        
        if (e.deltaY > 0) {
          setNavigationDirection('up');
          setCurrentVideoIndex(prev => (prev + 1) % videos.length);
        } else {
          setNavigationDirection('down');
          setCurrentVideoIndex(prev => prev === 0 ? videos.length - 1 : prev - 1);
        }
        
        // Reset scrolling flag after delay
        setTimeout(() => {
          isScrolling = false;
        }, scrollDelay);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [videos, showCommentsIdx]);

  // Handle touch/swipe navigation for mobile
  useEffect(() => {
    let startY = 0;
    let startTime = 0;
    let isScrolling = false;
    const scrollDelay = 500;

    const handleTouchStart = (e: TouchEvent) => {
      if (showCommentsIdx !== null) return;
      
      startY = e.touches[0].clientY;
      startTime = Date.now();
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (showCommentsIdx !== null) return;
      
      e.preventDefault();
    };

    const handleTouchEnd = () => {
      if (showCommentsIdx !== null || isScrolling) return;
      
      const endY = startY;
      const endTime = Date.now();
      const deltaY = endY - startY;
      const deltaTime = endTime - startTime;
      
      // Only trigger if it's a quick swipe (less than 300ms) and significant distance (more than 50px)
      if (deltaTime < 300 && Math.abs(deltaY) > 50 && videos.length > 1) {
        isScrolling = true;
        
        if (deltaY < 0) {
          // Swipe up - next video
          setNavigationDirection('up');
          setCurrentVideoIndex(prev => (prev + 1) % videos.length);
        } else {
          // Swipe down - previous video
          setNavigationDirection('down');
          setCurrentVideoIndex(prev => prev === 0 ? videos.length - 1 : prev - 1);
        }
        
        setTimeout(() => {
          isScrolling = false;
        }, scrollDelay);
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [videos, showCommentsIdx]);

  // Reset navigation direction after animation
  useEffect(() => {
    if (navigationDirection) {
      const timer = setTimeout(() => {
        setNavigationDirection(null);
      }, 300); // Match animation duration
      
      return () => clearTimeout(timer);
    }
  }, [navigationDirection]);

  // Fade out instructions after showing once
  useEffect(() => {
    if (showInstructions) {
      const timer = setTimeout(() => {
        setShowInstructions(false);
      }, 3000); // Show for 3 seconds
      
      return () => clearTimeout(timer);
  }
  }, [showInstructions]);

  const handleLike = async (video: any) => {
    if (isLiking || !dbUserId) return;
    try {
      setIsLiking(true);
      const currentLiked = hasLiked[video.id];
      setHasLiked((prev) => ({ ...prev, [video.id]: !currentLiked }));
      setOptimisticLikes((prev) => ({ ...prev, [video.id]: prev[video.id] + (currentLiked ? -1 : 1) }));
      await toggleLike(video.id);
    } catch (error) {
      // Revert optimistic updates on error
      setOptimisticLikes((prev) => ({ ...prev, [video.id]: video._count.likes }));
      setHasLiked((prev) => ({ ...prev, [video.id]: video.likes.some((l: any) => l.userId === dbUserId) }));
      toast.error("Failed to like video");
    } finally {
      setIsLiking(false);
    }
  };

  const handleDoubleLike = useCallback(async (video: any) => {
    if (!dbUserId) return;
    setShowHeartAnimation(true);
    setTimeout(() => setShowHeartAnimation(false), 1000);
    if (!hasLiked[video.id]) {
      // Like the video if not already liked
      await handleLike(video);
    }
    // If already liked, just play the animation (do not unlike)
  }, [dbUserId, hasLiked, handleLike]);

  const handleVideoClick = useCallback((video: any, e: React.MouseEvent) => {
    // Don't handle clicks on interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('button') || 
        target.closest('textarea') || 
        target.closest('input') || 
        target.closest('a') || 
        target.closest('.comment-modal')) {
      return;
    }

    const now = Date.now();
    const lastTap = lastTapTime[video.id] || 0;
    const timeDiff = now - lastTap;
    
    if (timeDiff < 300 && timeDiff > 0) {
      // Double tap/click detected
      handleDoubleLike(video);
    }
    
    setLastTapTime(prev => ({ ...prev, [video.id]: now }));
  }, [lastTapTime, handleDoubleLike]);

  // Handle double-tap for mobile
  const handleVideoTouch = useCallback((video: any, e: React.TouchEvent) => {
    // Don't handle touches on interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('button') || 
        target.closest('textarea') || 
        target.closest('input') || 
        target.closest('a') || 
        target.closest('.comment-modal')) {
      return;
    }

    const now = Date.now();
    const lastTap = lastTapTime[video.id] || 0;
    const timeDiff = now - lastTap;
    
    if (timeDiff < 300 && timeDiff > 0) {
      // Double tap detected
      handleDoubleLike(video);
    }
    
    setLastTapTime(prev => ({ ...prev, [video.id]: now }));
  }, [lastTapTime, handleDoubleLike]);

  const handleAddComment = async (video: any) => {
    if (!newComment.trim() || isCommenting) return;
    try {
      setIsCommenting(true);
      const result = await createComment(video.id, newComment);
      if (result?.success) {
        toast.success("Comment posted successfully");
        setNewComment("");
        // Update the current video's comment count optimistically
        setVideos(prevVideos => 
          prevVideos.map(v => 
            v.id === video.id 
              ? { ...v, _count: { ...v._count, comments: v._count.comments + 1 } }
              : v
          )
        );
      }
    } catch (error) {
      toast.error("Failed to add comment");
    } finally {
      setIsCommenting(false);
    }
  };

  const handleCommentToggle = (idx: number) => {
    setShowCommentsIdx(idx === showCommentsIdx ? null : idx);
  };

  // Touch event handlers for vertical swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchEnd({ x: touch.clientX, y: touch.clientY });
  };
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const dy = touchEnd.y - touchStart.y;
    // Vertical swipe for videos
    if (Math.abs(dy) > 50) {
      if (dy < 0) {
        // Swipe up: next video
      setNavigationDirection('up');
        setCurrentVideoIndex(prev => (prev + 1) % videos.length);
      } else if (dy > 0) {
        // Swipe down: previous video
        setNavigationDirection('down');
        setCurrentVideoIndex(prev => (prev - 1 + videos.length) % videos.length);
      }
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  if (!mounted) return null;
  
  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
    </div>
  );
  
  // If no videos at all, show a simple message
  if (!loading && videos.length === 0) {
    return <div className="flex justify-center items-center h-screen bg-black text-white">No videos available.</div>;
  }

  // Show loading spinner like in pawpad
  if (loading) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-sm">Loading content...</p>
        </div>
      </div>
    );
  }
  
  const currentVideo = videos[currentVideoIndex % videos.length] || videos[0];
  
  if (!currentVideo) {
    return <div className="flex justify-center items-center h-screen bg-black text-white">Loading content...</div>;
  }

  return (
    <div className="w-full h-screen bg-black flex items-center justify-center relative overflow-hidden" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      {/* Heart Animation Overlay */}
      {showHeartAnimation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="heart-burst-animation">
            <HeartIcon className="w-32 h-32 text-red-500 fill-current" />
          </div>
        </div>
      )}
      
      {/* Navigation Indicator */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
        {currentVideoIndex + 1} / {videos.length}
      </div>
      
      {/* Navigation Instructions */}
      {showInstructions && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30 bg-black/50 text-white px-4 py-2 rounded-full text-sm transition-opacity duration-500">
          <span className="hidden md:inline">Press SPACE or scroll to navigate • Double-click to like</span>
          <span className="md:hidden">Swipe up/down to navigate • Double-tap to like</span>
        </div>
      )}
      
      <div className="w-full flex justify-center items-center h-full">
        <div className="w-full max-w-[600px] h-full flex items-center justify-center">
          <div 
            key={currentVideoIndex}
            className="w-full h-full flex items-center justify-center transition-all duration-500 ease-in-out transform"
            style={{
              animation: navigationDirection === 'up' 
                ? 'slideUp 0.3s ease-out' 
                : navigationDirection === 'down'
                ? 'slideDown 0.3s ease-out'
                : 'slideUp 0.3s ease-out'
            }}
            onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
          >
              <div className="flex justify-center items-center h-full relative w-full">
                {/* Video with double-click handler */}
                <div 
                  className="w-full h-full flex items-center justify-center"
                onClick={(e) => handleVideoClick(currentVideo, e)}
                onTouchEnd={(e) => handleVideoTouch(currentVideo, e)}
                >
                <VideoPlayer src={currentVideo.image} poster={currentVideo.poster} />
                </div>
                
                      {/* Overlay: Right-side icons */}
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-6 z-10">
                  {user && dbUserId ? (
                          <Button
                            variant="ghost"
                            size="icon"
                    className={`hover:text-red-500 transition text-white text-2xl p-0 m-0 shadow-none border-none bg-transparent ${hasLiked[currentVideo.id] ? "text-red-500 hover:text-red-600" : ""}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      handleLike(currentVideo);
                      }}
                      disabled={isLiking}
                          >
                    <HeartIcon className={`w-20 h-20 ${hasLiked[currentVideo.id] ? "fill-current" : ""}`} />
                    <span className="text-base ml-1">{optimisticLikes[currentVideo.id]}</span>
                          </Button>
                        ) : (
                          <SignInButton mode="modal">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="hover:text-red-500 transition text-white text-2xl p-0 m-0 shadow-none border-none bg-transparent"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                              <HeartIcon className="w-20 h-20" />
                      <span className="text-base ml-1">{currentVideo._count.likes}</span>
                            </Button>
                          </SignInButton>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:text-blue-500 transition text-white text-2xl p-0 m-0 shadow-none border-none bg-transparent"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleCommentToggle(currentVideoIndex);
                    }}
                        >
                    <MessageCircleIcon className={`w-20 h-20 ${showCommentsIdx === currentVideoIndex ? "fill-blue-500 text-blue-500" : ""}`} />
                  <span className="text-base ml-1">{currentVideo._count.comments}</span>
                        </Button>
                      </div>
                
                      {/* Overlay: Bottom-left blurb */}
                      <div className="absolute left-4 bottom-6 z-10 flex items-end gap-3">
                <Link href={`/profile/${currentVideo.author.username}`} onClick={(e) => e.stopPropagation()}>
                          <Avatar className="w-10 h-10 border-2 border-white">
                    <AvatarImage src={currentVideo.author.image ?? "/avatar.png"} />
                          </Avatar>
                        </Link>
                        <div className="flex flex-col">
                  <Link href={`/profile/${currentVideo.author.username}`} className="text-white font-semibold text-base hover:underline flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {currentVideo.author.name ?? currentVideo.author.username}
                    {isUserVerified(currentVideo.author.username) && (
                      <BlueCheckIcon className="inline-block w-4 h-4 ml-1 align-text-bottom" />
                    )}
                          </Link>
                  <span className="text-white text-sm line-clamp-2 max-w-xs opacity-90">{currentVideo.content || currentVideo["content"] || currentVideo.title || "No description."}</span>
                        </div>
                      </div>
                
                {/* Comments Section (positioned below video) */}
                {showCommentsIdx === currentVideoIndex && (
                  <div 
                    className="absolute bottom-0 left-0 right-0 z-20 bg-white rounded-t-xl shadow-xl max-h-[60vh] flex flex-col comment-modal" 
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      animation: 'slideUp 0.3s ease-out'
                    }}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b">
                      <h3 className="font-semibold text-lg">Comments</h3>
                            <button
                        className="text-gray-400 hover:text-gray-600 text-2xl"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCommentToggle(currentVideoIndex);
                        }}
                              aria-label="Close"
                            >
                              ×
                            </button>
                    </div>
                    {/* Comments List */}
                    <div className="flex-1 overflow-y-auto p-4">
                      <div className="space-y-4">
                      {currentVideo.comments.length === 0 ? (
                          <div className="text-muted-foreground text-center py-8">No comments yet.</div>
                              ) : (
                        currentVideo.comments.map((comment: any) => (
                                  <div key={comment.id} className="flex space-x-3">
                                    <Avatar className="size-8 flex-shrink-0">
                                      <AvatarImage src={comment.author?.image ?? "/avatar.png"} />
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                        <span className="font-medium text-sm">{comment.author?.name || "User"}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(comment.createdAt).toLocaleDateString()}
                                  </span>
                                      </div>
                                <p className="text-sm break-words mt-1">{comment.content}</p>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                    </div>
                    {/* Comment Input */}
                    {user && dbUserId ? (
                      <div className="p-4 border-t bg-gray-50">
                        <div className="flex space-x-3">
                                <Avatar className="size-8 flex-shrink-0">
                                  <AvatarImage src={user.imageUrl || "/avatar.png"} />
                                </Avatar>
                                <div className="flex-1">
                                  <Textarea
                                    placeholder="Write a comment..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    className="min-h-[60px] resize-none"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  e.stopPropagation();
                                handleAddComment(currentVideo);
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                              onFocus={(e) => e.stopPropagation()}
                              onBlur={(e) => e.stopPropagation()}
                              onInput={(e) => e.stopPropagation()}
                                  />
                                  <div className="flex justify-end mt-2">
                                    <Button
                                      size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                handleAddComment(currentVideo);
                                }}
                                      disabled={!newComment.trim() || isCommenting}
                                      className="flex items-center gap-2"
                                    >
                                      {isCommenting ? "Posting..." : "Post"}
                                    </Button>
                            </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                      <div className="flex justify-center p-4 border-t bg-gray-50">
                                <SignInButton mode="modal">
                          <Button variant="outline" className="gap-2" onClick={(e) => e.stopPropagation()}>Sign in to comment</Button>
                                </SignInButton>
                              </div>
                            )}
                  </div>
                )}
              </div>
                    </div>
        </div>
      </div>
    </div>
  );
} 