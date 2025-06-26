"use client";

import * as React from "react";
import { MoonIcon, SunIcon, SettingsIcon, PaletteIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";

export default function SettingsDropdown() {
  const { theme, setTheme } = useTheme();
  // Default colors
  const defaultColors = {
    background: "#fffbea", // gold-50
    foreground: "#228B22" // light forest green
  };
  const [colors, setColors] = useState({
    background: defaultColors.background,
    foreground: defaultColors.foreground,
  });
  const [colorThemeOpen, setColorThemeOpen] = useState(false);

  // Load saved color preferences and Save n' Swipe from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('app-theme');
    if (saved) {
      setColors(JSON.parse(saved));
    }
  }, []);

  // Update CSS custom properties when colors change
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--background', colors.background);
    root.style.setProperty('--foreground', colors.foreground);
    localStorage.setItem('app-theme', JSON.stringify(colors));
  }, [colors]);

  const handleColorChange = (key: keyof typeof colors, value: string) => {
    setColors((prev) => ({ ...prev, [key]: value }));
  };

  const resetToDefault = () => {
    setColors(defaultColors);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="hover:bg-transparent focus:bg-transparent">
            <SettingsIcon className="h-5 w-5 text-gold-500 hover:text-gold-600 transition" />
            <span className="sr-only">Settings</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel asChild>
            <Link href="/settings" className="flex items-center gap-2 font-bold cursor-pointer px-2 py-1.5 rounded-md transition-colors hover:bg-accent focus:bg-accent">
              <SettingsIcon className="h-4 w-4 text-gold-500" />
              Settings
            </Link>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {/* Theme Toggle */}
          <DropdownMenuItem 
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              {theme === "dark" ? (
                <SunIcon className="h-4 w-4 text-gold-500 hover:text-gold-600 transition" />
              ) : (
                <MoonIcon className="h-4 w-4 text-gold-500 hover:text-gold-600 transition" />
              )}
              <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {/* Color Theme Button */}
          <DropdownMenuItem
            onClick={() => setColorThemeOpen(true)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <PaletteIcon className="h-4 w-4 text-gold-500" />
            <span>Color Theme</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {/* Color Theme Modal */}
      <Dialog open={colorThemeOpen} onOpenChange={setColorThemeOpen}>
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Color Theme</DialogTitle>
          </DialogHeader>
          {/* App Theme Color Picker */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-xs">
              <span>App Theme</span>
              <span>{colors.background}</span>
            </div>
            <input type="color" value={colors.background} onChange={e => handleColorChange('background', e.target.value)} className="w-12 h-8 border rounded" />
          </div>
          {/* Text Color Picker */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-xs">
              <span>Text</span>
              <span>{colors.foreground}</span>
            </div>
            <input type="color" value={colors.foreground} onChange={e => handleColorChange('foreground', e.target.value)} className="w-12 h-8 border rounded" />
          </div>
          <div className="text-xs text-muted-foreground pt-2">Default text color is light forest green (#228B22). If you don't see changes, try reloading the page.</div>
          {/* Reset Button */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={resetToDefault}
            className="w-full text-xs mt-4"
          >
            Reset to Default
          </Button>
          <Button 
            variant="secondary"
            size="sm"
            onClick={() => setColorThemeOpen(false)}
            className="w-full text-xs mt-2"
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
} 