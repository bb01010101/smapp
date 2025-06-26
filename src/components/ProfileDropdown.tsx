"use client";

import * as React from "react";
import { 
  BellIcon, 
  MessageCircleIcon, 
  UserIcon,
  LogOutIcon 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SignOutButton, useUser } from "@clerk/nextjs";
import Link from "next/link";

export default function ProfileDropdown() {
  const { user } = useUser();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="hover:bg-transparent focus:bg-transparent">
          <UserIcon className="h-5 w-5 text-gold-500 hover:text-gold-600 transition" />
          <span className="sr-only">Profile</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel asChild>
          <Link
            href={`/profile/${user?.username ?? user?.emailAddresses[0].emailAddress.split("@")[0]}`}
            className="flex items-center gap-2 font-bold cursor-pointer px-2 py-1.5 rounded-md transition-colors hover:bg-accent focus:bg-accent"
          >
            <UserIcon className="h-4 w-4 text-gold-500" />
            Profile
          </Link>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {/* Messages */}
        <DropdownMenuItem asChild>
          <Link href="/messages" className="flex items-center gap-2 cursor-pointer">
            <MessageCircleIcon className="h-4 w-4 text-gold-500" />
            <span>Messages</span>
          </Link>
        </DropdownMenuItem>
        {/* Notifications */}
        <DropdownMenuItem asChild>
          <Link href="/notifications" className="flex items-center gap-2 cursor-pointer">
            <BellIcon className="h-4 w-4 text-gold-500" />
            <span>Notifications</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {/* Sign Out Button */}
        <SignOutButton>
          <DropdownMenuItem className="flex items-center gap-2 text-red-600 hover:text-red-700 cursor-pointer">
            <LogOutIcon className="h-4 w-4" />
            <span>Sign Out</span>
          </DropdownMenuItem>
        </SignOutButton>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 