import CreatePost from "@/components/CreatePost";
import WhoToFollow from "@/components/WhoToFollow";
import PostCard from "@/components/PostCard";
import { getPosts } from "@/actions/post.action";
import SidebarWrapper from '@/components/SidebarWrapper';
import ChallengeDropdown from '@/components/ChallengeDropdown';

export default async function Home() {
  const posts = await getPosts();
  const dbUserId = null;

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="hidden lg:block lg:col-span-3">
          <SidebarWrapper />
        </div>
        <div className="lg:col-span-5">
          <CreatePost />

          <div className="space-y-6">
            {posts.length > 0 ? (
              posts.map((post) => (
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
        <div className="hidden lg:block lg:col-span-4 space-y-6">
          <WhoToFollow />
          {/* ChallengeList dropdown */}
          <ChallengeDropdown />
        </div>
      </div>
    </div>
  );
}
