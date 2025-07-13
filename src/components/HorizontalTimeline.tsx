"use client";

import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon, FlameIcon, ImageIcon, Loader2Icon, PencilIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { format } from "date-fns";
import { DeleteAlertDialog } from "@/components/DeleteAlertDialog";
import toast from "react-hot-toast";

interface TimelinePost {
  id: string;
  image: string | null;
  content?: string | null;
  createdAt: string | Date;
  petId?: string | null;
  pet?: {
    id: string;
    name: string;
    imageUrl?: string;
    streak?: number;
  };
}

interface HorizontalTimelineProps {
  posts: TimelinePost[];
  pet?: {
    id: string;
    name: string;
    imageUrl?: string;
    streak?: number;
  };
  isOwnPet?: boolean;
  onPostClick?: (post: TimelinePost) => void;
  onEditPost?: (post: TimelinePost) => void;
  onDeletePost?: (postId: string) => Promise<void>;
  onUploadDaily?: () => void;
  isUploading?: boolean;
  className?: string;
  showPetInfo?: boolean;
  showStreak?: boolean;
  showUploadButton?: boolean;
  variant?: 'pet' | 'merged';
  petColors?: { [petId: string]: string };
  expandable?: boolean;
  defaultExpanded?: boolean;
  timelineTitle?: string;
}

