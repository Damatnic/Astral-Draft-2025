
import React from 'react';
import { Widget } from '../ui/Widget';
import { FireIcon } from '../icons/FireIcon';

const OnTheHotSeatWidget: React.FC = () => {
    // This is a placeholder component to fix a build error.
    // The full implementation will be added in a future update.
    return (
        <Widget title="On The Hot Seat" icon={<FireIcon />}>
            <div className="p-4 text-center text-xs text-gray-400 h-full flex items-center justify-center">
                Feature coming soon...
            </div>
        </Widget>
    );
};

export default OnTheHotSeatWidget;
