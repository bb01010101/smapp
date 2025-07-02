"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";

function BarkCard({ bark, onVote }: { bark: any, onVote: (barkId: string, value: 1 | -1) => void }) {
  // Calculate score from votes
  const score = bark.votes ? bark.votes.reduce((sum: number, v: any) => sum + v.value, 0) : 0;

  return (
    <div className="rounded-lg border bg-white p-6 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
        {bark.community && (
          <span className="font-semibold text-primary">b/{bark.community.name}</span>
        )}
        <span>by <Link href={`/profile/${bark.author.username}`} className="hover:underline">{bark.author.name || bark.author.username}</Link></span>
        <span>· {new Date(bark.createdAt).toLocaleString()}</span>
      </div>
      <Link href={`/barks/${bark.id}`} className="hover:underline">
        <h2 className="text-lg font-bold mb-1">{bark.title}</h2>
        <p className="text-sm text-muted-foreground line-clamp-2">{bark.content}</p>
      </Link>
      {/* Top comment preview */}
      {bark.comments && bark.comments.length > 0 && (
        <div className="mt-2 p-2 bg-muted rounded text-xs">
          <span className="font-semibold"><Link href={`/profile/${bark.comments[0].author.username}`} className="hover:underline">{bark.comments[0].author.name || bark.comments[0].author.username}</Link>:</span>{" "}
          {bark.comments[0].content}
          <span className="ml-2 text-muted-foreground">· {new Date(bark.comments[0].createdAt).toLocaleString()}</span>
        </div>
      )}
      <div className="flex items-center gap-2 mt-2">
        <Button size="icon" variant="ghost" onClick={() => onVote(bark.id, 1)}>
          <ArrowUp className="w-4 h-4 text-green-500" />
        </Button>
        <span className="font-semibold text-sm">{score}</span>
        <Button size="icon" variant="ghost" onClick={() => onVote(bark.id, -1)}>
          <ArrowDown className="w-4 h-4 text-red-500" />
        </Button>
      </div>
    </div>
  );
}

export default function BarksPage() {
  const [barks, setBarks] = useState<any[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/barks")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setBarks(data);
        } else {
          setBarks([]);
        }
      })
      .catch(() => setBarks([]))
      .finally(() => setLoading(false));

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

  // Optimistic UI update for voting
  const handleVote = async (barkId: string, value: 1 | -1) => {
    setBarks(prev => prev.map(bark => {
      if (bark.id !== barkId) return bark;
      let existing = bark.votes.find((v: any) => v.userId === "me"); // TODO: Replace with real userId if available
      if (existing) {
        if (existing.value === value) {
          return { ...bark, votes: bark.votes.filter((v: any) => v.userId !== "me") };
        } else {
          return { ...bark, votes: bark.votes.map((v: any) => v.userId === "me" ? { ...v, value } : v) };
        }
      } else {
        return { ...bark, votes: [...bark.votes, { userId: "me", value }] };
      }
    }));
    await fetch("/api/barks/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ barkId, value }),
    });
  };

  // Add a function to refetch communities
  const refetchCommunities = () => {
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
  };

  // Optionally, listen for a custom event to refetch communities
  useEffect(() => {
    const handler = () => refetchCommunities();
    window.addEventListener("communityCreated", handler);
    return () => window.removeEventListener("communityCreated", handler);
  }, []);

  const handleCreateCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError("");
    // Check if community already exists
    const checkRes = await fetch(`/api/barks/communities/${newName}`);
    if (checkRes.ok) {
      setCreateError("A community with this name already exists.");
      setCreating(false);
      return;
    }
    // Create community
    const res = await fetch("/api/barks/communities/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, description: newDescription }),
    });
    const data = await res.json();
    setCreating(false);
    if (data.success) {
      setShowCreateModal(false);
      setNewName("");
      setNewDescription("");
      window.dispatchEvent(new Event("communityCreated"));
      router.push(`/barks/communities/${data.community.name}`);
    } else {
      setCreateError(data.error || "Failed to create community");
    }
  };

  return (
    <div className="flex">
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogTitle>Create Community</DialogTitle>
          <DialogDescription>
            Name your new community and add a description.
          </DialogDescription>
          <form onSubmit={handleCreateCommunity} className="space-y-4">
            <Input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Community name"
              required
            />
            <Textarea
              value={newDescription}
              onChange={e => setNewDescription(e.target.value)}
              placeholder="Description"
              rows={3}
              required
            />
            {createError && <div className="text-red-500 text-sm">{createError}</div>}
            <DialogFooter>
              <Button type="submit" disabled={creating}>{creating ? "Creating..." : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} transition-all duration-300 border-r p-4`}>
        <Button variant="outline" size="sm" className="mb-4" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
          {sidebarCollapsed ? '→' : '←'}
        </Button>
        {!sidebarCollapsed && (
          <>
            <Button variant="default" size="sm" className="w-full mb-4" onClick={() => setShowCreateModal(true)}>
              Create Community
            </Button>
            <div className="space-y-2">
              {communities.map((c) => (
                <Link key={c.id} href={`/barks/communities/${c.name}`} className="block p-2 hover:bg-muted rounded">
                  b/{c.name}
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
      <div className="flex-1 p-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Barks</h1>
          <Link href="/barks/submit">
            <Button variant="default">Create Bark</Button>
          </Link>
        </div>
        <div className="space-y-4">
          {loading ? (
            <div className="rounded-lg border bg-white p-6 text-center text-muted-foreground">Loading...</div>
          ) : !Array.isArray(barks) || barks.length === 0 ? (
            <div className="rounded-lg border bg-white p-6 text-center text-muted-foreground">
              No barks yet. Be the first to ask a question or share something!
            </div>
          ) : (
            barks.map((bark) => <BarkCard key={bark.id} bark={bark} onVote={handleVote} />)
          )}
        </div>
      </div>
    </div>
  );
} 