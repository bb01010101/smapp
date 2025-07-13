"use client";

import { createComment, deletePost, getPosts, toggleLike } from "@/actions/post.action";
import { SignInButton, useUser } from "@clerk/nextjs";
import { useState, useRef } from "react";
import toast from "react-hot-toast";
import { Card, CardContent } from "./ui/card";
import Link from "next/link";
import { Avatar, AvatarImage } from "./ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { DeleteAlertDialog } from "./DeleteAlertDialog";
import { Button } from "./ui/button";
import { HeartIcon, LogInIcon, MessageCircleIcon, SendIcon } from "lucide-react";
import { Textarea } from "./ui/textarea";
import { isUserVerified, isUserVerifiedShelter } from "@/lib/utils";
import BlueCheckIcon from "@/components/BlueCheckIcon";
import RedCheckIcon from "@/components/RedCheckIcon";
import ProfileLink from "@/components/ProfileLink";


type Posts = Awaited<ReturnType<typeof getPosts>>
type Post = Posts[number]


function PostCard({post, dbUserId} : {post:Post; dbUserId:string | null}) {
  const { user } = useUser();
  const [newComment, setNewComment] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasLiked, setHasLiked] = useState(post.likes.some(like => like.userId === dbUserId));
  const [optimisticLikes, setOptimisticLikes] = useState(post._count.likes);
  const [showComments, setShowComments] = useState(false);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const lastTapRef = useRef<number>(0);

  const handleLike = async () => {
    if(isLiking) return;
    try {
      setIsLiking(true)
      setHasLiked(prev => !prev)
      setOptimisticLikes(prev => prev + (hasLiked ? -1 : 1))
      await toggleLike(post.id)
    } catch (error) {
      setOptimisticLikes(post._count.likes)
      setHasLiked(post.likes.some(like => like.userId === dbUserId))
    } finally {
      setIsLiking(false)
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || isCommenting) return;
    try {
      setIsCommenting(true);
      const result = await createComment(post.id, newComment);
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

  const handleDeletePost = async () => {
    if (isDeleting) return;
    try {
      setIsDeleting(true);
      const result = await deletePost(post.id);
      if (result.success) toast.success("Post deleted successfully");
      else throw new Error(result.error);
    } catch (error) {
      toast.error("Failed to delete post");
    } finally {
      setIsDeleting(false);
    }
  };

  // Double-tap/double-click handler
  const handleImageClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (!user) {
      // If not logged in, don't allow double-tap like
      return;
    }
    
    const now = Date.now();
    const lastTap = lastTapRef.current;
    if (now - lastTap < 300 && now - lastTap > 0) {
      // Double tap/click detected
      setShowHeartAnimation(true);
      handleLike();
      setTimeout(() => setShowHeartAnimation(false), 800);
    }
    lastTapRef.current = now;
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 sm:p-5">
        {/* Header: Avatar, Name, Username, Timestamp, Delete */}
        <div className="flex items-center w-full mb-2">
          <ProfileLink href={post.pet ? `/pet/${post.pet.id}` : `/profile/${post.author.username}`}
            className="flex-shrink-0">
            <Avatar className="w-11 h-11 border-2 border-gold-200">
              <AvatarImage src={post.pet ? post.pet.imageUrl ?? "/avatar.png" : post.author.image ?? "/avatar.png"} />
                  </Avatar>
          </ProfileLink>
          <div className="flex flex-col justify-center ml-3 min-w-0 flex-1">
            <div className="flex items-center gap-1 min-w-0">
              <ProfileLink href={post.pet ? `/pet/${post.pet.id}` : `/profile/${post.author.username}`}
                className="font-semibold truncate hover:underline flex items-center gap-1 text-base">
                {post.pet ? post.pet.name : post.author.name}
                {post.pet ? null : (
                  <>
                    {isUserVerified(post.author.username) && (
                      <BlueCheckIcon className="inline-block w-4 h-4 ml-1 align-text-bottom" />
                    )}
                    {isUserVerifiedShelter(post.author.username) && (
                      <RedCheckIcon className="inline-block w-4 h-4 ml-1 align-text-bottom" />
                    )}
                  </>
                )}
                {post.pet && isUserVerifiedShelter(post.author.username) && (
                  <RedCheckIcon className="inline-block w-4 h-4 ml-1 align-text-bottom" />
                )}
              </ProfileLink>
              <span className="text-muted-foreground text-xs truncate ml-1">
                {post.pet ? post.pet.species : `@${post.author.username}`}
              </span>
              <span className="text-muted-foreground text-xs mx-1">•</span>
              <span className="text-muted-foreground text-xs truncate" suppressHydrationWarning>{formatDistanceToNow(new Date(post.createdAt))} ago</span>
                      </div>
                    </div>
                    {dbUserId === post.author.id && (
            <div className="ml-2">
                      <DeleteAlertDialog isDeleting={isDeleting} onDelete={handleDeletePost} />
                    </div>
                    )}
                  </div>

        {/* Post Content */}
        {post.content && (
          <div className="mb-2 text-sm text-foreground break-words whitespace-pre-line">
            {post.content}
          </div>
        )}

        {/* Post Image/Video */}
          {post.image && (
            user ? (
              <div className="relative w-full rounded-lg overflow-hidden mb-2" onClick={handleImageClick} onTouchEnd={handleImageClick} style={{ cursor: "pointer" }}>
                {showHeartAnimation && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                    <HeartIcon className="w-32 h-32 text-red-500 fill-current heart-burst-animation" />
                  </div>
                )}
                {post.mediaType?.startsWith("video") ? (
                  <VideoWithToggleControls src={post.image} />
                ) : (
                <img src={post.image} alt="Post content" className="w-full h-auto object-contain bg-black/5 rounded" style={{ maxHeight: 500 }} />
                )}
              </div>
            ) : (
              <SignInButton mode="modal">
                <div className="relative w-full rounded-lg overflow-hidden mb-2" style={{ cursor: "pointer" }}>
                  {post.mediaType?.startsWith("video") ? (
                    <VideoWithToggleControls src={post.image} />
                  ) : (
                  <img src={post.image} alt="Post content" className="w-full h-auto object-contain bg-black/5 rounded" style={{ maxHeight: 500 }} />
                  )}
                </div>
              </SignInButton>
            )
          )}

        {/* Like & Comment Buttons */}
        <div className="flex items-center pt-1 space-x-4">
            {user ? (
              <Button
                variant={hasLiked ? "gold" : "outline"}
                size="sm"
                className={`gap-2 ${hasLiked ? "hover:bg-gold-600" : "hover:bg-gold-100"}`}
                onClick={handleLike}
              >
                {hasLiked ? (
                  <HeartIcon className="size-5 fill-current text-red-500" />
                ) : (
                  <HeartIcon className="size-5 text-red-500" />
                )}
                <span>{optimisticLikes}</span>
              </Button>
            ) : (
              <SignInButton mode="modal">
              <Button variant="outline" size="sm" className="gap-2">
                  <HeartIcon className="size-5 text-red-500" />
                  <span>{optimisticLikes}</span>
                </Button>
              </SignInButton>
            )}
            {user ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 hover:bg-gold-100 hover:text-gold-700"
                onClick={() => setShowComments((prev) => !prev)}
              >
                <MessageCircleIcon
                  className={`size-5 ${showComments ? "fill-gold-500 text-gold-500" : ""}`}
                />
                <span>{post.comments.length}</span>
              </Button>
            ) : (
              <SignInButton mode="modal">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 hover:bg-gold-100 hover:text-gold-700"
                >
                  <MessageCircleIcon className="size-5" />
                  <span>{post.comments.length}</span>
                </Button>
              </SignInButton>
            )}
          </div>
          
        {/* Comments Section */}
          {showComments && (
          <div className="space-y-4 pt-4 border-t mt-2">
              <div className="space-y-4">
                {post.comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-3">
                    <Avatar className="size-8 flex-shrink-0">
                      <AvatarImage src={comment.author.image ?? "/avatar.png"} />
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-medium text-sm">
                        {comment.author.name}
                        {isUserVerified(comment.author.username) && (
                          <BlueCheckIcon className="inline-block w-3 h-3 ml-1 align-text-bottom" />
                        )}
                        {isUserVerifiedShelter(comment.author.username) && (
                          <RedCheckIcon className="inline-block w-3 h-3 ml-1 align-text-bottom" />
                        )}
                      </span>
                        <span className="text-sm text-muted-foreground">
                          @{comment.author.username}
                        </span>
                        <span className="text-sm text-muted-foreground">·</span>
                        <span className="text-sm text-muted-foreground">
                          <span suppressHydrationWarning>{formatDistanceToNow(new Date(comment.createdAt))} ago</span>
                        </span>
                      </div>
                      <p className="text-sm break-words">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {user ? (
                <div className="flex space-x-3">
                  <Avatar className="size-8 flex-shrink-0">
                    <AvatarImage src={user?.imageUrl || "/avatar.png"} />
                  </Avatar>
                  <div className="flex-1">
                    <Textarea
                      placeholder="Write a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-[80px] resize-none"
                    />
                    <div className="flex justify-end mt-2">
                      <Button
                        size="sm"
                        onClick={handleAddComment}
                        className="flex items-center gap-2"
                        disabled={!newComment.trim() || isCommenting}
                      >
                        {isCommenting ? (
                          "Posting..."
                        ) : (
                          <>
                            <SendIcon className="size-4" />
                            Comment
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center p-4 border rounded-lg bg-muted/50">
                  <SignInButton mode="modal">
                    <Button variant="outline" className="gap-2">
                      <LogInIcon className="size-4" />
                      Sign in to comment
                    </Button>
                  </SignInButton>
                </div>
              )}
            </div>
          )} 
      </CardContent>
    </Card>
  );
}

function VideoWithToggleControls({ src }: { src: string }) {
  const [showControls, setShowControls] = useState(false);
  return (
    <div className="relative w-full h-auto" onClick={() => setShowControls((v) => !v)} style={{ cursor: "pointer" }}>
      <video
        src={src}
        controls={showControls}
        autoPlay
        muted
        loop
        playsInline
        className="w-full h-auto bg-black"
        style={{ objectFit: "cover" }}
      />
    </div>
  );
}

export default PostCard;
