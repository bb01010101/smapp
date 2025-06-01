"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@clerk/nextjs";

// Utility to slugify a string
function slugify(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function CommunityPage() {
  const { communityId } = useParams() as { communityId: string };
  const router = useRouter();
  const searchParams = useSearchParams();
  const justCreated = searchParams.get("created") === "1";
  const { user } = useUser();
  const userClerkId = user?.id;
  const [community, setCommunity] = useState<any>(null);
  const [barks, setBarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editError, setEditError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    async function fetchCommunityAndBarks() {
      setLoading(true);
      setError(null);

      let attempts = 0;
      let commRes, commData;
      while (attempts < 5) {
        commRes = await fetch(`/api/barks/communities/${communityId}`);
        if (commRes.ok) {
          commData = await commRes.json();
          break;
        }
        if (!justCreated) break;
        // Wait 400ms before retrying
        await new Promise(res => setTimeout(res, 400));
        attempts++;
      }

      if (!commRes || !commRes.ok) {
        if (!justCreated) {
          setShowCreateModal(true);
          setName(communityId); // Pre-fill with slug, but allow editing
        }
        setLoading(false);
        return;
      }
      setCommunity(commData);
      setName(commData.name || "");
      setDescription(commData.description || "");
      // Fetch barks for this community (use slug)
      const barksRes = await fetch(`/api/barks?communityId=${commData.name}`);
      const barksData = await barksRes.json();
      setBarks(Array.isArray(barksData) ? barksData : []);
      setLoading(false);
    }
    if (communityId) fetchCommunityAndBarks();
  }, [communityId, justCreated]);

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

  const handleCreateCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError("");
    const slug = slugify(name);
    // Check if community already exists
    const checkRes = await fetch(`/api/barks/communities/${slug}`);
    if (checkRes.ok) {
      setCreateError("A community with this name already exists.");
      setCreating(false);
      return;
    }
    // Create community
    const res = await fetch("/api/barks/communities/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: slug, description }),
    });
    const data = await res.json();
    setCreating(false);
    if (data.success) {
      setCommunity(data.community);
      setShowCreateModal(false);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('communityCreated'));
      }
      // Always redirect to the slug URL with created=1
      router.push(`/barks/communities/${slug}?created=1`);
    } else {
      setCreateError(data.error || "Failed to create community");
    }
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    router.push("/barks");
  };

  const isCreator = userClerkId && community && community.creator && community.creator.clerkId === userClerkId;

  const handleEditCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError("");
    try {
      const res = await fetch(`/api/barks/communities/${community.name}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, description: editDescription }),
      });
      const data = await res.json();
      if (data.success) {
        setCommunity(data.community);
        setShowEditModal(false);
        if (editName !== community.name) {
          router.push(`/barks/communities/${editName}`);
        }
      } else {
        setEditError(data.error || "Failed to edit community");
      }
    } catch (err) {
      setEditError("Failed to edit community");
    }
  };

  const handleDeleteCommunity = async () => {
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch(`/api/barks/communities/${community.name}`, {
        method: "DELETE",
      });
      const data = await res.json();
      setDeleting(false);
      if (data.success) {
        router.push("/barks");
      } else {
        setDeleteError(data.error || "Failed to delete community");
      }
    } catch (err) {
      setDeleting(false);
      setDeleteError("Failed to delete community");
    }
  };

  if (loading) return <div className="max-w-2xl mx-auto py-8 px-4">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-4">
        <Button variant="outline" onClick={() => router.push('/barks')}>
          ← Back to Barks
        </Button>
      </div>
      {/* Community Info Card */}
      {community && (
        <div className="rounded-lg border bg-white p-6 mb-8 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">b/{community.name}</h1>
              <div className="text-muted-foreground text-base mb-2">{community.description}</div>
            </div>
            {isCreator && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { setEditName(community.name); setEditDescription(community.description); setShowEditModal(true); }}>Edit</Button>
                <Button size="sm" variant="destructive" onClick={() => setShowDeleteModal(true)}>Delete</Button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogTitle>Edit Community</DialogTitle>
          <form onSubmit={handleEditCommunity} className="space-y-4">
            <Input
              value={editName}
              onChange={e => setEditName(e.target.value)}
              placeholder="Community name"
              required
            />
            <Textarea
              value={editDescription}
              onChange={e => setEditDescription(e.target.value)}
              placeholder="Description"
              rows={3}
              required
            />
            {editError && <div className="text-red-500 text-sm">{editError}</div>}
            <DialogFooter>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Delete Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogTitle>Delete Community</DialogTitle>
          <DialogDescription>Are you sure you want to delete this community? This action cannot be undone.</DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteCommunity} disabled={deleting}>{deleting ? "Deleting..." : "Delete"}</Button>
          </DialogFooter>
          {deleteError && <div className="text-red-500 text-sm">{deleteError}</div>}
        </DialogContent>
      </Dialog>
      {/* Create Modal (existing) */}
      <Dialog open={showCreateModal} onOpenChange={open => { if (!open) handleCloseModal(); }}>
        <DialogContent>
          <DialogTitle>Create Community</DialogTitle>
          <DialogDescription>
            Name your new community and add a description.
          </DialogDescription>
          <form onSubmit={handleCreateCommunity} className="space-y-4">
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Community name"
              required
            />
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
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
      {/* Barks List (existing) */}
      {community && (
        <>
          <div className="flex items-center justify-between mb-6">
            <Link href={{ pathname: "/barks/submit", query: { communityId } }}>
              <Button variant="primary">Create Bark</Button>
            </Link>
          </div>
          <div className="space-y-4">
            {barks.length === 0 ? (
              <div className="rounded-lg border bg-white p-6 text-center text-muted-foreground">
                No barks yet. Be the first to post in this community!
              </div>
            ) : (
              barks.map((bark) => (
                <div key={bark.id} className="rounded-lg border bg-white p-6 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
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
                    <Button size="icon" variant="ghost" onClick={() => handleVote(bark.id, 1)}>
                      <ArrowUp className="w-4 h-4 text-green-500" />
                    </Button>
                    <span className="font-semibold text-sm">{bark.votes ? bark.votes.reduce((sum: number, v: any) => sum + v.value, 0) : 0}</span>
                    <Button size="icon" variant="ghost" onClick={() => handleVote(bark.id, -1)}>
                      <ArrowDown className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
} 