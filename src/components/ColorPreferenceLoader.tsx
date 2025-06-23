"use client";

import { useEffect } from 'react';

export default function ColorPreferenceLoader() {
  useEffect(() => {
    // Load saved color preferences from localStorage
    const savedHue = localStorage.getItem('app-hue');
    const savedSaturation = localStorage.getItem('app-saturation');
    const savedLightness = localStorage.getItem('app-lightness');
    
    if (savedHue && savedSaturation && savedLightness) {
      const root = document.documentElement;
      root.style.setProperty(
        '--foreground', 
        `${savedHue} ${savedSaturation}% ${savedLightness}%`
      );
    }
  }, []);

  return null; // This component doesn't render anything
} 