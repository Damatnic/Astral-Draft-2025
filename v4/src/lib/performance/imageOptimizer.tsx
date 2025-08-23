/**
 * @fileoverview Image Optimization and CDN utilities
 * Provides image optimization, lazy loading, and CDN integration for better performance
 */

import Image from 'next/image';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useIntersectionObserver } from '@/hooks/usePerformance';

// Image optimization configuration
export interface ImageOptimizationConfig {
  quality?: number;
  format?: 'webp' | 'avif' | 'auto';
  sizes?: string;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
}

// CDN configuration
const CDN_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_CDN_URL || '',
  domains: [
    'assets.nfl.com',
    'a.espncdn.com',
    's.yimg.com',
    'sleepercdn.com',
    'fantasy.nfl.com',
  ],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 512, 640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
};

/**
 * Generate optimized image URLs for different sizes
 */
export function generateImageSizes(src: string, sizes: number[] = CDN_CONFIG.imageSizes): string {
  return sizes
    .map(size => `${CDN_CONFIG.baseUrl}/w_${size}/${src} ${size}w`)
    .join(', ');
}

/**
 * Get responsive image sizes string
 */
export function getResponsiveSizes(config?: {
  mobile?: string;
  tablet?: string;
  desktop?: string;
  xl?: string;
}): string {
  const {
    mobile = '100vw',
    tablet = '50vw',
    desktop = '33vw',
    xl = '25vw'
  } = config || {};

  return `(max-width: 640px) ${mobile}, (max-width: 1024px) ${tablet}, (max-width: 1536px) ${desktop}, ${xl}`;
}

/**
 * Optimized Image component with lazy loading and performance tracking
 */
interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  quality?: number;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
  lazy?: boolean;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  sizes,
  quality = 85,
  priority = false,
  placeholder = 'empty',
  blurDataURL,
  onLoad,
  onError,
  fallbackSrc,
  lazy = true,
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState(src);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { elementRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px',
    triggerOnce: true,
  });

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    if (fallbackSrc && imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc);
      setHasError(false);
    } else {
      onError?.();
    }
  }, [fallbackSrc, imageSrc, onError]);

  // Only load image when it's in viewport or priority is set
  const shouldLoad = !lazy || isIntersecting || priority;

  if (!shouldLoad) {
    return (
      <div
        ref={elementRef as React.RefObject<HTMLDivElement>}
        className={`bg-gray-200 dark:bg-gray-700 animate-pulse ${className}`}
        style={{ width, height }}
        aria-label={`Loading ${alt}`}
      />
    );
  }

  if (hasError && !fallbackSrc) {
    return (
      <div
        className={`bg-gray-300 dark:bg-gray-600 flex items-center justify-center ${className}`}
        style={{ width, height }}
        aria-label={`Failed to load ${alt}`}
      >
        <span className="text-gray-500 text-sm">Image unavailable</span>
      </div>
    );
  }

  return (
    <Image
      ref={elementRef as React.RefObject<HTMLImageElement>}
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      sizes={sizes || getResponsiveSizes()}
      quality={quality}
      priority={priority}
      placeholder={placeholder}
      blurDataURL={blurDataURL}
      onLoad={handleLoad}
      onError={handleError}
      style={{
        opacity: isLoaded ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out',
      }}
    />
  );
}

/**
 * Avatar component with optimized loading
 */
interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  fallback?: string;
  initials?: string;
}

