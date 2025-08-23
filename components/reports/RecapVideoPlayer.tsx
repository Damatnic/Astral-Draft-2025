
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RecapVideoScene, League } from '../../types';
import { Avatar } from '../ui/Avatar';
import { LazyImage } from '../ui/LazyImage';
import { PlayIcon } from '../icons/PlayIcon';
import { PauseIcon } from '../icons/PauseIcon';
import useSound from '../../hooks/useSound';

interface RecapVideoPlayerProps {
    script: RecapVideoScene[];
    league: League;
}

const sceneDuration = 5000; // 5 seconds per scene

const TitleScene: React.FC<{ scene: RecapVideoScene }> = ({ scene }) => (
    <motion.div
        className="w-full h-full flex flex-col items-center justify-center text-center p-8 bg-gradient-to-br from-gray-900 to-black"
        {...{
            initial: { opacity: 0, scale: 0.8 },
            animate: { opacity: 1, scale: 1 },
            exit: { opacity: 0, scale: 1.2 },
            transition: { duration: 0.8 },
        }}
    >
        <h1 className="font-display text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-300 via-cyan-300 to-indigo-400">
            {scene.title}
        </h1>
        <p className="mt-4 text-lg text-gray-300">{scene.narration}</p>
    </motion.div>
);

const MatchupScene: React.FC<{ scene: RecapVideoScene, league: League }> = ({ scene, league }) => {
    const teamA = league.teams.find((t: any) => t.name === scene.teamAName);
    const teamB = league.teams.find((t: any) => t.name === scene.teamBName);
    return (
         <motion.div
            className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-b from-gray-800 to-gray-900"
            {...{
                initial: { opacity: 0 },
                animate: { opacity: 1 },
                exit: { opacity: 0 },
                transition: { duration: 0.5 },
            }}
        >
            <div className="flex flex-col sm:flex-row items-center justify-around w-full gap-4">
                <motion.div {...{ initial: { x: -50, opacity: 0 }, animate: { x: 0, opacity: 1 }, transition: { delay: 0.2 } }} className="text-center">
                    <Avatar avatar={teamA?.avatar || '🏈'} className="w-24 h-24 text-6xl mx-auto rounded-lg" />
                    <p className="mt-2 font-bold text-xl">{teamA?.name}</p>
                </motion.div>
                <motion.div {...{ initial: { scale: 0 }, animate: { scale: 1 }, transition: { delay: 0.4 } }} className="text-center">
                    <p className="font-display text-6xl font-bold">{scene.teamAScore?.toFixed(2)} - {scene.teamBScore?.toFixed(2)}</p>
                    <p className="text-red-400 font-bold mt-1">{scene.type === 'UPSET' ? 'UPSET ALERT' : 'FINAL'}</p>
                </motion.div>
                <motion.div {...{ initial: { x: 50, opacity: 0 }, animate: { x: 0, opacity: 1 }, transition: { delay: 0.2 } }} className="text-center">
                     <Avatar avatar={teamB?.avatar || '🏈'} className="w-24 h-24 text-6xl mx-auto rounded-lg" />
                    <p className="mt-2 font-bold text-xl">{teamB?.name}</p>
                </motion.div>
            </div>
            <motion.p {...{ initial: { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { delay: 0.8 } }} className="mt-8 text-lg text-gray-300 text-center italic">
                "{scene.narration}"
            </motion.p>
        </motion.div>
    )
};

const TopPerformerScene: React.FC<{ scene: RecapVideoScene, league: League }> = ({ scene, league }) => {
    const team = league.teams.find((t: any) => t.name === scene.playerTeam);
    return (
         <motion.div
            className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-b from-yellow-900/50 to-gray-900"
            {...{
                initial: { opacity: 0 },
                animate: { opacity: 1 },
                exit: { opacity: 0 },
                transition: { duration: 0.5 },
            }}
        >
            <motion.p {...{ initial: { y: -20 }, animate: { y: 0 } }} className="font-display text-3xl text-yellow-300">PLAYER OF THE WEEK</motion.p>
            <motion.div {...{ initial: { scale: 0.5 }, animate: { scale: 1 }, transition: { delay: 0.2 } }} className="my-4">
                <Avatar avatar={team?.avatar || '🏈'} className="w-24 h-24 text-6xl rounded-full ring-4 ring-yellow-400" />
            </motion.div>
            <motion.p {...{ initial: { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { delay: 0.4 } }} className="text-3xl font-bold">{scene.playerName}</motion.p>
            <motion.p {...{ initial: { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { delay: 0.6 } }} className="text-5xl font-display font-bold text-yellow-300 my-2">{scene.playerScore?.toFixed(2)} PTS</motion.p>
            <motion.p {...{ initial: { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { delay: 0.8 } }} className="mt-4 text-lg text-gray-300 text-center italic">
                "{scene.narration}"
            </motion.p>
        </motion.div>
    )
};

const OutroScene: React.FC<{ scene: RecapVideoScene }> = ({ scene }) => (
     <motion.div
        className="w-full h-full flex flex-col items-center justify-center text-center p-8 bg-gradient-to-br from-gray-900 to-black"
        {...{
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            exit: { opacity: 0 },
            transition: { duration: 1 },
        }}
    >
        <LazyImage 
          src="/favicon.svg" 
          alt="Astral Draft" 
          className="w-16 h-16 mb-4"
          loading="lazy"
        />
        <p className="text-lg text-gray-300">{scene.narration}</p>
    </motion.div>
);


const RecapVideoPlayer: React.FC<RecapVideoPlayerProps> = ({ script, league }) => {
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const [isPlaying, setIsPlaying] = React.useState(true);
    const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const playClickSound = useSound('bid', 0.3);

    React.useEffect(() => {
        const advanceScene = () => {
            setCurrentIndex(prev => {
                if (prev < script.length - 1) {
                    return prev + 1;
                }
                setIsPlaying(false);
                return prev;
            });
        };

        if (isPlaying) {
            timerRef.current = setTimeout(advanceScene, sceneDuration);
        }

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [currentIndex, isPlaying, script]);

    const handlePlayPause = () => {
        playClickSound();
        setIsPlaying(prev => !prev);
    };

    const currentScene = script[currentIndex];

    return (
        <div className="w-full h-full flex flex-col relative text-white">
            <div className="flex-grow">
                <AnimatePresence mode="wait">
                    {currentScene.type === 'TITLE' && <TitleScene key={currentIndex} scene={currentScene} />}
                    {(currentScene.type === 'MATCHUP' || currentScene.type === 'UPSET') && <MatchupScene key={currentIndex} scene={currentScene} league={league} />}
                    {currentScene.type === 'TOP_PERFORMER' && <TopPerformerScene key={currentIndex} scene={currentScene} league={league} />}
                    {currentScene.type === 'OUTRO' && <OutroScene key={currentIndex} scene={currentScene} />}
                </AnimatePresence>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <div className="w-full bg-white/20 h-1.5 rounded-full">
                    <motion.div 
                        className="h-full bg-cyan-400 rounded-full"
                        key={currentIndex}
                        {...{
                            initial: { width: '0%' },
                            animate: { width: isPlaying ? '100%' : '0%' },
                            transition: { duration: isPlaying ? sceneDuration / 1000 : 0, ease: 'linear' },
                        }}
                    />
                </div>
                <div className="flex items-center justify-between mt-2">
                    <button onClick={handlePlayPause} className="p-2 rounded-full text-white bg-white/10 hover:bg-white/20">
                        {isPlaying ? <PauseIcon /> : <PlayIcon />}
                    </button>
                    <span className="text-xs font-mono">{currentIndex + 1} / {script.length}</span>
                </div>
            </div>
        </div>
    );
};

export default RecapVideoPlayer;
