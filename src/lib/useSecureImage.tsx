"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { isPrivateS3Url } from './s3';

interface UseSecureImageReturn {
  src: string | null;
  loading: boolean;
  error: string | null;
}

// Cache for presigned URLs to avoid repeated API calls
const urlCache = new Map<string, { url: string; expires: number }>();

export function useSecureImage(originalUrl: string | null | undefined): UseSecureImageReturn {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadSecureUrl = useCallback(async (url: string) => {
    // Check if it's a private S3 URL that needs presigned access
    if (!isPrivateS3Url(url)) {
      setSrc(url);
      setLoading(false);
      return;
    }

        // Check cache first
    const cached = urlCache.get(url);
    if (cached && cached.expires > Date.now()) {
      setSrc(cached.url);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`/api/images/presigned?url=${encodeURIComponent(url)}`, {
        signal: abortControllerRef.current.signal,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get presigned URL: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Cache the presigned URL (expires in 50 minutes, refresh before 1 hour)
      urlCache.set(url, {
        url: data.url,
        expires: Date.now() + (50 * 60 * 1000), // 50 minutes
      });

      setSrc(data.url);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was aborted, ignore
        return;
      }

      console.error('Error loading secure image:', err);
      setError(err instanceof Error ? err.message : 'Failed to load image');
      setSrc(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!originalUrl) {
      setSrc(null);
      setLoading(false);
      setError(null);
      return;
    }

    loadSecureUrl(originalUrl);

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [originalUrl, loadSecureUrl]);

  return { src, loading, error };
}

// Helper component for easy image rendering
interface SecureImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  fallbackSrc?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function SecureImage({ 
  src, 
  alt, 
  className,
  style, 
  fallbackSrc = '/default-pet.png',
  onLoad,
  onError 
}: SecureImageProps) {
  const { src: secureUrl, loading, error } = useSecureImage(src);

  if (loading) {
    return (
      <div className={`bg-gray-200 animate-pulse ${className}`} style={style} />
    );
  }

  if (error || !secureUrl) {
    return (
      <img 
        src={fallbackSrc} 
        alt={alt} 
        className={className}
        style={style}
        onLoad={onLoad}
        onError={onError}
      />
    );
  }

  return (
    <img 
      src={secureUrl} 
      alt={alt} 
      className={className}
      style={style}
      onLoad={onLoad}
      onError={onError}
    />
  );
} 