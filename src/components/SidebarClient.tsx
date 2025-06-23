"use client";
import Link from "next/link";
import { HomeIcon, PawPrintIcon, PlayCircle, StoreIcon, DogIcon, MessageCircleIcon, BellIcon, UserIcon } from "lucide-react";

export default function SidebarClient() {
  return (
    <nav className="flex flex-col items-center py-8 gap-8 h-full w-full">
      <Link href="/" className="flex flex-col items-center gap-1 text-foreground hover:text-gold-700 transition">
        <HomeIcon className="w-7 h-7" />
        <span className="text-xs">Home</span>
      </Link>
      <Link href="/pawpad" className="flex flex-col items-center gap-1 text-foreground hover:text-gold-700 transition">
        <PawPrintIcon className="w-7 h-7" />
        <span className="text-xs">PawPad</span>
      </Link>
      <Link href="/plays" className="flex flex-col items-center gap-1 text-foreground hover:text-gold-700 transition">
        <PlayCircle className="w-7 h-7" />
        <span className="text-xs">Plays</span>
      </Link>
      <Link href="/marketplace" className="flex flex-col items-center gap-1 text-foreground hover:text-gold-700 transition">
        <StoreIcon className="w-7 h-7" />
        <span className="text-xs">Market</span>
      </Link>
      <Link href="/barks" className="flex flex-col items-center gap-1 text-foreground hover:text-gold-700 transition">
        <DogIcon className="w-7 h-7" />
        <span className="text-xs">Barks</span>
      </Link>
      <Link href="/messages" className="flex flex-col items-center gap-1 text-foreground hover:text-gold-700 transition">
        <MessageCircleIcon className="w-7 h-7" />
        <span className="text-xs">Messages</span>
      </Link>
      <Link href="/notifications" className="flex flex-col items-center gap-1 text-foreground hover:text-gold-700 transition">
        <BellIcon className="w-7 h-7" />
        <span className="text-xs">Alerts</span>
      </Link>
      <Link href="/profile" className="flex flex-col items-center gap-1 text-foreground hover:text-gold-700 transition">
        <UserIcon className="w-7 h-7" />
        <span className="text-xs">Profile</span>
      </Link>
    </nav>
  );
} 