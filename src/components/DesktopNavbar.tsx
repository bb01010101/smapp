import { BellIcon, HomeIcon, UserIcon, PawPrintIcon, StoreIcon, MessageCircleIcon, PlayCircle, DogIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SignInButton, UserButton } from "@clerk/nextjs";
import ModeToggle from "./ModeToggle";
import { currentUser } from "@clerk/nextjs/server";

async function DesktopNavbar() {
  const user = await currentUser();

  return (
    <div className="hidden md:flex items-center space-x-4 bg-background text-gold-700">
      <ModeToggle />

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
          <Button variant="ghost" className="flex items-center gap-2 hover:bg-transparent focus:bg-transparent" asChild>
            <Link href="/messages">
              <MessageCircleIcon className="w-6 h-6 text-gold-500 hover:text-gold-600 transition" />
              <span className="hidden lg:inline">Messages</span>
            </Link>
          </Button>
          <Button variant="ghost" className="flex items-center gap-2 hover:bg-transparent focus:bg-transparent" asChild>
            <Link href="/notifications">
              <BellIcon className="w-6 h-6 text-gold-500 hover:text-gold-600 transition" />
              <span className="hidden lg:inline">Notifications</span>
            </Link>
          </Button>
          <Button variant="ghost" className="flex items-center gap-2 hover:bg-transparent focus:bg-transparent" asChild>
            <Link
              href={`/profile/${user.username ?? user.emailAddresses[0].emailAddress.split("@")[0]}`}
            >
              <UserIcon className="w-6 h-6 text-gold-500 hover:text-gold-600 transition" />
              <span className="hidden lg:inline">Profile</span>
            </Link>
          </Button>
          
          {/* Clerk UserButton for account management */}
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