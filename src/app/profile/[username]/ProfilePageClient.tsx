"use client";

import { getProfileByUsername, getUserPosts, updateProfile } from "@/actions/profile.action";
import { getPosts } from "@/actions/post.action";
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
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { getOrCreateConversation } from "@/actions/dm.action";
import ImageUpload from "@/components/ImageUpload";

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
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isUpdatingFollow, setIsUpdatingFollow] = useState(false);
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

  // Get posts for the active pet
  const activePetPosts = activePet ? posts.filter((post) => post.petId === activePet.id) : [];
  const currentPetPost = activePetPosts[petPostIndex] || null;

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

                {/* PETS HIGHLIGHTS BAR */}
                {pets && pets.length > 0 && (
                  <div className="w-full mt-6">
                    <h2 className="text-lg font-semibold mb-2 text-left">Pets</h2>
                    <div className="flex gap-6 overflow-x-auto pb-2">
                      {pets.map((pet) => (
                        <div
                          key={pet.id}
                          className="flex flex-col items-center cursor-pointer group"
                          onClick={() => openPetStory(pet)}
                        >
                          <Avatar className="w-16 h-16 border-2 border-primary group-hover:scale-105 transition">
                            {pet.imageUrl && !pet.imageUrl.includes('placehold.co') ? (
                              <AvatarImage src={pet.imageUrl} alt={pet.name} />
                            ) : (
                              <AvatarImage src="/avatar.png" alt={pet.name} />
                            )}
                          </Avatar>
                          <div className="font-medium text-xs mt-2 text-center w-16 truncate">{pet.name}</div>
                        </div>
                      ))}
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
                  <Avatar className="w-20 h-20 mb-2">
                    <AvatarImage src={activePet.imageUrl && !activePet.imageUrl.includes('placehold.co') ? activePet.imageUrl : '/avatar.png'} alt={activePet.name} />
                  </Avatar>
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
      </div>
    </div>
  );
}
export default ProfilePageClient;