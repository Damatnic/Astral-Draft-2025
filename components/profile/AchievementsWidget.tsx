import React from 'react';
import type { Badge } from '../../types';
import { Widget } from '../ui/Widget';
import { TrophyIcon } from '../icons/TrophyIcon';
import { MedalIcon } from '../icons/MedalIcon';
import { FlameIcon } from '../icons/FlameIcon';

const badgeIcons: Record<Badge['type'], React.ReactNode> = {
    CHAMPION: <TrophyIcon />,
    TOP_SCORER: <MedalIcon />,
    WIN_STREAK_3: <FlameIcon />,
};

const badgeColors: Record<Badge['type'], string> = {
    CHAMPION: 'border-yellow-400/50 bg-yellow-500/10 text-yellow-300',
    TOP_SCORER: 'border-purple-400/50 bg-purple-500/10 text-purple-300',
    WIN_STREAK_3: 'border-orange-400/50 bg-orange-500/10 text-orange-300',
};

const AchievementsWidget: React.FC<{ badges: Badge[] }> = ({ badges }) => {
    if (!badges || badges.length === 0) {
        return null; // Don't show the widget if there are no badges
    }

    return (
        <Widget title="Achievements" icon={<TrophyIcon />}>
            <div className="p-4 space-y-2">
                {badges.map((badge: any) => (
                    <div key={badge.id} className={`flex items-center gap-3 p-2 rounded-lg border-l-4 ${badgeColors[badge.type]}`}>
                        <div className="text-xl">{badgeIcons[badge.type]}</div>
                        <div>
                             <p className="font-semibold text-sm text-white">{badge.text}</p>
                             <p className="text-xs text-gray-400">{badge.season}</p>
                        </div>
                    </div>
                ))}
            </div>
        </Widget>
    );
};

export default AchievementsWidget;