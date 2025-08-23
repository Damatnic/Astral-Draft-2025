
import React from 'react';

interface EmptyStateProps {
    icon?: React.ReactNode;
    illustration?: React.ReactNode;
    message: string;
    children?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, illustration, message, children }) => {
    return (
        <div className="text-center py-4 px-2 text-sm text-gray-500">
            {illustration && <div className="text-gray-600 w-24 h-24 mx-auto mb-2">{illustration}</div>}
            {icon && !illustration && <div className="text-gray-600 w-8 h-8 mx-auto mb-2">{icon}</div>}
            <p>{message}</p>
            {children && <div className="mt-2">{children}</div>}
        </div>
    );
};

export default EmptyState;
