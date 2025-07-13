"use client";

import { useUser } from "@clerk/nextjs";
import { SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { ReactNode } from "react";

interface ProfileLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}

export default function ProfileLink({ href, children, className }: ProfileLinkProps) {
  const { isSignedIn } = useUser();

  if (isSignedIn) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <SignInButton mode="modal">
      <div className={className} style={{ cursor: 'pointer' }}>
        {children}
      </div>
    </SignInButton>
  );
} 