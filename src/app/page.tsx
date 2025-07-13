import CreatePost from "@/components/CreatePost";
import { currentUser } from "@clerk/nextjs/server";
import WhoToFollow from "@/components/WhoToFollow";
import PostCard from "@/components/PostCard";
import { getFollowingPosts, getPosts } from "@/actions/post.action";
import { getDbUserId } from "@/actions/user.action";
import SidebarWrapper from '@/components/SidebarWrapper';

export default async function Home() {
  const user = await currentUser();
  const posts = user ? await getFollowingPosts() : await getPosts();
  const dbUserId = user ? await getDbUserId() : null;

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="hidden lg:block lg:col-span-3">
          <SidebarWrapper />
        </div>
        <div className="lg:col-span-5">
          {user ? <CreatePost /> : null}

          <div className="space-y-6">
            {posts.filter(post => !(post.petId && (!post.mediaType || post.mediaType.startsWith('image')))).length > 0 ? (
              posts.filter(post => !(post.petId && (!post.mediaType || post.mediaType.startsWith('image')))).map((post) => (
                <PostCard key={post.id} post={post} dbUserId={dbUserId} />
              ))
            ) : (
              <div className="text-center py-8">
                <h2 className="text-xl font-semibold mb-2">No posts yet</h2>
                <p className="text-muted-foreground mb-4">
                  Follow some users to see their posts here!
                </p>
                <div className="lg:hidden">
                  <WhoToFollow />
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="hidden lg:block lg:col-span-4">
          <WhoToFollow />
        </div>
      </div>
    </div>
  );
}
