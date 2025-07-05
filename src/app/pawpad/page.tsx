"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { PawPrintIcon, HeartIcon, MessageCircleIcon } from "lucide-react";
import { getExplorePosts, getPosts, toggleLike } from "@/actions/post.action";
import { getDbUserId } from "@/actions/user.action";
import { useUser } from "@clerk/nextjs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { Sheet, SheetContent } from "@/components/ui/sheet";

type PostType = "REGULAR" | "PRODUCT" | "SERVICE";

type Post = {
  id: string;
  content: string | null;
  image: string | null;
  mediaType: string | null;
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
  petId: string | null;
  type: PostType;
  title: string | null;
  description: string | null;
  price: number | null;
  priceType: string | null;
  category: string | null;
  condition: string | null;
  location: string | null;
  isAffiliate: boolean | null;
  affiliateLink: string | null;
  affiliateCode: string | null;
  author: {
    id: string;
    name: string | null;
    username: string;
    image: string | null;
  };
  pet: {
    id: string;
    name: string;
    imageUrl: string | null;
    species: string;
    breed: string | null;
    age: string | null;
    bio: string | null;
  } | null;
  comments: Array<{
    id: string;
    content: string;
    createdAt: Date;
    authorId: string;
    postId: string;
    author: {
      id: string;
      name: string | null;
      username: string;
      image: string | null;
    };
  }>;
  likes: Array<{
    userId: string;
  }>;
  _count: {
    likes: number;
    comments: number;
  };
};

function useIntersectionObserver(ref: React.RefObject<HTMLVideoElement>, onChange: (inView: boolean) => void) {
  React.useEffect(() => {
    if (!ref.current) return;
    const observer = new window.IntersectionObserver(
      ([entry]) => onChange(entry.isIntersecting),
      { threshold: 0.5 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, onChange]);
}

function PostMedia({ post }: { post: Post }) {
  // Images: 1:1, Videos: 1:2 (portrait rectangle, twice as tall as wide)
  const isVideo = post.mediaType?.startsWith("video");
  return (
    <div
      style={{
        aspectRatio: isVideo ? "1/2" : "1/1",
        width: "100vw",
        maxWidth: 400,
        maxHeight: '80vh',
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
          controls={false}
          autoPlay
          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 0 }}
        />
      ) : (
        <img
          src={post.image || "/placeholder.png"}
          alt={post.title || "Post"}
          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 0 }}
        />
      )}
    </div>
  );
}

function PostModal({ open, onOpenChange, post, dbUserId }: { open: boolean; onOpenChange: (v: boolean) => void; post: Post | null; dbUserId: string | null }) {
  const { user } = useUser();
  const [newComment, setNewComment] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [comments, setComments] = useState(post?.comments || []);
  const [hasLiked, setHasLiked] = useState(post ? post.likes.some(like => like.userId === dbUserId) : false);
  const [optimisticLikes, setOptimisticLikes] = useState(post ? post._count.likes : 0);
  const [isLiking, setIsLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    setComments(post?.comments || []);
    setHasLiked(post ? post.likes.some(like => like.userId === dbUserId) : false);
    setOptimisticLikes(post ? post._count.likes : 0);
    setShowComments(false);
  }, [post, dbUserId]);

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
          },
        },
      ]);
      setNewComment("");
    } finally {
      setIsCommenting(false);
    }
  };

  if (!post) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 flex flex-col items-center justify-center bg-transparent shadow-none border-none max-w-fit">
        {/* Media area with enforced aspect ratio and no black bars */}
        <div className="relative flex items-center justify-center">
          <PostMedia post={post} />
          {/* Floating like & comment icons at the bottom of the media */}
          <div className="absolute bottom-0 left-0 w-full flex items-center justify-start gap-6 px-4 py-3 bg-gradient-to-t from-black/60 to-transparent z-10">
            {user ? (
              <button
                className={`flex items-center gap-2 text-muted-foreground ${hasLiked ? "text-red-500 hover:text-red-600" : "hover:text-red-500"}`}
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
            ) : (
              <span className="flex items-center gap-2 text-muted-foreground">
                <HeartIcon className="size-6" />
                <span>{optimisticLikes}</span>
              </span>
            )}
            <button
              className="flex items-center gap-2 text-muted-foreground hover:text-blue-500"
              onClick={() => setShowComments(true)}
            >
              <MessageCircleIcon className="size-6" />
              <span>{comments.length}</span>
            </button>
          </div>
        </div>
        {/* Bottom sheet for comments */}
        <Sheet open={showComments} onOpenChange={setShowComments}>
          <SheetContent 
            side="bottom" 
            className="max-h-[60vh] p-4 rounded-t-2xl"
            style={{ maxWidth: 400, width: '100vw', margin: '0 auto' }}
          >
            <div className="flex items-center gap-3 mb-2">
              <Link href={`/profile/${post.author.username}`}>
                <Avatar className="w-10 h-10">
                  <AvatarImage src={post.author.image ?? "/avatar.png"} />
                </Avatar>
              </Link>
              <div>
                <Link href={`/profile/${post.author.username}`} className="font-semibold hover:underline">
                  {post.author.name ?? post.author.username}
                </Link>
                <div className="text-xs text-muted-foreground">@{post.author.username}</div>
              </div>
            </div>
            <div className="mb-4 text-sm break-words">{post.content}</div>
            <div className="space-y-4 max-h-[30vh] overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="flex space-x-3">
                  <Avatar className="size-8 flex-shrink-0">
                    <AvatarImage src={comment.author.image ?? "/avatar.png"} />
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-medium text-sm">{comment.author.name}</span>
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
            {user ? (
              <div className="flex space-x-3 mt-4">
                <Avatar className="size-8 flex-shrink-0">
                  <AvatarImage src={user?.imageUrl || "/avatar.png"} />
                </Avatar>
                <div className="flex-1">
                  <textarea
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[60px] resize-none w-full border rounded p-2"
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={handleAddComment}
                      className="px-3 py-1 bg-primary text-white rounded disabled:opacity-50"
                      disabled={!newComment.trim() || isCommenting}
                    >
                      {isCommenting ? "Posting..." : "Comment"}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </SheetContent>
        </Sheet>
      </DialogContent>
    </Dialog>
  );
}

