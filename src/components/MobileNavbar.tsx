"use client";

import {
  BellIcon,
  HomeIcon,
  UserIcon,
  PawPrintIcon,
  StoreIcon,
  MessageCircleIcon,
  PlayCircle,
  DogIcon,
  PlusIcon,
} from "lucide-react";
import Link from "next/link";
import { useAuth, useUser } from "@clerk/nextjs";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import CreatePost from "./CreatePost";
import React from "react";

function MobileNavbar() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [open, setOpen] = React.useState(false);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-gold-200 flex md:hidden justify-around items-center h-16 shadow-lg">
      <Link href="/" className="flex flex-col items-center justify-center flex-1 py-2">
        <HomeIcon className="w-7 h-7 text-gold-500" />
              </Link>
      <Link href="/pawpad" className="flex flex-col items-center justify-center flex-1 py-2">
        <PawPrintIcon className="w-7 h-7 text-gold-500" />
              </Link>
      <Link href="/marketplace" className="flex flex-col items-center justify-center flex-1 py-2">
        <StoreIcon className="w-7 h-7 text-gold-500" />
              </Link>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button
            className="flex items-center justify-center rounded-full bg-gold-500 text-white shadow-lg w-14 h-14 -mt-8 border-4 border-background focus:outline-none focus:ring-2 focus:ring-gold-400"
            aria-label="Create Post"
            style={{ zIndex: 60 }}
          >
            <PlusIcon className="w-8 h-8" />
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-lg w-full p-0">
          <CreatePost />
        </DialogContent>
      </Dialog>
      <Link href="/plays" className="flex flex-col items-center justify-center flex-1 py-2">
        <PlayCircle className="w-7 h-7 text-gold-500" />
              </Link>
      <Link href="/barks" className="flex flex-col items-center justify-center flex-1 py-2">
        <DogIcon className="w-7 h-7 text-gold-500" />
              </Link>
      <Link href={isSignedIn && user ? `/profile/${user.username ?? user.emailAddresses?.[0]?.emailAddress?.split("@")[0]}` : "/profile"} className="flex flex-col items-center justify-center flex-1 py-2">
        <UserIcon className="w-7 h-7 text-gold-500" />
                  </Link>
          </nav>
  );
}

export default MobileNavbar;