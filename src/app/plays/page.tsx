"use client";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { HeartIcon, MessageCircleIcon, XIcon, Bone } from "lucide-react";
import Link from "next/link";
import { toggleLike, createComment } from "@/actions/post.action";
import { useUser, SignInButton } from "@clerk/nextjs";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import toast from "react-hot-toast";
import { useRouter } from 'next/navigation';

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
  const [showHeartAnimation, setShowHeartAnimation] = useState<{petIdx: number, show: boolean}>({petIdx: -1, show: false});
  const [showBoneAnimation, setShowBoneAnimation] = useState<{petIdx: number, show: boolean}>({petIdx: -1, show: false});
  const [showXAnimation, setShowXAnimation] = useState<{petIdx: number, show: boolean}>({petIdx: -1, show: false});
  const [lastTapTime, setLastTapTime] = useState<{ [id: string]: number }>({});
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [navigationDirection, setNavigationDirection] = useState<'up' | 'down' | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const router = useRouter();
  const [petCards, setPetCards] = useState<any[]>([]);
  const [petCardSwipe, setPetCardSwipe] = useState<{dir: 'left' | 'right' | null, idx: number | null}>({dir: null, idx: null});
  const [loveCounts, setLoveCounts] = useState<{[petIdx: number]: number}>({});
  const longPressTimeout = useRef<NodeJS.Timeout | null>(null);
  const [dataFetched, setDataFetched] = useState(false);
  const [petMediaIdx, setPetMediaIdx] = useState(0);
  const [petAspectRatio, setPetAspectRatio] = useState<'square' | 'portrait' | 'landscape'>('portrait');

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
        
        // Fetch pet cards
        const petRes = await fetch('/api/pets/random-posts');
        const petData = await petRes.json();
        
        // Shuffle videos with a fixed seed
        const shuffledVideos = [...videoData];
        for (let i = shuffledVideos.length - 1; i > 0; i--) {
          const j = Math.floor(seededRandom(i * 12345) * (i + 1));
          [shuffledVideos[i], shuffledVideos[j]] = [shuffledVideos[j], shuffledVideos[i]];
        }
        
        setVideos(shuffledVideos);
        setPetCards(petData.posts || []);
        setDataFetched(true);
        
        // Set initial love counts for pet cards
        const petLoveCounts: {[petIdx: number]: number} = {};
        (petData.posts || []).forEach((post: any, idx: number) => {
          petLoveCounts[idx] = post.pet?.loveCount || 0;
        });
        setLoveCounts(petLoveCounts);
      } catch (err) {
        console.error("Failed to fetch videos or pets:", err);
        setVideos([]);
        setPetCards([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [dataFetched]);

  // Create stable feed using useMemo
  const stableFeed = useMemo(() => {
    if (!videos.length || !petCards.length) return [];
    
    const feed = [];
    let petCardIndex = 0;
    
    // Add videos and deterministically insert pet cards
    videos.forEach((video: any, idx: number) => {
      feed.push({ ...video, _type: 'video', _originalIndex: idx });
      
      // Use seeded random for consistent placement
      const randomValue = seededRandom(idx * 67890);
      if (randomValue < 0.35 && petCardIndex < petCards.length) {
        const pet = petCards[petCardIndex];
        if (pet?.image || pet?.pet?.imageUrl) {
          feed.push({ ...pet, _type: 'pet', _petIdx: petCardIndex });
        }
        petCardIndex++;
      }
    });
    
    // Add any remaining pet cards at the end
    while (petCardIndex < petCards.length) {
      const pet = petCards[petCardIndex];
      if (pet?.image || pet?.pet?.imageUrl) {
        feed.push({ ...pet, _type: 'pet', _petIdx: petCardIndex });
      }
      petCardIndex++;
    }
    
    return feed;
  }, [videos, petCards]);

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
        if (stableFeed.length > 1) {
          setNavigationDirection('up');
          setCurrentVideoIndex(prev => (prev + 1) % stableFeed.length);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stableFeed, showCommentsIdx]);

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
      
      if (stableFeed.length > 1) {
        isScrolling = true;
        
        if (e.deltaY > 0) {
          setNavigationDirection('up');
          setCurrentVideoIndex(prev => (prev + 1) % stableFeed.length);
        } else {
          setNavigationDirection('down');
          setCurrentVideoIndex(prev => prev === 0 ? stableFeed.length - 1 : prev - 1);
        }
        
        // Reset scrolling flag after delay
        setTimeout(() => {
          isScrolling = false;
        }, scrollDelay);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [stableFeed, showCommentsIdx]);

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
      if (deltaTime < 300 && Math.abs(deltaY) > 50 && stableFeed.length > 1) {
        isScrolling = true;
        
        if (deltaY < 0) {
          // Swipe up - next video
          setNavigationDirection('up');
          setCurrentVideoIndex(prev => (prev + 1) % stableFeed.length);
        } else {
          // Swipe down - previous video
          setNavigationDirection('down');
          setCurrentVideoIndex(prev => prev === 0 ? stableFeed.length - 1 : prev - 1);
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
  }, [stableFeed, showCommentsIdx]);

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
    if (!dbUserId || hasLiked[video.id]) return;
    
    setShowHeartAnimation({petIdx: -1, show: true});
    setTimeout(() => setShowHeartAnimation({petIdx: -1, show: false}), 1000);
    
    // Like the video
    await handleLike(video);
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

  // Save-n-swipe actions
  const handleSwipeLeft = (petIdx: number) => {
    setShowXAnimation({petIdx, show: true});
    setPetCardSwipe({dir: 'left', idx: petIdx});
    setTimeout(() => {
      setPetCardSwipe({dir: null, idx: null});
      setShowXAnimation({petIdx: -1, show: false});
      // Navigate to next item
      const feed = stableFeed;
      if (feed.length > 1) {
        setNavigationDirection('up');
        setCurrentVideoIndex(prev => (prev + 1) % feed.length);
      }
    }, 600); // Match animation duration
  };

  const handleSwipeRight = async (pet: any) => {
    try {
      // Show bone animation immediately
      setShowBoneAnimation({petIdx: pet._petIdx, show: true});
      setPetCardSwipe({dir: 'right', idx: pet._petIdx});
      
      // Optimistically update UI
      setLoveCounts((prev) => ({...prev, [pet._petIdx]: (prev[pet._petIdx] || 0) + 1}));
      
      // Call backend API using pet ID
      const petId = pet.pet?.id;
      if (!petId) {
        throw new Error('Pet ID not found');
      }
      
      const response = await fetch(`/api/pets/${petId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to like pet');
      }
      
      const data = await response.json();
      
      // Update with actual count from backend
      setLoveCounts((prev) => ({...prev, [pet._petIdx]: data.pet.loveCount}));
      
      // Show success toast
      toast.success('Pet loved! 💙');
      
    } catch (error) {
      console.error('Error liking pet:', error);
      // Revert optimistic update on error
      setLoveCounts((prev) => ({...prev, [pet._petIdx]: Math.max(0, (prev[pet._petIdx] || 0) - 1)}));
      toast.error('Failed to like pet');
    } finally {
      // Hide animation and move to next card
      setTimeout(() => {
        setPetCardSwipe({dir: null, idx: null});
        setShowBoneAnimation({petIdx: -1, show: false});
        // Navigate to next item
        const feed = stableFeed;
        if (feed.length > 1) {
          setNavigationDirection('up');
          setCurrentVideoIndex(prev => (prev + 1) % feed.length);
        }
      }, 800); // Match animation duration
    }
  };

  const handleSuperLove = async (pet: any) => {
    try {
      // Show heart animation immediately
      setShowHeartAnimation({petIdx: pet._petIdx, show: true});
      setPetCardSwipe({dir: 'right', idx: pet._petIdx});
      
      // Optimistically update UI
      setLoveCounts((prev) => ({...prev, [pet._petIdx]: (prev[pet._petIdx] || 0) + 1}));
      
      // Call backend API using pet ID
      const petId = pet.pet?.id;
      if (!petId) {
        throw new Error('Pet ID not found');
      }
      
      const response = await fetch(`/api/pets/${petId}/super-like`, {
          method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to super like pet');
      }
      
      const data = await response.json();
      
      // Navigate to pet owner's profile or general messages
      setTimeout(() => {
        setPetCardSwipe({dir: null, idx: null});
        setShowHeartAnimation({petIdx: -1, show: false});
        
        if (data.petOwner?.username) {
          // Navigate to pet owner's profile
          router.push(`/profile/${data.petOwner.username}`);
        } else {
          // Navigate to general messages page
          router.push('/messages');
        }
      }, 600); // Match animation duration
      
      toast.success('Super like! Opening DMs...');
      
    } catch (error) {
      console.error('Error super liking pet:', error);
      toast.error('Failed to super like pet');
      
      // Reset UI state on error
      setPetCardSwipe({dir: null, idx: null});
      setShowHeartAnimation({petIdx: -1, show: false});
      setLoveCounts((prev) => ({...prev, [pet._petIdx]: (prev[pet._petIdx] || 1) - 1}));
    }
  };

  // Save-n-swipe image error handler
  const handlePetImageError = (petIdx: number) => {
    // Navigate to next item instead of marking as skipped
    const feed = stableFeed;
    if (feed.length > 1) {
      setNavigationDirection('up');
      setCurrentVideoIndex(prev => (prev + 1) % feed.length);
    }
  };

  // Helper to get pet media array
  function getPetMedia(pet: any) {
    // If pet has multiple posts, return array of images/videos
    if (pet.pet?.media && Array.isArray(pet.pet.media) && pet.pet.media.length > 0) {
      return pet.pet.media;
    }
    // Fallback to single image
    return [pet.image || pet.pet?.imageUrl];
  }

  // Ensure we always have a current item by looping
  const feed = stableFeed;
  const currentItem = feed[currentVideoIndex % feed.length] || feed[0];

  // Detect aspect ratio when pet card changes
  useEffect(() => {
    if (!currentItem || currentItem._type !== 'pet') return;
    const mediaArr = getPetMedia(currentItem);
    const img = new window.Image();
    img.onload = function () {
      if (img.naturalWidth === img.naturalHeight) setPetAspectRatio('square');
      else if (img.naturalWidth > img.naturalHeight) setPetAspectRatio('landscape');
      else setPetAspectRatio('portrait');
    };
    img.src = mediaArr[petMediaIdx] || '';
  }, [currentItem, petMediaIdx]);

  // Reset media index when card changes
  useEffect(() => {
    setPetMediaIdx(0);
  }, [currentItem]);

  if (loading) return <div className="flex justify-center items-center h-screen bg-black">Loading...</div>;
  
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
  
  if (!currentItem) {
    return <div className="flex justify-center items-center h-screen bg-black text-white">Loading content...</div>;
  }

  return (
    <div className="w-full h-screen bg-black flex items-center justify-center relative overflow-hidden" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      {/* Heart Animation Overlay */}
      {showHeartAnimation.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="heart-burst-animation">
            <HeartIcon className="w-32 h-32 text-green-500 fill-current" />
          </div>
        </div>
      )}
      
      {/* Bone Animation Overlay */}
      {showBoneAnimation.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bone-burst-animation">
            <Bone className="w-32 h-32 text-blue-500" />
          </div>
        </div>
      )}
      
      {/* X Animation Overlay */}
      {showXAnimation.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="swipe-x-animation">
            <XIcon className="w-32 h-32 text-red-500" />
          </div>
        </div>
      )}
      
      {/* Navigation Indicator */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
        {currentVideoIndex + 1} / {feed.length}
      </div>
      
      {/* Navigation Instructions */}
      {showInstructions && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30 bg-black/50 text-white px-4 py-2 rounded-full text-sm transition-opacity duration-500">
          <span className="hidden md:inline">Press SPACE or scroll to navigate • Double-click to like</span>
          <span className="md:hidden">Swipe up/down to navigate • Double-tap to like</span>
        </div>
      )}
      
      <div className="w-full flex justify-center items-center h-full">
        <div className="w-full max-w-[400px] h-full flex items-center justify-center">
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
          >
            {currentItem._type === 'video' ? (
              <div className="flex justify-center items-center h-full relative w-full">
                {/* Video with double-click handler */}
                <div 
                  className="w-full h-full flex items-center justify-center"
                  onClick={(e) => handleVideoClick(currentItem, e)}
                  onTouchEnd={(e) => handleVideoTouch(currentItem, e)}
                >
                  <VideoPlayer src={currentItem.image} poster={currentItem.poster} />
                </div>
                
                      {/* Overlay: Right-side icons */}
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-6 z-10">
                  {user && dbUserId ? (
                          <Button
                            variant="ghost"
                            size="icon"
                      className={`hover:text-red-500 transition text-white text-2xl p-0 m-0 shadow-none border-none bg-transparent ${hasLiked[currentItem.id] ? "text-red-500 hover:text-red-600" : ""}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleLike(currentItem);
                      }}
                      disabled={isLiking}
                    >
                      <HeartIcon className={`w-20 h-20 ${hasLiked[currentItem.id] ? "fill-current" : ""}`} />
                      <span className="text-base ml-1">{optimisticLikes[currentItem.id]}</span>
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
                        <span className="text-base ml-1">{currentItem._count.likes}</span>
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
                    <span className="text-base ml-1">{currentItem._count.comments}</span>
                        </Button>
                      </div>
                
                      {/* Overlay: Bottom-left blurb */}
                      <div className="absolute left-4 bottom-6 z-10 flex items-end gap-3">
                  <Link href={`/profile/${currentItem.author.username}`} onClick={(e) => e.stopPropagation()}>
                          <Avatar className="w-10 h-10 border-2 border-white">
                      <AvatarImage src={currentItem.author.image ?? "/avatar.png"} />
                          </Avatar>
                        </Link>
                        <div className="flex flex-col">
                    <Link href={`/profile/${currentItem.author.username}`} className="text-white font-semibold text-base hover:underline" onClick={(e) => e.stopPropagation()}>
                      {currentItem.author.name ?? currentItem.author.username}
                          </Link>
                    <span className="text-white text-sm line-clamp-2 max-w-xs opacity-90">{currentItem.content || currentItem["content"] || currentItem.title || "No description."}</span>
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
                        {currentItem.comments.length === 0 ? (
                          <div className="text-muted-foreground text-center py-8">No comments yet.</div>
                        ) : (
                          currentItem.comments.map((comment: any) => (
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
                                  handleAddComment(currentItem);
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
                                  handleAddComment(currentItem);
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
            ) : currentItem._type === 'pet' ? (
              <div className="flex justify-center items-center h-full relative w-full">
                {/* Animation Overlays for Pet Cards */}
                {showBoneAnimation.show && showBoneAnimation.petIdx === currentItem._petIdx && (
                  <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
                    <div className="bone-burst-animation">
                      <Bone className="w-32 h-32 text-blue-500" />
                    </div>
                  </div>
                )}
                
                {showHeartAnimation.show && showHeartAnimation.petIdx === currentItem._petIdx && (
                  <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
                    <div className="heart-burst-animation">
                      <HeartIcon className="w-32 h-32 text-green-500 fill-current" />
                          </div>
                        </div>
                      )}
                
                {showXAnimation.show && showXAnimation.petIdx === currentItem._petIdx && (
                  <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
                    <div className="swipe-x-animation">
                      <XIcon className="w-32 h-32 text-red-500" />
                    </div>
                  </div>
                )}

                {/* Tinder-style Card - Now full screen size */}
                <div
                  className={`relative w-full h-full bg-white flex flex-col overflow-hidden select-none transition-transform duration-300 ${petCardSwipe.idx === currentItem._petIdx && petCardSwipe.dir === 'left' ? '-translate-x-[500px] opacity-0' : ''} ${petCardSwipe.idx === currentItem._petIdx && petCardSwipe.dir === 'right' ? 'translate-x-[500px] opacity-0' : ''}`}
                  onTouchStart={(e) => {
                    if (e.touches.length === 1) {
                      longPressTimeout.current = setTimeout(() => handleSuperLove(currentItem), 1200);
                      (e.target as HTMLElement).setAttribute('data-touch-x', e.touches[0].clientX.toString());
                    }
                  }}
                  onTouchEnd={(e) => {
                    if (longPressTimeout.current) clearTimeout(longPressTimeout.current);
                    const startX = parseFloat((e.target as HTMLElement).getAttribute('data-touch-x') || '0');
                    const endX = e.changedTouches[0].clientX;
                    if (startX && Math.abs(endX - startX) > 80) {
                      if (endX < startX) handleSwipeLeft(currentItem._petIdx);
                      else handleSwipeRight(currentItem);
                    }
                  }}
                  onMouseDown={(e) => {
                    longPressTimeout.current = setTimeout(() => handleSuperLove(currentItem), 1200);
                    (e.target as HTMLElement).setAttribute('data-mouse-x', e.clientX.toString());
                  }}
                  onMouseUp={(e) => {
                    if (longPressTimeout.current) clearTimeout(longPressTimeout.current);
                    const startX = parseFloat((e.target as HTMLElement).getAttribute('data-mouse-x') || '0');
                    const endX = e.clientX;
                    if (startX && Math.abs(endX - startX) > 80) {
                      if (endX < startX) handleSwipeLeft(currentItem._petIdx);
                      else handleSwipeRight(currentItem);
                    }
                  }}
                >
                  {/* Pet Image - Framed in 9:16 black box, object-contain for letterboxing */}
                  <div
                    className="w-full h-full flex items-center justify-center bg-black relative"
                    style={{ 
                      cursor: getPetMedia(currentItem).length > 1 ? 'pointer' : 'default', 
                      aspectRatio: '9/16', 
                      maxHeight: '100vh', 
                      maxWidth: '100vw', 
                      margin: '0 auto' 
                    }}
                    onClick={(e) => {
                      const mediaArr = getPetMedia(currentItem);
                      if (mediaArr.length > 1) {
                        // Tap right half: next, left half: prev
                        const x = (e.nativeEvent as any).offsetX;
                        const width = (e.target as HTMLElement).clientWidth;
                        if (x > width / 2) setPetMediaIdx((idx) => (idx + 1) % mediaArr.length);
                        else setPetMediaIdx((idx) => (idx - 1 + mediaArr.length) % mediaArr.length);
                      }
                    }}
                  >
                    <img
                      src={getPetMedia(currentItem)[petMediaIdx]}
                      alt={currentItem?.pet?.name || 'Dog'}
                      className="object-contain w-full h-full bg-black"
                      onError={() => handlePetImageError(currentItem._petIdx)}
                    />
                    {/* Dots for multiple media */}
                    {getPetMedia(currentItem).length > 1 && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1 z-20">
                        {getPetMedia(currentItem).map((_: any, idx: number) => (
                          <div key={idx} className={`w-2 h-2 rounded-full ${idx === petMediaIdx ? 'bg-white' : 'bg-gray-400/60'}`}></div>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Info Bar - moved above action buttons */}
                  <div className="absolute bottom-32 left-0 right-0 flex flex-col justify-between px-6 pb-2 bg-gradient-to-t from-black/80 via-black/60 to-transparent pointer-events-none">
                    <div>
                      <span className="text-white text-3xl font-bold drop-shadow-lg">
                        {currentItem?.pet?.name || 'Dog'}
                      </span>
                      <span className="text-white text-xl ml-2 drop-shadow-lg">
                        {currentItem?.pet?.age ? `• ${currentItem.pet.age}` : ''}
                      </span>
                    </div>
                    <div className="text-white text-base opacity-90 mt-3 drop-shadow-lg">
                      Owner: {currentItem?.author?.name || currentItem?.author?.username}
                    </div>
                  </div>
                  {/* Overlay Action Buttons */}
                  <div className="absolute bottom-8 left-0 right-0 flex justify-center items-end gap-8 z-20 pointer-events-auto">
                    {/* X Button (Nope) - red border and icon */}
                        <button
                      className="bg-white border-2 border-red-500 hover:bg-red-100 rounded-full w-16 h-16 flex items-center justify-center shadow-xl text-3xl transition active:scale-90 text-red-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSwipeLeft(currentItem._petIdx);
                      }}
                      aria-label="Nope"
                    >
                      <XIcon className="w-8 h-8 text-red-500" />
                        </button>
                    {/* Blue Bone Button (Love) */}
                        <button
                      className="bg-blue-100 border-2 border-blue-400 hover:bg-blue-200 rounded-full w-20 h-20 flex flex-col items-center justify-center shadow-xl text-3xl transition active:scale-90 relative"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSwipeRight(currentItem);
                      }}
                          aria-label="Love"
                        >
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full shadow">{loveCounts[currentItem._petIdx] || 0}</span>
                      {/* Show only icon on mobile, icon+text on desktop */}
                      <Bone className="w-9 h-9 text-blue-500" />
                      <span className="text-blue-600 text-xs mt-1 font-bold hidden md:inline">Bone</span>
                    </button>
                    {/* Green Heart Button (Super Love) */}
                    <button
                      className="bg-green-100 border-2 border-green-400 hover:bg-green-200 rounded-full w-16 h-16 flex items-center justify-center shadow-xl text-3xl transition active:scale-90"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSuperLove(currentItem);
                      }}
                      aria-label="Super Love"
                    >
                      <HeartIcon className="w-8 h-8 text-green-500 fill-current" />
                        </button>
                      </div>
                        </div>
                      </div>
            ) : null}
                    </div>
        </div>
      </div>
    </div>
  );
} 