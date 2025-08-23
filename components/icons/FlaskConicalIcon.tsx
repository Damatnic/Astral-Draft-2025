
import React from 'react';

export const FlaskConicalIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className || "h-5 w-5"}>
        <path d="M4.5 3h15"/>
        <path d="M6 3v12.5a4.5 4.5 0 0 0 9 0V3"/>
        <path d="M6 14h12"/>
    </svg>
);