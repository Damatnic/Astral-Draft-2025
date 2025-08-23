
import React from 'react';
import { AlertTriangleIcon } from '../icons/AlertTriangleIcon';

interface ErrorDisplayProps {
    title?: string;
    message: string;
    onRetry?: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ title = "An Error Occurred", message, onRetry }) => {
    return (
        <div className="p-6 text-center text-red-400 border border-red-400/20 bg-red-900/10 rounded-lg m-4">
            <AlertTriangleIcon className="mx-auto h-10 w-10 mb-2" />
            <h3 className="font-bold text-lg text-red-300">{title}</h3>
            <p className="text-sm">{message}</p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="mt-4 px-4 py-1.5 text-xs font-bold bg-red-500/20 text-red-300 rounded-md hover:bg-red-500/30"
                >
                    Try Again
                </button>
            )}
        </div>
    );
};

export default ErrorDisplay;