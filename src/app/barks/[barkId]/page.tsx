"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { isUserVerified } from "@/lib/utils";
import BlueCheckIcon from "@/components/BlueCheckIcon";

function CommentThread({ comments, onReply, onVote, userId, onDelete, onEdit }: {
  comments: any[],
  onReply: (parentId: string) => void,
  onVote: (commentId: string, value: 1 | -1) => void,
  userId: string | undefined,
  onDelete: (commentId: string) => void,
  onEdit: (commentId: string, content: string) => void,
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  if (!comments || comments.length === 0) return null;
  return (
    <ul className="pl-4 border-l">
      {comments.map((comment) => {
        const score = comment.votes ? comment.votes.reduce((sum: number, v: any) => sum + v.value, 0) : 0;
        const isAuthor = userId && comment.author.clerkId === userId;
        return (
          <li key={comment.id} className="mb-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-semibold flex items-center gap-1"><Link href={`/profile/${comment.author.username}`} className="hover:underline">{comment.author.name || comment.author.username}</Link>{isUserVerified(comment.author.username) && (<BlueCheckIcon className="inline-block w-3 h-3 ml-1 align-text-bottom" />)}</span>
              <span>· {new Date(comment.createdAt).toLocaleString()}</span>
            </div>
            {editingId === comment.id ? (
              <form
                onSubmit={e => {
                  e.preventDefault();
                  onEdit(comment.id, editContent);
                  setEditingId(null);
                }}
                className="mb-1"
              >
                <textarea
                  className="w-full border rounded px-2 py-1 text-xs"
                  rows={2}
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  required
                />
                <div className="flex gap-2 mt-1">
                  <Button type="submit" size="sm">Save</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                </div>
              </form>
            ) : (
              <div className="mb-1">{comment.content}</div>
            )}
            <div className="flex items-center gap-2 text-xs mb-1">
              <button
                className="px-1 py-0.5 rounded hover:bg-gray-100"
                aria-label="Upvote comment"
                onClick={() => onVote(comment.id, 1)}
              >
                <ArrowUp size={16} className="text-green-500" />
              </button>
              <span>{score}</span>
              <button
                className="px-1 py-0.5 rounded hover:bg-gray-100"
                aria-label="Downvote comment"
                onClick={() => onVote(comment.id, -1)}
              >
                <ArrowDown size={16} className="text-red-500" />
              </button>
              <button className="text-xs text-primary hover:underline ml-2" onClick={() => onReply(comment.id)}>Reply</button>
              {isAuthor && (
                <>
                  <button className="text-xs text-muted-foreground hover:underline ml-2" onClick={() => { setEditingId(comment.id); setEditContent(comment.content); }}>Edit</button>
                  <button className="text-xs text-red-500 hover:underline ml-1" onClick={() => { if (confirm("Delete this comment?")) onDelete(comment.id); }}>Delete</button>
                </>
              )}
            </div>
            {comment.replies && comment.replies.length > 0 && (
              <CommentThread comments={comment.replies} onReply={onReply} onVote={onVote} userId={userId} onDelete={onDelete} onEdit={onEdit} />
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default function BarkDetailPage() {
  const { barkId } = useParams() as { barkId: string };
  const router = useRouter();
  const { user } = useUser();
  const userId = user?.id;
  const [bark, setBark] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingBark, setEditingBark] = useState(false);
  const [editBarkTitle, setEditBarkTitle] = useState("");
  const [editBarkContent, setEditBarkContent] = useState("");

  useEffect(() => {
    async function fetchBarkAndComments() {
      setLoading(true);
      const barkRes = await fetch(`/api/barks?barkId=${barkId}`);
      const barks = await barkRes.json();
      setBark(Array.isArray(barks) ? barks.find((b: any) => b.id === barkId) : null);
      const commentsRes = await fetch(`/api/barks/${barkId}/comments`);
      setComments(await commentsRes.json());
      setLoading(false);
    }
    fetchBarkAndComments();
  }, [barkId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;
    setSubmitting(true);
    await fetch(`/api/barks/${barkId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: commentContent, parentId: replyTo }),
    });
    setCommentContent("");
    setReplyTo(null);
    // Refetch comments
    const commentsRes = await fetch(`/api/barks/${barkId}/comments`);
    setComments(await commentsRes.json());
    setSubmitting(false);
  };

  // Optimistic UI update for comment voting
  const handleVote = async (commentId: string, value: 1 | -1) => {
    setComments(prev => {
      // Recursively update the comment tree
      function updateVotes(comments: any[]): any[] {
        return comments.map(comment => {
          if (comment.id === commentId) {
            let existing = comment.votes.find((v: any) => v.userId === "me"); // TODO: Replace with real userId if available
            if (existing) {
              if (existing.value === value) {
                // Remove vote
                return { ...comment, votes: comment.votes.filter((v: any) => v.userId !== "me") };
              } else {
                // Change vote
                return { ...comment, votes: comment.votes.map((v: any) => v.userId === "me" ? { ...v, value } : v) };
              }
            } else {
              // New vote
              return { ...comment, votes: [...comment.votes, { userId: "me", value }] };
            }
          } else if (comment.replies && comment.replies.length > 0) {
            return { ...comment, replies: updateVotes(comment.replies) };
          } else {
            return comment;
          }
        });
      }
      return updateVotes(prev);
    });
    // Call API
    await fetch("/api/barks/comments/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId, value }),
    });
    // Optionally, refetch comments for real data
  };

  const handleDeleteBark = async () => {
    if (!bark) return;
    if (!confirm("Delete this Bark?")) return;
    const res = await fetch(`/api/barks/${bark.id}/delete`, { method: "POST" });
    if (res.ok) {
      router.push("/barks");
    }
  };

  const handleEditBark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bark) return;
    const res = await fetch(`/api/barks/${bark.id}/edit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editBarkTitle, content: editBarkContent }),
    });
    if (res.ok) {
      setEditingBark(false);
      // Refetch bark
      const barkRes = await fetch(`/api/barks?barkId=${barkId}`);
      const barks = await barkRes.json();
      setBark(Array.isArray(barks) ? barks.find((b: any) => b.id === barkId) : null);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    await fetch(`/api/barks/comments/${commentId}/delete`, { method: "POST" });
    // Refetch comments
    const commentsRes = await fetch(`/api/barks/${barkId}/comments`);
    setComments(await commentsRes.json());
  };

  const handleEditComment = async (commentId: string, content: string) => {
    await fetch(`/api/barks/comments/${commentId}/edit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    // Refetch comments
    const commentsRes = await fetch(`/api/barks/${barkId}/comments`);
    setComments(await commentsRes.json());
  };

  const isBarkAuthor = userId && bark && bark.author.clerkId === userId;

  if (loading) return <div className="max-w-2xl mx-auto py-8 px-4">Loading...</div>;
  if (!bark) return <div className="max-w-2xl mx-auto py-8 px-4">Bark not found.</div>;

  const backButton = bark.community ? (
    <Link href={`/barks/communities/${bark.community.id}`} className="text-primary hover:underline text-sm">← Back to b/{bark.community.name}</Link>
  ) : (
    <Link href="/barks" className="text-primary hover:underline text-sm">← Back to Barks</Link>
  );

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {backButton}
      <div className="rounded-lg border bg-white p-6 flex flex-col gap-2 mt-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          {bark.community && (
            <span className="font-semibold text-primary">b/{bark.community.name}</span>
          )}
          <span>by <Link href={`/profile/${bark.author.username}`} className="hover:underline flex items-center gap-1">{bark.author.name || bark.author.username}{isUserVerified(bark.author.username) && (<BlueCheckIcon className="inline-block w-4 h-4 ml-1 align-text-bottom" />)}</Link></span>
          <span>· {new Date(bark.createdAt).toLocaleString()}</span>
        </div>
        {editingBark ? (
          <form onSubmit={handleEditBark} className="flex flex-col gap-2 mt-2">
            <input
              className="border rounded px-2 py-1"
              value={editBarkTitle}
              onChange={e => setEditBarkTitle(e.target.value)}
              required
            />
            <textarea
              className="border rounded px-2 py-1"
              rows={4}
              value={editBarkContent}
              onChange={e => setEditBarkContent(e.target.value)}
              required
            />
            <div className="flex gap-2">
              <Button type="submit">Save</Button>
              <Button type="button" variant="outline" onClick={() => setEditingBark(false)}>Cancel</Button>
            </div>
          </form>
        ) : (
          <>
            <h2 className="text-lg font-bold mb-1">{bark.title}</h2>
            <p className="text-sm text-muted-foreground mb-2">{bark.content}</p>
            {isBarkAuthor && (
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="outline" onClick={() => { setEditingBark(true); setEditBarkTitle(bark.title); setEditBarkContent(bark.content); }}>Edit</Button>
                <Button size="sm" variant="destructive" onClick={handleDeleteBark}>Delete</Button>
              </div>
            )}
          </>
        )}
      </div>
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">Comments</h3>
        <form onSubmit={handleSubmit} className="mb-4 flex flex-col gap-2">
          {replyTo && (
            <div className="text-xs text-muted-foreground mb-1">
              Replying to a comment. <button type="button" className="underline" onClick={() => setReplyTo(null)}>Cancel</button>
            </div>
          )}
          <textarea
            className="w-full border rounded px-3 py-2"
            rows={3}
            value={commentContent}
            onChange={e => setCommentContent(e.target.value)}
            placeholder={replyTo ? "Write a reply..." : "Write a comment..."}
            required
          />
          <Button type="submit" disabled={submitting || !commentContent.trim()}>
            {submitting ? "Posting..." : replyTo ? "Reply" : "Comment"}
          </Button>
        </form>
        <CommentThread
          comments={comments}
          onReply={setReplyTo}
          onVote={handleVote}
          userId={userId}
          onDelete={handleDeleteComment}
          onEdit={handleEditComment}
        />
      </div>
    </div>
  );
} 