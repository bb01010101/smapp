"use client";

import { getProfileByUsername, getUserPosts, updateProfile } from "@/actions/profile.action";
import { getPosts, createPost } from "@/actions/post.action";
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
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { getOrCreateConversation } from "@/actions/dm.action";
import dynamic from "next/dynamic";
import EditFamilyModal from "@/components/EditFamilyModal";

// Dynamically import ImageUpload to avoid SSR issues
const ImageUpload = dynamic(() => import("@/components/ImageUpload"), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center size-40 border-2 border-dashed rounded-md">Loading...</div>
});

type User = Awaited<ReturnType<typeof getProfileByUsername>>;
type Posts = Awaited<ReturnType<typeof getUserPosts>>;
type Post = Awaited<ReturnType<typeof getPosts>>[number];

interface ProfilePageClientProps {
  user: NonNullable<User>;
  posts: Post[];
  likedPosts: Post[];
  isFollowing: boolean;
  pets: any[];
}

function ProfilePageClient({
  isFollowing: initialIsFollowing,
  likedPosts,
  posts,
  user,
  pets,
}: ProfilePageClientProps) {
  const { user: currentUser } = useUser();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showEditFamilyDialog, setShowEditFamilyDialog] = useState(false);
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isUpdatingFollow, setIsUpdatingFollow] = useState(false);
  const [currentPets, setCurrentPets] = useState(pets);
  const router = useRouter();

  const [editForm, setEditForm] = useState({
    name: user.name || "",
    bio: user.bio || "",
    location: user.location || "",
    website: user.website || "",
    image: user.image || "",
  });

  const [imageUpload, setImageUpload] = useState<{ url: string; type: string } | null>(user.image ? { url: user.image, type: "image" } : null);

  // Pet Story Modal State
  const [storyOpen, setStoryOpen] = useState(false);
  const [activePet, setActivePet] = useState<any | null>(null);
  const [petPostIndex, setPetPostIndex] = useState(0);
  const [isTimelineMode, setIsTimelineMode] = useState(false);
  const [timelineInterval, setTimelineInterval] = useState<NodeJS.Timeout | null>(null);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  const [showExistingPosts, setShowExistingPosts] = useState(false);
  const [timelineImageUpload, setTimelineImageUpload] = useState<{ url: string; type: string } | null>(null);

  // Get posts for the active pet
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

  // Handle space key press for timeline mode
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

  const stopTimeline = () => {
    if (timelineInterval) {
      clearInterval(timelineInterval);
      setTimelineInterval(null);
    }
    setIsTimelineMode(false);
  };

  const openTimeline = () => {
    setTimelineOpen(true);
    setPetPostIndex(0);
  };

  const closeTimeline = () => {
    setTimelineOpen(false);
    setPetPostIndex(0);
    setIsTimelineMode(false);
    if (timelineInterval) {
      clearInterval(timelineInterval);
      setTimelineInterval(null);
    }
  };

  const handleUploadDaily = () => {
    setShowUploadOptions(true);
  };

  const handleSelectExistingPost = (post: Post) => {
    // Mark this post as today's daily photo (implement backend logic as needed)
    toast.success('Selected existing post as today\'s timeline photo!');
    setShowExistingPosts(false);
  };

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

  const handleUploadSubmit = async () => {
    if (!timelineImageUpload?.url || !activePet) return;
    
    try {
      setIsUploading(true);
      
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

  const handleMessage = async () => {
    if (!currentUser) return;
    const conversation = await getOrCreateConversation(user.id);
    router.push(`/messages/${conversation.id}`);
  };

  const isOwnProfile =
    currentUser?.username === user.username ||
    currentUser?.emailAddresses[0].emailAddress.split("@")[0] === user.username;

  const formattedDate = format(new Date(user.createdAt), "MMMM yyyy");

  // Handlers
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

  const timelineRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (timelineOpen && activePetPosts.length > 0) {
      // Scroll to the top (most recent post)
      timelineRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [timelineOpen, activePetPosts.length]);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="grid grid-cols-1 gap-6">
        <div className="w-full max-w-lg mx-auto">
          <Card className="bg-card">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={user.image ?? "/avatar.png"} />
                </Avatar>
                <h1 className="mt-4 text-2xl font-bold">{user.name ?? user.username}</h1>
                <p className="text-muted-foreground">@{user.username}</p>
                <p className="mt-2 text-sm">{user.bio}</p>

                {/* CREATE PET BUTTON IF NO PETS */}
                {currentPets.length === 0 && isOwnProfile && (
                  <div className="w-full flex flex-col items-center justify-center mt-8 mb-8">
                    <button
                      className="bg-gradient-to-r from-orange-400 via-orange-500 to-yellow-400 text-white font-bold py-4 px-8 rounded-2xl shadow-lg text-xl flex items-center gap-3 hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-orange-400"
                      onClick={() => setShowEditFamilyDialog(true)}
                    >
                      <PawPrintIcon className="w-7 h-7" />
                      Create Pet
                    </button>
                    <p className="mt-3 text-orange-600 text-base font-medium">Start your pet's journey!</p>
                  </div>
                )}

                {/* PETS HIGHLIGHTS BAR */}
                {currentPets && currentPets.length > 0 && (
                  <div className="w-full mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-lg font-semibold text-left">Family</h2>
                      {isOwnProfile && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowEditFamilyDialog(true)}
                        >
                          Edit Family
                        </Button>
                      )}
                    </div>
                    <div className="flex gap-6 overflow-x-auto pb-2">
                      {currentPets.map((pet) => {
                        // Check if this pet has posted today
                        const petPosts = posts.filter((post) => post.petId === pet.id && (!post.mediaType || post.mediaType.startsWith('image')));
                        const today = new Date(); today.setHours(0,0,0,0);
                        const hasPostedToday = petPosts.some(post => {
                          const postDate = new Date(post.createdAt); postDate.setHours(0,0,0,0);
                          return postDate.getTime() === today.getTime();
                        });
                        return (
                          <div
                            key={pet.id}
                            className="flex flex-col items-center cursor-pointer group"
                            onClick={() => openPetStory(pet)}
                          >
                            <div className={
                              !hasPostedToday
                                ? "p-1 rounded-full bg-gradient-to-tr from-orange-400 via-yellow-400 to-orange-600 shadow-lg animate-pulse"
                                : ""
                            }>
                              <Avatar className="w-16 h-16 border-2 border-primary group-hover:scale-105 transition">
                                <AvatarImage src={pet.imageUrl ? pet.imageUrl : '/avatar.png'} alt={pet.name} />
                              </Avatar>
                            </div>
                            <div className="font-medium text-xs mt-2 text-center w-16 truncate">{pet.name}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* PROFILE STATS */}
                <div className="w-full mt-6">
                  <div className="flex justify-between mb-4">
                    <div>
                      <div className="font-semibold">{user._count.following.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Following</div>
                    </div>
                    <Separator orientation="vertical" />
                    <div>
                      <div className="font-semibold">{user._count.followers.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Followers</div>
                    </div>
                    <Separator orientation="vertical" />
                    <div>
                      <div className="font-semibold">{user._count.posts.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Posts</div>
                    </div>
                  </div>
                </div>

                {/* "FOLLOW & EDIT PROFILE" BUTTONS */}
                {!currentUser ? (
                  <SignInButton mode="modal">
                    <Button className="w-full mt-4">Follow</Button>
                  </SignInButton>
                ) : isOwnProfile ? (
                  <Button className="w-full mt-4" onClick={() => setShowEditDialog(true)}>
                    <EditIcon className="size-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <>
                    <Button
                      className="w-full mt-4 mb-2"
                      onClick={handleFollow}
                      disabled={isUpdatingFollow}
                      variant={isFollowing ? "outline" : "default"}
                    >
                      {isFollowing ? "Unfollow" : "Follow"}
                    </Button>
                    <Button
                      className="w-full"
                      variant="secondary"
                      onClick={handleMessage}
                    >
                      Message
                    </Button>
                  </>
                )}

                {/* LOCATION & WEBSITE */}
                <div className="w-full mt-6 space-y-2 text-sm">
                  {user.location && (
                    <div className="flex items-center text-muted-foreground">
                      <MapPinIcon className="size-4 mr-2" />
                      {user.location}
                    </div>
                  )}
                  {user.website && (
                    <div className="flex items-center text-muted-foreground">
                      <LinkIcon className="size-4 mr-2" />
                      <a
                        href={
                          user.website.startsWith("http") ? user.website : `https://${user.website}`
                        }
                        className="hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {user.website}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center text-muted-foreground">
                    <CalendarIcon className="size-4 mr-2" />
                    Joined {formattedDate}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
            <TabsTrigger
              value="posts"
              className="flex items-center gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary
               data-[state=active]:bg-transparent px-6 font-semibold"
            >
              <FileTextIcon className="size-4" />
              Posts
            </TabsTrigger>
            <TabsTrigger
              value="likes"
              className="flex items-center gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary
               data-[state=active]:bg-transparent px-6 font-semibold"
            >
              <HeartIcon className="size-4" />
              Likes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-6">
            <div className="space-y-6">
              {posts.length > 0 ? (
                posts.map((post) => <PostCard key={post.id} post={post} dbUserId={user.id} />)
              ) : (
                <div className="text-center py-8 text-muted-foreground">No posts yet</div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="likes" className="mt-6">
            <div className="space-y-6">
              {likedPosts.length > 0 ? (
                likedPosts.map((post) => <PostCard key={post.id} post={post} dbUserId={user.id} />)
              ) : (
                <div className="text-center py-8 text-muted-foreground">No liked posts to show</div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Profile Picture</Label>
                <ImageUpload
                  endpoint="postImage"
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

        {/* PET STORY MODAL */}
        <Dialog open={storyOpen} onOpenChange={closePetStory}>
          <DialogContent className="max-w-md p-0 overflow-hidden flex items-center justify-center min-h-[70vh]">
            {activePet && (
              <div className="relative bg-background rounded-lg shadow-lg w-full flex flex-col items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center p-6 w-full">
                  <div 
                    className="cursor-pointer transform hover:scale-105 transition-transform"
                    onClick={openTimeline}
                  >
                    <Avatar className="w-20 h-20 mb-2">
                      <AvatarImage src={activePet.imageUrl ? activePet.imageUrl : '/avatar.png'} alt={activePet.name} />
                    </Avatar>
                  </div>
                  <div className="font-bold text-lg">{activePet.name}</div>
                  <div className="text-sm text-muted-foreground mb-1">{activePet.breed} • {activePet.age}</div>
                  <div className="text-xs text-muted-foreground text-center mb-4">{activePet.bio}</div>

                  {/* Post navigation */}
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

        {/* TIMELINE MODAL */}
        <Dialog open={timelineOpen} onOpenChange={closeTimeline}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden flex items-center justify-center min-h-[80vh] bg-gradient-to-br from-orange-100 via-yellow-50 to-orange-200">
            {activePet && (
              <div className="relative rounded-lg shadow-lg w-full flex flex-col items-center justify-center min-h-[70vh]">
                <div className="flex flex-col items-center p-6 w-full">
                  <div className="flex items-center justify-between w-full mb-6">
                    <div className="flex items-center space-x-4">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={activePet.imageUrl ? activePet.imageUrl : '/avatar.png'} alt={activePet.name} />
                      </Avatar>
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
                            <span>Upload Daily Photo</span>
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
                              <div className={`flex items-center w-1/2 ${isLeft ? 'justify-end pr-8' : 'justify-start pl-8'}`}> 
                                {isLeft && (
                                  <div className="flex flex-col items-end">
                                    <div className={`w-4 h-4 rounded-full border-2 ${isToday ? 'bg-orange-400 border-orange-600' : 'bg-orange-200 border-orange-400'} mb-1`}></div>
                                    <div className="text-xs text-muted-foreground text-right mb-2">
                                      {isToday ? 'Today' : format(postDate, 'MMM d, yyyy')}
                                    </div>
                                  </div>
                                )}
                                <div className="relative aspect-square w-40 rounded-lg overflow-hidden shadow-lg border border-orange-100 group-hover:scale-105 transition-transform cursor-pointer bg-white">
                                  <img src={post.image || '/avatar.png'} alt={activePet.name + ' photo'} className="w-full h-full object-cover" />
                                </div>
                                {!isLeft && (
                                  <div className="flex flex-col items-start ml-4">
                                    <div className={`w-4 h-4 rounded-full border-2 ${isToday ? 'bg-orange-400 border-orange-600' : 'bg-orange-200 border-orange-400'} mb-1`}></div>
                                    <div className="text-xs text-muted-foreground text-left mb-2">
                                      {isToday ? 'Today' : format(postDate, 'MMM d, yyyy')}
                                    </div>
                                  </div>
                                )}
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

        {/* UPLOAD OPTIONS MODAL */}
        <Dialog open={showUploadOptions} onOpenChange={setShowUploadOptions}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Upload Daily Photo</DialogTitle>
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
                      Upload a photo for {activePet?.name}'s timeline
                    </div>
                    <ImageUpload
                      endpoint="postImage"
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
                          'Upload Daily Photo'
                        )}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* EXISTING POSTS MODAL */}
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
                  <img 
                    src={post.image || '/avatar.png'} 
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

        {/* Edit Family Modal */}
        <EditFamilyModal
          open={showEditFamilyDialog}
          onOpenChange={setShowEditFamilyDialog}
          pets={currentPets}
          onPetsChange={setCurrentPets}
        />
      </div>
    </div>
  );
}
export default ProfilePageClient;