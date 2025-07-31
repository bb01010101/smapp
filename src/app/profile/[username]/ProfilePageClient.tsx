"use client";


import { getProfileByUsername, getUserPosts, updateProfile, isFoundingPackUser } from "@/actions/profile.action";
import { getPosts, createPost, toggleLike, updatePost, deletePost } from "@/actions/post.action";
import { toggleFollow } from "@/actions/user.action";
import PostCard from "@/components/PostCard";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
 Dialog,
 DialogClose,
 DialogContent,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { SignInButton, useUser } from "@clerk/nextjs";
import { format } from "date-fns";
import { SecureImage } from "@/lib/useSecureImage";
import { SecureAvatar } from "@/components/SecureAvatar";
import { SecureVideo } from "@/components/SecureVideo";
import {
 CalendarIcon,
 EditIcon,
 FileTextIcon,
 HeartIcon,
 LinkIcon,
 MapPinIcon,
 ChevronLeftIcon,
 ChevronRightIcon,
 Loader2Icon,
 ImageIcon,
 CameraIcon,
 PawPrintIcon,
 FlameIcon,
 MessageCircleIcon,
 PencilIcon,
 TrashIcon,
} from "lucide-react";
import BlueCheckIcon from "@/components/BlueCheckIcon";
import RedCheckIcon from "@/components/RedCheckIcon";
import { useState, useEffect, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import { useRouter, useParams } from "next/navigation";
import { getOrCreateConversation } from "@/actions/dm.action";
import dynamic from "next/dynamic";
import EditFamilyModal from "@/components/EditFamilyModal";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import Link from "next/link";
import { DeleteAlertDialog } from "@/components/DeleteAlertDialog";
import HorizontalTimeline from "@/components/HorizontalTimeline";
import { isUserVerified, isUserVerifiedShelter } from "@/lib/utils";
import { getPetAvatarImage } from "@/lib/petImageUtils";
import { getUserEvolutionImagePreference } from "@/actions/profile.action";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";


// This is the main client-side component for rendering a user's profile page
// It handles all UI, state, and user interactions for the profile, pets, posts, and modals


// Dynamically import S3ImageUpload to avoid SSR issues
const S3ImageUpload = dynamic(() => import("@/components/S3ImageUpload"), {
 ssr: false,
 loading: () => <div className="flex items-center justify-center size-40 border-2 border-dashed rounded-md">Loading...</div>
});


// Type definitions for user, posts, and props
// User: The profile being viewed
// Posts: All posts by the user
// Post: A single post object
// ProfilePageClientProps: Props expected by the main profile page client component


type User = Awaited<ReturnType<typeof getProfileByUsername>>;
type Posts = Awaited<ReturnType<typeof getUserPosts>>;
type Post = Awaited<ReturnType<typeof getPosts>>[number];


interface ProfilePageClientProps {
 user: NonNullable<User>;      // The user profile data
 posts: Post[];               // Posts created by the user
 likedPosts: Post[];          // Posts liked by the user
 isFollowing: boolean;        // Whether the current user is following this profile
 pets: any[];                 // Pets associated with the user
 isFoundingPack?: boolean;    // Founding Pack badge
 useEvolutionImages: boolean; // Whether to use evolution images as default
}


// Renders the media (image or video) for a post
function PostMedia({ post }: { post: Post }) {
 const isVideo = post.mediaType?.startsWith("video");
 return (
   <div
     style={{
       width: '100%',
       maxWidth: '90vw',
       maxHeight: '90vh',
       background: "#222",
       display: "flex",
       alignItems: "center",
       justifyContent: "center",
       position: "relative",
     }}
     className="mx-auto"
   >
     {isVideo ? (
       <video
         src={post.image || undefined}
         controls={true}
         autoPlay
         style={{ 
           width: "100%", 
           height: "100%", 
           objectFit: "contain", 
           borderRadius: 0,
           maxHeight: '90vh'
         }}
       />
     ) : (
       <SecureImage
         src={post.image}
         alt={post.title || "Post"}
         style={{ 
           width: "100%", 
           height: "auto", 
           maxHeight: "90vh",
           objectFit: "contain", 
           borderRadius: 0 
         }}
       />
     )}
   </div>
 );
}


// Modal for viewing a single post and its comments/likes
function PostModal({ open, onOpenChange, post, dbUserId }: { open: boolean; onOpenChange: (v: boolean) => void; post: Post | null; dbUserId: string | null }) {
 const { user } = useUser();
 const [newComment, setNewComment] = useState("");
 const [isCommenting, setIsCommenting] = useState(false);
 const [comments, setComments] = useState(post?.comments || []);
 const [hasLiked, setHasLiked] = useState(post ? post.likes.some(like => like.userId === dbUserId) : false);
 const [optimisticLikes, setOptimisticLikes] = useState(post ? post._count.likes : 0);
 const [isLiking, setIsLiking] = useState(false);
 const [showComments, setShowComments] = useState(false);
 const [showVideoControls, setShowVideoControls] = useState(false);
 const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
 const isVideo = post?.mediaType?.startsWith("video");
 
 useEffect(() => {
   setComments(post?.comments || []);
   setHasLiked(post ? post.likes.some(like => like.userId === dbUserId) : false);
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
     setHasLiked(prev => !prev);
     setOptimisticLikes(prev => prev + (hasLiked ? -1 : 1));
     await toggleLike(post.id);
   } catch (error) {
     setOptimisticLikes(post ? post._count.likes : 0);
     setHasLiked(post ? post.likes.some(like => like.userId === dbUserId) : false);
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
          isFirst1000: true, // Default to true for current users
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
                     {comments.map((comment) => (
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
                    {comments.map((comment) => (
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


// Main profile page client component
function ProfilePageClient({
 isFollowing: initialIsFollowing,
 likedPosts,
 posts,
 user,
 pets,
 isFoundingPack = false,
 useEvolutionImages,
}: ProfilePageClientProps) {
 // Get the current logged-in user
 const { user: currentUser } = useUser();
 // State for showing edit profile dialog
 const [showEditDialog, setShowEditDialog] = useState(false);
 // State for showing edit family (pets) dialog
 const [showEditFamilyDialog, setShowEditFamilyDialog] = useState(false);
 // State for following/unfollowing
 const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
 const [isUpdatingFollow, setIsUpdatingFollow] = useState(false);
 // State for the user's pets
 const [currentPets, setCurrentPets] = useState(pets);
 // Router for navigation
 const router = useRouter();
 const params = useParams();
 const username = params?.username || user.username;


 // State for the edit profile form
 const [editForm, setEditForm] = useState({
   name: user.name || "",
   bio: user.bio || "",
   location: user.location || "",
   website: user.website || "",
   image: user.image || "",
 });


 // State for uploaded profile image
 const [imageUpload, setImageUpload] = useState<{ url: string; type: string } | null>(user.image ? { url: user.image, type: "image" } : null);


 // State for pet story modal
 const [storyOpen, setStoryOpen] = useState(false);
 const [activePet, setActivePet] = useState<any | null>(null);
 const [petPostIndex, setPetPostIndex] = useState(0);
 const [isTimelineMode, setIsTimelineMode] = useState(false);
 const [timelineInterval, setTimelineInterval] = useState<NodeJS.Timeout | null>(null);
 const [timelineOpen, setTimelineOpen] = useState(false);
 const [familyTimelineOpen, setFamilyTimelineOpen] = useState(false);
 const [isUploading, setIsUploading] = useState(false);
 const [showUploadOptions, setShowUploadOptions] = useState(false);
 const [showExistingPosts, setShowExistingPosts] = useState(false);
 const [timelineImageUpload, setTimelineImageUpload] = useState<{ url: string; type: string } | null>(null);


 // State for post modal
 const [modalOpen, setModalOpen] = useState(false);
 const [activePost, setActivePost] = useState<Post | null>(null);


 // Video preview refs and handlers for hover/scroll
 const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
 const handleMouseEnter = (idx: number) => {
   const vid = videoRefs.current[idx];
   if (vid) {
     vid.play();
   }
 };
 const handleMouseLeave = (idx: number) => {
   const vid = videoRefs.current[idx];
   if (vid) {
     vid.pause();
     vid.currentTime = 0;
   }
 };


 // Intersection observer for mobile (not used in desktop, but could be used for auto-play videos)
 const handleIntersection = useCallback((idx: number, inView: boolean) => {
   const vid = videoRefs.current[idx];
   if (vid) {
     if (inView) vid.play();
     else {
       vid.pause();
       vid.currentTime = 0;
     }
   }
 }, []);


 // Get posts for the active pet (for pet story/timeline)
 const activePetPosts = activePet ? posts.filter((post) =>
   post.petId === activePet.id &&
   (!post.mediaType || post.mediaType.startsWith('image'))
 ) : [];
 const currentPetPost = activePetPosts[petPostIndex] || null;


 // Get today's post for the active pet
 const today = new Date();
 today.setHours(0, 0, 0, 0);
 const todaysPost = activePetPosts.find(post => {
   const postDate = new Date(post.createdAt);
   postDate.setHours(0, 0, 0, 0);
   return postDate.getTime() === today.getTime();
 });


 // Handle space key press for timeline mode (pet story timeline)
 useEffect(() => {
   const handleKeyPress = (e: KeyboardEvent) => {
     if (e.code === 'Space' && timelineOpen && !isTimelineMode) {
       e.preventDefault();
       startTimeline();
     }
   };


   const handleKeyUp = (e: KeyboardEvent) => {
     if (e.code === 'Space' && isTimelineMode) {
       stopTimeline();
     }
   };


   const handleDoubleTap = (e: TouchEvent) => {
     if (timelineOpen && !isTimelineMode) {
       e.preventDefault();
       startTimeline();
     }
   };


   window.addEventListener('keydown', handleKeyPress);
   window.addEventListener('keyup', handleKeyUp);
   window.addEventListener('touchend', handleDoubleTap, { passive: false });


   return () => {
     window.removeEventListener('keydown', handleKeyPress);
     window.removeEventListener('keyup', handleKeyUp);
     window.removeEventListener('touchend', handleDoubleTap);
     if (timelineInterval) {
       clearInterval(timelineInterval);
     }
   };
 }, [timelineOpen, isTimelineMode, activePetPosts.length, petPostIndex]);


 // Start the timeline (auto-advance through pet's posts)
 const startTimeline = () => {
   setIsTimelineMode(true);
   const interval = setInterval(() => {
     setPetPostIndex((current) => {
       if (current >= activePetPosts.length - 1) {
         clearInterval(interval);
         setIsTimelineMode(false);
         return current;
       }
       return current + 1;
     });
   }, 1000); // Show each post for 1 second
   setTimelineInterval(interval);
 };


 // Stop the timeline
 const stopTimeline = () => {
   if (timelineInterval) {
     clearInterval(timelineInterval);
     setTimelineInterval(null);
   }
   setIsTimelineMode(false);
 };


 // Open the timeline modal for a pet
 const openTimeline = () => {
   setTimelineOpen(true);
   setPetPostIndex(0);
 };


 // Close the timeline modal
 const closeTimeline = () => {
   setTimelineOpen(false);
   setPetPostIndex(0);
   setIsTimelineMode(false);
   if (timelineInterval) {
     clearInterval(timelineInterval);
     setTimelineInterval(null);
   }
 };


 // Show upload options modal for daily pet photo
 const handleUploadDaily = () => {
   setShowUploadOptions(true);
 };


 // Select an existing post as today's daily photo (not fully implemented)
 const handleSelectExistingPost = (post: Post) => {
   // Mark this post as today's daily photo (implement backend logic as needed)
   toast.success('Selected existing post as today\'s timeline photo!');
   setShowExistingPosts(false);
 };


 // Remove today's daily post (not fully implemented)
 const handleRemoveDailyPost = async () => {
   if (!todaysPost) return;
   try {
     setIsUploading(true);
     // TODO: Implement logic to remove the daily post status
     toast.success("Daily post removed successfully");
   } catch (error) {
     toast.error("Failed to remove daily post");
   } finally {
     setIsUploading(false);
   }
 };


 // Upload a new daily photo for the pet's timeline
 const handleUploadSubmit = async () => {
   if (!timelineImageUpload?.url || !activePet) return;
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
       activePet.id, // Post as the active pet
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


 // Submit the edit profile form
 const handleEditSubmit = async () => {
   const formData = new FormData();
   Object.entries(editForm).forEach(([key, value]) => {
     formData.append(key, value);
   });
   if (imageUpload && imageUpload.url) {
     formData.set("image", imageUpload.url);
   }
   const result = await updateProfile(formData);
   if (result.success) {
     setShowEditDialog(false);
     toast.success("Profile updated successfully");
   }
 };


 // Follow or unfollow the user
 const handleFollow = async () => {
   if (!currentUser) return;
   try {
     setIsUpdatingFollow(true);
     await toggleFollow(user.id);
     setIsFollowing(!isFollowing);
   } catch (error) {
     toast.error("Failed to update follow status");
   } finally {
     setIsUpdatingFollow(false);
   }
 };


 // Start a direct message conversation with the user
 const handleMessage = async () => {
   if (!currentUser) return;
   const conversation = await getOrCreateConversation(user.id);
   router.push(`/messages/${conversation.id}`);
 };


 // Determine if the current user is viewing their own profile
 const isOwnProfile =
   currentUser?.username === user.username ||
   currentUser?.emailAddresses[0].emailAddress.split("@")[0] === user.username;


 // Format the user's join date
 const formattedDate = format(new Date(user.createdAt), "MMMM yyyy");


 // Handlers for pet story modal navigation
 const openPetStory = (pet: any) => {
   setActivePet(pet);
   setPetPostIndex(0);
   setStoryOpen(true);
 };
 const closePetStory = () => {
   setStoryOpen(false);
   setActivePet(null);
   setPetPostIndex(0);
   setIsTimelineMode(false);
   if (timelineInterval) {
     clearInterval(timelineInterval);
     setTimelineInterval(null);
   }
 };
 const nextPetPost = () => {
   if (activePetPosts && petPostIndex < activePetPosts.length - 1) {
     setPetPostIndex((idx) => idx + 1);
   }
 };
 const prevPetPost = () => {
   if (petPostIndex > 0) {
     setPetPostIndex((idx) => idx - 1);
   }
 };


 // Ref for scrolling the timeline modal to the top
 const timelineRef = useRef<HTMLDivElement>(null);
 useEffect(() => {
   if (timelineOpen && activePetPosts.length > 0) {
     // Scroll to the top (most recent post)
     timelineRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
   }
 }, [timelineOpen, activePetPosts.length]);


 // State for post editing
 const [editModalOpen, setEditModalOpen] = useState(false);
 const [editPost, setEditPost] = useState<Post | null>(null);
 const [editImage, setEditImage] = useState<{ url: string; type: string } | null>(null);
 const [editContent, setEditContent] = useState("");
 const [isEditing, setIsEditing] = useState(false);
 const [activePhotoId, setActivePhotoId] = useState<string | null>(null);

 // Pet colors for merged timeline - specific colors for each pet
 const petColors = {
   ...currentPets.reduce((acc, pet) => {
     // Map specific pet names to their colors
     const petName = pet.name?.toLowerCase();
     let color;
     
     if (petName === 'buddy') {
       color = 'from-pink-400 via-rose-400 to-pink-600'; // Buddy pink
     } else if (petName === 'rocco') {
       color = 'from-orange-400 via-yellow-400 to-orange-600'; // Rocco gold
     } else if (petName === 'chip') {
       color = 'from-green-400 via-emerald-400 to-green-600'; // Chip green
     } else if (petName === 'buck') {
       color = 'from-blue-400 via-indigo-400 to-blue-600'; // Buck blue
     } else {
       // Fallback colors for other pets
       const fallbackColors = [
       'from-purple-400 via-violet-400 to-purple-600',
         'from-red-400 via-pink-400 to-red-600',
         'from-teal-400 via-cyan-400 to-teal-600',
         'from-amber-400 via-orange-400 to-amber-600'
     ];
       color = fallbackColors[pet.id.length % fallbackColors.length];
     }
     
     acc[pet.id] = color;
     return acc;
   }, {} as { [key: string]: string })
 };

 // Get all timeline posts from all pets
 const allTimelinePosts = posts
   .filter(post => post.petId && (!post.mediaType || post.mediaType.startsWith('image')))
   .map(post => {
     const pet = currentPets.find(p => p.id === post.petId);
     return {
       id: post.id,
       image: post.image,
       content: post.content,
       createdAt: post.createdAt,
       petId: post.petId,
       pet: pet ? {
         id: pet.id,
         name: pet.name,
         imageUrl: pet.imageUrl,
         streak: pet.streak
       } : undefined
     };
   })
   .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());


 // --- Handler to open edit modal ---
 const openEditModal = (post: Post) => {
   setEditPost(post);
   setEditImage(post.image ? { url: post.image, type: "image" } : null);
   setEditContent(post.content || "");
   setEditModalOpen(true);
 };


 // --- Handler to submit edit ---
 const handleEditPostSubmit = async () => {
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

 const [followersOpen, setFollowersOpen] = useState(false);
 const [followingOpen, setFollowingOpen] = useState(false);
 const [followers, setFollowers] = useState<any[]>([]);
 const [following, setFollowing] = useState<any[]>([]);
 const [followersLoading, setFollowersLoading] = useState(false);
 const [followingLoading, setFollowingLoading] = useState(false);

 const fetchFollowers = async () => {
   setFollowersLoading(true);
   try {
     const res = await fetch(`/api/users/${username}/followers`);
     const data = await res.json();
     setFollowers(data || []);
   } catch {
     setFollowers([]);
   } finally {
     setFollowersLoading(false);
   }
 };
 const fetchFollowing = async () => {
   setFollowingLoading(true);
   try {
     const res = await fetch(`/api/users/${username}/following`);
     const data = await res.json();
     setFollowing(data || []);
   } catch {
     setFollowing([]);
   } finally {
     setFollowingLoading(false);
   }
 };

 const verifiedUsers = ["bb7906", "mitchng77", "luisa.marfori"];
 const isVerified = verifiedUsers.includes(user.username);

 // --- Create Pet Button Logic ---
 const hasPets = currentPets && currentPets.length > 0;

 // Main return: renders the profile page layout
 return (
   <div className="w-full h-screen bg-background flex items-center justify-center relative overflow-hidden" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
     <div className="max-w-3xl mx-auto w-full h-full overflow-y-auto pt-20 scrollbar-hide">
       {/* Create Pet Button */}
       {isOwnProfile && (
         <div className="w-full flex justify-center items-center my-8">
           {!hasPets ? (
             <Button
               onClick={() => setShowEditFamilyDialog(true)}
               className="px-10 py-6 text-2xl font-bold bg-gradient-to-r from-pink-500 via-yellow-400 to-orange-400 text-white shadow-xl rounded-full"
               style={{
                 boxShadow: '0 0 32px 8px #fbbf24, 0 0 64px 16px #f472b6, 0 0 0 12px rgba(251,191,36,0.15)',
                 transition: 'box-shadow 0.6s cubic-bezier(0.4,0,0.2,1)',
               }}
               onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 48px 16px #fbbf24, 0 0 96px 32px #f472b6, 0 0 0 20px rgba(251,191,36,0.18)'}
               onMouseLeave={e => e.currentTarget.style.boxShadow = '0 0 32px 8px #fbbf24, 0 0 64px 16px #f472b6, 0 0 0 12px rgba(251,191,36,0.15)'}
             >
               <span className="drop-shadow-lg">+ Create Your First Pet</span>
             </Button>
           ) : (
             <div className="fixed top-28 right-8 z-30">
               <Button
                 onClick={() => setShowEditFamilyDialog(true)}
                 className="px-4 py-2 text-base font-semibold bg-gradient-to-r from-pink-400 via-yellow-300 to-orange-300 text-white shadow-md rounded-full hover:scale-105 transition-all duration-300 opacity-90"
               >
                 + Add Pet
               </Button>
             </div>
           )}
         </div>
       )}
       {/* Main grid layout for sidebar and content */}
       <div className="grid grid-cols-1 gap-6 p-6">
       {/* Merged Family Timeline */}
       {currentPets.length > 0 && allTimelinePosts.length > 0 && (
         <div className="w-full">
           <HorizontalTimeline
             posts={allTimelinePosts}
             isOwnPet={isOwnProfile}
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
             onDeletePost={async (postId) => {
               const res = await deletePost(postId);
               if (res.success) {
                 window.location.reload();
               } else {
                 toast.error(res.error || "Failed to delete post");
               }
             }}
             variant="merged"
             petColors={petColors}
             showPetInfo={true}
             showStreak={false}
             showUploadButton={false}
             expandable={true}
             defaultExpanded={false}
             className="bg-gradient-to-r from-orange-50 via-yellow-50 to-orange-50 rounded-2xl p-6 shadow-lg border border-orange-100"
           />
         </div>
       )}

       {/* Sidebar card with avatar, stats, and actions */}
       {/* Make the profile card wider and re-add the pet story pfps bar below */}
       {/* Profile card: even wider, main pfp larger and centered, story circles at the bottom, actions to the right */}
       <div className="w-full max-w-4xl mx-auto px-4">
         {/* Profile Header */}
         <div className="flex flex-row sm:flex-row items-start gap-6 sm:gap-8 py-8 sm:py-10 px-2 sm:px-0">
           {/* Avatar */}
           <div className="flex-shrink-0 flex flex-col items-center w-auto">
               <div className="cursor-pointer" onClick={() => setFamilyTimelineOpen(true)}>
               <SecureAvatar 
                   src={user.image}
                   alt={user.name || "User"}
                   className="w-28 h-28 sm:w-36 sm:h-36 ring-2 ring-primary"
                   showFirst1000Badge={user?.isFirst1000}
                 />
               </div>
                 </div>
           {/* Main Info */}
           <div className="flex-1 flex flex-col gap-4 min-w-0 w-full">
             {/* Username row */}
             <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
               <div className="flex flex-col">
                 <div className="flex items-center gap-2 text-xl sm:text-2xl font-bold truncate">
                   {user.name ?? user.username}
                   {isUserVerified(user.username) && <BlueCheckIcon className="inline-block w-6 h-6 ml-1" />}
                   {isUserVerifiedShelter(user.username) && <RedCheckIcon className="inline-block w-6 h-6 ml-1" />}
                   {isFoundingPack && (
                     <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-yellow-200 via-yellow-50 to-yellow-200 border border-yellow-300 shadow-sm ml-1 text-xs font-semibold text-yellow-900" title="Founding Pack">
                       <Image src="/otis.png" alt="Founding Pack" width={18} height={18} className="rounded-full border border-yellow-300" />
                       Founding Pack
                     </span>
                   )}
                 </div>
                 {/* Verified Shelter label below name, only for shelter users */}
                 {isUserVerifiedShelter(user.username) && (
                   <div className="flex items-center gap-1 text-red-600 font-medium mt-1">
                     <span className="text-sm">Verified Shelter</span>
                   </div>
                 )}
                 <span className="text-lg sm:text-lg text-muted-foreground truncate">@{user.username}</span>
               </div>
               <div className="flex gap-2 sm:ml-auto mt-2 sm:mt-0">
                 {!currentUser ? (
                   <SignInButton mode="modal">
                     <Button size="sm">Follow</Button>
                   </SignInButton>
                 ) : isOwnProfile ? (
                   <Button size="sm" onClick={() => setShowEditDialog(true)}>
                     <EditIcon className="size-4 mr-1" />Edit Profile
                   </Button>
                 ) : (
                   <>
                       <Button
                         size="sm"
                       onClick={handleFollow}
                       disabled={isUpdatingFollow}
                       variant={isFollowing ? "outline" : "default"}
                       >
                       {isFollowing ? "Unfollow" : "Follow"}
                       </Button>
                     <Button size="sm" variant="secondary" onClick={handleMessage}>
                       Message
                     </Button>
                   </>
                     )}
                   </div>
             </div>
             {/* Stats row */}
             <div className="flex gap-10 sm:gap-12 mt-2">
               <div className="flex flex-col items-center">
                 <span className="font-bold text-lg sm:text-lg">{user._count.posts}</span>
                 <span className="text-sm text-muted-foreground">Posts</span>
               </div>
               <div 
                 className="flex flex-col items-center cursor-pointer hover:text-primary transition-colors"
                 onClick={() => {
                   setFollowersOpen(true);
                   fetchFollowers();
                 }}
               >
                 <span className="font-bold text-lg sm:text-lg">{user._count.followers}</span>
                 <span className="text-sm text-muted-foreground">Followers</span>
               </div>
               <div 
                 className="flex flex-col items-center cursor-pointer hover:text-primary transition-colors"
                 onClick={() => {
                   setFollowingOpen(true);
                   fetchFollowing();
                 }}
               >
                 <span className="font-bold text-lg sm:text-lg">{user._count.following}</span>
                 <span className="text-sm text-muted-foreground">Following</span>
               </div>
             </div>
             {/* Bio section */}
             <div className="mt-2">
               {user.bio && <div className="text-base sm:text-base text-foreground mt-1 whitespace-pre-line">{user.bio}</div>}
               <div className="flex flex-wrap gap-6 mt-2 text-sm text-muted-foreground">
                 {user.location && (
                   <span className="flex items-center"><MapPinIcon className="size-4 mr-1" />{user.location}</span>
                 )}
                 {user.website && (
                   <span className="flex items-center"><LinkIcon className="size-4 mr-1" /><a href={user.website.startsWith("http") ? user.website : `https://${user.website}`} className="hover:underline" target="_blank" rel="noopener noreferrer">{user.website}</a></span>
                 )}
                 <span className="flex items-center"><CalendarIcon className="size-4 mr-1" />Joined {formattedDate}</span>
               </div>
             </div>
           </div>
         </div>
         {/* Story Circles */}
         {currentPets && currentPets.length > 0 && (
            <div className="flex gap-4 sm:gap-6 justify-start py-4 overflow-x-auto">
                     {currentPets.map((pet) => {
                       // Check if this pet has posted today
                       const petPosts = posts.filter((post) => post.petId === pet.id && (!post.mediaType || post.mediaType.startsWith('image')));
                       const today = new Date(); today.setHours(0,0,0,0);
                       const hasPostedToday = petPosts.some(post => {
                         const postDate = new Date(post.createdAt); postDate.setHours(0,0,0,0);
                         return postDate.getTime() === today.getTime();
                       });
                       return (
                           <Link
                           key={pet.id}
                             href={`/pet/${pet.id}`}
                           className="flex flex-col items-center cursor-pointer group"
                             prefetch={false}
                         >
                           <div className={
                             !hasPostedToday
                       ? "p-1 sm:p-1.5 rounded-full bg-gradient-to-tr from-orange-400 via-yellow-400 to-orange-600 shadow-lg animate-pulse"
                               : ""
                           }>
                                             <SecureAvatar 
                                src={getPetAvatarImage(pet, useEvolutionImages)}
                                alt={pet.name}
                                className="w-16 h-16 sm:w-20 sm:h-20 border-2 border-primary group-hover:scale-105 transition"
                              />
                           </div>
                    <div className="font-medium text-xs sm:text-sm mt-2 text-center w-16 sm:w-20 truncate">{pet.name}</div>
                           </Link>
                       );
                     })}
                 </div>
               )}
         {/* Post Grid */}
         <div className="mt-8">
       <Tabs defaultValue="posts" className="w-full">
         <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
           <TabsTrigger
             value="posts"
                 className="flex items-center gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 font-semibold"
           >
             <FileTextIcon className="size-4" />
             Posts
           </TabsTrigger>
           <TabsTrigger
             value="likes"
                 className="flex items-center gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 font-semibold"
           >
             <HeartIcon className="size-4" />
             Likes
           </TabsTrigger>
         </TabsList>
         {/* User's posts grid */}
         <TabsContent value="posts" className="mt-6">
  {posts.filter(post => !(post.petId && (!post.mediaType || post.mediaType.startsWith('image')))).length > 0 ? (
    <div className="grid grid-cols-3 gap-1">
      {posts.filter(post => !(post.petId && (!post.mediaType || post.mediaType.startsWith('image')))).map((post, idx) => (
        <div
          key={post.id}
          className="relative aspect-square bg-black group cursor-pointer overflow-hidden"
          onClick={() => {
            setActivePost(post);
            setModalOpen(true);
          }}
          onMouseEnter={() => handleMouseEnter(idx)}
          onMouseLeave={() => handleMouseLeave(idx)}
        >
          {post.mediaType?.startsWith('video') ? (
            <SecureVideo
              ref={el => { videoRefs.current[idx] = el; }}
              src={post.image}
              muted
              loop
              playsInline
              preload="metadata"
              className="w-full h-full object-cover"
              controls={false}
            />
          ) : (
            <SecureImage
              src={post.image}
              alt={post.title || 'Post'}
              className="w-full h-full object-cover"
            />
          )}
          {/* Edit/Delete icons for own posts */}
          {isOwnProfile && (
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
                  onDelete={async () => { 
                    const res = await deletePost(post.id);
                    if (res.success) {
                      window.location.reload();
                    } else {
                      toast.error(res.error || "Failed to delete post");
                    }
                  }}
                  title="Delete Post"
                  description="This action cannot be undone."
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  ) : (
    <div className="text-center py-8 text-muted-foreground">No posts yet</div>
  )}
</TabsContent>
         {/* User's liked posts grid */}
         <TabsContent value="likes" className="mt-6">
             {likedPosts.filter(post => !(post.petId && (!post.mediaType || post.mediaType.startsWith('image')))).length > 0 ? (
                 <div className="grid grid-cols-3 gap-1">
                   {likedPosts.filter(post => !(post.petId && (!post.mediaType || post.mediaType.startsWith('image')))).map((post, idx) => (
                     <div
                       key={post.id}
                       className="relative aspect-square bg-black group cursor-pointer overflow-hidden"
                       onClick={() => {
                         setActivePost(post);
                         setModalOpen(true);
                       }}
                       onMouseEnter={() => handleMouseEnter(idx)}
                       onMouseLeave={() => handleMouseLeave(idx)}
                     >
                       {post.mediaType?.startsWith('video') ? (
                         <video
                           ref={el => { videoRefs.current[idx] = el; }}
                           src={post.image || undefined}
                           muted
                           loop
                           playsInline
                           preload="metadata"
                           className="w-full h-full object-cover"
                           controls={false}
                         />
                       ) : (
                         <SecureImage
                           src={post.image}
                           alt={post.title || 'Post'}
                           className="w-full h-full object-cover"
                         />
                       )}
                     </div>
                   ))}
                 </div>
             ) : (
               <div className="text-center py-8 text-muted-foreground">No liked posts to show</div>
             )}
         </TabsContent>
       </Tabs>
         </div>
       </div>


       {/* Edit profile modal */}
       <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
         <DialogContent className="sm:max-w-[500px]">
           <DialogHeader>
             <DialogTitle>Edit Profile</DialogTitle>
           </DialogHeader>
           <div className="space-y-4 py-4">
             <div className="space-y-2">
               <Label>Profile Picture</Label>
               <S3ImageUpload
                 folder="users"
                 value={imageUpload}
                 onChange={(img) => {
                   setImageUpload(img);
                   setEditForm((prev) => ({ ...prev, image: img?.url || "" }));
                 }}
               />
             </div>
             <div className="space-y-2">
               <Label>Name</Label>
               <Input
                 name="name"
                 value={editForm.name}
                 onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                 placeholder="Your name"
               />
             </div>
             <div className="space-y-2">
               <Label>Bio</Label>
               <Textarea
                 name="bio"
                 value={editForm.bio}
                 onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                 className="min-h-[100px]"
                 placeholder="Tell us about yourself"
               />
             </div>
             <div className="space-y-2">
               <Label>Location</Label>
               <Input
                 name="location"
                 value={editForm.location}
                 onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                 placeholder="Where are you based?"
               />
             </div>
             <div className="space-y-2">
               <Label>Website</Label>
               <Input
                 name="website"
                 value={editForm.website}
                 onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                 placeholder="Your personal website"
               />
             </div>
           </div>
           <div className="flex justify-end gap-3">
             <DialogClose asChild>
               <Button variant="outline">Cancel</Button>
             </DialogClose>
             <Button onClick={handleEditSubmit}>Save Changes</Button>
           </div>
         </DialogContent>
       </Dialog>


       {/* PET STORY MODAL: Shows a pet's photo story */}
       <Dialog open={storyOpen} onOpenChange={closePetStory}>
         <DialogContent className="max-w-md p-0 overflow-hidden flex items-center justify-center min-h-[70vh]">
           {activePet && (
             <div className="relative bg-background rounded-lg shadow-lg w-full flex flex-col items-center justify-center min-h-[60vh]">
               <div className="flex flex-col items-center p-6 w-full">
                 <div
                   className="cursor-pointer transform hover:scale-105 transition-transform"
                   onClick={openTimeline}
                 >
                   <SecureAvatar 
                     src={getPetAvatarImage(activePet, useEvolutionImages)}
                     alt={activePet.name}
                     className="w-20 h-20 mb-2"
                   />
                 </div>
                 <div className="font-bold text-lg">{activePet.name}</div>
                 <div className="text-sm text-muted-foreground mb-1">{activePet.breed} • {activePet.age}</div>
                 <div className="text-xs text-muted-foreground text-center mb-4">{activePet.bio}</div>


                 {/* Post navigation for pet story */}
                 {activePetPosts.length > 0 ? (
                   <div className="relative w-full flex items-center justify-center min-h-[300px]">
                     <button
                       onClick={prevPetPost}
                       disabled={petPostIndex === 0}
                       className="absolute left-0 top-1/2 -translate-y-1/2 p-2 disabled:opacity-30 z-10"
                       aria-label="Previous post"
                     >
                       <ChevronLeftIcon className="w-6 h-6" />
                     </button>
                     <div className="mx-10 w-full flex items-center justify-center">
                       <div className="max-w-full flex items-center justify-center">
                         <PostCard post={currentPetPost} dbUserId={user.id} />
                       </div>
                     </div>
                     <button
                       onClick={nextPetPost}
                       disabled={petPostIndex === activePetPosts.length - 1}
                       className="absolute right-0 top-1/2 -translate-y-1/2 p-2 disabled:opacity-30 z-10"
                       aria-label="Next post"
                     >
                       <ChevronRightIcon className="w-6 h-6" />
                     </button>
                   </div>
                 ) : (
                   <div className="text-center text-muted-foreground py-8">No posts for this pet yet.</div>
                 )}
               </div>
             </div>
           )}
         </DialogContent>
       </Dialog>


       {/* TIMELINE MODAL: Shows a pet's timeline of daily photos */}
       <Dialog open={timelineOpen} onOpenChange={closeTimeline}>
         <DialogContent className="max-w-4xl p-0 overflow-hidden flex items-center justify-center min-h-[80vh] bg-gradient-to-br from-orange-100 via-yellow-50 to-orange-200">
           {activePet && (
             <div className="relative rounded-lg shadow-lg w-full flex flex-col items-center justify-center min-h-[70vh]">
               <div className="flex flex-col items-center p-6 w-full">
                 <div className="flex items-center justify-between w-full mb-6">
                   <div className="flex items-center space-x-4">
                     <SecureAvatar 
                       src={getPetAvatarImage(activePet, useEvolutionImages)}
                       alt={activePet.name}
                       className="w-16 h-16"
                     />
                     <div>
                       <div className="font-bold text-xl">{activePet.name}'s Timeline</div>
                       <div className="text-sm text-muted-foreground">{activePetPosts.length} photos</div>
                     </div>
                   </div>
                   {/* Flaming streak icon and count */}
                   <div className="flex items-center gap-2 bg-gradient-to-tr from-orange-400 via-yellow-400 to-orange-600 px-4 py-2 rounded-full shadow-lg">
                     <FlameIcon className="w-6 h-6 text-orange-700 animate-pulse" />
                     <span className="font-bold text-lg text-orange-900">{activePet.streak ?? 0}</span>
                   </div>
                   {/* Only show upload button if user owns this pet */}
                   {isOwnProfile && (
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
                   )}
                 </div>
                 {/* Timeline progress bar */}
                 {isTimelineMode && (
                   <div className="w-full h-1 bg-gray-200 rounded-full mb-4">
                     <div
                       className="h-full bg-primary rounded-full transition-all duration-1000"
                       style={{ width: `${((petPostIndex + 1) / activePetPosts.length) * 100}%` }}
                     />
                   </div>
                 )}
                 {/* Timeline instructions */}
                 {!isTimelineMode && activePetPosts.length > 0 && (
                   <div className="text-sm text-muted-foreground mb-4">
                     Press space or double tap to view timeline
                   </div>
                 )}
                 {/* Alternating vertical timeline (tree style) */}
                 <div className="w-full max-h-[60vh] overflow-y-auto overflow-x-hidden" ref={timelineRef}>
                   {activePetPosts.length > 0 ? (
                     <div className="relative w-full">
                       {/* Central timeline line */}
                       <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-400 to-orange-200 -translate-x-1/2"></div>
                       {activePetPosts.map((post, index) => {
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
                                 className="relative aspect-square w-48 rounded-lg overflow-hidden shadow-lg border-2 transition-all duration-300 cursor-pointer group ${
                                   isToday 
                                     ? 'border-orange-400 shadow-orange-200' 
                                     : 'border-gray-200 hover:border-orange-300'
                                 } bg-white"
                               >
                                 <SecureImage src={post.image || '/avatar.png'} alt={activePet.name + ' photo'} className="w-full h-full object-cover" />
                                 
                                 {/* Golden overlay for today's post */}
                                 {isToday && (
                                   <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-yellow-400/20 pointer-events-none" />
                                 )}
                                 
                                 {/* Edit/Delete buttons for owner, show on hover */}
                                 {isOwnProfile && (
                                   <div className="absolute top-2 right-2 flex gap-1 z-20 opacity-0 group-hover:opacity-100 transition">
                                     <Button
                                       variant="ghost"
                                       size="sm"
                                       className="h-7 w-7 p-0 bg-white/90 backdrop-blur-sm hover:bg-white"
                                       onClick={e => { 
                                         e.stopPropagation(); 
                                         const originalPost = posts.find(p => p.id === post.id);
                                         if (originalPost) {
                                           openEditModal(originalPost);
                                         }
                                       }}
                                       title="Edit Photo"
                                     >
                                       <PencilIcon className="w-3 h-3 text-gray-700" />
                                     </Button>
                                     <DeleteAlertDialog
                                       isDeleting={isEditing && editPost?.id === post.id}
                                       onDelete={async () => { 
                                         const res = await deletePost(post.id);
                                         if (res.success) {
                                           window.location.reload();
                                         } else {
                                           toast.error(res.error || "Failed to delete post");
                                         }
                                       }}
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
           )}
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
                 <div className="flex justify-between">
                   <Button
                     variant="destructive"
                     onClick={handleRemoveDailyPost}
                     disabled={isUploading}
                   >
                     Remove Daily Post
                   </Button>
                   <Button
                     variant="outline"
                     onClick={() => setShowUploadOptions(false)}
                   >
                     Cancel
                   </Button>
                 </div>
               </div>
             ) : (
               <>
                 {/* Image Upload Component */}
                 <div className="space-y-4">
                   <div className="text-sm text-muted-foreground">
                     Upload media for {activePet?.name}'s timeline
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


       {/* EXISTING POSTS MODAL: Select an existing post as daily photo */}
       <Dialog open={showExistingPosts} onOpenChange={setShowExistingPosts}>
         <DialogContent className="sm:max-w-[600px]">
           <DialogHeader>
             <DialogTitle>Select Existing Post</DialogTitle>
           </DialogHeader>
           <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
             {activePetPosts.map((post) => (
               <div
                 key={post.id}
                 className="relative aspect-square rounded-lg overflow-hidden cursor-pointer transform hover:scale-105 transition-transform"
                 onClick={() => handleSelectExistingPost(post)}
               >
                 <SecureImage
                   src={post.image}
                   alt={`${activePet.name}'s photo`}
                   className="w-full h-full object-cover"
                 />
                 <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                   <div className="text-xs text-white">
                     {format(new Date(post.createdAt), 'MMM d, yyyy')}
                   </div>
                 </div>
               </div>
             ))}
           </div>
         </DialogContent>
       </Dialog>


       {/* Edit Family Modal: For editing user's pets */}
       <EditFamilyModal
         open={showEditFamilyDialog}
         onOpenChange={setShowEditFamilyDialog}
         pets={currentPets}
         onPetsChange={setCurrentPets}
       />


       {/* --- Edit Post Modal --- */}
       <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
         <DialogContent className="sm:max-w-[500px]">
           <DialogHeader>
             <DialogTitle>Edit Post</DialogTitle>
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
             <Button onClick={handleEditPostSubmit} disabled={isEditing}>
               {isEditing ? "Saving..." : "Save Changes"}
             </Button>
           </div>
         </DialogContent>
       </Dialog>

       {/* Followers Modal */}
       <Dialog open={followersOpen} onOpenChange={setFollowersOpen}>
         <DialogContent className="max-w-md w-full">
           <DialogHeader>
             <DialogTitle>Followers</DialogTitle>
           </DialogHeader>
           {followersLoading ? (
             <div className="py-8 text-center">Loading...</div>
           ) : followers.length === 0 ? (
             <div className="py-8 text-center text-muted-foreground">No followers yet.</div>
           ) : (
             <ul className="divide-y">
               {followers.map(f => (
                 <li key={f.id} className="flex items-center gap-3 py-3">
                   <Link href={`/profile/${f.username}`} className="flex items-center gap-3">
                     <SecureAvatar src={f.image} alt={f.name || "User"} className="w-8 h-8" showFirst1000Badge={f?.isFirst1000} />
                     <div>
                       <div className="flex items-center gap-1">
                         <div className="font-medium hover:underline">{f.name || f.username}</div>
                         {isUserVerified(f.username) && (
                           <BlueCheckIcon className="inline-block w-3 h-3 align-text-bottom" />
                         )}
                         {isUserVerifiedShelter(f.username) && (
                           <RedCheckIcon className="inline-block w-3 h-3 align-text-bottom" />
                         )}
                       </div>
                       <div className="text-xs text-muted-foreground">@{f.username}</div>
                     </div>
                   </Link>
                 </li>
               ))}
             </ul>
           )}
         </DialogContent>
       </Dialog>

       {/* Following Modal */}
       <Dialog open={followingOpen} onOpenChange={setFollowingOpen}>
         <DialogContent className="max-w-md w-full">
           <DialogHeader>
             <DialogTitle>Following</DialogTitle>
           </DialogHeader>
           {followingLoading ? (
             <div className="py-8 text-center">Loading...</div>
           ) : following.length === 0 ? (
             <div className="py-8 text-center text-muted-foreground">Not following anyone yet.</div>
           ) : (
             <ul className="divide-y">
               {following.map(f => (
                 <li key={f.id} className="flex items-center gap-3 py-3">
                   <Link href={`/profile/${f.username}`} className="flex items-center gap-3">
                     <SecureAvatar src={f.image} alt={f.name || "User"} className="w-8 h-8" showFirst1000Badge={f?.isFirst1000} />
                     <div>
                       <div className="flex items-center gap-1">
                         <div className="font-medium hover:underline">{f.name || f.username}</div>
                         {isUserVerified(f.username) && (
                           <BlueCheckIcon className="inline-block w-3 h-3 align-text-bottom" />
                         )}
                         {isUserVerifiedShelter(f.username) && (
                           <RedCheckIcon className="inline-block w-3 h-3 align-text-bottom" />
                         )}
                       </div>
                       <div className="text-xs text-muted-foreground">@{f.username}</div>
                     </div>
                   </Link>
                 </li>
               ))}
             </ul>
           )}
         </DialogContent>
       </Dialog>

       {/* FAMILY TIMELINE MODAL: Shows merged vertical timeline for all pets */}
       <Dialog open={familyTimelineOpen} onOpenChange={setFamilyTimelineOpen}>
         <DialogContent className="max-w-6xl p-0 overflow-hidden flex items-center justify-center min-h-[80vh] bg-gradient-to-br from-orange-100 via-yellow-50 to-orange-200">
           <div className="relative rounded-lg shadow-lg w-full flex flex-col items-center justify-center min-h-[70vh]">
             <div className="flex flex-col items-center p-6 w-full">
               <div className="font-bold text-xl mb-2">Family Timeline</div>
               <div className="text-sm text-muted-foreground mb-4">All pets' daily photos</div>
               {/* Tree-like branching timeline */}
               <div className="w-full max-h-[60vh] overflow-y-auto overflow-x-hidden">
                 {allTimelinePosts.length > 0 ? (
                   <div className="relative w-full">
                     {/* Central timeline line */}
                     <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-400 to-orange-200 -translate-x-1/2"></div>
                     {allTimelinePosts.map((post, index) => {
                       const postDate = new Date(post.createdAt);
                       const isToday = (() => {
                         const today = new Date();
                         today.setHours(0, 0, 0, 0);
                         const postDay = new Date(postDate);
                         postDay.setHours(0, 0, 0, 0);
                         return postDay.getTime() === today.getTime();
                       })();
                       const isLeft = index % 2 === 0;
                       const petColor = post.pet ? petColors[post.pet.id] : 'from-orange-400 via-yellow-400 to-orange-600';
                       
                       return (
                         <div key={post.id} className={`flex w-full mb-12 relative ${isLeft ? 'justify-start' : 'justify-end'}`}>
                           <div className={`flex flex-col items-center w-1/2 ${isLeft ? 'items-end pr-4' : 'items-start pl-4'}`}>
                             {/* Pet name above photo */}
                             {post.pet && (
                               <div className="mb-2">
                                 <div className={`px-2 py-1 rounded-full text-xs font-medium shadow-lg bg-gradient-to-r ${petColor} text-white`}>
                                   {post.pet.name}
                                 </div>
                               </div>
                             )}
                             
                             {/* Photo container */}
                             <div 
                               className="relative aspect-square w-48 rounded-lg overflow-hidden shadow-lg border-2 transition-all duration-300 cursor-pointer group-hover:scale-105 ${
                                 isToday 
                                   ? 'border-orange-400 shadow-orange-200' 
                                   : 'border-gray-200 hover:border-orange-300'
                               } bg-white"
                               onClick={() => {
                                 const originalPost = posts.find(p => p.id === post.id);
                                 if (originalPost) {
                                   setActivePost(originalPost);
                                   setModalOpen(true);
                                 }
                               }}
                             >
                               <SecureImage src={post.image || '/avatar.png'} alt={post.pet?.name || 'Pet'} className="w-full h-full object-cover" />
                               
                               {/* Golden overlay for today's post */}
                               {isToday && (
                                 <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-yellow-400/20 pointer-events-none" />
                               )}
                               
                               {/* Edit/Delete buttons for owner */}
                               {isOwnProfile && (
                                 <div className="absolute top-2 right-2 flex gap-1 z-20 opacity-0 group-hover:opacity-100 transition">
                                   <Button
                                     variant="ghost"
                                     size="sm"
                                     className="h-7 w-7 p-0 bg-white/90 backdrop-blur-sm hover:bg-white"
                                     onClick={e => { 
                                       e.stopPropagation(); 
                                       const originalPost = posts.find(p => p.id === post.id);
                                       if (originalPost) {
                                         openEditModal(originalPost);
                                       }
                                     }}
                                     title="Edit Photo"
                                   >
                                     <PencilIcon className="w-3 h-3 text-gray-700" />
                                   </Button>
                                   <DeleteAlertDialog
                                     isDeleting={isEditing && editPost?.id === post.id}
                                     onDelete={async () => { 
                                       const res = await deletePost(post.id);
                                       if (res.success) {
                                         window.location.reload();
                                       } else {
                                         toast.error(res.error || "Failed to delete post");
                                       }
                                     }}
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
                   <div className="text-center text-muted-foreground py-8">No timeline photos yet</div>
                 )}
               </div>
             </div>
           </div>
         </DialogContent>
       </Dialog>
       
       {/* Post Modal with like button and comment section */}
       <PostModal 
         open={modalOpen} 
         onOpenChange={setModalOpen} 
         post={activePost} 
         dbUserId={user.id} 
       />
       </div>
     </div>
   </div>
 );
}


// Export the main profile page client component
export default ProfilePageClient;

