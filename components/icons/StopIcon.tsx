import React from 'react';

export const StopIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className={className || "h-4 w-4"}>
        <rect width="18" height="18" x="3" y="3" rx="2" />
    </svg>
);