export default function HorizontalTimeline({
  posts,
  pet,
  isOwnPet = false,
  onPostClick,
  onEditPost,
  onDeletePost,
  onUploadDaily,
  isUploading = false,
  className = "",
  showPetInfo = true,
  showStreak = true,
  showUploadButton = true,
  variant = 'pet',
  petColors = {},
  expandable = false,
  defaultExpanded = false,
  timelineTitle = 'Family Timeline',
}: HorizontalTimelineProps) {
  const [activePhotoId, setActivePhotoId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editPost, setEditPost] = useState<TimelinePost | null>(null);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check scroll position
  const checkScrollPosition = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScrollPosition();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollPosition);
      return () => container.removeEventListener('scroll', checkScrollPosition);
    }
  }, [posts]);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (onDeletePost) {
      setIsEditing(true);
      try {
        await onDeletePost(postId);
        toast.success("Post deleted successfully");
      } catch (error) {
        toast.error("Failed to delete post");
      } finally {
        setIsEditing(false);
      }
    }
  };

  const getPetColor = (petId: string) => {
    return petColors[petId] || 'from-orange-400 via-yellow-400 to-orange-600';
  };

  if (posts.length === 0) {
    return (
      <div className={`flex items-center justify-center p-8 text-muted-foreground ${className}`}>
        <div className="text-center">
          <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No timeline photos yet</p>
          <p className="text-sm">Start sharing daily moments!</p>
        </div>
      </div>
    );
  }

  // Get unique pets for ribbon display
  const uniquePets = variant === 'merged' 
    ? Array.from(new Set(posts.map(post => post.pet?.id).filter(Boolean)))
    : pet ? [pet.id] : [];

  // Get latest post for each pet for ribbon preview
  const latestPostsByPet = uniquePets.map(petId => {
    const petPosts = posts.filter(post => post.pet?.id === petId || post.petId === petId);
    return petPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  }).filter(Boolean);

  return (
    <div className={`relative ${className}`}>
      {/* Timeline Title */}
      {/* Compact Ribbon View */}
      {expandable && !isExpanded && (
        <div 
          className="cursor-pointer group"
          onClick={() => setIsExpanded(true)}
        >
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center space-x-2">
              {variant === 'pet' && pet && (
                <>
                  <Avatar className="w-6 h-6 border border-orange-200">
                    <AvatarImage src={pet.imageUrl || '/avatar.png'} alt={pet.name} />
                  </Avatar>
                  <div>
                    <div className="font-semibold text-xs">{pet.name}'s Timeline</div>
                    <div className="text-xs text-muted-foreground">{posts.length} photos</div>
                  </div>
                </>
              )}
              {variant === 'merged' && (
                <div>
                  <div className="font-semibold text-xs">{timelineTitle}</div>
                  <div className="text-xs text-muted-foreground">{posts.length} moments</div>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Streak indicator */}
              {showStreak && pet?.streak && (
                <div className="flex items-center gap-1 bg-gradient-to-tr from-orange-400 via-yellow-400 to-orange-600 px-1.5 py-0.5 rounded-full shadow-sm">
                  <FlameIcon className="w-2.5 h-2.5 text-orange-700 animate-pulse" />
                  <span className="font-bold text-xs text-orange-900">{pet.streak}</span>
                </div>
              )}
              
              <ChevronDownIcon className="w-4 h-4 text-muted-foreground group-hover:text-orange-500 transition-colors" />
            </div>
          </div>

                    {/* Intertwined Ribbons */}
          <div className="relative h-12 px-2 pb-2">
            <div className="absolute inset-0 flex items-center">
              {/* Base line */}
              <div className="w-full h-0.5 bg-gradient-to-r from-orange-200 via-yellow-200 to-orange-200 rounded-full"></div>
            </div>
            
            {/* Pet ribbons */}
            <div className="relative h-full flex items-center">
              {latestPostsByPet.map((post, index) => {
                const postPet = post.pet || pet;
                const petColor = postPet ? getPetColor(postPet.id) : 'from-orange-400 via-yellow-400 to-orange-600';
                const postDate = new Date(post.createdAt);
                const isToday = (() => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const postDay = new Date(postDate);
                  postDay.setHours(0, 0, 0, 0);
                  return postDay.getTime() === today.getTime();
                })();

                return (
                  <div
                    key={post.id}
                    className="absolute transform -translate-x-1/2"
                    style={{ 
                      left: `${(index / (latestPostsByPet.length - 1)) * 100}%`,
                      zIndex: latestPostsByPet.length - index
                    }}
                  >
                    <div className="relative">
                      {/* Ribbon */}
                      <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${petColor} shadow-md border-2 border-white transform rotate-45 timeline-ribbon`}>
                        <div className="absolute inset-0.5 rounded-full bg-white/20"></div>
                      </div>
                      
                      {/* Today indicator */}
                      {isToday && (
                        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-orange-400 rounded-full border border-white animate-pulse"></div>
                      )}
                      
                      {/* Pet name for merged timeline */}
                      {variant === 'merged' && postPet && (
                        <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2">
                          <div className={`px-1 py-0.5 rounded text-xs font-medium bg-gradient-to-r ${petColor} text-white shadow-sm whitespace-nowrap`}>
                            {postPet.name}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

             {/* Expanded Timeline View */}
       <div className={`timeline-expand ${expandable && !isExpanded ? 'max-h-0 overflow-hidden opacity-0' : 'max-h-[800px] opacity-100'}`}>
        {/* Header with pet info and controls */}
        {showPetInfo && (
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center space-x-3">
              {variant === 'pet' && pet && (
                <>
                  <Avatar className="w-12 h-12 border-2 border-orange-200">
                    <AvatarImage src={pet.imageUrl || '/avatar.png'} alt={pet.name} />
                  </Avatar>
                  <div>
                    <div className="font-bold text-lg">{pet.name}'s Timeline</div>
                    <div className="text-sm text-muted-foreground">{posts.length} photos</div>
                  </div>
                </>
              )}
              {variant === 'merged' && (
                <div>
                  <div className="font-bold text-lg">{timelineTitle}</div>
                  <div className="text-sm text-muted-foreground">{posts.length} moments</div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Streak indicator */}
              {showStreak && pet?.streak && (
                <div className="flex items-center gap-2 bg-gradient-to-tr from-orange-400 via-yellow-400 to-orange-600 px-3 py-1.5 rounded-full shadow-lg">
                  <FlameIcon className="w-4 h-4 text-orange-700 animate-pulse" />
                  <span className="font-bold text-sm text-orange-900">{pet.streak}</span>
                </div>
              )}

              {/* Upload button */}
              {showUploadButton && isOwnPet && onUploadDaily && (
                <Button
                  onClick={onUploadDaily}
                  disabled={isUploading}
                  size="sm"
                  className="flex items-center space-x-2 bg-gradient-to-tr from-orange-400 via-yellow-400 to-orange-600 text-white hover:scale-105 transition-transform"
                >
                  {isUploading ? (
                    <>
                      <Loader2Icon className="w-4 h-4 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-4 h-4" />
                      <span>Upload Daily</span>
                    </>
                  )}
                </Button>
              )}

              {/* Collapse button */}
              {expandable && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(false)}
                  className="text-muted-foreground hover:text-orange-500"
                >
                  <ChevronUpIcon className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        )}

      {/* Timeline container */}
      <div className="relative group">
        {/* Scroll buttons */}
        {canScrollLeft && (
          <button
            onClick={scrollLeft}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
          >
            <ChevronLeftIcon className="w-5 h-5 text-gray-700" />
          </button>
        )}
        
        {canScrollRight && (
          <button
            onClick={scrollRight}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
          >
            <ChevronRightIcon className="w-5 h-5 text-gray-700" />
          </button>
        )}

        {/* Timeline ribbon */}
        <div
          ref={scrollContainerRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide pb-4 px-2 snap-x snap-mandatory timeline-scroll"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {posts.map((post, index) => {
            const postDate = new Date(post.createdAt);
            const isToday = (() => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const postDay = new Date(postDate);
              postDay.setHours(0, 0, 0, 0);
              return postDay.getTime() === today.getTime();
            })();

            const postPet = post.pet || pet;
            const petColor = postPet ? getPetColor(postPet.id) : 'from-orange-400 via-yellow-400 to-orange-600';

            return (
                             <div
                 key={post.id}
                 className="flex-shrink-0 relative group/item snap-start timeline-item-hover"
                 onClick={() => onPostClick?.(post)}
               >
                {/* Timeline item */}
                <div className="relative">
                  {/* Date indicator */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium shadow-lg ${
                      isToday 
                        ? 'bg-gradient-to-r from-orange-400 to-yellow-400 text-orange-900' 
                        : 'bg-white/90 backdrop-blur-sm text-gray-700'
                    }`}>
                      {isToday ? 'Today' : format(postDate, 'MMM d')}
                    </div>
                  </div>

                  {/* Pet indicator for merged timeline */}
                  {variant === 'merged' && postPet && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-10">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium shadow-lg bg-gradient-to-r ${petColor} text-white`}>
                        {postPet.name}
                      </div>
                    </div>
                  )}

                  {/* Photo container */}
                  <div
                    className={`relative aspect-square w-32 rounded-xl overflow-hidden shadow-lg border-2 transition-all duration-300 cursor-pointer group-hover/item:scale-105 mt-4 ${
                      isToday 
                        ? 'border-orange-400 shadow-orange-200' 
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                    onClick={() => setActivePhotoId(post.id === activePhotoId ? null : post.id)}
                  >
                    <img
                      src={post.image || '/avatar.png'}
                      alt={`${postPet?.name || 'Pet'} photo`}
                      className="w-full h-full object-cover"
                    />

                    {/* Golden overlay for today's post */}
                    {isToday && (
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-yellow-400/20 pointer-events-none" />
                    )}

                    {/* Edit/Delete buttons */}
                    {isOwnPet && activePhotoId === post.id && (
                      <div className="absolute top-2 right-2 flex gap-1 z-20">
                        {onEditPost && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 bg-white/90 backdrop-blur-sm hover:bg-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditPost(post);
                            }}
                            title="Edit Photo"
                          >
                            <PencilIcon className="w-3 h-3 text-gray-700" />
                          </Button>
                        )}
                        {onDeletePost && (
                          <DeleteAlertDialog
                            isDeleting={isEditing && editPost?.id === post.id}
                            onDelete={() => handleDeletePost(post.id)}
                            title="Delete Timeline Photo"
                            description="This action cannot be undone."
                            triggerClassName="h-7 w-7 p-0 bg-white/90 backdrop-blur-sm hover:bg-white text-gray-700 hover:text-red-500"
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      </div>
    </div>
  );
} 