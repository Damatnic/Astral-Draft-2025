
import React from 'react';
import { useLeague } from '../../hooks/useLeague';
import { motion, AnimatePresence } from 'framer-motion';
import { BotMessageSquareIcon } from '../icons/BotMessageSquareIcon';

const AiCoPilotPanel: React.FC = () => {
    const { league } = useLeague();
    const commentary = league?.draftCommentary || [];
    const scrollRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [commentary]);

    return (
        <div className="h-full flex flex-col text-[var(--text-primary)]">
            <div className="flex-shrink-0 p-3 text-center border-b border-[var(--panel-border)]">
                <h3 className="font-display text-lg font-bold flex items-center justify-center gap-2">
                    <BotMessageSquareIcon /> DRAFT CO-PILOT
                </h3>
            </div>
            <div ref={scrollRef} className="flex-grow p-2 space-y-3 overflow-y-auto">
                <AnimatePresence>
                    {commentary.map((item, index) => (
                        <motion.div
                            key={item.pickNumber}
                            className="flex items-start gap-2 text-sm"
                            {...{
                                initial: { opacity: 0, y: 10 },
                                animate: { opacity: 1, y: 0 },
                                transition: { delay: index > commentary.length - 2 ? 0.2 : 0 },
                            }}
                        >
                            <span className="font-mono text-xs text-gray-500 pt-0.5 w-8 text-center">{item.pickNumber}</span>
                            <p className="flex-1 bg-black/10 p-2 rounded-md">{item.text}</p>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {commentary.length === 0 && (
                    <div className="text-center text-xs text-gray-400 p-4 h-full flex items-center justify-center">
                        <p>The Oracle is standing by... Commentary will appear here as picks are made.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AiCoPilotPanel;
