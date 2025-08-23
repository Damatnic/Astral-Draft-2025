
import React from 'react';

export const BrainCircuitIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className || "h-5 w-5"}>
        <path d="M12 5a3 3 0 1 0-5.997.125"/>
        <path d="M12 5a3 3 0 1 1 5.997.125"/>
        <path d="M15 13a3 3 0 1 0-6 0"/>
        <path d="M12 13h.01"/>
        <path d="M17.65 6.35A2 2 0 0 0 15 5h-3"/>
        <path d="M6.35 6.35A2 2 0 0 1 9 5h3"/>
        <path d="M12 21a9 9 0 0 0 6.7-3.3"/>
        <path d="M5.3 17.7A9 9 0 0 1 12 21"/>
        <path d="M12 21v-2"/>
        <path d="m15.5 16.5-1-1"/>
        <path d="m8.5 16.5 1-1"/>
        <path d="M17.65 11.65A2 2 0 0 0 15 13h-3"/>
        <path d="M6.35 11.65A2 2 0 0 1 9 13h3"/>
        <circle cx="18" cy="10" r="1"/>
        <circle cx="6" cy="10" r="1"/>
        <circle cx="12" cy="17" r="1"/>
    </svg>
);
