
import React from 'react';
import type { Team, DraftPick } from '../../types';

interface TurnTimerProps {
    currentPick: number;
    teams: Team[];
    draftPicks: DraftPick[];
    isMyTurn: boolean;
    isPaused: boolean;
}

const PICK_TIME_SECONDS = 60;

const TurnTimer: React.FC<TurnTimerProps> = ({ currentPick, teams, draftPicks, isMyTurn, isPaused }) => {
    const [timeLeft, setTimeLeft] = React.useState(PICK_TIME_SECONDS);
    
    const isDraftComplete = draftPicks.length > 0 && currentPick > draftPicks.length;
    
    React.useEffect(() => {
        if (isDraftComplete) return;

        setTimeLeft(PICK_TIME_SECONDS);

        const interval = setInterval(() => {
            if (!isPaused) {
                setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [currentPick, isPaused, isDraftComplete]);
    
    const teamOnTheClockId = !isDraftComplete ? draftPicks[currentPick - 1]?.teamId : null;
    const teamOnTheClock = teams.find((t: any) => t.id === teamOnTheClockId);
    const progress = (timeLeft / PICK_TIME_SECONDS) * 100;

    return (
        <>
            {isDraftComplete ? (
                 <div className="glass-pane p-3 rounded-xl flex items-center justify-center bg-gradient-to-r from-green-500 to-cyan-500">
                    <p className="font-bold text-lg text-white">DRAFT COMPLETE!</p>
                </div>
            ) : (
                <div className="glass-pane p-3 rounded-xl flex items-center justify-between">
                    <div>
                        <p className="text-xs text-gray-400">ON THE CLOCK (PICK {currentPick})</p>
                        <p className="font-bold text-lg text-white">{teamOnTheClock?.name || '...'}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {isMyTurn && !isPaused &&
                            <span className="px-3 py-1 bg-green-500/80 text-white font-bold rounded-full text-sm animate-pulse">
                                YOUR PICK!
                            </span>
                        }
                        {isPaused &&
                            <span className="px-3 py-1 bg-yellow-500/80 text-white font-bold rounded-full text-sm">
                                PAUSED
                            </span>
                        }
                        <div className="w-24 h-8 bg-gray-800/50 rounded-full relative overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-green-400 to-cyan-400 transition-all duration-1000 linear"
                                style={{ width: `${progress}%` }}
                            ></div>
                            <span className="absolute inset-0 flex items-center justify-center font-mono font-bold text-lg text-white">
                                0:{timeLeft.toString().padStart(2, '0')}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default TurnTimer;