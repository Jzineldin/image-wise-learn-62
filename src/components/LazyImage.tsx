/**
 * Optimized Lazy Loading Image Component
 * 
 * Features:
 * - Intersection Observer API for performance
 * - WebP format support with fallback
 * - Loading states and error handling
 * - Responsive image sizing
 */

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/production-logger';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  fallback?: string;
  webpSrc?: string;
  sizes?: string;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
}

export function LazyImage({
  src,
  alt,
  className,
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSJoc2woMjE0IDMyJSA5MSUpIi8+CjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjgiIGZpbGw9ImhzbCgyMTQgMzIlIDgxJSkiLz4KPC9zdmc+',
  fallback,
  webpSrc,
  sizes,
  loading = 'lazy',
  onLoad,
  onError,
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(loading === 'eager');
  const imgRef = useRef<HTMLImageElement>(null);
  const [currentSrc, setCurrentSrc] = useState<string>(placeholder);

  useEffect(() => {
    if (loading === 'eager') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [loading]);

  useEffect(() => {
    if (!isInView || isLoaded) return;

    const img = new Image();
    
    const handleLoad = () => {
      setIsLoaded(true);
      setCurrentSrc(webpSrc || src);
      onLoad?.();
      logger.debug('Image loaded successfully', {
        component: 'LazyImage',
        src: webpSrc || src,
        alt,
      });
    };

    const handleError = () => {
      if (webpSrc && img.src === webpSrc) {
        // Fallback to original format if WebP fails
        img.src = src;
        return;
      }
      
      setHasError(true);
      if (fallback) {
        setCurrentSrc(fallback);
      }
      onError?.();
      logger.warn('Image failed to load', {
        component: 'LazyImage',
        src: img.src,
        alt,
      });
    };

    img.onload = handleLoad;
    img.onerror = handleError;
    img.src = webpSrc || src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [isInView, src, webpSrc, fallback, alt, onLoad, onError, isLoaded]);

  return (
    <img
      ref={imgRef}
      src={currentSrc}
      alt={alt}
      className={cn(
        'transition-opacity duration-300',
        isLoaded ? 'opacity-100' : 'opacity-70',
        hasError && 'grayscale',
        className
      )}
      sizes={sizes}
      loading={loading}
      decoding="async"
    />
  );
}