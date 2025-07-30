"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarImage } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import { ImageIcon, Loader2Icon, SendIcon, VideoIcon, TrophyIcon } from "lucide-react";
import { Button } from "./ui/button";
import { createPost } from "@/actions/post.action";
import toast from "react-hot-toast";
import S3ImageUpload from "./S3ImageUpload";
import { useOptimisticXp } from '@/lib/useOptimisticXp';
import { SecureAvatar } from "./SecureAvatar";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";

function CreatePost() {
  const { user } = useUser();
  const [content, setContent] = useState("");
  const [media, setMedia] = useState<{ url: string; type: string } | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [pets, setPets] = useState<any[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [currentChallenge, setCurrentChallenge] = useState<any>(null);
  const [joinChallenge, setJoinChallenge] = useState(false);
  const { incrementXp } = useOptimisticXp();

  useEffect(() => {
    // Fetch pets for the current user and current challenge
    const fetchData = async () => {
      // Fetch pets
      const petsRes = await fetch("/api/pets");
      if (petsRes.ok) {
        const petsData = await petsRes.json();
        setPets(petsData);
      }

      // Fetch current weekly challenge
      const challengeRes = await fetch("/api/weekly-challenges/current");
      if (challengeRes.ok) {
        const challengeData = await challengeRes.json();
        setCurrentChallenge(challengeData.challenge);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async () => {
    if (!content.trim() && !media?.url) return;

    setIsPosting(true);
    try {
      const result = await createPost(content, media?.url || "", selectedPetId, media?.type || "");
      if (result?.success) {
        // If joining challenge, tag the post
        if (joinChallenge && currentChallenge && result.postId) {
          try {
            await fetch("/api/weekly-challenges/posts", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ postId: result.postId })
            });
            toast.success("Post created and tagged with challenge!");
          } catch (challengeError) {
            console.error("Failed to tag post with challenge:", challengeError);
            toast.success("Post created, but couldn't tag with challenge");
          }
        } else {
          toast.success("Post created successfully");
        }

        // Track XP for posting a photo if media was uploaded
        if (media?.url && media?.type?.startsWith('image')) {
          await incrementXp('daily_post_photo', 1);
          await incrementXp('weekly_post_7_photos', 1);
        }
        
        // reset the form
        setContent("");
        setMedia(null);
        setShowImageUpload(false);
        setSelectedPetId(null);
        setJoinChallenge(false);
      }
    } catch (error) {
      console.error("Failed to create post:", error);
      toast.error("Failed to create post");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex space-x-4">
            <SecureAvatar 
              src={user?.imageUrl}
              alt={user?.fullName || "User"}
              className="w-10 h-10"
            />
            <Textarea
              placeholder="What's on your mind?"
              className="min-h-[100px] resize-none border-none focus-visible:ring-0 p-0 text-base"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isPosting}
            />
          </div>

          {/* Post as selector */}
          <div>
            <label className="block text-sm font-medium mb-1">Post as</label>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={selectedPetId || ""}
              onChange={e => setSelectedPetId(e.target.value || null)}
              disabled={isPosting}
            >
              <option value="">Yourself</option>
              {pets.map((pet) => (
                <option key={pet.id} value={pet.id}>
                  {pet.name} ({pet.species})
                </option>
              ))}
            </select>
          </div>

          {/* Weekly Challenge Opt-in */}
          {currentChallenge && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <TrophyIcon className="w-5 h-5 text-purple-600" />
                <div className="flex-1">
                  <h3 className="font-semibold text-purple-900">{currentChallenge.title}</h3>
                  <p className="text-sm text-purple-700">{currentChallenge.description}</p>
                  <p className="text-xs text-purple-600 mt-1">#{currentChallenge.hashtag}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="join-challenge"
                    checked={joinChallenge}
                    onCheckedChange={setJoinChallenge}
                    disabled={isPosting}
                  />
                  <Label htmlFor="join-challenge" className="text-sm font-medium text-purple-800">
                    Join Challenge
                  </Label>
                </div>
              </div>
            </div>
          )}

          {(showImageUpload || media) && (
            <div className="border rounded-lg p-4">
              <S3ImageUpload
                folder="posts"
                value={media}
                onChange={(mediaObj) => {
                  setMedia(mediaObj);
                  if (!mediaObj) setShowImageUpload(false);
                }}
              />
            </div>
          )}

          <div className="flex items-center justify-between border-t pt-4">
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="hover:bg-gold-100 hover:text-gold-700"
                onClick={() => setShowImageUpload(!showImageUpload)}
                disabled={isPosting}
              >
                {media && media.type?.startsWith("video") ? (
                  <VideoIcon className="size-4 mr-2" />
                ) : (
                  <ImageIcon className="size-4 mr-2" />
                )}
                {media && media.type?.startsWith("video") ? "Video" : "Media"}
              </Button>
            </div>
            <Button
              className="flex items-center"
              variant="default"
              onClick={handleSubmit}
              disabled={(!content.trim() && !media?.url) || isPosting}
            >
              {isPosting ? (
                <>
                  <Loader2Icon className="size-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <SendIcon className="size-4 mr-2" />
                  Post
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
export default CreatePost;
