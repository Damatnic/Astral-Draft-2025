
import React from 'react';

export const EmptyTumbleweedIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className || "w-full h-full"}>
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Z"/>
        <path d="M12 12a10 10 0 0 0-4.4 8.1"/>
        <path d="M12 12a10 10 0 0 1 4.4 8.1"/>
        <path d="M12 12a10 10 0 0 0 4.4-8.1"/>
        <path d="M12 12a10 10 0 0 1-4.4-8.1"/>
        <path d="M2 12a10 10 0 0 1 8.1-4.4"/>
        <path d="M22 12a10 10 0 0 0-8.1-4.4"/>
        <path d="M2 12a10 10 0 0 0 8.1 4.4"/>
        <path d="M22 12a10 10 0 0 1-8.1 4.4"/>
    </svg>
);
