'use client';
import { useState } from 'react';
import ChallengeSidebar from './ChallengeSidebar';

export default function ChallengeDropdown() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl shadow bg-white/90 border border-gray-100">
      <button
        className="w-full flex items-center justify-between px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50 rounded-t-xl focus:outline-none"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <span>XP Challenges</span>
        <span className={`transition-transform ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {open && (
        <div className="p-2 pt-0">
          <ChallengeSidebar className="shadow-none border-none bg-transparent" />
        </div>
      )}
    </div>
  );
} 