
import React from 'react';

export const FireIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className || "h-5 w-5"}>
        <path d="M12 22c-2.5-1-4-2-4-4 0-2 2-4 4-4s4 2 4 4c0 2-1.5 3-4 4z" />
        <path d="M15.5 15.5c1.3-1.3 2.5-3.5 2.5-5.5 0-3.3-2.7-6-6-6s-6 2.7-6 6c0 2 1.2 4.2 2.5 5.5" />
    </svg>
);
