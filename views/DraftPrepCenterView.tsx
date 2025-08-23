

import React from 'react';
import { useAppState } from '../contexts/AppContext';
import { useLeague } from '../hooks/useLeague';
import { Widget } from '../components/ui/Widget';
import Tabs from '../components/ui/Tabs';
import { AnimatePresence, motion } from 'framer-motion';
import MyRankingsEditor from '../components/prep/MyRankingsEditor';
import MockDraftHistory from '../components/prep/MockDraftHistory';
import DraftSimulationDemo from '../components/draft/DraftSimulationDemo';

const DraftPrepCenterView: React.FC = () => {
    const { dispatch } = useAppState();
    const { league } = useLeague();
    const [activeTab, setActiveTab] = React.useState('rankings');

    if (!league) {
        return (
            <div className="p-8 text-center w-full h-full flex flex-col items-center justify-center">
                <p>Please select a league to prepare for your draft.</p>
                 <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'DASHBOARD' })} className="mt-4 px-4 py-2 bg-cyan-500 rounded">
                    Back to Dashboard
                </button>
            </div>
        );
    }

    const tabs = [
        { id: 'rankings', label: 'My Rankings' },
        { id: 'ai_simulation', label: 'AI Draft Simulation' },
        { id: 'mock_history', label: 'Mock Draft History' },
    ];

    return (
        <div className="w-full h-full flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <header className="flex-shrink-0 flex justify-between items-center mb-2">
                <div>
                    <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-wider uppercase text-[var(--text-primary)]">
                        Draft Prep Center
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)] tracking-widest">{league.name}</p>
                </div>
                <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'LEAGUE_HUB' })} className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20">
                    Back to League Hub
                </button>
            </header>
            <div className="border-b border-[var(--panel-border)] mb-6">
                <Tabs items={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
            </div>
            <main className="flex-grow">
                 <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        {...{
                            initial: { opacity: 0, y: 20 },
                            animate: { opacity: 1, y: 0 },
                            exit: { opacity: 0, y: -20 },
                            transition: { duration: 0.2 },
                        }}
                    >
                        {activeTab === 'rankings' && <MyRankingsEditor leagueId={league.id} />}
                        {activeTab === 'ai_simulation' && <DraftSimulationDemo />}
                        {activeTab === 'mock_history' && <MockDraftHistory />}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
};

export default DraftPrepCenterView;
