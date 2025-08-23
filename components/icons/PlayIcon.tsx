
import React from 'react';

export const PlayIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className={className || "h-5 w-5"}>
        <path d="M6 3v18l15-9L6 3z"/>
    </svg>
);