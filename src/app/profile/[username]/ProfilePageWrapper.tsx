"use client";

import { useUser } from "@clerk/nextjs";
import { SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { SecureAvatar } from "@/components/SecureAvatar";
import { LogInIcon, UserIcon } from "lucide-react";
import ProfilePageClient from "./ProfilePageClient";

interface ProfilePageWrapperProps {
  user: any;
  posts: any[];
  likedPosts: any[];
  isFollowing: boolean;
  pets: any[];
  isFoundingPack: boolean;
  useEvolutionImages: boolean;
}

export default function ProfilePageWrapper({
  user,
  posts,
  likedPosts,
  isFollowing,
  pets,
  isFoundingPack,
  useEvolutionImages,
}: ProfilePageWrapperProps) {
  const { isSignedIn, isLoaded } = useUser();

  // Show loading state while Clerk is loading
  if (!isLoaded) {
    return (
      <div className="w-full h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse bg-gray-200 h-6 w-20 rounded"></div>
      </div>
    );
  }

  // If user is not signed in, show login prompt
  if (!isSignedIn) {
    return (
      <div className="w-full h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <SecureAvatar 
                src={user.image}
                alt={user.name || "User"}
                className="w-20 h-20 border-2 border-primary"
                showFirst1000Badge={user?.isFirst1000}
              />
            </div>
            <CardTitle className="text-xl">
              {user.name || user.username}'s Profile
            </CardTitle>
            <p className="text-muted-foreground text-sm mt-2">
              Sign in to view this profile and interact with posts
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <UserIcon className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1">
                <div className="font-medium">{user.name || user.username}</div>
                <div className="text-sm text-muted-foreground">@{user.username}</div>
              </div>
            </div>
            
            <div className="flex gap-4 text-center">
              <div className="flex-1">
                <div className="font-bold text-lg">{user._count.posts}</div>
                <div className="text-xs text-muted-foreground">Posts</div>
              </div>
              <div className="flex-1">
                <div className="font-bold text-lg">{user._count.followers}</div>
                <div className="text-xs text-muted-foreground">Followers</div>
              </div>
              <div className="flex-1">
                <div className="font-bold text-lg">{user._count.following}</div>
                <div className="text-xs text-muted-foreground">Following</div>
              </div>
            </div>

            <SignInButton mode="modal">
              <Button className="w-full gap-2">
                <LogInIcon className="w-4 h-4" />
                Sign in to continue
              </Button>
            </SignInButton>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user is signed in, show the normal profile page
  return (
    <ProfilePageClient
      user={user}
      posts={posts}
      likedPosts={likedPosts}
      isFollowing={isFollowing}
      pets={pets}
      isFoundingPack={isFoundingPack}
      useEvolutionImages={useEvolutionImages}
    />
  );
} 