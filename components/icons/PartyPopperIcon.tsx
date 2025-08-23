
import React from 'react';

export const PartyPopperIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className || "h-8 w-8 text-yellow-300"}>
        <path d="M5.8 11.3 2 22l10.7-3.8c.2-.1.3-.2.4-.4L17 14l-6-6-3.8 3.8c-.2.2-.3.3-.4.4Z"/>
        <path d="m14 6 6-6"/>
        <path d="m6 14-4 4"/>
        <path d="m18 12 4 4"/>
        <path d="M12 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/>
    </svg>
);
