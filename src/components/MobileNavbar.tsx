"use client";

import {
  BellIcon,
  HomeIcon,
  LogOutIcon,
  MenuIcon,
  UserIcon,
  PawPrintIcon,
  StoreIcon,
  MessageCircleIcon,
  PlayCircle,
  DogIcon,
  SettingsIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { useAuth, SignInButton, SignOutButton, useUser, UserButton } from "@clerk/nextjs";
import ProfileDropdown from "./ProfileDropdown";
import SettingsDropdown from "./SettingsDropdown";
import Link from "next/link";
import { useTheme } from "next-themes";

function MobileNavbar() {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { theme } = useTheme();

  const sheetBg = theme === "dark"
    ? { backgroundColor: "#111" }
    : { backgroundColor: "var(--background)" };

  return (
    <div className="flex md:hidden items-center space-x-2 bg-background text-foreground">
      {/* Hamburger menu only, no UserButton or ProfileDropdown outside */}
      <Sheet open={showMobileMenu} onOpenChange={setShowMobileMenu}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <MenuIcon className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[300px] bg-background">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col space-y-4 mt-6">
            <Button variant="ghost" className="flex items-center gap-3 justify-start hover:bg-transparent focus:bg-transparent" asChild>
              <Link href="/" onClick={() => setShowMobileMenu(false)}>
                <HomeIcon className="w-6 h-6 text-gold-500 hover:text-gold-600 transition" />
                Home
              </Link>
            </Button>
            <Button variant="ghost" className="flex items-center gap-3 justify-start hover:bg-transparent focus:bg-transparent" asChild>
              <Link href="/pawpad" onClick={() => setShowMobileMenu(false)}>
                <PawPrintIcon className="w-6 h-6 text-gold-500 hover:text-gold-600 transition" />
                PawPad
              </Link>
            </Button>
            <Button variant="ghost" className="flex items-center gap-3 justify-start hover:bg-transparent focus:bg-transparent" asChild>
              <Link href="/plays" onClick={() => setShowMobileMenu(false)}>
                <PlayCircle className="w-6 h-6 text-gold-500 hover:text-gold-600 transition" />
                Plays
              </Link>
            </Button>
            <Button variant="ghost" className="flex items-center gap-3 justify-start hover:bg-transparent focus:bg-transparent" asChild>
              <Link href="/marketplace" onClick={() => setShowMobileMenu(false)}>
                <StoreIcon className="w-6 h-6 text-gold-500 hover:text-gold-600 transition" />
                Marketplace
              </Link>
            </Button>
            <Button variant="ghost" className="flex items-center gap-3 justify-start hover:bg-transparent focus:bg-transparent" asChild>
              <Link href="/barks" onClick={() => setShowMobileMenu(false)}>
                <DogIcon className="w-6 h-6 text-gold-500 hover:text-gold-600 transition" />
                Barks
              </Link>
            </Button>
            {isSignedIn && (
              <>
                <div className="pt-4 border-t border-gold-200">
                  <ProfileDropdown />
                </div>
                <div className="pt-2">
                  <SettingsDropdown />
                </div>
                <div className="mb-4">
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
            )}
            {!isSignedIn && (
              <div className="pt-4 border-t border-gold-200">
                <SignInButton mode="modal">
                  <Button variant="default" className="w-full">
                    Sign In
                  </Button>
                </SignInButton>
              </div>
            )}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default MobileNavbar;