export function Avatar({
  src,
  alt,
  size = 'md',
  className,
  fallback,
  initials,
}: AvatarProps) {
  const sizeMap = {
    xs: { width: 24, height: 24, text: 'text-xs' },
    sm: { width: 32, height: 32, text: 'text-sm' },
    md: { width: 40, height: 40, text: 'text-base' },
    lg: { width: 48, height: 48, text: 'text-lg' },
    xl: { width: 64, height: 64, text: 'text-xl' },
    '2xl': { width: 80, height: 80, text: 'text-2xl' },
  };

  const { width, height, text } = sizeMap[size];
  const fallbackInitials = initials || alt.charAt(0).toUpperCase();

  if (!src) {
    return (
      <div
        className={`
          inline-flex items-center justify-center rounded-full bg-gray-300 dark:bg-gray-600
          ${text} font-medium text-gray-700 dark:text-gray-300 ${className}
        `}
        style={{ width, height }}
      >
        {fallbackInitials}
      </div>
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={`rounded-full object-cover ${className}`}
      sizes={`${width}px`}
      quality={90}
      fallbackSrc={fallback}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkrHB0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknysoC5OvqTYiAtxMUPvXEAuZ8CjOhKDhFqT90JjOBgAiXd4KBKJGKPo1/t3TKtOQCRaC5hl+bCApBvqMpU/KhNFKLhqKpVyVYoG+cXAhOIFAUr0Jnp6Pg8Rq7nOSb5G8+8AyR9fPPrGTyLmcBYnCi5hKXM5rGNKdBnOIb+BLJ3qGlMNc1VcmnFYrLFpBPi1c3hMAh5sZUZklhVCq2JKkkFOdUfKZhFSpJM9gKZzRBZE4GqFUJQaNIuA1JwDBNhEq9I3yKmfPL6Av8AtqsGWxKGMwCQ3VFgJ1vJFJdUgIMfLc5Bdr4zPKMvCb5ZVB3FyKAX5ngnTv2HPo"
    />
  );
}

/**
 * Logo component with optimized loading and fallback
 */
interface LogoProps {
  src?: string | null;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallback?: React.ReactNode;
}

export function Logo({
  src,
  alt,
  width = 40,
  height = 40,
  className,
  fallback,
}: LogoProps) {
  if (!src) {
    return fallback || (
      <div
        className={`bg-gray-300 dark:bg-gray-600 rounded ${className}`}
        style={{ width, height }}
        aria-label={`${alt} logo placeholder`}
      />
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      sizes={`${width}px`}
      quality={95}
      priority={false}
    />
  );
}

/**
 * Hero image component with optimized loading
 */
interface HeroImageProps {
  src: string;
  alt: string;
  className?: string;
  overlay?: boolean;
  children?: React.ReactNode;
}

export function HeroImage({
  src,
  alt,
  className,
  overlay = false,
  children,
}: HeroImageProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <OptimizedImage
        src={src}
        alt={alt}
        width={1920}
        height={1080}
        className="object-cover w-full h-full"
        sizes="100vw"
        quality={80}
        priority={true}
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkrHB0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknysoC5OvqTYiAtxMUPvXEAuZ8CjOhKDhFqT90JjOBgAiXd4KBKJGKPo1/t3TKtOQCRaC5hl+bCApBvqMpU/KhNFKLhqKpVyVYoG+cXAhOIFAUr0Jnp6Pg8Rq7nOSb5G8+8AyR9fPPrGTyLmcBYnCi5hKXM5rGNKdBnOIb+BLJ3qGlMNc1VcmnFYrLFpBPi1c3hMAh5sZUZklhVCq2JKkkFOdUfKZhFSpJM9gKZzRBZE4GqFUJQaNIuA1JwDBNhEq9I3yKmfPL6Av8AtqsGWxKGMwCQ3VFgJ1vJFJdUgIMfLc5Bdr4zPKMvCb5ZVB3FyKAX5ngnTv2HPo"
      />
      {overlay && (
        <div className="absolute inset-0 bg-black bg-opacity-40" />
      )}
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Image gallery with lazy loading and virtual scrolling
 */
interface ImageGalleryProps {
  images: Array<{
    id: string;
    src: string;
    alt: string;
    width?: number;
    height?: number;
  }>;
  columns?: number;
  gap?: string;
  className?: string;
  onImageClick?: (image: any) => void;
}

export function ImageGallery({
  images,
  columns = 3,
  gap = 'gap-4',
  className,
  onImageClick,
}: ImageGalleryProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  }[columns] || 'grid-cols-3';

  return (
    <div className={`grid ${gridCols} ${gap} ${className}`}>
      {images.map((image) => (
        <div
          key={image.id}
          className="relative aspect-square cursor-pointer overflow-hidden rounded-lg hover:opacity-90 transition-opacity"
          onClick={() => onImageClick?.(image)}
        >
          <OptimizedImage
            src={image.src}
            alt={image.alt}
            width={image.width || 300}
            height={image.height || 300}
            className="object-cover w-full h-full"
            sizes={getResponsiveSizes({
              mobile: '50vw',
              tablet: '33vw',
              desktop: '25vw',
              xl: '20vw',
            })}
            lazy={true}
          />
        </div>
      ))}
    </div>
  );
}

/**
 * Image preloader for critical images
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Batch preload multiple images
 */
export async function preloadImages(
  sources: string[],
  onProgress?: (loaded: number, total: number) => void
): Promise<void> {
  let loaded = 0;
  const total = sources.length;

  const promises = sources.map(async (src) => {
    try {
      await preloadImage(src);
      loaded++;
      onProgress?.(loaded, total);
    } catch (error) {
      console.warn(`Failed to preload image: ${src}`, error);
      loaded++;
      onProgress?.(loaded, total);
    }
  });

  await Promise.allSettled(promises);
}

/**
 * Hook for image preloading
 */
export function useImagePreload(sources: string[], enabled = true) {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!enabled || sources.length === 0) return;

    setIsLoading(true);
    setProgress(0);
    setIsComplete(false);

    preloadImages(sources, (loaded, total) => {
      setProgress((loaded / total) * 100);
    }).finally(() => {
      setIsLoading(false);
      setIsComplete(true);
    });
  }, [sources, enabled]);

  return { isLoading, progress, isComplete };
}

/**
 * Generate blur data URL from image
 */
export async function generateBlurDataURL(src: string): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  const img = new window.Image();
  img.crossOrigin = 'anonymous';
  
  return new Promise((resolve, reject) => {
    img.onload = () => {
      canvas.width = 10;
      canvas.height = 10;
      ctx.drawImage(img, 0, 0, 10, 10);
      resolve(canvas.toDataURL('image/jpeg', 0.1));
    };
    img.onerror = reject;
    img.src = src;
  });
}

// Export image optimization utilities
export const imageUtils = {
  generateImageSizes,
  getResponsiveSizes,
  preloadImage,
  preloadImages,
  generateBlurDataURL,
};

export default OptimizedImage;