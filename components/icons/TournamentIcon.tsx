
import React from 'react';

export const TournamentIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className || "h-5 w-5"}>
        <path d="M4 8v5" />
        <path d="M4 13h5" />
        <path d="M9 13v5" />
        <path d="M15 18v-5" />
        <path d="M15 13h5" />
        <path d="M20 13V8" />
        <path d="M9 8h6" />
        <path d="M12 8V5" />
    </svg>
);
