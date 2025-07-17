'use client';

import { useEffect, useState } from 'react';
import { StarIcon, TrophyIcon } from 'lucide-react';
import toast from 'react-hot-toast';

interface XpToastProps {
  xpGained: number;
  challengeName?: string;
}

export function XpToast({ xpGained, challengeName }: XpToastProps) {
  return (
    <div className="flex items-center gap-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4 shadow-lg">
      <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full">
        <TrophyIcon className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1">
        <div className="font-semibold text-gray-900">
          Challenge Completed!
        </div>
        {challengeName && (
          <div className="text-sm text-gray-600">{challengeName}</div>
        )}
      </div>
      <div className="flex items-center gap-1 text-lg font-bold text-yellow-600">
        <StarIcon className="w-4 h-4" />
        +{xpGained} XP
      </div>
    </div>
  );
}

// Hook to show XP toast
export function useXpToast() {
  const [showToast, setShowToast] = useState(false);
  const [toastData, setToastData] = useState<{ xpGained: number; challengeName?: string } | null>(null);

  const showXpGain = (xpGained: number, challengeName?: string) => {
    setToastData({ xpGained, challengeName });
    setShowToast(true);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  useEffect(() => {
    if (showToast && toastData) {
      toast.custom(
        <XpToast xpGained={toastData.xpGained} challengeName={toastData.challengeName} />,
        { duration: 3000 }
      );
    }
  }, [showToast, toastData]);

  return { showXpGain };
} 