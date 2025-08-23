
import React from 'react';

export const ChartBarIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className || "h-5 w-5"}>
        <path d="M3 3v18h18" />
        <path d="M9 17V9" />
        <path d="M15 17V5" />
        <path d="M12 17V13" />
    </svg>
);
