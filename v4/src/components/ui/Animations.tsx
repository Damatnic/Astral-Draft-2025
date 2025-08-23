/**
 * Animation Components Library (Phase 11.2)
 * Provides consistent animations and transitions across the application
 */

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/utils';

// Fade In Animation
export interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  className?: string;
  once?: boolean;
}

export const FadeIn: React.FC<FadeInProps> = ({
  children,
  delay = 0,
  duration = 500,
  direction = 'up',
  className,
  once = true
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) {
            observer.unobserve(entry.target);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [once]);

  const directionClasses = {
    up: 'translate-y-8',
    down: '-translate-y-8',
    left: 'translate-x-8',
    right: '-translate-x-8',
    none: ''
  };

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all ease-out',
        isVisible 
          ? 'opacity-100 translate-x-0 translate-y-0' 
          : `opacity-0 ${directionClasses[direction]}`,
        className
      )}
      style={{
        transitionDelay: `${delay}ms`,
        transitionDuration: `${duration}ms`
      }}
    >
      {children}
    </div>
  );
};

// Stagger Animation
export interface StaggerProps {
  children: React.ReactNode[];
  delay?: number;
  staggerDelay?: number;
  className?: string;
}

export const Stagger: React.FC<StaggerProps> = ({
  children,
  delay = 0,
  staggerDelay = 100,
  className
}) => (
  <div className={className}>
    {React.Children.map(children, (child, index) => (
      <FadeIn delay={delay + (index * staggerDelay)} key={index}>
        {child}
      </FadeIn>
    ))}
  </div>
);

// Hover Glow Effect
export interface HoverGlowProps {
  children: React.ReactNode;
  variant?: 'purple' | 'blue' | 'pink' | 'green' | 'custom';
  intensity?: 'low' | 'medium' | 'high';
  className?: string;
}

export const HoverGlow: React.FC<HoverGlowProps> = ({
  children,
  variant = 'purple',
  intensity = 'medium',
  className
}) => {
  const variantClasses = {
    purple: 'hover:shadow-neon-purple',
    blue: 'hover:shadow-neon-blue',
    pink: 'hover:shadow-neon-pink',
    green: 'hover:shadow-neon-green',
    custom: ''
  };

  const intensityClasses = {
    low: 'hover:shadow-sm',
    medium: 'hover:shadow-md',
    high: 'hover:shadow-lg'
  };

  return (
    <div
      className={cn(
        'transition-all duration-300 ease-out',
        variantClasses[variant],
        intensityClasses[intensity],
        'hover:scale-102 hover:-translate-y-1',
        className
      )}
    >
      {children}
    </div>
  );
};

// Pulse Animation
export interface PulseProps {
  children: React.ReactNode;
  speed?: 'slow' | 'normal' | 'fast';
  variant?: 'scale' | 'glow' | 'both';
  className?: string;
}

export const Pulse: React.FC<PulseProps> = ({
  children,
  speed = 'normal',
  variant = 'scale',
  className
}) => {
  const speedClasses = {
    slow: 'animate-pulse-slow',
    normal: 'animate-pulse',
    fast: 'animate-ping'
  };

  const variantClasses = {
    scale: 'hover:animate-bounce-slow',
    glow: 'animate-glow',
    both: 'hover:animate-bounce-slow animate-glow'
  };

  return (
    <div
      className={cn(
        speedClasses[speed],
        variantClasses[variant],
        className
      )}
    >
      {children}
    </div>
  );
};

// Slide In Animation
export interface SlideInProps {
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  delay?: number;
  className?: string;
}

export const SlideIn: React.FC<SlideInProps> = ({
  children,
  direction = 'left',
  delay = 0,
  className
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const directionClasses = {
    left: isVisible ? 'translate-x-0' : '-translate-x-full',
    right: isVisible ? 'translate-x-0' : 'translate-x-full',
    up: isVisible ? 'translate-y-0' : 'translate-y-full',
    down: isVisible ? 'translate-y-0' : '-translate-y-full'
  };

  return (
    <div
      ref={ref}
      className={cn(
        'transition-transform duration-500 ease-out',
        directionClasses[direction],
        className
      )}
    >
      {children}
    </div>
  );
};

// Floating Animation
export interface FloatingProps {
  children: React.ReactNode;
  intensity?: 'subtle' | 'medium' | 'high';
  speed?: 'slow' | 'normal' | 'fast';
  className?: string;
}

export const Floating: React.FC<FloatingProps> = ({
  children,
  intensity = 'medium',
  speed = 'normal',
  className
}) => {
  const intensityClasses = {
    subtle: 'animate-float',
    medium: 'animate-float-slow',
    high: 'hover:animate-bounce'
  };

  const speedMultiplier = {
    slow: '6s',
    normal: '3s',
    fast: '1.5s'
  };

  return (
    <div
      className={cn(intensityClasses[intensity], className)}
      style={{ animationDuration: speedMultiplier[speed] }}
    >
      {children}
    </div>
  );
};

// Glitch Effect
export interface GlitchProps {
  children: React.ReactNode;
  trigger?: 'hover' | 'always' | 'none';
  intensity?: 'low' | 'medium' | 'high';
  className?: string;
}

export const Glitch: React.FC<GlitchProps> = ({
  children,
  trigger = 'hover',
  intensity = 'medium',
  className
}) => {
  const triggerClasses = {
    hover: 'hover:animate-cyberpunk-glitch',
    always: 'animate-cyberpunk-glitch',
    none: ''
  };

  return (
    <div
      className={cn(
        'relative',
        triggerClasses[trigger],
        className
      )}
      data-text={typeof children === 'string' ? children : ''}
    >
      {children}
    </div>
  );
};

// Shimmer Effect
export interface ShimmerProps {
  children: React.ReactNode;
  direction?: 'horizontal' | 'vertical' | 'diagonal';
  speed?: 'slow' | 'normal' | 'fast';
  className?: string;
}

export const Shimmer: React.FC<ShimmerProps> = ({
  children,
  direction = 'horizontal',
  speed = 'normal',
  className
}) => {
  const directionClasses = {
    horizontal: 'animate-shimmer',
    vertical: 'animate-shimmer-slow',
    diagonal: 'animate-text-shimmer'
  };

  const speedMultiplier = {
    slow: '4s',
    normal: '2s',
    fast: '1s'
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        directionClasses[direction],
        className
      )}
      style={{ animationDuration: speedMultiplier[speed] }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer" />
      {children}
    </div>
  );
};

