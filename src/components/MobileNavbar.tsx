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
  SettingsIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { useAuth, SignInButton, SignOutButton, useUser, UserButton } from "@clerk/nextjs";
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

      {/* UserButton for mobile - shows when signed in */}
      {isSignedIn && (
        <div className="mr-2">
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
      )}

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

            {isSignedIn ? (
              <>
                <Button variant="ghost" className="flex items-center gap-3 justify-start hover:bg-transparent focus:bg-transparent" asChild>
                  <Link href="/messages" onClick={() => setShowMobileMenu(false)}>
                    <MessageCircleIcon className="w-6 h-6 text-gold-500 hover:text-gold-600 transition" />
                    Messages
                  </Link>
                </Button>

                <Button variant="ghost" className="flex items-center gap-3 justify-start hover:bg-transparent focus:bg-transparent" asChild>
                  <Link href="/notifications" onClick={() => setShowMobileMenu(false)}>
                    <BellIcon className="w-6 h-6 text-gold-500 hover:text-gold-600 transition" />
                    Notifications
                  </Link>
                </Button>

                <Button variant="ghost" className="flex items-center gap-3 justify-start hover:bg-transparent focus:bg-transparent" asChild>
                  <Link href={`/profile/${user?.username ?? user?.emailAddresses[0].emailAddress.split("@")[0]}`} onClick={() => setShowMobileMenu(false)}> 
                    <UserIcon className="w-6 h-6 text-gold-500 hover:text-gold-600 transition" />
                    Profile
                  </Link>
                </Button>

                {/* Account management section */}
                <div className="pt-4 border-t border-gold-200">
                  <div className="text-sm font-medium text-gold-700 mb-2 px-2">Account</div>
                  
                  <Button variant="ghost" className="flex items-center gap-3 justify-start hover:bg-transparent focus:bg-transparent w-full" asChild>
                    <Link href="/user" onClick={() => setShowMobileMenu(false)}>
                      <SettingsIcon className="w-6 h-6 text-gold-500 hover:text-gold-600 transition" />
                      Settings
                    </Link>
                  </Button>

                  <SignOutButton>
                    <Button variant="ghost" className="flex items-center gap-3 justify-start hover:bg-transparent focus:bg-transparent w-full text-red-600 hover:text-red-700">
                      <LogOutIcon className="w-6 h-6" />
                      Sign Out
                    </Button>
                  </SignOutButton>
                </div>
              </>
            ) : (
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