"use client";

import { useEffect } from 'react';

export default function ColorPreferenceLoader() {
  useEffect(() => {
    const saved = localStorage.getItem('app-theme');
    if (saved) {
      const { background, foreground } = JSON.parse(saved);
      const root = document.documentElement;
      if (background) root.style.setProperty('--background', background);
      if (foreground) root.style.setProperty('--foreground', foreground);
    }
  }, []);

  return null; // This component doesn't render anything
} 