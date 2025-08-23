
import React from 'react';

export const CheckIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5 text-green-500 dark:text-green-400" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M20 6 9 17l-5-5" />
    </svg>
);