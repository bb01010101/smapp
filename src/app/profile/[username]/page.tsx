import {
  getProfileByUsername,
  getUserLikedPosts,
  getUserPosts,
  isFollowing,
  getUserPets,
  isFoundingPackUser,
} from "@/actions/profile.action";
import { notFound } from "next/navigation";
import ProfilePageClient from "./ProfilePageClient";
import ProfilePageWrapper from "./ProfilePageWrapper";

export async function generateMetadata({ params }: { params: { username: string } }) {
  const user = await getProfileByUsername(params.username);
  if (!user) return;

  return {
    title: `${user.name ?? user.username}`,
    description: user.bio || `Check out ${user.username}'s profile.`,
  };
}

async function ProfilePageServer({ params }: { params: { username: string } }) {
  const user = await getProfileByUsername(params.username);

  if (!user) notFound();

  const [posts, likedPosts, isCurrentUserFollowing, pets, isFoundingPack] = await Promise.all([
    getUserPosts(user.id),
    getUserLikedPosts(user.id),
    isFollowing(user.id),
    getUserPets(user.clerkId),
    isFoundingPackUser(user.id),
  ]);

  return (
    <ProfilePageWrapper
      user={user}
      posts={posts}
      likedPosts={likedPosts}
      isFollowing={isCurrentUserFollowing}
      pets={pets}
      isFoundingPack={isFoundingPack}
    />
  );
}
export default ProfilePageServer;