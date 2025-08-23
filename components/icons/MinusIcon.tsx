
import React from 'react';

export const MinusIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className || "h-5 w-5"}>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);
