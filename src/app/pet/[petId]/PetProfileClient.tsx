"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileTextIcon, HeartIcon, MapPinIcon, LinkIcon, CalendarIcon, ChevronLeftIcon, ChevronRightIcon, FlameIcon, ImageIcon, Loader2Icon, PencilIcon, TrashIcon, MessageCircleIcon } from "lucide-react";
import Link from "next/link";
import PostCard from "@/components/PostCard";
import { format, formatDistanceToNow } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { createPost, deletePost, updatePost, toggleLike } from "@/actions/post.action";
import { useUser } from "@clerk/nextjs";
import toast from "react-hot-toast";
import dynamic from "next/dynamic";
import { DeleteAlertDialog } from "@/components/DeleteAlertDialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SecureImage } from "@/lib/useSecureImage";
import { SecureAvatar } from "@/components/SecureAvatar";
import HorizontalTimeline from "@/components/HorizontalTimeline";
import BlueCheckIcon from "@/components/BlueCheckIcon";
import { isUserVerified } from "@/lib/utils";
import PetDatingProfileEditor from "@/components/PetDatingProfileEditor";

// Dynamically import S3ImageUpload to avoid SSR issues
const S3ImageUpload = dynamic(() => import("@/components/S3ImageUpload"), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center size-40 border-2 border-dashed rounded-md">Loading...</div>
});

interface PetProfileClientProps {
  pet: any;
  posts: any[];
  owner: any;
}

