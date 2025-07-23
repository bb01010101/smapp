"use client";
import { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter, useSearchParams } from "next/navigation";
import { useOptimisticXp } from '@/lib/useOptimisticXp';

function BarkSubmitPageInner() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [community, setCommunity] = useState("");
  const [communities, setCommunities] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { incrementXp } = useOptimisticXp();

  useEffect(() => {
    if (searchParams) {
      const communityId = searchParams.get("communityId");
      if (communityId) setCommunity(communityId);
    }
  }, [searchParams]);

  useEffect(() => {
    fetch("/api/barks/communities")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCommunities(data);
        } else {
          setCommunities([]);
        }
      })
      .catch(() => setCommunities([]));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    const res = await fetch("/api/barks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, communityId: community || undefined }),
    });
    const data = await res.json();
    setIsSubmitting(false);
    if (data.success) {
      // Track XP for posting a Bark
      await incrementXp('seasonal_post_5_barks', 1);
      router.push("/barks");
    } else {
      setError(data.error || "Failed to create bark");
    }
  };

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <h2 className="text-2xl font-bold mb-6">Create a Bark</h2>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label className="block font-medium mb-1">Title</label>
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="What's your question or topic?"
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Content</label>
          <Textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Share details, ask a question, or tell a story..."
            rows={6}
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Community <span className="text-red-500">*</span></label>
          <select
            className="w-full border rounded px-3 py-2"
            value={community}
            onChange={e => setCommunity(e.target.value)}
            required
          >
            <option value="" disabled>Select a community</option>
            {communities.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <Button type="submit" disabled={isSubmitting || !title || !content || !community} className="w-full">
          {isSubmitting ? "Posting..." : "Post Bark"}
        </Button>
      </form>
    </div>
  );
}

export default function BarkSubmitPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BarkSubmitPageInner />
    </Suspense>
  );
} 