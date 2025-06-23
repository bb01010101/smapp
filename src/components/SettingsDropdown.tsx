"use client";

import * as React from "react";
import { MoonIcon, SunIcon, SettingsIcon, PaletteIcon, ArrowLeftIcon, LogOutIcon } from "lucide-react";
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
import { Slider } from "@/components/ui/slider";
import { useState, useEffect } from "react";
import { SignOutButton } from "@clerk/nextjs";

export default function SettingsDropdown() {
  const { theme, setTheme } = useTheme();
  const [hue, setHue] = useState(120); // Default forest green hue
  const [saturation, setSaturation] = useState(61); // Default saturation
  const [lightness, setLightness] = useState(34); // Default lightness
  const [showColorTheme, setShowColorTheme] = useState(false);

  // Load saved color preferences from localStorage
  useEffect(() => {
    const savedHue = localStorage.getItem('app-hue');
    const savedSaturation = localStorage.getItem('app-saturation');
    const savedLightness = localStorage.getItem('app-lightness');
    
    if (savedHue) setHue(parseInt(savedHue));
    if (savedSaturation) setSaturation(parseInt(savedSaturation));
    if (savedLightness) setLightness(parseInt(savedLightness));
  }, []);

  // Update CSS custom property when color changes
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--foreground', `${hue} ${saturation}% ${lightness}%`);
    
    // Save to localStorage
    localStorage.setItem('app-hue', hue.toString());
    localStorage.setItem('app-saturation', saturation.toString());
    localStorage.setItem('app-lightness', lightness.toString());
  }, [hue, saturation, lightness]);

  const handleHueChange = (value: number[]) => {
    setHue(value[0]);
  };

  const handleSaturationChange = (value: number[]) => {
    setSaturation(value[0]);
  };

  const handleLightnessChange = (value: number[]) => {
    setLightness(value[0]);
  };

  const resetToDefault = () => {
    setHue(120);
    setSaturation(61);
    setLightness(34);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="hover:bg-transparent focus:bg-transparent">
          <SettingsIcon className="h-5 w-5 text-gold-500 hover:text-gold-600 transition" />
          <span className="sr-only">Settings</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        {!showColorTheme ? (
          <>
            <DropdownMenuLabel className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4 text-gold-500" />
              Settings
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
              onClick={() => setShowColorTheme(true)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <PaletteIcon className="h-4 w-4 text-gold-500" />
              <span>Color Theme</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* Sign Out Button */}
            <SignOutButton>
              <DropdownMenuItem className="flex items-center gap-2 text-red-600 hover:text-red-700 cursor-pointer">
                <LogOutIcon className="h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </SignOutButton>
          </>
        ) : (
          <div className="p-4 space-y-4">
            <button
              className="flex items-center gap-2 text-sm font-medium mb-2 hover:underline"
              onClick={() => setShowColorTheme(false)}
              type="button"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back
            </button>
            <div className="flex items-center gap-2">
              <PaletteIcon className="h-4 w-4 text-gold-500" />
              <span className="text-sm font-medium">Color Theme</span>
            </div>
            {/* Hue Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Hue</span>
                <span>{hue}°</span>
              </div>
              <Slider
                value={[hue]}
                onValueChange={handleHueChange}
                max={360}
                min={0}
                step={1}
                className="w-full"
              />
            </div>
            {/* Saturation Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Saturation</span>
                <span>{saturation}%</span>
              </div>
              <Slider
                value={[saturation]}
                onValueChange={handleSaturationChange}
                max={100}
                min={0}
                step={1}
                className="w-full"
              />
            </div>
            {/* Lightness Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Lightness</span>
                <span>{lightness}%</span>
              </div>
              <Slider
                value={[lightness]}
                onValueChange={handleLightnessChange}
                max={100}
                min={0}
                step={1}
                className="w-full"
              />
            </div>
            {/* Color Preview */}
            <div className="flex items-center gap-2 pt-2">
              <span className="text-xs">Preview:</span>
              <div 
                className="w-6 h-6 rounded border"
                style={{ backgroundColor: `hsl(${hue}, ${saturation}%, ${lightness}%)` }}
              />
              <span className="text-xs font-mono">
                hsl({hue}, {saturation}%, {lightness}%)
              </span>
            </div>
            {/* Reset Button */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={resetToDefault}
              className="w-full text-xs"
            >
              Reset to Default
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 