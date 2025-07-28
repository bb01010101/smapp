"use client";

import { currentUser } from "@clerk/nextjs/server";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { SignInButton, SignUpButton, useUser } from "@clerk/nextjs";
import { Button } from "./ui/button";
import { getUserByClerkId } from "@/actions/user.action";
import Link from "next/link";
import { Avatar, AvatarImage } from "./ui/avatar";
import { Separator } from "./ui/separator";
import { SecureAvatar } from "./SecureAvatar";
import { LinkIcon, MapPinIcon } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { isUserVerified, isUserVerifiedShelter } from "@/lib/utils";
import BlueCheckIcon from "./BlueCheckIcon";
import RedCheckIcon from "./RedCheckIcon";



interface SidebarProps {
  user?: any;
}

export default function SidebarClient({ user }: { user?: any }) {
  const { user: authUser } = useUser();
  const loginChallengeDone = useRef(false);
  const [followersOpen, setFollowersOpen] = useState(false);
  const [followingOpen, setFollowingOpen] = useState(false);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);

  useEffect(() => {
    if (authUser && !loginChallengeDone.current) {
      // Only call once per session
      loginChallengeDone.current = true;
      
      // Track daily login XP
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/xp/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: 'daily_login',
          increment: 1,
          userId: authUser.id,
        }),
      }).catch(() => {});
    }
  }, [authUser]);

  const fetchFollowers = async () => {
    if (!user?.username) return;
    setFollowersLoading(true);
    try {
      const res = await fetch(`/api/users/${user.username}/followers`);
      const data = await res.json();
      setFollowers(data || []);
    } catch {
      setFollowers([]);
    } finally {
      setFollowersLoading(false);
    }
  };

  const fetchFollowing = async () => {
    if (!user?.username) return;
    setFollowingLoading(true);
    try {
      const res = await fetch(`/api/users/${user.username}/following`);
      const data = await res.json();
      setFollowing(data || []);
    } catch {
      setFollowing([]);
    } finally {
      setFollowingLoading(false);
    }
  };

  if (!authUser) return <UnAuthenticatedSidebar />;
  if (!user) return null;

  return (
    <>
      <div className="sticky top-20 space-y-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Link
                href={`/profile/${user.username}`}
                className="flex flex-col items-center justify-center"
              >
                <SecureAvatar 
                  src={user.image}
                  alt={user.name || "User"}
                  className="w-20 h-20 border-2"
                />

                <div className="mt-4 space-y-1">
                  <div className="flex items-center gap-1">
                    <h3 className="font-semibold">{user.name}</h3>
                    {isUserVerified(user.username) && (
                      <BlueCheckIcon className="inline-block w-4 h-4 align-text-bottom" />
                    )}
                    {isUserVerifiedShelter(user.username) && (
                      <RedCheckIcon className="inline-block w-4 h-4 align-text-bottom" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{user.username}</p>
                </div>
              </Link>

              {user.bio && <p className="mt-3 text-sm text-muted-foreground">{user.bio}</p>}

              <div className="w-full">
                <Separator className="my-4" />
                <div className="flex justify-between">
                  <div 
                    className="cursor-pointer hover:text-primary transition-colors"
                    onClick={() => {
                      setFollowingOpen(true);
                      fetchFollowing();
                    }}
                  >
                    <p className="font-medium">{user._count.following}</p>
                    <p className="text-xs text-muted-foreground">Following</p>
                  </div>
                  <Separator orientation="vertical" />
                  <div 
                    className="cursor-pointer hover:text-primary transition-colors"
                    onClick={() => {
                      setFollowersOpen(true);
                      fetchFollowers();
                    }}
                  >
                    <p className="font-medium">{user._count.followers}</p>
                    <p className="text-xs text-muted-foreground">Followers</p>
                  </div>
                </div>
                <Separator className="my-4" />
              </div>

              <div className="w-full space-y-2 text-sm">
                <div className="flex items-center text-muted-foreground">
                  <MapPinIcon className="w-4 h-4 mr-2" />
                  {user.location || "No location"}
                </div>
                <div className="flex items-center text-muted-foreground">
                  <LinkIcon className="w-4 h-4 mr-2 shrink-0" />
                  {user.website ? (
                    <a href={`${user.website}`} className="hover:underline truncate" target="_blank">
                      {user.website}
                    </a>
                  ) : (
                    "No website"
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        

      </div>

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
                    <SecureAvatar 
                      src={f.image}
                      alt={f.name || "User"}
                      className="w-8 h-8"
                    />
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
                    <SecureAvatar 
                      src={f.image}
                      alt={f.name || "User"}
                      className="w-8 h-8"
                    />
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
    </>
  );
}
const UnAuthenticatedSidebar = () => (
  <div className="sticky top-20">
    <Card>
      <CardHeader>
        <CardTitle className="text-center text-xl font-semibold">Welcome Back!</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-center text-muted-foreground mb-4">
          Login to access your profile and connect with others.
        </p>
        <SignInButton mode="modal">
          <Button className="w-full" variant="outline">
            Login
          </Button>
        </SignInButton>
        <SignUpButton mode="modal">
          <Button className="w-full mt-2" variant="default">
            Sign Up
          </Button>
        </SignUpButton>
      </CardContent>
    </Card>
  </div>
);
