"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/barks/communities")
      .then(res => res.json())
      .then(data => setCommunities(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Communities</h1>
        <Link href="/barks/communities/create">
          <Button variant="default">Create Community</Button>
        </Link>
      </div>
      <div className="space-y-4">
        {loading ? (
          <div className="rounded-lg border bg-white p-6 text-center text-muted-foreground">Loading...</div>
        ) : communities.length === 0 ? (
          <div className="rounded-lg border bg-white p-6 text-center text-muted-foreground">
            No communities yet. Be the first to create one!
          </div>
        ) : (
          communities.map((c) => (
            <Link key={c.id} href={`/barks/communities/${c.id}`} className="block rounded-lg border bg-white p-4 hover:bg-muted">
              <div className="font-semibold text-primary">b/{c.name}</div>
              <div className="text-xs text-muted-foreground">{c.description}</div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
} 