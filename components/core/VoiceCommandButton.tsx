

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppState } from '../../contexts/AppContext';
import { MicrophoneIcon } from '../icons/MicrophoneIcon';
import { players } from '../../data/players';
import type { Player } from '../../types';

// Web Speech API might be vendor-prefixed
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

const speak = (text: string) => {
    if ('speechSynthesis' in window) {
        try {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.1;
            utterance.pitch = 0.9;
            window.speechSynthesis.speak(utterance);
        } catch (e) {
            console.error("Speech synthesis error", e);
        }
    }
};

const VoiceCommandButton: React.FC = () => {
    const { state, dispatch } = useAppState();
    const [isListening, setIsListening] = React.useState(false);
    const [transcript, setTranscript] = React.useState('');
    const recognitionRef = React.useRef<any>(null);

    const processCommand = (command: string) => {
        const lowerCaseCommand = command.toLowerCase();
        
        if (lowerCaseCommand.includes('go to dashboard')) {
            dispatch({ type: 'SET_VIEW', payload: 'DASHBOARD' });
            speak("Navigating to Dashboard");
        } else if (lowerCaseCommand.includes('show my team') || lowerCaseCommand.includes('go to my team')) {
            if(state.activeLeagueId) {
                dispatch({ type: 'SET_VIEW', payload: 'TEAM_HUB' });
                speak("Navigating to your Team Hub");
            } else {
                speak("Please select a league first");
            }
        } else if (lowerCaseCommand.includes('open command palette')) {
            dispatch({ type: 'SET_COMMAND_PALETTE_OPEN', payload: true });
            speak("Opening Command Palette");
        } else if (lowerCaseCommand.startsWith('search for') || lowerCaseCommand.startsWith('look up')) {
            const playerName = lowerCaseCommand.replace('search for', '').replace('look up', '').trim();
            const foundPlayer = players.find((p: any) => p.name.toLowerCase() === playerName);
            if(foundPlayer) {
                dispatch({ type: 'SET_PLAYER_DETAIL', payload: { player: foundPlayer } });
                speak(`Showing details for ${foundPlayer.name}`);
            } else {
                 speak(`Sorry, I could not find a player named ${playerName}`);
            }
        } else {
            speak(`I didn't recognize that command.`);
        }
    };

    const handleListen = () => {
        if (!SpeechRecognition) {
            dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Voice commands not supported by this browser.', type: 'SYSTEM' }});
            speak("Sorry, voice commands are not supported on this browser.");
            return;
        }

        if (isListening) {
            recognitionRef.current?.stop();
            return;
        }

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsListening(true);
            setTranscript('');
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error', event.error);
            speak(`Voice error: ${event.error}`);
        };

        recognition.onresult = (event: any) => {
            const currentTranscript = Array.from(event.results)
                .map((result: any) => result[0])
                .map((result: any) => result.transcript)
                .join('');
            
            setTranscript(currentTranscript);

            if (event.results[0].isFinal) {
                processCommand(currentTranscript);
            }
        };

        recognition.start();
    };

    return (
        <>
            <motion.button
                onClick={handleListen}
                className={`fixed bottom-6 right-6 z-40 w-16 h-16 rounded-full flex items-center justify-center text-white shadow-2xl transition-colors
                    ${isListening ? 'bg-red-500' : 'bg-gradient-to-r from-cyan-500 to-blue-600'}`
                }
                aria-label={isListening ? 'Stop listening' : 'Start voice command'}
                {...{
                    whileHover: { scale: 1.1 },
                    whileTap: { scale: 0.9 },
                }}
            >
                {isListening && (
                    <motion.div
                        className="absolute inset-0 border-4 border-red-300 rounded-full"
                        {...{
                            animate: {
                                scale: [1, 1.3, 1],
                                opacity: [0.5, 1, 0.5]
                            },
                            transition: {
                                repeat: Infinity,
                                duration: 1.5,
                                ease: "easeInOut"
                            },
                        }}
                    />
                )}
                <MicrophoneIcon className="h-8 w-8" />
            </motion.button>
            <AnimatePresence>
                {isListening && (
                    <motion.div
                        className="fixed bottom-24 right-6 z-40 p-4 bg-gray-900/80 backdrop-blur-md rounded-lg shadow-xl text-white max-w-sm"
                        {...{
                            initial: { opacity: 0, y: 10 },
                            animate: { opacity: 1, y: 0 },
                            exit: { opacity: 0, y: 10 },
                        }}
                    >
                        <p className="text-sm font-semibold mb-1">Listening...</p>
                        <p className="text-lg min-h-[1.75rem]">{transcript || '...'}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default VoiceCommandButton;