// Add this style block to the component or your global CSS
const gridStyles = `
  .explore-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    grid-auto-rows: 220px;
    gap: 0;
    width: 100%;
  }
  .explore-item {
    width: 100%;
    height: 100%;
    object-fit: cover;
    cursor: pointer;
    background: #222;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .explore-item.video {
    grid-row: span 2;
  }
`;

export default function PawPad() {
  const { user } = useUser();
  const [posts, setPosts] = useState<Post[]>([]);
  const [dbUserId, setDbUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [activePost, setActivePost] = useState<Post | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!value) {
      setSearchResults([]);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(value)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        setSearchResults([]);
      }
    }, 300);
  };

  const handleResultClick = (item: any) => {
    // TODO: Navigate to user, pet, or post page
    if (item.type === 'user') {
      window.location.href = `/profile/${item.username}`;
    } else if (item.type === 'pet') {
      window.location.href = `/pet/${item.id}`;
    } else if (item.type === 'post') {
      window.location.href = `/posts/${item.id}`;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        let explorePosts = [];
        let userId = null;
        if (user) {
          [explorePosts, userId] = await Promise.all([
            getExplorePosts(),
            getDbUserId()
          ]);
        } else {
          explorePosts = await getPosts();
        }
        setPosts(explorePosts);
        setDbUserId(userId);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // Video preview logic
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

  // Intersection observer for mobile
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

  return (
    <div className="container mx-auto p-0 min-h-screen">
      <style>{gridStyles}</style>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center gap-2 mb-8">
          <PawPrintIcon className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-bold text-center">Explore</h1>
        </div>
        {/* Universal Search Bar */}
        <div className="flex justify-center mb-6">
          <div className="w-full max-w-xl relative">
            <input
              type="text"
              placeholder="Search users, pets, posts..."
              className="w-full px-4 py-2 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={searchQuery}
              onChange={handleSearchChange}
            />
            {searchResults.length > 0 && searchQuery && (
              <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto">
                {/* Grouped Results */}
                {searchResults.some(r => r.type === 'user') && (
                  <div>
                    <div className="px-4 py-2 text-xs text-gray-500">Users</div>
                    {searchResults.filter(r => r.type === 'user').map(user => (
                      <div key={user.id} className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2" onClick={() => handleResultClick(user)}>
                        <Avatar className="w-6 h-6"><AvatarImage src={user.image || '/avatar.png'} /></Avatar>
                        <span className="font-medium">{user.name || user.username}</span>
                        <span className="text-xs text-gray-400">@{user.username}</span>
                      </div>
                    ))}
                  </div>
                )}
                {searchResults.some(r => r.type === 'pet') && (
                  <div>
                    <div className="px-4 py-2 text-xs text-gray-500">Pets</div>
                    {searchResults.filter(r => r.type === 'pet').map(pet => (
                      <div key={pet.id} className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2" onClick={() => handleResultClick(pet)}>
                        <Avatar className="w-6 h-6"><AvatarImage src={pet.imageUrl || '/avatar.png'} /></Avatar>
                        <span className="font-medium">{pet.name}</span>
                        <span className="text-xs text-gray-400">{pet.species}</span>
                      </div>
                    ))}
                  </div>
                )}
                {searchResults.some(r => r.type === 'post') && (
                  <div>
                    <div className="px-4 py-2 text-xs text-gray-500">Posts</div>
                    {searchResults.filter(r => r.type === 'post').map(post => (
                      <div key={post.id} className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2" onClick={() => handleResultClick(post)}>
                        <img src={post.image || '/placeholder.png'} alt="Post" className="w-6 h-6 rounded object-cover" />
                        <span className="font-medium truncate max-w-xs">{post.content || post.title || 'Post'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : posts.length > 0 ? (
          <div className="explore-grid">
            {posts.map((post, idx) => (
              <div
                key={post.id}
                className={
                  post.mediaType?.startsWith('video')
                    ? 'explore-item video'
                    : 'explore-item image'
                }
                style={{
                  borderRadius: 0,
                  background: '#222',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  setActivePost(post);
                  setModalOpen(true);
                }}
                onMouseEnter={() => post.mediaType?.startsWith('video') && handleMouseEnter(idx)}
                onMouseLeave={() => post.mediaType?.startsWith('video') && handleMouseLeave(idx)}
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
                  <img
                    src={post.image || '/placeholder.png'}
                    alt={post.title || 'Post'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                )}
              </div>
            ))}
            <PostModal open={modalOpen} onOpenChange={setModalOpen} post={activePost} dbUserId={dbUserId} />
          </div>
        ) : (
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold mb-2">No posts to explore</h2>
            <p className="text-muted-foreground">
              Check back later for new content!
            </p>
        </div>
        )}
      </div>
    </div>
  );
} 