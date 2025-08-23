




import React from 'react';
import Modal from '../ui/Modal';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useAppState } from '../../contexts/AppContext';
import ToggleSwitch from '../ui/ToggleSwitch';
import { requestNotificationPermission } from '../../utils/notifications';

interface PreferencesModalProps {
    onClose: () => void;
}

export const PreferencesModal: React.FC<PreferencesModalProps> = ({ onClose }) => {
    const { state, dispatch } = useAppState();

    const handleRequestPermission = () => {
        if (state.notificationPermission === 'default') {
            requestNotificationPermission(dispatch);
        }
    };

    const getNotificationButton = () => {
        switch(state.notificationPermission) {
            case 'granted':
                return <span className="text-sm font-semibold text-green-400">Enabled</span>;
            case 'denied':
                return <span className="text-sm font-semibold text-red-400">Blocked</span>;
            case 'default':
            default:
                return (
                    <button onClick={handleRequestPermission} className="px-3 py-1 text-sm font-bold bg-cyan-500/20 text-cyan-300 rounded-md hover:bg-cyan-500/30">
                        Enable
                    </button>
                );
        }
    }


    return (
        <Modal onClose={onClose}>
            <div className="glass-pane p-6 rounded-2xl w-full max-w-md">
                <h2 className="font-display text-2xl font-bold mb-4">Preferences</h2>
                
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="font-semibold">Theme</label>
                        <ThemeToggle theme={state.theme} dispatch={dispatch} />
                    </div>
                    <div className="flex justify-between items-center">
                        <label htmlFor="sound-toggle" className="font-semibold">Sound Effects</label>
                        <ToggleSwitch
                            id="sound-toggle"
                            checked={state.soundEnabled}
                            onChange={() => dispatch({ type: 'TOGGLE_SOUND' })}
                        />
                    </div>
                    <div className="flex justify-between items-center">
                        <label className="font-semibold">Browser Notifications</label>
                        {getNotificationButton()}
                    </div>
                </div>

                <div className="mt-6 text-right">
                    <button onClick={onClose} className="px-4 py-2 bg-cyan-500 text-black font-bold text-sm rounded-md" aria-label="Close preferences modal">
                        Done
                    </button>
                </div>
            </div>
        </Modal>
    );
};