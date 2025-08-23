
import React from 'react';

export const TelescopeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className || "h-4 w-4"}>
        <path d="m10.06 14.44-8.12 8.12" />
        <path d="M17.61 6.39 6.39 17.61" />
        <path d="M14.14 10.86a2.5 2.5 0 0 0 3.54 0l4.24-4.24a2.5 2.5 0 0 0 0-3.54l-1.41-1.41a2.5 2.5 0 0 0-3.54 0L12.73 6.07a2.5 2.5 0 0 0 0 3.54Z" />
        <path d="M5.12 15.12a2.5 2.5 0 0 0 0 3.54l1.41 1.41a2.5 2.5 0 0 0 3.54 0l2.12-2.12" />
    </svg>
);