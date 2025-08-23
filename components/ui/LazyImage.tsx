import React, { useState, useRef, useEffect } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  fallback?: string;
  sizes?: string;
  srcSet?: string;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Optimized lazy loading image component for mobile performance
 * Features:
 * - Intersection Observer for lazy loading
 * - WebP format preference with fallback
 * - Responsive image support with srcSet
 * - Loading placeholder and error handling
 * - Mobile-optimized loading strategy
 */
export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  placeholder,
  fallback,
  sizes,
  srcSet,
  loading = 'lazy',
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (loading === 'eager') {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        // Start loading when image is 100px away from viewport
        rootMargin: '100px',
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [loading]);

  // Generate WebP version URL if possible
  const getOptimizedSrc = (originalSrc: string): string => {
    if (originalSrc.endsWith('.svg') || originalSrc.startsWith('data:')) {
      return originalSrc; // Don't optimize SVGs or data URLs
    }
    
    // For remote images, check if WebP version exists
    if (originalSrc.startsWith('http')) {
      return originalSrc; // External images - use as is
    }
    
    // For local images, try to use WebP version
    const webpSrc = originalSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    return webpSrc;
  };

  // Generate responsive srcSet if not provided
  const getResponsiveSrcSet = (originalSrc: string): string | undefined => {
    if (srcSet) return srcSet;
    
    if (originalSrc.endsWith('.svg') || originalSrc.startsWith('data:') || originalSrc.startsWith('http')) {
      return undefined; // Don't generate srcSet for these
    }

    // Generate responsive variants for local images
    const baseName = originalSrc.replace(/\.(jpg|jpeg|png|webp)$/i, '');
    const extensionMatch = /\.(webp|jpg|jpeg|png)$/i.exec(originalSrc);
    const extension = extensionMatch?.[1] || 'webp';
    
    return [
      `${baseName}-320w.${extension} 320w`,
      `${baseName}-640w.${extension} 640w`,
      `${baseName}-1024w.${extension} 1024w`,
      `${baseName}-1920w.${extension} 1920w`
    ].join(', ');
  };

  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  const optimizedSrc = getOptimizedSrc(src);
  const responsiveSrcSet = getResponsiveSrcSet(src);
  const defaultSizes = sizes || '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';

  return (
    <div 
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{ 
        backgroundColor: !isLoaded && !hasError ? '#f3f4f6' : 'transparent',
        minHeight: '20px' // Prevent layout shift
      }}
    >
      {/* Loading placeholder */}
      {!isLoaded && !hasError && isInView && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
          <div className="w-8 h-8 rounded-full border-2 border-gray-300 border-t-gray-600 animate-spin" />
        </div>
      )}

      {/* Placeholder before intersection */}
      {!isInView && placeholder && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <span className="text-gray-400 text-sm">{placeholder}</span>
        </div>
      )}

      {/* Error fallback */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          {fallback ? (
            <img 
              src={fallback} 
              alt={alt}
              className="w-full h-full object-cover"
              onError={() => {
                // Final fallback - show placeholder
                console.warn(`Failed to load image and fallback: ${src}`);
              }}
            />
          ) : (
            <div className="text-gray-400 text-center">
              <div className="w-8 h-8 mx-auto mb-2 bg-gray-300 rounded" />
              <span className="text-xs">Image unavailable</span>
            </div>
          )}
        </div>
      )}

      {/* Main image */}
      {isInView && (
        <picture>
          {/* WebP source for modern browsers */}
          {!src.endsWith('.svg') && !src.startsWith('data:') && (
            <source 
              type="image/webp" 
              srcSet={responsiveSrcSet?.replace(/\.(jpg|jpeg|png)/g, '.webp')} 
              sizes={defaultSizes}
            />
          )}
          
          <img
            src={hasError ? (fallback || src) : optimizedSrc}
            alt={alt}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            srcSet={responsiveSrcSet}
            sizes={defaultSizes}
            loading={loading}
            decoding="async"
            onLoad={handleLoad}
            onError={handleError}
          />
        </picture>
      )}
    </div>
  );
};

export default LazyImage;
