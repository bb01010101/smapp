"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserButton, SignOutButton } from "@clerk/nextjs";
import { SettingsIcon, UserIcon, ShieldIcon, BellIcon } from "lucide-react";

export default function UserSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-bold">Account Settings</h1>
      </div>

      <div className="grid gap-6">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="w-5 h-5" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: "w-16 h-16",
                    userButtonPopoverCard: "shadow-lg border border-gold-200",
                    userButtonPopoverActionButton: "hover:bg-gold-50",
                    userButtonPopoverActionButtonText: "text-gold-700",
                    userButtonPopoverFooter: "border-t border-gold-200"
                  }
                }}
              />
              <div>
                <p className="text-sm text-muted-foreground">
                  Manage your profile information and preferences
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldIcon className="w-5 h-5" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Manage your account security settings
            </p>
            <div className="space-y-2">
              <p className="text-sm">• Change password</p>
              <p className="text-sm">• Two-factor authentication</p>
              <p className="text-sm">• Connected accounts</p>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BellIcon className="w-5 h-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Control your notification preferences
            </p>
            <div className="space-y-2">
              <p className="text-sm">• Email notifications</p>
              <p className="text-sm">• Push notifications</p>
              <p className="text-sm">• Notification frequency</p>
            </div>
          </CardContent>
        </Card>

        {/* Sign Out Section */}
        <Card>
          <CardHeader>
            <CardTitle>Sign Out</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Sign out of your account
            </p>
            <SignOutButton>
              <Button variant="destructive">
                Sign Out
              </Button>
            </SignOutButton>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 