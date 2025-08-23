
import React from 'react';
import { useAppState } from '../contexts/AppContext';

// Data URLs for simple placeholder sounds
const sounds = {
    notification: 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAABhZ2FzAAAAAAAAAAAAAABoYXJtAAAAADAAAAAJAAAAGgAAAAEAAgAUAAAAZGF0YV9vT18AAAAABgAAABcAMgA0ADoAOwA+AD4APQA8ADgANQAyAC8ALQApACUALgAuAC4ALgAsACcAJgAjACAAGgAXABEADQAHAAIAAAA=',
    draft: 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAABhZ2FzAAAAAAAAAAAAAABoYXJtAAAAADAAAAAJAAAAGgAAAAEAAgAUAAAAZGF0YV9vT18AAAAABgAAAE4AVQBTAD0AMgAqACIAFgAIAAQAPwA/AD8APQA2ACwAJgAgABUADQAFAAAA',
    bid: 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAABhZ2FzAAAAAAAAAAAAAABoYXJtAAAAADAAAAAJAAAAGgAAAAEAAgAUAAAAZGF0YV9vT18AAAAABgAAABMAHgAjACgAKgAmACIAHAAXABEACQADAAAA',
    yourTurn: 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAABhZ2FzAAAAAAAAAAAAAABoYXJtAAAAADAAAAAJAAAAGgAAAAEAAgAUAAAAZGF0YV9vT18AAAAABgAAACUANgA9AD0AMwArACIAFwAOAAQAPgA/AD8APgA5AC0AJgAfABYADQAFAAAA',
    sold: 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAABhZ2FzAAAAAAAAAAAAAABoYXJtAAAAADAAAAAJAAAAGgAAAAEAAgAUAAAAZGF0YV9vT18AAAAABgAAAEIAVwBeAFsAUgBGADoALgAiABUACQABAAA=',
    tradeOffer: 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAABhZ2FzAAAAAAAAAAAAAABoYXJtAAAAADAAAAAJAAAAGgAAAAEAAgAUAAAAZGF0YV9vT18AAAAABgAAADMARgBOAFQASgA/ADAAJgAbABMADgAFAAACAAAA',
    hover: 'data:audio/wav;base64,UklGRkFvT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAABhZ2FzAAAAAAAAAAAAAABoYXJtAAAAADAAAAAJAAAAGgAAAAEAAgAUAAAAZGF0YVpvT18AAAAABQAAAP8A/wD/AP8A/w==',
    openModal: 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAABhZ2FzAAAAAAAAAAAAAABoYXJtAAAAADAAAAAJAAAAGgAAAAEAAgAUAAAAZGF0YV9vT18AAAAABgAAABcAMgA0ADoAOwA+AD4APQA8ADgANQAyAC8ALQApACUALgAuAC4ALgAsACcAJgAjACAAGgAXABEADQAHAAIAAAA=',
    closeModal: 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAABhZ2FzAAAAAAAAAAAAAABoYXJtAAAAADAAAAAJAAAAGgAAAAEAAgAUAAAAZGF0YV9vT18AAAAABgAAAD4APAA4ADMANgA5ADwAPQA9ADoANgAyACwAJgAgABcAEQAMAAcAAgAAAA==',
    tab: 'data:audio/wav;base64,UklGRkFvT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAABhZ2FzAAAAAAAAAAAAAABoYXJtAAAAADAAAAAJAAAAGgAAAAEAAgAUAAAAZGF0YVpvT18AAAAABQAAACAAIAAgACAAIA=='
};

type SoundType = keyof typeof sounds;

const audioCache: { [key in SoundType]?: HTMLAudioElement } = {};

const useSound = (soundType: SoundType, volume: number = 0.5): (() => void) => {
    const { state } = useAppState();

    const play = React.useCallback(() => {
        if (!state.soundEnabled || !state.isAudioUnlocked) {
            return;
        }

        try {
            if (!audioCache[soundType]) {
                audioCache[soundType] = new Audio(sounds[soundType]);
            }
            const audio = audioCache[soundType]!;
            audio.volume = volume;
            
            // Allow playing the sound again even if it's already playing
            audio.currentTime = 0;
            audio.play().catch(e => console.error("Error playing sound:", e));
        } catch (e) {
            console.error("Could not play sound", e);
        }
    }, [soundType, volume, state.soundEnabled, state.isAudioUnlocked]);

    return play;
};

export default useSound;
