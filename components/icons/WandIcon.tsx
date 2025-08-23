
import React from 'react';

export const WandIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className || "h-4 w-4"}>
        <path d="M15 4V2" />
        <path d="M15 16v-2" />
        <path d="M8 9h2" />
        <path d="M20 9h2" />
        <path d="M17.8 11.8 19 13" />
        <path d="M15 9a3 3 0 0 0-3-3" />
        <path d="M12 9H9" />
        <path d="M12 12a3 3 0 0 0-3-3" />
        <path d="M6.2 6.2 5 5" />
        <path d="M12 12v3" />
        <path d="m3.4 17.6 1.4-1.4" />
        <path d="m19 5-8 8" />
    </svg>
);
