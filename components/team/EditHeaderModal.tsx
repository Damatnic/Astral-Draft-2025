

import React from 'react';
import { motion } from 'framer-motion';
import Modal from '../ui/Modal';
import { ImageIcon } from '../icons/ImageIcon';

interface EditHeaderModalProps {
    leagueId: string;
    teamId: number;
    currentHeader?: string;
    dispatch: React.Dispatch<any>;
    onClose: () => void;
}

const EditHeaderModal: React.FC<EditHeaderModalProps> = ({ leagueId, teamId, currentHeader, dispatch, onClose }) => {
    const [imageUrl, setImageUrl] = React.useState(currentHeader || '');

    const handleSave = () => {
        dispatch({ type: 'UPDATE_TEAM_HEADER', payload: { leagueId, teamId, imageUrl } });
        dispatch({ type: 'ADD_NOTIFICATION', payload: 'Team header updated!' });
        onClose();
    };

    return (
        <Modal onClose={onClose}>
            <motion.div
                className="glass-pane rounded-xl shadow-2xl w-full max-w-md"
                {...{
                    initial: { opacity: 0, scale: 0.95 },
                    animate: { opacity: 1, scale: 1 },
                }}
            >
                <header className="p-4 border-b border-[var(--panel-border)]">
                    <h2 className="text-xl font-bold font-display flex items-center gap-2">
                        <ImageIcon />
                        Edit Team Header
                    </h2>
                </header>
                <main className="p-4 space-y-2">
                    <label htmlFor="header-url" className="text-sm font-semibold text-gray-300">Image URL</label>
                    <input
                        id="header-url"
                        type="text"
                        value={imageUrl}
                        onChange={(e: any) => setImageUrl(e.target.value)}
                        placeholder="https://example.com/my-banner.png"
                        className="w-full bg-black/20 p-2 rounded-md border border-white/10 focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                    />
                     <p className="text-xs text-gray-400">
                        Paste a direct link to an image. For best results, use a wide, banner-style image.
                    </p>
                </main>
                <footer className="p-4 flex justify-end gap-2 border-t border-[var(--panel-border)]">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-bold bg-transparent border border-transparent hover:border-[var(--panel-border)] rounded-md">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 text-sm font-bold bg-cyan-500 text-black rounded-md">Save Header</button>
                </footer>
            </motion.div>
        </Modal>
    );
};

export default EditHeaderModal;