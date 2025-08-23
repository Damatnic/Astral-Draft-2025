
import React from 'react';
import type { SeasonReviewData, Team } from '../../types';
import { SparklesIcon } from '../icons/SparklesIcon';
import { ChartBarIcon } from '../icons/ChartBarIcon';

interface SeasonReviewDisplayProps {
    review: SeasonReviewData;
    teams: Team[];
}

const SuperlativeCard: React.FC<{ superlative: SeasonReviewData['superlatives'][0], team?: Team }> = ({ superlative, team }) => (
    <div className="bg-white/5 p-4 rounded-lg">
        <h4 className="font-bold text-white">{superlative.title}</h4>
        <p className="text-sm text-yellow-300 font-semibold">{superlative.teamName}</p>
        <p className="text-xs text-gray-400 mt-1 italic">"{superlative.rationale}"</p>
    </div>
);

const SeasonReviewDisplay: React.FC<SeasonReviewDisplayProps> = ({ review, teams }) => {
    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-center mb-6">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-300 via-cyan-300 to-indigo-400">
                    {review.title}
                </span>
            </h2>

             <div className="max-w-4xl mx-auto space-y-8">
                 <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap text-center italic">
                    "{review.summary}"
                </p>

                <div>
                    <h3 className="font-bold text-lg text-cyan-300 mb-3 flex items-center gap-2"><SparklesIcon /> Season Superlatives</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {review.superlatives.map((sup, i) => (
                            <SuperlativeCard key={i} superlative={sup} team={teams.find(t => t.name === sup.teamName)} />
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="font-bold text-lg text-cyan-300 mb-3 flex items-center gap-2"><ChartBarIcon /> Final Power Rankings</h3>
                    <div className="bg-black/10 rounded-lg p-2 space-y-1">
                        {review.finalPowerRanking.map((ranking: any) => {
                             const team = teams.find((t: any) => t.name === ranking.teamName);
                             return (
                                <div key={ranking.rank} className="flex items-center gap-4 p-1.5 rounded-md">
                                    <span className="font-display font-bold text-xl w-8 text-center text-cyan-400">{ranking.rank}</span>
                                    <span className="text-2xl">{team?.avatar}</span>
                                    <span className="font-semibold text-white">{ranking.teamName}</span>
                                </div>
                             )
                        })}
                    </div>
                </div>
             </div>
        </div>
    );
};

export default SeasonReviewDisplay;