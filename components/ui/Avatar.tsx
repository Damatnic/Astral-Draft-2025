
import React from 'react';
import LazyImage from './LazyImage';

interface AvatarProps {
  avatar: string;
  className?: string;
  alt?: string;
  generatedAvatarUrl?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ avatar, className, alt = 'Team avatar', generatedAvatarUrl }) => {
  const isImageUrl = generatedAvatarUrl || (avatar && (avatar.startsWith('data:image') || avatar.startsWith('https')));

  if (isImageUrl) {
    return (
      <LazyImage
        src={generatedAvatarUrl || avatar}
        alt={alt}
        className={`object-cover bg-black/20 ${className}`}
        fallback="https://api.dicebear.com/7.x/avataaars/svg?seed=default"
        loading="lazy"
      />
    );
  }

  // It's an emoji
  return (
      <span className={`flex items-center justify-center bg-black/10 ${className}`}>
          {avatar}
      </span>
  );
};
