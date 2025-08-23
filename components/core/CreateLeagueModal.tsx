
import React from 'react';
import type { LeagueSettings, User, CreateLeaguePayload, AiProfileData } from '../../types';
import Modal from '../ui/Modal';
import { motion } from 'framer-motion';
import { generateTeamBranding, generateAiTeamProfile } from '../../services/geminiService';
import { SparklesIcon } from '../icons/SparklesIcon';
import { Avatar } from '../ui/Avatar';

interface CreateLeagueModalProps {
    onClose: () => void;
    user: User;
    dispatch: React.Dispatch<any>;
}

const CreateLeagueModal: React.FC<CreateLeagueModalProps> = ({ onClose, user, dispatch }) => {
    const [name, setName] = React.useState('My Awesome League');
    const [userTeamName, setUserTeamName] = React.useState(`${user.name}'s Dynasty`);
    const [userTeamAvatar, setUserTeamAvatar] = React.useState(user.avatar);
    const [isGenerating, setIsGenerating] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const [draftFormat, setDraftFormat] = React.useState<LeagueSettings['draftFormat']>('SNAKE');
    const [teamCount, setTeamCount] = React.useState<LeagueSettings['teamCount']>(12);
    const [scoring, setScoring] = React.useState<LeagueSettings['scoring']>('PPR');
    const [tradeDeadline, setTradeDeadline] = React.useState<LeagueSettings['tradeDeadline']>(10);
    const [playoffFormat, setPlayoffFormat] = React.useState<LeagueSettings['playoffFormat']>('4_TEAM');
    const [waiverRule, setWaiverRule] = React.useState<LeagueSettings['waiverRule']>('FAAB');
    const [aiAssistanceLevel, setAiAssistanceLevel] = React.useState<LeagueSettings['aiAssistanceLevel']>('FULL');


    const handleGenerateBranding = async () => {
        setIsGenerating(true);
        const branding = await generateTeamBranding(user.name);
        if (branding) {
            setUserTeamName(branding.teamName);
            setUserTeamAvatar(branding.avatar);
        } else {
            dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Could not generate branding.', type: 'SYSTEM' } });
        }
        setIsGenerating(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        dispatch({ type: 'ADD_NOTIFICATION', payload: { message: `Generating AI managers... this may take a moment.`, type: 'SYSTEM' }});

        try {
            const aiProfilePromises = Array.from({ length: teamCount - 1 }).map(() => generateAiTeamProfile(name));
            const aiProfiles = (await Promise.all(aiProfilePromises)).filter(Boolean) as AiProfileData[];
            
            if (aiProfiles.length !== teamCount - 1) {
                throw new Error("Failed to generate all AI manager profiles.");
            }

            const newLeague: CreateLeaguePayload = {
                id: `league_${Date.now()}`,
                name,
                settings: {
                    draftFormat,
                    teamCount,
                    scoring,
                    rosterSize: 16, // Hardcode for now
                    tradeDeadline,
                    playoffFormat,
                    waiverRule,
                    aiAssistanceLevel,
                },
                status: 'PRE_DRAFT' as const,
                commissionerId: user.id,
                userTeamName,
                userTeamAvatar,
                aiProfiles,
            };
            dispatch({ type: 'CREATE_LEAGUE', payload: newLeague });
            dispatch({ type: 'ADD_NOTIFICATION', payload: { message: `League "${name}" created!`, type: 'SYSTEM' }});
            onClose();

        } catch (error) {
            console.error("Error creating league with AI profiles:", error);
            dispatch({ type: 'ADD_NOTIFICATION', payload: { message: "Error: Could not create league. Please try again.", type: 'SYSTEM' } });
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClasses = "mobile-touch-target w-full bg-black/10 dark:bg-gray-900/50 border border-[var(--panel-border)] rounded-md px-3 py-3 text-sm placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-cyan-400";
    const labelClasses = "block text-sm font-medium text-[var(--text-secondary)] mb-1";
    const buttonGroupButtonClasses = (isActive: boolean) => `flex-1 py-2 text-sm font-bold rounded-md transition-all ${isActive ? 'bg-cyan-400 text-black' : 'bg-black/10 dark:bg-gray-700/50 hover:bg-black/20 dark:hover:bg-gray-600/50'}`;


    return (
        <Modal onClose={onClose}>
            <motion.div 
                className="glass-pane rounded-xl shadow-2xl w-full max-w-2xl"
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-league-title"
                onClick={(e: any) => e.stopPropagation()}
                {...{
                    initial: { opacity: 0, y: -20, scale: 0.95 },
                    animate: { opacity: 1, y: 0, scale: 1 },
                    exit: { opacity: 0, y: 20, scale: 0.95 },
                }}
            >
                <header className="p-6 border-b border-[var(--panel-border)]">
                    <h2 id="create-league-title" className="text-2xl font-bold font-display text-[var(--text-primary)]">
                        Create New League
                    </h2>
                </header>

                <form onSubmit={handleSubmit}>
                    <main className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column */}
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="league-name" className={labelClasses}>League Name</label>
                                <input id="league-name" type="text" value={name} onChange={e => setName(e.target.value)} className={inputClasses} required />
                            </div>
                            
                            <div className="p-3 bg-black/10 rounded-lg space-y-2 border border-cyan-400/20">
                                <label className={labelClasses}>Your Team Branding</label>
                                <div className="flex items-center gap-3">
                                    <Avatar avatar={userTeamAvatar} className="w-16 h-16 text-4xl rounded-lg flex-shrink-0" />
                                    <div className="flex-grow space-y-2">
                                        <input id="team-name" type="text" value={userTeamName} onChange={e => setUserTeamName(e.target.value)} className={inputClasses} required />
                                        <p className="text-xs text-gray-500 px-1">Enter a team name above, or generate one with AI.</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleGenerateBranding}
                                    disabled={isGenerating}
                                    className="w-full mt-1 flex items-center justify-center gap-2 px-4 py-1.5 bg-transparent border border-cyan-400/50 text-cyan-300 font-bold text-xs rounded-md hover:bg-cyan-400/20 disabled:opacity-50"
                                >
                                    {isGenerating ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                                            <span>Generating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <SparklesIcon />
                                            <span>Generate Logo & Name</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClasses}>AI Assistance</label>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => setAiAssistanceLevel('FULL')} className={buttonGroupButtonClasses(aiAssistanceLevel === 'FULL')}>Full</button>
                                        <button type="button" onClick={() => setAiAssistanceLevel('BASIC')} className={buttonGroupButtonClasses(aiAssistanceLevel === 'BASIC')}>Basic</button>
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClasses}>Draft Format</label>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => setDraftFormat('SNAKE')} className={buttonGroupButtonClasses(draftFormat === 'SNAKE')}>SNAKE</button>
                                        <button type="button" onClick={() => setDraftFormat('AUCTION')} className={buttonGroupButtonClasses(draftFormat === 'AUCTION')}>AUCTION</button>
                                    </div>
                                </div>
                            </div>
                            <div>
                               <label className={labelClasses}>Scoring</label>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => setScoring('PPR')} className={`flex-1 px-1 py-2 text-xs font-bold rounded-md transition-all ${scoring === 'PPR' ? 'bg-cyan-400 text-black' : 'bg-black/10 dark:bg-gray-700/50 hover:bg-black/20 dark:hover:bg-gray-600/50'}`}>PPR</button>
                                    <button type="button" onClick={() => setScoring('Half-PPR')} className={`flex-1 px-1 py-2 text-xs font-bold rounded-md transition-all ${scoring === 'Half-PPR' ? 'bg-cyan-400 text-black' : 'bg-black/10 dark:bg-gray-700/50 hover:bg-black/20 dark:hover:bg-gray-600/50'}`}>Half-PPR</button>
                                    <button type="button" onClick={() => setScoring('Standard')} className={`flex-1 px-1 py-2 text-xs font-bold rounded-md transition-all ${scoring === 'Standard' ? 'bg-cyan-400 text-black' : 'bg-black/10 dark:bg-gray-700/50 hover:bg-black/20 dark:hover:bg-gray-600/50'}`}>Standard</button>
                                </div>
                            </div>

                             <div>
                                <label className={labelClasses}>Playoff Format</label>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => setPlayoffFormat('4_TEAM')} className={buttonGroupButtonClasses(playoffFormat === '4_TEAM')}>4 Teams</button>
                                    <button type="button" onClick={() => setPlayoffFormat('6_TEAM')} className={buttonGroupButtonClasses(playoffFormat === '6_TEAM')}>6 Teams</button>
                                </div>
                            </div>

                             <div>
                                <label htmlFor="team-count" className={labelClasses}>Number of Teams: <span className="font-bold text-[var(--text-primary)]">{teamCount}</span></label>
                                <input id="team-count" type="range" min="8" max="14" step="2" value={teamCount} onChange={e => setTeamCount(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400" />
                            </div>
                        </div>

                    </main>

                    <footer className="p-6 flex justify-end gap-4 border-t border-[var(--panel-border)]">
                        <button type="button" onClick={onClose} className="mobile-touch-target px-4 py-3 bg-transparent border border-[var(--panel-border)] text-[var(--text-secondary)] font-bold rounded-lg hover:bg-white/10 transition-colors">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="mobile-touch-target px-6 py-3 bg-gradient-to-r from-green-500 to-cyan-500 text-white font-bold rounded-lg shadow-md hover:from-green-600 hover:to-cyan-600 transition-colors disabled:opacity-60 disabled:cursor-wait"
                        >
                            {isSubmitting ? 'Creating...' : 'Create League'}
                        </button>
                    </footer>
                </form>
            </motion.div>
        </Modal>
    );
};

export default CreateLeagueModal;
