"use client";
import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { usePersistentToggle } from "@/components/ui/usePersistentToggle";

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [saveNSwipe, setSaveNSwipe] = usePersistentToggle('save-n-swipe', true);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="max-w-xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      <div className="flex items-center justify-between bg-white rounded-lg shadow p-6 mb-4">
        <div>
          <div className="font-medium text-lg">Save n' Swipe</div>
          <div className="text-gray-500 text-sm">Show Save n' Swipes with Plays</div>
        </div>
        <Switch checked={saveNSwipe} onCheckedChange={setSaveNSwipe} />
      </div>
    </div>
  );
} 