// PostModal component for Instagram-style post viewing
function PostModal({ open, onOpenChange, post, dbUserId }: { open: boolean; onOpenChange: (v: boolean) => void; post: any | null; dbUserId: string | null }) {
  const { user } = useUser();
  const [newComment, setNewComment] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [comments, setComments] = useState(post?.comments || []);
  const [hasLiked, setHasLiked] = useState(post ? post.likes.some((like: any) => like.userId === dbUserId) : false);
  const [optimisticLikes, setOptimisticLikes] = useState(post ? post._count.likes : 0);
  const [isLiking, setIsLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showVideoControls, setShowVideoControls] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const isVideo = post?.mediaType?.startsWith("video");
  
  useEffect(() => {
    setComments(post?.comments || []);
    setHasLiked(post ? post.likes.some((like: any) => like.userId === dbUserId) : false);
    setOptimisticLikes(post ? post._count.likes : 0);
    setShowComments(false);
    setShowVideoControls(false);
  }, [post, dbUserId]);

  const handleVideoMouseDown = () => {
    const timer = setTimeout(() => {
      setShowVideoControls(true);
    }, 500); // 500ms long press
    setLongPressTimer(timer);
  };

  const handleVideoMouseUp = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleVideoMouseLeave = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleLike = async () => {
    if (isLiking || !post) return;
    try {
      setIsLiking(true);
      setHasLiked((prev: boolean) => !prev);
      setOptimisticLikes((prev: number) => prev + (hasLiked ? -1 : 1));
      await toggleLike(post.id);
    } catch (error) {
      setOptimisticLikes(post ? post._count.likes : 0);
      setHasLiked(post ? post.likes.some((like: any) => like.userId === dbUserId) : false);
    } finally {
      setIsLiking(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || isCommenting || !post) return;
    try {
      setIsCommenting(true);
      setComments([
        ...comments,
        {
          id: Math.random().toString(),
          content: newComment,
          createdAt: new Date(),
          authorId: user?.id || "",
          postId: post.id,
          author: {
            id: user?.id || "",
            name: user?.fullName || user?.username || "Anonymous",
            username: user?.username || "anonymous",
            image: user?.imageUrl || "/avatar.png",
          },
        },
      ]);
      setNewComment("");
    } finally {
      setIsCommenting(false);
    }
  };

  if (!post) return null;
  
  // Video layout - vertical/phone-sized
  if (isVideo) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="p-0 flex flex-col items-stretch justify-center bg-transparent shadow-none border-none max-w-sm w-full h-[90vh]">
          {/* Video container - phone-sized */}
          <div className="relative flex-1 bg-black flex items-center justify-center min-h-[400px] max-h-[60vh] rounded-t-xl">
            <video
              src={post.image || undefined}
              controls={showVideoControls}
              autoPlay
              loop
              muted
              onMouseDown={handleVideoMouseDown}
              onMouseUp={handleVideoMouseUp}
              onMouseLeave={handleVideoMouseLeave}
              className="w-full h-full object-contain max-h-[60vh] rounded-t-xl"
            />
            
            {/* Header overlay */}
            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/50 to-transparent rounded-t-xl">
              <div className="flex items-center gap-3">
                <SecureAvatar 
                  src={post.author?.image}
                  alt={post.author?.name || "User"}
                  className="w-8 h-8"
                />
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="font-semibold truncate text-white text-sm">{post.author?.name ?? post.author?.username}</span>
                    {isUserVerified(post.author?.username) && (
                      <BlueCheckIcon className="inline-block w-3 h-3 ml-1 align-text-bottom text-white" />
                    )}
                    <span className="text-xs text-white/70 ml-2 truncate">@{post.author?.username}</span>
                  </div>
                  <span className="text-xs text-white/70 truncate" suppressHydrationWarning>{formatDistanceToNow(new Date(post.createdAt))} ago</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Content and actions below video */}
          <div className="bg-white dark:bg-zinc-900 rounded-b-xl">
            {/* Post content */}
            {post.content && (
              <div className="px-4 py-3 text-sm text-foreground break-words whitespace-pre-line border-b border-muted">
                {post.content}
              </div>
            )}
            
            {/* Actions */}
            <div className="flex items-center gap-4 px-4 py-3 border-b border-muted">
              <button
                className={`flex items-center gap-2 text-muted-foreground ${hasLiked ? "text-red-500" : "hover:text-red-500"}`}
                onClick={handleLike}
                disabled={isLiking}
              >
                {hasLiked ? (
                  <HeartIcon className="size-5 fill-current" />
                ) : (
                  <HeartIcon className="size-5" />
                )}
                <span className="text-sm">{optimisticLikes}</span>
              </button>
              <button
                className="flex items-center gap-2 text-muted-foreground hover:text-blue-500"
                onClick={() => setShowComments(true)}
              >
                <MessageCircleIcon className="size-5" />
                <span className="text-sm">{comments.length}</span>
              </button>
            </div>
            
            {/* Comments section - slides up from bottom */}
            {showComments && (
              <div className="border-t border-muted max-h-[40vh] overflow-y-auto">
                <div className="flex items-center justify-between p-3 border-b border-muted">
                  <h3 className="font-semibold text-sm">Comments</h3>
                  <button
                    onClick={() => setShowComments(false)}
                    className="text-muted-foreground hover:text-foreground text-sm"
                  >
                    ✕
                  </button>
                </div>
                
                {/* Comments list */}
                <div className="px-4 py-2">
                  {comments.length === 0 ? (
                    <div className="text-muted-foreground text-sm py-4 text-center">No comments yet</div>
                  ) : (
                    <div className="space-y-3">
                      {comments.map((comment: any) => (
                        <div key={comment.id} className="flex space-x-2">
                          <SecureAvatar 
                            src={comment.author.image}
                            alt={comment.author.name || "User"}
                            className="size-6 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-x-1 gap-y-1">
                              <span className="font-medium text-xs">{comment.author.name}</span>
                              {isUserVerified(comment.author.username) && (
                                <BlueCheckIcon className="inline-block w-2 h-2 ml-1 align-text-bottom" />
                              )}
                              <span className="text-xs text-muted-foreground">@{comment.author.username}</span>
                              <span className="text-xs text-muted-foreground">·</span>
                              <span className="text-xs text-muted-foreground">
                                <span suppressHydrationWarning>{new Date(comment.createdAt).toLocaleString()}</span>
                              </span>
                            </div>
                            <p className="text-xs break-words">{comment.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Add comment */}
                {user && (
                  <div className="flex items-center gap-2 p-3 border-t border-muted">
                    <SecureAvatar 
                      src={user?.imageUrl}
                      alt={user?.fullName || "User"}
                      className="size-6 flex-shrink-0"
                    />
                    <Textarea
                      placeholder="Write a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-[32px] resize-none flex-1 text-xs"
                    />
                    <button
                      onClick={handleAddComment}
                      className="px-2 py-1 bg-primary text-white rounded text-xs disabled:opacity-50"
                      disabled={!newComment.trim() || isCommenting}
                    >
                      {isCommenting ? "Posting..." : "Comment"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  
  // Image layout - fit image size with bottom bar
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="p-0 flex flex-col items-stretch justify-center bg-transparent shadow-none border-none max-w-2xl w-full">
         {/* Image container - fit image size */}
         <div className="relative bg-black flex items-center justify-center">
           <SecureImage
             src={post.image}
             alt={post.title || "Post"}
             className="w-full h-auto max-h-[70vh] object-contain"
           />
           
           {/* Header overlay */}
           <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/50 to-transparent">
             <div className="flex items-center gap-3">
                               <SecureAvatar 
                  src={post.author?.image}
                  alt={post.author?.name || "User"}
                  className="w-10 h-10"
                />
               <div className="flex flex-col min-w-0">
                 <div className="flex items-center gap-1 min-w-0">
                   <span className="font-semibold truncate text-white">{post.author?.name ?? post.author?.username}</span>
                   {isUserVerified(post.author?.username) && (
                     <BlueCheckIcon className="inline-block w-4 h-4 ml-1 align-text-bottom text-white" />
                   )}
                   <span className="text-xs text-white/70 ml-2 truncate">@{post.author?.username}</span>
                 </div>
                 <span className="text-xs text-white/70 truncate" suppressHydrationWarning>{formatDistanceToNow(new Date(post.createdAt))} ago</span>
               </div>
             </div>
           </div>
         </div>
         
         {/* Bottom bar with content and actions - attached to image */}
         <div className="bg-white dark:bg-zinc-900">
           {/* Post content */}
           {post.content && (
             <div className="px-4 py-3 text-sm text-foreground break-words whitespace-pre-line border-b border-muted">
               {post.content}
             </div>
           )}
           
           {/* Actions */}
           <div className="flex items-center gap-4 px-4 py-3">
             <button
               className={`flex items-center gap-2 text-muted-foreground ${hasLiked ? "text-red-500" : "hover:text-red-500"}`}
               onClick={handleLike}
               disabled={isLiking}
             >
               {hasLiked ? (
                 <HeartIcon className="size-6 fill-current" />
               ) : (
                 <HeartIcon className="size-6" />
               )}
               <span>{optimisticLikes}</span>
             </button>
             <button
               className="flex items-center gap-2 text-muted-foreground hover:text-blue-500"
               onClick={() => setShowComments(true)}
             >
               <MessageCircleIcon className="size-6" />
               <span>{comments.length}</span>
             </button>
           </div>
           
           {/* Comments section - slides up from bottom */}
           {showComments && (
             <div className="border-t border-muted max-h-[40vh] overflow-y-auto">
               <div className="flex items-center justify-between p-4 border-b border-muted">
                 <h3 className="font-semibold">Comments</h3>
                 <button
                   onClick={() => setShowComments(false)}
                   className="text-muted-foreground hover:text-foreground"
                 >
                   ✕
                 </button>
               </div>
               
               {/* Comments list */}
               <div className="flex-1 overflow-y-auto px-4 py-2 max-h-[30vh]">
                 {comments.length === 0 ? (
                   <div className="text-muted-foreground text-sm py-8 text-center">No comments yet</div>
                 ) : (
                   <div className="space-y-4">
                     {comments.map((comment: any) => (
                       <div key={comment.id} className="flex space-x-3">
                         <SecureAvatar 
                           src={comment.author.image}
                           alt={comment.author.name || "User"}
                           className="size-8 flex-shrink-0"
                         />
                         <div className="flex-1 min-w-0">
                           <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                             <span className="font-medium text-sm">{comment.author.name}</span>
                             {isUserVerified(comment.author.username) && (
                               <BlueCheckIcon className="inline-block w-3 h-3 ml-1 align-text-bottom" />
                             )}
                             <span className="text-sm text-muted-foreground">@{comment.author.username}</span>
                             <span className="text-sm text-muted-foreground">·</span>
                             <span className="text-sm text-muted-foreground">
                               <span suppressHydrationWarning>{new Date(comment.createdAt).toLocaleString()}</span>
                             </span>
                           </div>
                           <p className="text-sm break-words">{comment.content}</p>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
               </div>
               
               {/* Add comment */}
               {user && (
                 <div className="flex items-center gap-3 p-4 border-t border-muted">
                   <SecureAvatar 
                     src={user?.imageUrl}
                     alt={user?.fullName || "User"}
                     className="size-8 flex-shrink-0"
                   />
                   <Textarea
                     placeholder="Write a comment..."
                     value={newComment}
                     onChange={(e) => setNewComment(e.target.value)}
                     className="min-h-[40px] resize-none flex-1"
                   />
                   <button
                     onClick={handleAddComment}
                     className="px-3 py-1 bg-primary text-white rounded disabled:opacity-50"
                     disabled={!newComment.trim() || isCommenting}
                   >
                     {isCommenting ? "Posting..." : "Comment"}
                   </button>
                 </div>
               )}
             </div>
           )}
         </div>
       </DialogContent>
    </Dialog>
  );
}

export default function PetProfileClient({ pet, posts, owner }: PetProfileClientProps) {
  const { user: currentUser } = useUser();
  const [modalOpen, setModalOpen] = useState(false);
  const [activePost, setActivePost] = useState<any | null>(null);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [petPostIndex, setPetPostIndex] = useState(0);
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [timelineImageUpload, setTimelineImageUpload] = useState<{ url: string; type: string } | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editPost, setEditPost] = useState<any | null>(null);
  const [editImage, setEditImage] = useState<{ url: string; type: string } | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [activePhotoId, setActivePhotoId] = useState<string | null>(null);
  const [showDatingProfileEditor, setShowDatingProfileEditor] = useState(false);

  const formattedDate = pet.createdAt ? format(new Date(pet.createdAt), "MMMM yyyy") : "";
  const petPosts = posts.filter((post) => !post.mediaType || post.mediaType.startsWith('image'));
  const currentPetPost = petPosts[petPostIndex] || null;

  // Check if current user owns this pet (Clerk user ID)
  const isOwnPet = currentUser && owner && currentUser.id === owner.clerkId;
  // Debug log (remove in production)
  if (!isOwnPet) {
    console.log('DEBUG: currentUser', currentUser);
    console.log('DEBUG: owner', owner);
  }

  // Get today's post for the pet
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaysPost = petPosts.find(post => {
    const postDate = new Date(post.createdAt);
    postDate.setHours(0, 0, 0, 0);
    return postDate.getTime() === today.getTime();
  });

  // Timeline navigation
  const nextPetPost = (): void => {
    if (petPostIndex < petPosts.length - 1) setPetPostIndex((idx) => idx + 1);
  };
  const prevPetPost = (): void => {
    if (petPostIndex > 0) setPetPostIndex((idx) => idx - 1);
  };

  // Scroll to top of timeline modal when opened
  const handleTimelineOpen = () => {
    setTimelineOpen(true);
    setPetPostIndex(0);
    setTimeout(() => {
      timelineRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  // Show upload options modal for daily pet photo
  const handleUploadDaily = () => {
    setShowUploadOptions(true);
  };

  // Upload a new daily photo for the pet's timeline
  const handleUploadSubmit = async () => {
    if (!timelineImageUpload?.url) return;
    try {
      setIsUploading(true);
      
      // Optimistic update for timeline photo challenge
      if (timelineImageUpload?.type?.startsWith('image')) {
        // Trigger optimistic update immediately
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('challenge-progress', {
            detail: { challengeId: 'daily_post_photo', increment: 1 }
          }));
        }
      }
      
      // Create a post for the timeline using the same logic as regular posts
      const result = await createPost(
        "", // Empty content for timeline photos
        timelineImageUpload.url,
        pet.id, // Post as the pet
        timelineImageUpload.type || "image"
      );
      if (result?.success) {
        // Refresh the page to show the new post
        window.location.reload();
        toast.success("Daily photo uploaded successfully!");
      } else {
        toast.error(result?.error || "Failed to upload daily photo");
      }
    } catch (error) {
      console.error("Failed to upload daily photo:", error);
      toast.error("Failed to upload daily photo");
    } finally {
      setIsUploading(false);
      setShowUploadOptions(false);
      setTimelineImageUpload(null);
    }
  };

  // Delete post handler
  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    const res = await deletePost(postId);
    if (res.success) {
      window.location.reload();
    } else {
      toast.error(res.error || "Failed to delete post");
    }
  };

  // Open edit modal
  const openEditModal = (post: any): void => {
    setEditPost(post);
    setEditImage(post.image ? { url: post.image, type: "image" } : null);
    setEditContent(post.content || "");
    setEditModalOpen(true);
  };

  // Edit post submit handler
  const handleEditSubmit = async () => {
    if (!editPost) return;
    setIsEditing(true);
    const res = await updatePost(editPost.id, {
      content: editContent,
      image: editImage?.url,
    });
    setIsEditing(false);
    if (res.success) {
      setEditModalOpen(false);
      window.location.reload();
    } else {
      toast.error(res.error || "Failed to update post");
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="grid grid-cols-1 gap-6">
        {/* Horizontal Timeline */}
        <div className="w-full">
                     <HorizontalTimeline
             posts={petPosts.map(post => ({
               id: post.id,
               image: post.image,
               content: post.content,
               createdAt: post.createdAt,
               petId: post.petId,
               pet: {
                 id: pet.id,
                 name: pet.name,
                 imageUrl: pet.imageUrl,
                 streak: pet.streak
               }
             }))}
             pet={pet}
             isOwnPet={isOwnPet}
             onPostClick={(post) => {
               const originalPost = posts.find(p => p.id === post.id);
               if (originalPost) {
                 setActivePost(originalPost);
                 setModalOpen(true);
               }
             }}
             onEditPost={(post) => {
               const originalPost = posts.find(p => p.id === post.id);
               if (originalPost) {
                 openEditModal(originalPost);
               }
             }}
             onDeletePost={handleDeletePost}
             onUploadDaily={handleUploadDaily}
             isUploading={isUploading}
             expandable={true}
             defaultExpanded={false}
             className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl p-6 shadow-lg border border-orange-100"
           />
        </div>

        <div className="w-full max-w-lg mx-auto">
          <Card className="bg-card">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                {/* Glowing golden avatar, clickable for timeline */}
                <div
                  className="p-1 rounded-full bg-gradient-to-tr from-orange-400 via-yellow-400 to-orange-600 shadow-lg animate-pulse cursor-pointer mb-2"
                  onClick={handleTimelineOpen}
                  title="View Timeline"
                >
                  <SecureAvatar 
                    src={pet.imageUrl}
                    alt={pet.name}
                    className="w-24 h-24 border-2 border-primary group-hover:scale-105 transition"
                  />
                </div>
                <h1 className="mt-4 text-2xl font-bold">{pet.name}</h1>
                <p className="text-muted-foreground">{pet.breed} {pet.breed && pet.age && "•"} {pet.age}</p>
                <p className="mt-2 text-sm">{pet.bio}</p>
                {/* Owner Profile Button */}
                {owner && (
                  <Link href={`/profile/${owner.username}`}>
                    <Button className="w-full mt-4">View Owner Profile</Button>
                  </Link>
                )}
                {/* PROFILE STATS */}
                <div className="w-full mt-6">
                  <div className="flex justify-between mb-4">
                    <div>
                      <div className="font-semibold">{pet.streak?.toLocaleString?.() ?? 0}</div>
                      <div className="text-sm text-muted-foreground">Streak</div>
                    </div>
                    <Separator orientation="vertical" />
                    <div>
                      <div className="font-semibold">{posts.length.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Posts</div>
                    </div>
                  </div>
                </div>
                {/* LOCATION & WEBSITE (if pet has location/bio fields) */}
                <div className="w-full mt-6 space-y-2 text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <CalendarIcon className="size-4 mr-2" />
                    Joined {formattedDate}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Main content tabs: Posts only */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
            <TabsTrigger
              value="posts"
              className="flex items-center gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 font-semibold"
            >
              <FileTextIcon className="size-4" />
              Posts
            </TabsTrigger>
          </TabsList>
          <TabsContent value="posts" className="mt-6">
            {posts.length > 0 ? (
              <>
                <style>{`
                  .profile-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    grid-auto-rows: 1fr;
                    gap: 2px;
                    width: 100%;
                  }
                  .profile-item {
                    width: 100%;
                    aspect-ratio: 1/1;
                    object-fit: cover;
                    cursor: pointer;
                    background: #222;
                    overflow: hidden;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                  }
                `}</style>
                <div className="profile-grid">
                  {posts.map((post, idx) => (
                    <div
                      key={post.id}
                      className="profile-item group relative"
                      onClick={() => {
                        setActivePost(post);
                        setModalOpen(true);
                      }}
                      onMouseEnter={() => post.mediaType?.startsWith('video') && videoRefs.current[idx]?.play()}
                      onMouseLeave={() => post.mediaType?.startsWith('video') && videoRefs.current[idx]?.pause()}
                    >
                      {post.mediaType?.startsWith('video') ? (
                        <video
                          ref={el => { videoRefs.current[idx] = el; }}
                          src={post.image || undefined}
                          muted
                          loop
                          playsInline
                          preload="metadata"
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          controls={false}
                        />
                      ) : (
                        <SecureImage
                          src={post.image}
                          alt={post.title || 'Post'}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                      )}
                      {/* Edit button (only for pet owner) */}
                      {isOwnPet && (
                        <div className="absolute top-2 right-2 z-10 flex gap-2 opacity-0 group-hover:opacity-100">
                          <button
                            className="p-1 hover:bg-transparent transition-colors"
                            onClick={e => { e.stopPropagation(); openEditModal(post); }}
                            title="Edit Post"
                          >
                            <PencilIcon className="size-5 text-yellow-600 hover:text-yellow-700" />
                          </button>
                          <div className="p-1 hover:bg-transparent transition-colors">
                            <DeleteAlertDialog
                              isDeleting={isEditing && editPost?.id === post.id}
                              onDelete={async () => { await handleDeletePost(post.id); }}
                              title="Delete Post"
                              description="This action cannot be undone."
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No posts yet</div>
            )}
          </TabsContent>
        </Tabs>
        {/* Timeline Modal */}
        <Dialog open={timelineOpen} onOpenChange={setTimelineOpen}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden flex items-center justify-center min-h-[80vh] bg-gradient-to-br from-orange-100 via-yellow-50 to-orange-200">
            <div className="relative rounded-lg shadow-lg w-full flex flex-col items-center justify-center min-h-[70vh]">
              <div className="flex flex-col items-center p-6 w-full">
                <div className="flex items-center justify-between w-full mb-6">
                  <div className="flex items-center space-x-4">
                    <SecureAvatar 
                      src={pet.imageUrl}
                      alt={pet.name}
                      className="w-16 h-16"
                    />
                    <div>
                      <div className="font-bold text-xl">{pet.name}'s Timeline</div>
                      <div className="text-sm text-muted-foreground">{petPosts.length} photos</div>
                    </div>
                  </div>
                  {/* Flaming streak icon and count */}
                  <div className="flex items-center gap-2 bg-gradient-to-tr from-orange-400 via-yellow-400 to-orange-600 px-4 py-2 rounded-full shadow-lg">
                    <FlameIcon className="w-6 h-6 text-orange-700 animate-pulse" />
                    <span className="font-bold text-lg text-orange-900">{pet.streak ?? 0}</span>
                  </div>
                  {/* Only show upload button if user owns this pet */}
                  {isOwnPet && (
                    <>
                      <Button
                        onClick={handleUploadDaily}
                        disabled={isUploading}
                        className="flex items-center space-x-2 bg-gradient-to-tr from-orange-400 via-yellow-400 to-orange-600 text-white hover:scale-105"
                      >
                        {isUploading ? (
                          <>
                            <Loader2Icon className="w-4 h-4 animate-spin" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <ImageIcon className="w-4 h-4" />
                            <span>Upload Daily Media</span>
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => setShowDatingProfileEditor(true)}
                        className="flex items-center space-x-2 bg-gradient-to-tr from-pink-400 via-purple-400 to-pink-600 text-white hover:scale-105"
                      >
                        <HeartIcon className="w-4 h-4" />
                        <span>Dating Profile</span>
                      </Button>
                    </>
                  )}
                </div>
                {/* Alternating vertical timeline (tree style) */}
                <div className="w-full max-h-[60vh] overflow-y-auto overflow-x-hidden" ref={timelineRef}>
                  {petPosts.length > 0 ? (
                    <div className="relative w-full">
                      {/* Central timeline line */}
                      <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-400 to-orange-200 -translate-x-1/2"></div>
                      {petPosts.map((post, index) => {
                        const postDate = new Date(post.createdAt);
                        const isToday = (() => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const postDay = new Date(postDate);
                          postDay.setHours(0, 0, 0, 0);
                          return postDay.getTime() === today.getTime();
                        })();
                        const isLeft = index % 2 === 0;
                        return (
                          <div key={post.id} className={`flex w-full mb-12 relative ${isLeft ? 'justify-start' : 'justify-end'}`}>
                            <div className={`flex flex-col items-center w-1/2 ${isLeft ? 'items-end pr-4' : 'items-start pl-4'}`}>
                              {/* Photo container */}
                              <div
                                className="relative aspect-square w-48 rounded-lg overflow-hidden shadow-lg border-2 transition-all duration-300 cursor-pointer group-hover:scale-105 ${
                                  isToday
                                    ? 'border-orange-400 shadow-orange-200'
                                    : 'border-gray-200 hover:border-orange-300'
                                } bg-white"
                                onClick={() => setActivePhotoId(post.id === activePhotoId ? null : post.id)}
                              >
                                <SecureImage src={post.image || '/avatar.png'} alt={pet.name + ' photo'} className="w-full h-full object-cover" />
                                {/* Golden overlay for today's post */}
                                {isToday && (
                                  <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-yellow-400/20 pointer-events-none" />
                                )}
                                {/* Edit/Delete buttons for owner, only show if this photo is active */}
                                {isOwnPet && activePhotoId === post.id && (
                                  <div className="absolute top-2 right-2 flex gap-1 z-20">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0 bg-white/90 backdrop-blur-sm hover:bg-white"
                                      onClick={e => { e.stopPropagation(); openEditModal(post); }}
                                      title="Edit Photo"
                                    >
                                      <PencilIcon className="w-3 h-3 text-gray-700" />
                                    </Button>
                                    <DeleteAlertDialog
                                      isDeleting={isEditing && editPost?.id === post.id}
                                      onDelete={async () => { await handleDeletePost(post.id); }}
                                      title="Delete Timeline Photo"
                                      description="This action cannot be undone."
                                      triggerClassName="h-7 w-7 p-0 bg-white/90 backdrop-blur-sm hover:bg-red-100 text-gray-700 hover:text-red-500"
                                    />
                                  </div>
                                )}
                                    </div>
                              {/* Date indicator below photo */}
                              <div className="mt-2">
                                <div className={`px-2 py-1 rounded-full text-xs font-medium shadow-lg ${
                                  isToday
                                    ? 'bg-gradient-to-r from-orange-400 to-yellow-400 text-orange-900'
                                    : 'bg-white/90 backdrop-blur-sm text-gray-700'
                                }`}>
                                  {isToday ? 'Today' : format(postDate, 'MMM d')}
                                  </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">No photos for this pet yet.</div>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        {/* UPLOAD OPTIONS MODAL: For uploading a daily pet photo */}
        <Dialog open={showUploadOptions} onOpenChange={setShowUploadOptions}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Upload Daily Media</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {todaysPost ? (
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    You already have a daily post for today. Would you like to replace it?
                  </div>
                  <div className="relative aspect-square rounded-lg overflow-hidden">
                    <img
                      src={(todaysPost.image as string) || '/avatar.png'}
                      alt="Today's post"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {isOwnPet && (
                    <div className="flex flex-col gap-2">
                      {!timelineImageUpload && (
                        <div className="flex justify-between">
                          <Button
                            variant="outline"
                            onClick={() => setShowUploadOptions(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="default"
                            onClick={() => setTimelineImageUpload({ url: '', type: 'image' })}
                          >
                            Replace Photo
                          </Button>
                        </div>
                      )}
                      {timelineImageUpload && (
                        <div className="space-y-2">
                          <S3ImageUpload
                            folder="posts"
                            value={timelineImageUpload.url ? timelineImageUpload : null}
                            onChange={mediaObj => setTimelineImageUpload(mediaObj)}
                          />
                          <div className="flex justify-end gap-3">
                            <Button
                              variant="outline"
                              onClick={() => setTimelineImageUpload(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={async () => {
                                if (!timelineImageUpload?.url) return;
                                setIsUploading(true);
                                // Update today's post image
                                const res = await updatePost(todaysPost.id, { image: timelineImageUpload.url });
                                setIsUploading(false);
                                if (res.success) {
                                  setShowUploadOptions(false);
                                  setTimelineImageUpload(null);
                                  window.location.reload();
                                } else {
                                  toast.error(res.error || 'Failed to replace photo');
                                }
                              }}
                              disabled={isUploading}
                            >
                              {isUploading ? 'Replacing...' : 'Replace Photo'}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Image Upload Component */}
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      Upload media for {pet?.name}'s timeline
                    </div>
                    <S3ImageUpload
                      folder="posts"
                      value={timelineImageUpload}
                      onChange={(mediaObj) => {
                        setTimelineImageUpload(mediaObj);
                      }}
                    />
                  </div>
                  {timelineImageUpload && (
                    <div className="flex justify-end gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setTimelineImageUpload(null);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleUploadSubmit}
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <>
                            <Loader2Icon className="w-4 h-4 animate-spin mr-2" />
                            Uploading...
                          </>
                        ) : (
                          'Upload Daily Media'
                        )}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* EDIT POST MODAL */}
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Timeline Photo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Image</Label>
                <S3ImageUpload
                  folder="posts"
                  value={editImage}
                  onChange={img => setEditImage(img)}
                />
              </div>
              <div className="space-y-2">
                <Label>Caption</Label>
                <Textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  className="min-h-[80px]"
                  placeholder="Edit your caption"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleEditSubmit} disabled={isEditing}>
                {isEditing ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Post Modal with like button and comment section */}
        <PostModal 
          open={modalOpen} 
          onOpenChange={setModalOpen} 
          post={activePost} 
          dbUserId={owner?.id} 
        />

        {/* Dating Profile Editor */}
        {isOwnPet && (
          <PetDatingProfileEditor
            petId={pet.id}
            petName={pet.name}
            isOpen={showDatingProfileEditor}
            onOpenChange={setShowDatingProfileEditor}
          />
        )}
      </div>
    </div>
  );
} 