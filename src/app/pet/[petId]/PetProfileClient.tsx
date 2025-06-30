"use client";

import { useState, useRef } from "react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileTextIcon, HeartIcon, MapPinIcon, LinkIcon, CalendarIcon } from "lucide-react";
import Link from "next/link";
import PostCard from "@/components/PostCard";
import { format } from "date-fns";

interface PetProfileClientProps {
  pet: any;
  posts: any[];
  owner: any;
}

export default function PetProfileClient({ pet, posts, owner }: PetProfileClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [activePost, setActivePost] = useState<any | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const formattedDate = pet.createdAt ? format(new Date(pet.createdAt), "MMMM yyyy") : "";

  return (
    <div className="max-w-3xl mx-auto">
      <div className="grid grid-cols-1 gap-6">
        <div className="w-full max-w-lg mx-auto">
          <Card className="bg-card">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={pet.imageUrl ?? "/avatar.png"} />
                </Avatar>
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
                      className="profile-item"
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
                        <img
                          src={post.image || '/placeholder.png'}
                          alt={post.title || 'Post'}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
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
      </div>
    </div>
  );
} 