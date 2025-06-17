"use client";

import {
  BellIcon,
  HomeIcon,
  LogOutIcon,
  MenuIcon,
  MoonIcon,
  SunIcon,
  UserIcon,
  PawPrintIcon,
  StoreIcon,
  MessageCircleIcon,
  PlayCircle,
  DogIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { useAuth, SignInButton, SignOutButton, useUser } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import Link from "next/link";

function MobileNavbar() {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex md:hidden items-center space-x-2 bg-gold-100 text-gold-700">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="mr-2 hover:bg-transparent focus:bg-transparent"
      >
        <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>

      <Sheet open={showMobileMenu} onOpenChange={setShowMobileMenu}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <MenuIcon className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[300px]">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col space-y-4 mt-6">
            <Button variant="ghost" className="flex items-center gap-3 justify-start hover:bg-transparent focus:bg-transparent" asChild>
              <Link href="/">
                <HomeIcon className="w-6 h-6 text-gold-500 hover:text-gold-600 transition" />
                Home
              </Link>
            </Button>

            <Button variant="ghost" className="flex items-center gap-3 justify-start hover:bg-transparent focus:bg-transparent" asChild>
              <Link href="/pawpad">
                <PawPrintIcon className="w-6 h-6 text-gold-500 hover:text-gold-600 transition" />
                PawPad
              </Link>
            </Button>

            <Button variant="ghost" className="flex items-center gap-3 justify-start hover:bg-transparent focus:bg-transparent" asChild>
              <Link href="/plays">
                <PlayCircle className="w-6 h-6 text-gold-500 hover:text-gold-600 transition" />
                Plays
              </Link>
            </Button>

            <Button variant="ghost" className="flex items-center gap-3 justify-start hover:bg-transparent focus:bg-transparent" asChild>
              <Link href="/marketplace">
                <StoreIcon className="w-6 h-6 text-gold-500 hover:text-gold-600 transition" />
                Marketplace
              </Link>
            </Button>

            <Button variant="ghost" className="flex items-center gap-3 justify-start hover:bg-transparent focus:bg-transparent" asChild>
              <Link href="/barks">
                <DogIcon className="w-6 h-6 text-gold-500 hover:text-gold-600 transition" />
                Barks
              </Link>
            </Button>

            {isSignedIn ? (
              <Button variant="ghost" className="flex items-center gap-3 justify-start hover:bg-transparent focus:bg-transparent" asChild>
                <Link href="/messages">
                  <MessageCircleIcon className="w-6 h-6 text-gold-500 hover:text-gold-600 transition" />
                  Messages
                </Link>
              </Button>
            ) : (
              <SignInButton mode="modal">
                <Button variant="default" className="w-full">
                  Sign In
                </Button>
              </SignInButton>
            )}

            {isSignedIn ? (
              <Button variant="ghost" className="flex items-center gap-3 justify-start hover:bg-transparent focus:bg-transparent" asChild>
                <Link href="/notifications">
                  <BellIcon className="w-6 h-6 text-gold-500 hover:text-gold-600 transition" />
                  Notifications
                </Link>
              </Button>
            ) : (
              <SignInButton mode="modal">
                <Button variant="default" className="w-full">
                  Sign In
                </Button>
              </SignInButton>
            )}

            {isSignedIn ? (
              <Button variant="ghost" className="flex items-center gap-3 justify-start hover:bg-transparent focus:bg-transparent" asChild>
                <Link href={`/profile/${user?.username ?? user?.emailAddresses[0].emailAddress.split("@")[0]}`}> 
                  <UserIcon className="w-6 h-6 text-gold-500 hover:text-gold-600 transition" />
                  Profile
                </Link>
              </Button>
            ) : (
              <SignInButton mode="modal">
                <Button variant="default" className="w-full">
                  Sign In
                </Button>
              </SignInButton>
            )}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default MobileNavbar;