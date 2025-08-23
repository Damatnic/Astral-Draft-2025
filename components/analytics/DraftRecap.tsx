

import React from 'react';
import type { League, DraftRecapData } from '../../types';
import { generateDraftRecap } from '../../services/geminiService';
import { TrophyIcon } from '../icons/TrophyIcon';
import { FlameIcon } from '../icons/FlameIcon';
import { GemIcon } from '../icons/GemIcon';
import { SparklesIcon } from '../icons/SparklesIcon';
import LoadingSpinner from '../ui/LoadingSpinner';
import { TelescopeIcon } from '../icons/TelescopeIcon';

interface DraftRecapProps {
    league: League;
    dispatch: React.Dispatch<any>;
}

const AwardCard: React.FC<{ award: DraftRecapData['awards'][0] }> = ({ award }) => {
    const getIcon = (title: string) => {
        const lowerTitle = title.toLowerCase();
        if (lowerTitle.includes('steal') || lowerTitle.includes('value')) return <GemIcon />;
        if (lowerTitle.includes('gambler') || lowerTitle.includes('risk')) return <FlameIcon />;
        return <TrophyIcon />;
    };

    return (
        <div className="bg-white/5 p-3 sm:p-4 rounded-lg flex items-start gap-3 sm:gap-4">
            <div className="text-cyan-400 mt-1 flex-shrink-0">{getIcon(award.awardTitle)}</div>
            <div className="min-w-0 flex-1">
                <h4 className="font-bold text-white text-sm sm:text-base break-words">{award.awardTitle}</h4>
                <p className="text-xs sm:text-sm text-gray-300">
                    <span className="font-semibold text-yellow-300">{award.teamName}</span> - {award.playerName}
                </p>
                <p className="text-xs text-gray-400 mt-1 italic break-words">"{award.rationale}"</p>
            </div>
        </div>
    );
};

const DraftRecap: React.FC<DraftRecapProps> = ({ league, dispatch }) => {
    const [recap, setRecap] = React.useState<DraftRecapData | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const fetchRecap = async () => {
            if (!league) return;
            setIsLoading(true);
            setError(null);
            try {
                const data = await generateDraftRecap(league);
                setRecap(data);
            } catch (err) {
                console.error(err);
                setError("The Oracle is resting. Could not generate a draft recap.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchRecap();
    }, [league]);
    
    if (isLoading) {
        return <div className="p-4 sm:p-6"><LoadingSpinner text="The Oracle is writing your draft story..." /></div>;
    }

    if (error || !recap) {
        return <div className="p-4 sm:p-6 text-center text-red-400 text-sm sm:text-base">{error || "No recap data available."}</div>;
    }

    return (
        <div className="p-3 sm:p-4 md:p-6">
            <div className="text-center">
                <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-300 via-cyan-300 to-indigo-400">
                        {recap.title}
                    </span>
                </h2>
                 <button 
                    onClick={() => dispatch({ type: 'SET_VIEW', payload: 'DRAFT_STORY' })}
                    className="mb-3 sm:mb-4 flex items-center gap-2 mx-auto px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold rounded-lg shadow-lg btn-primary text-sm mobile-touch-target"
                >
                    <TelescopeIcon />
                    View Draft Story
                </button>
            </div>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed mb-4 sm:mb-6 whitespace-pre-wrap">{recap.summary}</p>

            <div>
                <h3 className="font-bold text-base sm:text-lg text-cyan-300 mb-3 flex items-center gap-2"><SparklesIcon /> Draft Awards</h3>
                <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                    {recap.awards.map((award, index) => (
                        <AwardCard key={index} award={award} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DraftRecap;
