
import React from 'react';

export const ScrollTextIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className || "h-5 w-5"}>
        <path d="M8 21h12a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H8" />
        <path d="M6 17H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2" />
        <path d="M16 17h2" />
        <path d="M15 13h2" />
        <path d="M13 9h2" />
    </svg>
);
