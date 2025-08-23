
import React from 'react';
import { useAppState } from '../contexts/AppContext';
import { getStartSitAdvice } from '../services/geminiService';
import type { League, Player, StartSitAdvice, Team } from '../types';
import { Widget } from '../components/ui/Widget';
import { AnimatePresence, motion } from 'framer-motion';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { ArrowRightLeftIcon } from '../components/icons/ArrowRightLeftIcon';
import { Avatar } from '../components/ui/Avatar';
import { CloseIcon } from '../components/icons/CloseIcon';
import { useLeague } from '../hooks/useLeague';
import ErrorDisplay from '../components/core/ErrorDisplay';
import { useResponsiveBreakpoint } from '../utils/mobileOptimizationUtils';

const PlayerList: React.FC<{
    roster: Player[];
    onSelect: (id: number) => void;
    selectedId: number | null;
    disabledId: number | null;
}> = ({ roster, onSelect, selectedId, disabledId }) => {
    return (
        <div className="space-y-2 h-96 overflow-y-auto pr-2">
            {roster.map(p => (
                <button
                    key={p.id}
                    onClick={() => onSelect(p.id)}
                    disabled={p.id === disabledId}
                    className={`w-full p-2 rounded-lg flex items-center gap-3 text-left transition-all duration-200
                        ${p.id === selectedId ? 'bg-cyan-500/30 ring-2 ring-cyan-400' : 'bg-black/10 hover:bg-black/20'}
                        ${p.id === disabledId ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                >
                    <Avatar avatar={p.astralIntelligence?.spiritAnimal?.split(',')[0] || '🏈'} className="w-10 h-10 text-2xl rounded-md flex-shrink-0" />
                    <div>
                        <p className="font-bold text-sm">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.position} - {p.team}</p>
                    </div>
                </button>
            ))}
        </div>
    );
};

const PlayerSelectionSlot: React.FC<{ player: Player | undefined; onClear: () => void; label: string; weeklyProjection: number | undefined }> = ({ player, onClear, label, weeklyProjection }) => (
     <div className="glass-pane rounded-xl p-4 flex flex-col items-center justify-center h-48">
        {player ? (
            <div className="text-center relative w-full h-full flex flex-col items-center justify-center">
                <button onClick={onClear} className="absolute top-1 right-1 text-red-400 hover:text-red-300 transition-colors p-1 rounded-full bg-black/20">
                    <CloseIcon className="h-3 w-3" />
                </button>
                <Avatar avatar={player.astralIntelligence?.spiritAnimal?.split(',')[0] || '🏈'} className="w-16 h-16 text-4xl rounded-lg" />
                <p className="font-bold mt-2">{player.name}</p>
                <p className="text-xs text-gray-400">{player.position} - {player.team}</p>
                 {weeklyProjection !== undefined && (
                     <p className="text-xs text-cyan-300 mt-1">Proj: <span className="font-bold">{weeklyProjection.toFixed(2)}</span></p>
                 )}
            </div>
        ) : (
            <div className="text-center text-gray-400">
                <p className="text-xl font-bold">{label}</p>
                <p className="text-sm">Select a player from your roster below.</p>
            </div>
        )}
    </div>
);


const RecommendedPlayerCard: React.FC<{ player: Player; isRecommended: boolean; weeklyProjection: number | undefined; }> = ({ player, isRecommended, weeklyProjection }) => (
    <div className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${isRecommended ? 'border-green-400 bg-green-500/10 shadow-lg shadow-green-500/20' : 'border-gray-600/50 opacity-60'}`}>
        {isRecommended && <div className="absolute top-2 right-2 px-2 py-0.5 text-xs font-bold bg-green-400 text-black rounded-full">RECOMMENDED</div>}
        <div className="flex flex-col items-center text-center">
            <Avatar avatar={player.astralIntelligence?.spiritAnimal?.split(',')[0] || '🏈'} className="w-20 h-20 text-5xl rounded-lg" />
            <p className="font-bold mt-2 text-lg">{player.name}</p>
            <p className="text-sm text-gray-400">{player.position} - {player.team}</p>
            {weeklyProjection !== undefined && (
                <p className="text-sm text-cyan-300 mt-1">Proj: <span className="font-bold">{weeklyProjection.toFixed(2)}</span></p>
            )}
        </div>
    </div>
);

const AdviceDisplay: React.FC<{
    advice: StartSitAdvice;
    playerA: Player;
    playerB: Player;
    playerAProj: number | undefined;
    playerBProj: number | undefined;
}> = ({ advice, playerA, playerB, playerAProj, playerBProj }) => {
    const { isMobile } = useResponsiveBreakpoint();
    const isPlayerARecommended = advice.recommendedPlayerId === playerA.id;
    
    return (
        <motion.div
            className="mt-6"
            {...{
                initial: { opacity: 0, y: 10 },
                animate: { opacity: 1, y: 0 },
            }}
        >
            <Widget title="Oracle's Recommendation">
                <div className="p-4">
                    <div className={`grid ${isMobile ? 'grid-cols-1 gap-6' : 'grid-cols-[1fr_auto_1fr]'} items-center gap-4`}>
                        <RecommendedPlayerCard player={playerA} isRecommended={isPlayerARecommended} weeklyProjection={playerAProj}/>
                        {!isMobile && <div className="font-bold text-gray-400 text-2xl">VS</div>}
                        {isMobile && (
                            <div className="flex justify-center">
                                <div className="font-bold text-gray-400 text-xl">VS</div>
                            </div>
                        )}
                        <RecommendedPlayerCard player={playerB} isRecommended={!isPlayerARecommended} weeklyProjection={playerBProj}/>
                    </div>
                    <p className="text-sm text-gray-300 italic text-center mt-4 pt-4 border-t border-white/10">"{advice.summary}"</p>
                </div>
            </Widget>
        </motion.div>
    );
};


const StartSitToolContent: React.FC<{ league: League; myTeam: Team; dispatch: React.Dispatch<any> }> = ({ league, myTeam, dispatch }) => {
    const { isMobile } = useResponsiveBreakpoint();
    const [playerAId, setPlayerAId] = React.useState<number | null>(null);
    const [playerBId, setPlayerBId] = React.useState<number | null>(null);
    const [advice, setAdvice] = React.useState<StartSitAdvice | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);

    const handleGetAdvice = async () => {
        if (!playerAId || !playerBId) return;
        const playerA = myTeam.roster.find(p => p.id === playerAId);
        const playerB = myTeam.roster.find(p => p.id === playerBId);
        if (!playerA || !playerB) return;

        setIsLoading(true);
        setAdvice(null);
        try {
            const result = await getStartSitAdvice(playerA, playerB, league);
            setAdvice(result);
        } catch (e) {
            console.error("Error getting start/sit advice:", e);
            dispatch({ type: 'ADD_NOTIFICATION', payload: { message: "The Oracle could not be reached.", type: 'SYSTEM' } });
        } finally {
            setIsLoading(false);
        }
    };
    
    const playerA = myTeam.roster.find(p => p.id === playerAId);
    const playerB = myTeam.roster.find(p => p.id === playerBId);

    const playerAProj = playerA?.stats.weeklyProjections[league.currentWeek];
    const playerBProj = playerB?.stats.weeklyProjections[league.currentWeek];

    return (
        <div className="w-full h-full flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <header className="flex-shrink-0 flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-wider uppercase text-[var(--text-primary)]">
                        Start/Sit Tool
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)] tracking-widest">{league.name} - Week {league.currentWeek}</p>
                </div>
                <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'TEAM_HUB' })} 
                        className="w-full sm:w-auto px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 min-h-[44px]">
                    Back to Team Hub
                </button>
            </header>
            <main className="flex-grow max-w-6xl mx-auto w-full">
                <div className={`grid ${isMobile ? 'grid-cols-1 gap-6' : 'grid-cols-[1fr_auto_1fr]'} items-center gap-4 mb-6`}>
                     <PlayerSelectionSlot player={playerA} onClear={() => setPlayerAId(null)} label="Player A" weeklyProjection={playerAProj} />
                     {!isMobile && <ArrowRightLeftIcon className="w-8 h-8 text-cyan-400 mx-auto" />}
                     {isMobile && (
                         <div className="flex justify-center">
                             <ArrowRightLeftIcon className="w-8 h-8 text-cyan-400 rotate-90" />
                         </div>
                     )}
                     <PlayerSelectionSlot player={playerB} onClear={() => setPlayerBId(null)} label="Player B" weeklyProjection={playerBProj} />
                </div>

                <Widget title="Select Players From Your Roster">
                     <div className={`p-4 grid ${isMobile ? 'grid-cols-1 gap-6' : 'grid-cols-2'} gap-4`}>
                        <div className={isMobile ? 'order-1' : ''}>
                            <div className="text-sm font-semibold text-cyan-300 mb-2">Player A Selection</div>
                            <PlayerList roster={myTeam.roster} onSelect={setPlayerAId} selectedId={playerAId} disabledId={playerBId} />
                        </div>
                        <div className={isMobile ? 'order-2' : ''}>
                            <div className="text-sm font-semibold text-cyan-300 mb-2">Player B Selection</div>
                            <PlayerList roster={myTeam.roster} onSelect={setPlayerBId} selectedId={playerBId} disabledId={playerAId} />
                        </div>
                    </div>
                </Widget>
                
                <div className="mt-6 text-center">
                    <button
                        onClick={handleGetAdvice}
                        disabled={!playerAId || !playerBId || isLoading}
                        className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-bold rounded-lg shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto min-h-[44px] justify-center"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <SparklesIcon />
                                Ask the Oracle
                            </>
                        )}
                    </button>
                </div>
                
                <AnimatePresence>
                    {advice && playerA && playerB && (
                        <AdviceDisplay advice={advice} playerA={playerA} playerB={playerB} playerAProj={playerAProj} playerBProj={playerBProj}/>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

const StartSitToolView: React.FC = () => {
    const { dispatch } = useAppState();
    const { league, myTeam } = useLeague();

    if (!league || !myTeam) {
        return (
            <div className="w-full h-full flex items-center justify-center p-4">
                <p>Could not load tool. Please select a league with an active season first.</p>
                <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'DASHBOARD' })} className="ml-4 px-4 py-2 bg-cyan-500 rounded">
                    Back to Dashboard
                </button>
            </div>
        );
    }
    
    if (league.settings.aiAssistanceLevel === 'BASIC') {
        return <ErrorDisplay title="Feature Disabled" message="The Start/Sit Tool is disabled in leagues with Basic AI Assistance." onRetry={() => dispatch({ type: 'SET_VIEW', payload: 'TEAM_HUB' })} />;
    }

    return <StartSitToolContent league={league} myTeam={myTeam} dispatch={dispatch} />;
};

export default StartSitToolView;
