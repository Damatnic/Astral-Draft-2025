
import React from 'react';
import { useAppState } from '../../contexts/AppContext';
import { Widget } from '../ui/Widget';
import type { ActivityItem } from '../../types';
import { ArrowRightLeftIcon } from '../icons/ArrowRightLeftIcon';
import { PlusCircleIcon } from '../icons/PlusCircleIcon';
import { formatRelativeTime } from '../../utils/time';
import { ActivityIcon } from 'lucide-react';


const activityIcons: { [key in ActivityItem['type']]: React.ReactNode } = {
    TRADE: <ArrowRightLeftIcon className="h-4 w-4 text-purple-400" />,
    WAIVER: <PlusCircleIcon className="h-4 w-4 text-green-400" />,
    DRAFT: <div />, // Draft handled elsewhere
};


const ActivityFeedWidget: React.FC = () => {
    const { state } = useAppState();

    const feed = state.activityFeed;

    return (
        <Widget title="League Activity">
            <div className="p-3 space-y-3">
                {feed.length === 0 ? (
                    <p className="text-center text-xs text-gray-400 py-4">No recent activity.</p>
                ) : (
                    feed.map((item: any) => (
                        <div key={item.id} className="flex items-start gap-3">
                            <div className="mt-1">{activityIcons[item.type]}</div>
                            <div>
                                <p className="text-xs text-gray-300">{item.content}</p>
                                <p className="text-[10px] text-gray-500">{formatRelativeTime(item.timestamp)}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </Widget>
    );
};

export default ActivityFeedWidget;
