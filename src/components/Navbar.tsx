import React from 'react'
import Link from "next/link";
import DesktopNavbar from "./DesktopNavbar";
import MobileNavbar from './MobileNavbar';
import { currentUser } from '@clerk/nextjs/server';
import { syncUser } from '@/actions/user.action';
import Image from "next/image";
import { HomeIcon, SearchIcon, PawPrintIcon, MessageCircleIcon, BellIcon, UserIcon } from "lucide-react";

async function Navbar() {
  const user = await currentUser();
  if(user) await syncUser(); // POST

  return (
    <nav className="shadow-md sticky top-0 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center h-16">
          {/* Logo in top left */}
          <Link href="/" className="flex items-center gap-2 mr-6">
            <Image src="/logo.jpeg" alt="PetNet Logo" width={40} height={40} className="rounded-full" />
            <span className="text-2xl font-bold text-gold-700">PetNet</span>
          </Link>
          {/* Main navigation shifted right for balance */}
          <div className="flex-1 flex items-center justify-end">
            <DesktopNavbar />
            <MobileNavbar />
          </div>
        </div>
      </div>
    </nav>  
    );
}

export default Navbar