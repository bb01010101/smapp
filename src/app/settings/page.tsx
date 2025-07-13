"use client";
import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { usePersistentToggle } from "@/components/ui/usePersistentToggle";
import { Button } from "@/components/ui/button";
import { ExternalLinkIcon, BuildingIcon } from "lucide-react";

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
      
      {/* Save n' Swipe Setting */}
      <div className="flex items-center justify-between bg-white rounded-lg shadow p-6 mb-6">
        <div>
          <div className="font-medium text-lg">Save n' Swipe</div>
          <div className="text-gray-500 text-sm">Show Save n' Swipes with Plays</div>
        </div>
        <Switch checked={saveNSwipe} onCheckedChange={setSaveNSwipe} />
      </div>

      {/* Verification Form for Registered Pet Shelters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <BuildingIcon className="w-8 h-8 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-2">Verification Form for Registered Pet Shelters</h3>
            <p className="text-gray-600 text-sm mb-4">
              Are you a registered pet shelter or rescue organization? Apply for verification to get a verified badge and enhanced features on your profile.
            </p>
            <Button 
              onClick={() => window.open('https://docs.google.com/forms/d/e/1FAIpQLSdyQbiQl8uKEcchwX5nLkjpVJneU7uMZ8rc0Oesgt78K98XxA/viewform?usp=dialog', '_blank')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <ExternalLinkIcon className="w-4 h-4 mr-2" />
              Apply for Verification
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 