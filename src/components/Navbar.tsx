import React from 'react'
import Link from "next/link";
import DesktopNavbar from "./DesktopNavbar";
import MobileNavbar from './MobileNavbar';
import { currentUser } from '@clerk/nextjs/server';
import { syncUser } from '@/actions/user.action';
import Image from "next/image";
import { BellIcon, MessageCircleIcon, StoreIcon } from "lucide-react";

async function Navbar() {
  const user = await currentUser();
  if(user) await syncUser(); // POST

  return (
    <>
      {/* Top bar: logo and likes/messages for mobile, full nav for desktop */}
    <nav className="shadow-md sticky top-0 w-full border-b bg-background text-foreground z-50">
      <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center h-16 justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <Image 
                src="/otis.png" 
                alt="Otis Logo" 
                width={40} 
                height={40} 
                className="w-10 h-10"
              />
              <span className="text-4xl font-bold text-foreground tracking-wide" style={{ fontFamily: "'Lobster', cursive", letterSpacing: "0.04em" }}>PetNet</span>
            </Link>
            {/* Likes and messages for mobile, hidden on desktop */}
            <div className="flex md:hidden items-center gap-4">
              <Link href="/marketplace" aria-label="Marketplace">
                <StoreIcon className="w-7 h-7 text-gold-500 hover:text-gold-600 transition" />
              </Link>
              <Link href="/notifications" aria-label="Notifications">
                <BellIcon className="w-7 h-7 text-gold-500 hover:text-gold-600 transition" />
              </Link>
              <Link href="/messages" aria-label="Messages">
                <MessageCircleIcon className="w-7 h-7 text-gold-500 hover:text-gold-600 transition" />
              </Link>
            </div>
            {/* Desktop nav */}
            <div className="hidden md:flex flex-1 items-center justify-end">
            <DesktopNavbar />
            </div>
          </div>
        </div>
      </nav>
      {/* Bottom nav for mobile only */}
      <div className="md:hidden">
        <MobileNavbar />
      </div>
    </>
    );
}

export default Navbar