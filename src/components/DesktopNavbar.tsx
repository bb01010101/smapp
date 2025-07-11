"use client";

import { BellIcon, HomeIcon, UserIcon, PawPrintIcon, StoreIcon, MessageCircleIcon, PlayCircle, DogIcon, SettingsIcon, HeartIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import ProfileDropdown from "./ProfileDropdown";
import SettingsDropdown from "./SettingsDropdown";

function DesktopNavbar() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="hidden md:flex items-center space-x-4 bg-background text-foreground">
        <div className="animate-pulse bg-gray-200 h-6 w-20 rounded"></div>
        <div className="animate-pulse bg-gray-200 h-6 w-20 rounded"></div>
        <div className="animate-pulse bg-gray-200 h-6 w-20 rounded"></div>
      </div>
    );
  }

  return (
    <div className="hidden md:flex items-center space-x-4 bg-background text-foreground">
      <Button variant="ghost" className="flex items-center gap-2 hover:bg-transparent focus:bg-transparent" asChild>
        <Link href="/">
          <HomeIcon className="w-6 h-6 text-gold-500 hover:text-gold-600 transition" />
          <span className="hidden lg:inline">Home</span>
        </Link>
      </Button>

      <Button variant="ghost" className="flex items-center gap-2 hover:bg-transparent focus:bg-transparent" asChild>
        <Link href="/pawpad">
          <PawPrintIcon className="w-6 h-6 text-gold-500 hover:text-gold-600 transition" />
          <span className="hidden lg:inline">PawPad</span>
        </Link>
      </Button>

      <Button variant="ghost" className="flex items-center gap-2 hover:bg-transparent focus:bg-transparent" asChild>
        <Link href="/plays">
          <PlayCircle className="w-6 h-6 text-gold-500 hover:text-gold-600 transition" />
          <span className="hidden lg:inline">Plays</span>
        </Link>
      </Button>

      <Button variant="ghost" className="flex items-center gap-2 hover:bg-transparent focus:bg-transparent" asChild>
        <Link href="/swipensave">
          <HeartIcon className="w-6 h-6 text-gold-500 hover:text-gold-600 transition" />
          <span className="hidden lg:inline">Swipe n Save</span>
        </Link>
      </Button>

      <Button variant="ghost" className="flex items-center gap-2 hover:bg-transparent focus:bg-transparent" asChild>
        <Link href="/marketplace">
          <StoreIcon className="w-6 h-6 text-gold-500 hover:text-gold-600 transition" />
          <span className="hidden lg:inline">Marketplace</span>
        </Link>
      </Button>

      <Button variant="ghost" className="flex items-center gap-2 hover:bg-transparent focus:bg-transparent" asChild>
        <Link href="/barks">
          <DogIcon className="w-6 h-6 text-gold-500 hover:text-gold-600 transition" />
          <span className="hidden lg:inline">Barks</span>
        </Link>
      </Button>

      {user ? (
        <>
          <ProfileDropdown showLabel />
          <SettingsDropdown showLabel />
          <div className="ml-2">
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8",
                  userButtonPopoverCard: "shadow-lg border border-gold-200",
                  userButtonPopoverActionButton: "hover:bg-gold-50",
                  userButtonPopoverActionButtonText: "text-gold-700",
                  userButtonPopoverFooter: "border-t border-gold-200"
                }
              }}
            />
          </div>
        </>
      ) : (
        <SignInButton mode="modal">
          <Button variant="default">Sign In</Button>
        </SignInButton>
      )}
    </div>
  );
}
export default DesktopNavbar;