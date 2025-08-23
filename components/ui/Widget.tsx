
import React from 'react';

interface WidgetProps {
    title: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

export const Widget: React.FC<WidgetProps> = ({ title, icon, children, className }) => {
    return (
        <div className={`glass-pane flex flex-col bg-[var(--panel-bg)] border-[var(--panel-border)] rounded-2xl h-full shadow-lg ${className}`}>
            <header className="flex-shrink-0 p-3 sm:p-4 border-b border-[var(--panel-border)]">
                <h3 className="font-display text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                    {icon}
                    {title}
                </h3>
            </header>
            <div className="flex-grow overflow-y-auto">
                {children}
            </div>
        </div>
    );
};