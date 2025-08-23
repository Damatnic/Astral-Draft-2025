
import React from 'react';
import { useAppState } from '../../contexts/AppContext';
import { useLeague } from '../../hooks/useLeague';
import { Widget } from '../ui/Widget';
import { MegaphoneIcon } from '../icons/MegaphoneIcon';
import { formatRelativeTime } from '../../utils/time';

const AnnouncementsWidget: React.FC = () => {
    const { state } = useAppState();
    const { league } = useLeague();
    
    if (!league) return null;
    
    const announcement = (state.leagueAnnouncements[league.id] || [])[0];

    if (!announcement) {
        return (
            <Widget title="Announcements" icon={<MegaphoneIcon />}>
                <div className="p-4 text-center text-sm text-gray-400">
                    No recent announcements from the commissioner.
                </div>
            </Widget>
        );
    }
    
    return (
        <Widget title="Announcements" icon={<MegaphoneIcon />}>
             <div className="p-3">
                <p className="font-semibold text-sm">{announcement.title}</p>
                <p className="text-xs text-gray-300 mt-1 whitespace-pre-wrap">{announcement.content}</p>
                <p className="text-right text-xs text-gray-500 mt-2">{formatRelativeTime(announcement.timestamp)}</p>
             </div>
        </Widget>
    );
};

export default AnnouncementsWidget;
