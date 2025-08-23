

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppState } from '../../contexts/AppContext';
import { formatRelativeTime } from '../../utils/time';
import { FlameIcon } from '../icons/FlameIcon';
import { ZapIcon } from '../icons/ZapIcon';
import type { GamedayEventType } from '../../types';

interface LiveEventTickerProps {
    matchupId: string;
}

const eventIcons: Record<GamedayEventType, React.ReactElement> = {
    TOUCHDOWN: <FlameIcon />,
    FIELD_GOAL: <ZapIcon />,
    BIG_PLAY: <ZapIcon />,
    REDZONE_ENTRY: <FlameIcon />,
    INTERCEPTION: <ZapIcon />,
    FUMBLE: <ZapIcon />,
};

const LiveEventTicker: React.FC<LiveEventTickerProps> = ({ matchupId }) => {
    const { state } = useAppState();
    const events = (state.gamedayEvents[matchupId] || []).slice(-5); // Show last 5 events
    const scrollRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [events]);

    return (
        <div className="glass-pane p-3 rounded-xl flex-grow flex flex-col min-w-[300px]">
            <h3 className="text-center font-bold text-sm mb-2 text-red-400 animate-pulse">LIVE</h3>
            <div ref={scrollRef} className="flex-grow space-y-2 overflow-y-auto pr-2">
                <AnimatePresence initial={false}>
                    {events.map((event: any) => (
                        <motion.div
                            key={event.id}
                            className="p-2 bg-black/20 rounded-md text-xs"
                            {...{
                                layout: true,
                                initial: { opacity: 0, y: 20, scale: 0.8 },
                                animate: { opacity: 1, y: 0, scale: 1 },
                                exit: { opacity: 0, x: -20 },
                                transition: { type: 'spring', stiffness: 200, damping: 20 },
                            }}
                        >
                            <div className="flex justify-between items-center text-gray-400 mb-1">
                                <span className="font-bold text-cyan-300 flex items-center gap-1">
                                    {eventIcons[event.type]}
                                    {event.type.replace('_', ' ')}
                                </span>
                                <span>{formatRelativeTime(event.timestamp)}</span>
                            </div>
                            <p>{event.text}</p>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default LiveEventTicker;
