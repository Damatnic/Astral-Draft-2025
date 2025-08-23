

import React from 'react';
import type { WeeklyReportData } from '../../types';
import { TrophyIcon } from '../icons/TrophyIcon';
import { FlameIcon } from '../icons/FlameIcon';
import { ZapIcon } from '../icons/ZapIcon';

interface WeeklyReportDisplayProps {
    report: WeeklyReportData;
}

const WeeklyReportDisplay: React.FC<WeeklyReportDisplayProps> = ({ report }) => {
    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-center mb-6">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-300 via-cyan-300 to-indigo-400">
                    {report.title}
                </span>
            </h2>

            <div className="max-w-3xl mx-auto">
                <p className="text-sm text-gray-300 leading-relaxed mb-8 whitespace-pre-wrap text-center italic">
                    "{report.summary}"
                </p>
                
                {report.powerPlay && (
                    <div className="mb-8 p-4 bg-purple-500/10 border border-purple-400/20 rounded-lg text-center">
                        <h3 className="font-bold text-lg text-purple-300 mb-1 flex items-center justify-center gap-2"><ZapIcon /> Power Play of the Week</h3>
                        <p className="font-semibold text-white">{report.powerPlay.move} by {report.powerPlay.teamName}</p>
                        <p className="text-xs text-gray-400 mt-1 italic">"{report.powerPlay.rationale}"</p>
                    </div>
                )}


                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Game of the Week */}
                    <div className="bg-white/5 p-4 rounded-lg flex flex-col items-center text-center">
                        <FlameIcon />
                        <h3 className="font-bold text-lg text-cyan-300 mt-2 mb-1">Game of the Week</h3>
                        <p className="font-semibold text-white">{report.gameOfWeek.teamAName} vs. {report.gameOfWeek.teamBName}</p>
                        <p className="text-xs text-gray-400 mt-1">"{report.gameOfWeek.reason}"</p>
                    </div>

                    {/* Player of the Week */}
                    <div className="bg-white/5 p-4 rounded-lg flex flex-col items-center text-center">
                        <TrophyIcon />
                        <h3 className="font-bold text-lg text-yellow-300 mt-2 mb-1">Player of the Week</h3>
                        <p className="font-semibold text-white">{report.playerOfWeek.playerName}</p>
                        <p className="text-xs text-gray-400">{report.playerOfWeek.teamName} - {report.playerOfWeek.stats} points</p>
                        <p className="text-xs text-gray-400 mt-1">"{report.playerOfWeek.reason}"</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WeeklyReportDisplay;