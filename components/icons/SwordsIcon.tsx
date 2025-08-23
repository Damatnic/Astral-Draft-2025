
import React from 'react';

export const SwordsIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className || "h-5 w-5"}>
        <path d="M14.5 17.5 3 6V3h3l11.5 11.5"/>
        <path d="m21 3-6 6"/>
        <path d="m3 21 6-6"/>
        <path d="M14.5 3h3v3l-11.5 11.5"/>
    </svg>
);
