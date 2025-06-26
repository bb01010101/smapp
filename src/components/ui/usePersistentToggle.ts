import { useState, useEffect } from "react";

export function usePersistentToggle(key: string, defaultValue: boolean = true): [boolean, (val: boolean) => void] {
  // Synchronous read for initial value
  const getInitial = () => {
    if (typeof window === 'undefined') return defaultValue;
    const stored = localStorage.getItem(key);
    return stored === null ? defaultValue : stored === 'true';
  };

  const [value, setValue] = useState(getInitial);

  // Update localStorage when value changes
  useEffect(() => {
    localStorage.setItem(key, value.toString());
  }, [key, value]);

  // Listen for changes from other tabs/pages
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === key) {
        setValue(e.newValue === null ? defaultValue : e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [key, defaultValue]);

  return [value, setValue];
} 