
import React from 'react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    text?: string;
}

const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', text }) => {
    return (
        <div className="flex flex-col items-center justify-center gap-4 py-8">
            <div className={`
                ${sizeClasses[size]}
                border-4 border-[var(--panel-border)] border-t-cyan-400 rounded-full animate-spin
            `}></div>
            {text && <p className="text-sm text-[var(--text-secondary)]">{text}</p>}
        </div>
    );
};

export default LoadingSpinner;
