
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NewspaperIcon } from '../icons/NewspaperIcon';
import { useLiveData } from '../../hooks/useLiveData';
import { LiveNewsItem } from '../../types';

const NewsTicker: React.FC = () => {
    const { latestNews } = useLiveData();
    const [headlines, setHeadlines] = React.useState<LiveNewsItem[]>([]);
    const [currentIndex, setCurrentIndex] = React.useState(0);

    React.useEffect(() => {
        if (latestNews && !headlines.some((h: any) => h.id === latestNews.id)) {
            setHeadlines(prev => [latestNews, ...prev].slice(0, 10)); // Keep last 10
        }
    }, [latestNews, headlines]);

    React.useEffect(() => {
        if (headlines.length > 1) {
            const interval = setInterval(() => {
                setCurrentIndex((prevIndex) => (prevIndex + 1) % headlines.length);
            }, 5000); // Change headline every 5 seconds
            return () => clearInterval(interval);
        }
    }, [headlines.length]);

    if (headlines.length === 0) {
        return <div className="p-4 text-center text-sm text-[var(--text-secondary)] h-full flex items-center justify-center">Awaiting latest news...</div>;
    }

    const currentHeadline = headlines[currentIndex];

    return (
        <div className="p-4 overflow-hidden h-full flex items-center">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentHeadline.id}
                    className="flex items-start gap-3 w-full"
                    {...{
                        initial: { opacity: 0, y: 20 },
                        animate: { opacity: 1, y: 0 },
                        exit: { opacity: 0, y: -20 },
                        transition: { duration: 0.5, ease: 'easeInOut' },
                    }}
                >
                    <NewspaperIcon className="w-5 h-5 mt-0.5 text-cyan-400 flex-shrink-0" />
                    <div className="flex-grow">
                        <p className="text-[var(--text-primary)] font-semibold">{currentHeadline.headline}</p>
                        <p className="text-xs text-[var(--text-secondary)] mt-1">{currentHeadline.source}</p>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default NewsTicker;