// Morphing Background
export interface MorphingBackgroundProps {
  children: React.ReactNode;
  colors?: string[];
  speed?: 'slow' | 'normal' | 'fast';
  className?: string;
}

export const MorphingBackground: React.FC<MorphingBackgroundProps> = ({
  children,
  colors = ['#9333ea', '#00d9ff', '#ff0080'],
  speed = 'normal',
  className
}) => {
  const speedMultiplier = {
    slow: '8s',
    normal: '4s',
    fast: '2s'
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden animate-morph',
        className
      )}
      style={{
        background: `linear-gradient(-45deg, ${colors.join(', ')})`,
        backgroundSize: '400% 400%',
        animationDuration: speedMultiplier[speed]
      }}
    >
      {children}
    </div>
  );
};

// Card Flip Animation
export interface CardFlipProps {
  front: React.ReactNode;
  back: React.ReactNode;
  trigger?: 'hover' | 'click';
  className?: string;
}

export const CardFlip: React.FC<CardFlipProps> = ({
  front,
  back,
  trigger = 'hover',
  className
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleInteraction = () => {
    if (trigger === 'click') {
      setIsFlipped(!isFlipped);
    }
  };

  const triggerClass = trigger === 'hover' ? 'group-hover:rotate-y-180' : '';

  return (
    <div
      className={cn('group perspective-1000 cursor-pointer', className)}
      onClick={handleInteraction}
      onMouseEnter={() => trigger === 'hover' && setIsFlipped(true)}
      onMouseLeave={() => trigger === 'hover' && setIsFlipped(false)}
    >
      <div
        className={cn(
          'relative w-full h-full transform-style-preserve-3d transition-transform duration-700',
          isFlipped ? 'rotate-y-180' : '',
          triggerClass
        )}
      >
        {/* Front */}
        <div className="absolute inset-0 backface-hidden">
          {front}
        </div>
        
        {/* Back */}
        <div className="absolute inset-0 backface-hidden rotate-y-180">
          {back}
        </div>
      </div>
    </div>
  );
};

// Typewriter Effect
export interface TypewriterProps {
  text: string[];
  speed?: number;
  deleteSpeed?: number;
  delayBetween?: number;
  loop?: boolean;
  className?: string;
}

export const Typewriter: React.FC<TypewriterProps> = ({
  text,
  speed = 100,
  deleteSpeed = 50,
  delayBetween = 2000,
  loop = true,
  className
}) => {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentFullText = text[currentTextIndex];
    
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        // Typing
        if (currentText.length < currentFullText.length) {
          setCurrentText(currentFullText.substring(0, currentText.length + 1));
        } else {
          // Finished typing, start deleting after delay
          setTimeout(() => setIsDeleting(true), delayBetween);
        }
      } else {
        // Deleting
        if (currentText.length > 0) {
          setCurrentText(currentFullText.substring(0, currentText.length - 1));
        } else {
          // Finished deleting, move to next text
          setIsDeleting(false);
          if (loop || currentTextIndex < text.length - 1) {
            setCurrentTextIndex((prev) => (prev + 1) % text.length);
          }
        }
      }
    }, isDeleting ? deleteSpeed : speed);

    return () => clearTimeout(timeout);
  }, [currentText, currentTextIndex, isDeleting, text, speed, deleteSpeed, delayBetween, loop]);

  return (
    <span className={cn('border-r-2 border-astral-purple-500 animate-pulse', className)}>
      {currentText}
    </span>
  );
};

// Reveal Animation
export interface RevealProps {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
  delay?: number;
  className?: string;
}

export const Reveal: React.FC<RevealProps> = ({
  children,
  direction = 'up',
  delay = 0,
  className
}) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsRevealed(true), delay);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.2 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  const directionClasses = {
    up: 'translate-y-8',
    down: '-translate-y-8',
    left: 'translate-x-8',
    right: '-translate-x-8'
  };

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-700 ease-out',
        isRevealed 
          ? 'opacity-100 translate-x-0 translate-y-0' 
          : `opacity-0 ${directionClasses[direction]}`,
        className
      )}
    >
      {children}
    </div>
  );
};

const AnimationComponents = {
  FadeIn,
  Stagger,
  HoverGlow,
  Pulse,
  SlideIn,
  Floating,
  Glitch,
  Shimmer,
  MorphingBackground,
  CardFlip,
  Typewriter,
  Reveal
};

export default AnimationComponents;