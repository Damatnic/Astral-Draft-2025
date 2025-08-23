
import React from 'react';

export const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className || "h-6 w-6"}>
        <path d="M12 3L9.25 8.75L3.5 9.5L8.25 13.75L6.5 19.5L12 16.25L17.5 19.5L15.75 13.75L20.5 9.5L14.75 8.75L12 3Z" />
        <path d="M5 3L6.05 5.95" />
        <path d="M19 3L17.95 5.95" />
        <path d="M22 14L19.05 14.95" />
        <path d="M2 14L4.95 14.95" />
        <path d="M17.5 22L16.45 19.05" />
        <path d="M6.5 22L7.55 19.05" />
    </svg>
);
