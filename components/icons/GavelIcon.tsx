
import React from 'react';

export const GavelIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className || "h-5 w-5"}>
        <path d="m14 14-7.5 7.5"/>
        <path d="m18 10-7.5 7.5"/>
        <path d="m6 6 7.5-3.5 3.5 3.5L10 10"/>
        <path d="m18 10 4 4"/>
        <path d="M12.5 3.5 6 10"/>
    </svg>
);
