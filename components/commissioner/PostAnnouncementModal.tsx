

import React from 'react';
import { motion } from 'framer-motion';
import { useAppState } from '../../contexts/AppContext';
import Modal from '../ui/Modal';
import { MegaphoneIcon } from '../icons/MegaphoneIcon';

interface PostAnnouncementModalProps {
    leagueId: string;
    onClose: () => void;
}

const PostAnnouncementModal: React.FC<PostAnnouncementModalProps> = ({ leagueId, onClose }) => {
    const { dispatch } = useAppState();
    const [title, setTitle] = React.useState('');
    const [content, setContent] = React.useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) {
            dispatch({ type: 'ADD_NOTIFICATION', payload: { message: "Title and content must be filled out.", type: 'SYSTEM' } });
            return;
        }

        dispatch({
            type: 'POST_ANNOUNCEMENT',
            payload: { leagueId, announcement: { title, content } },
        });
        dispatch({ type: 'ADD_NOTIFICATION', payload: { message: "Announcement posted!", type: 'SYSTEM' } });
        onClose();
    };
    
    return (
        <Modal onClose={onClose}>
            <motion.form
                onSubmit={handleSubmit}
                className="glass-pane rounded-xl shadow-2xl w-full max-w-lg"
                onClick={e => e.stopPropagation()}
                {...{
                    initial: { opacity: 0, scale: 0.95 },
                    animate: { opacity: 1, scale: 1 },
                }}
            >
                <header className="p-4 border-b border-[var(--panel-border)]">
                    <h2 className="text-xl font-bold font-display flex items-center gap-2">
                        <MegaphoneIcon /> Post New Announcement
                    </h2>
                </header>
                <main className="p-4 space-y-4">
                    <div>
                        <label htmlFor="announcement-title" className="block text-sm font-medium text-gray-400 mb-1">Title</label>
                        <input
                            id="announcement-title"
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full bg-black/20 p-2 rounded-md border border-white/10"
                            placeholder="e.g., Trade Deadline Approaching"
                        />
                    </div>
                    <div>
                        <label htmlFor="announcement-content" className="block text-sm font-medium text-gray-400 mb-1">Content</label>
                        <textarea
                            id="announcement-content"
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            className="w-full h-32 bg-black/20 p-2 rounded-md border border-white/10 resize-none"
                            placeholder="Write your announcement here..."
                        />
                    </div>
                </main>
                 <footer className="p-4 flex justify-end gap-2 border-t border-[var(--panel-border)]">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold bg-transparent border border-transparent hover:border-[var(--panel-border)] rounded-md">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-sm font-bold bg-cyan-500 text-black rounded-md">Post Announcement</button>
                </footer>
            </motion.form>
        </Modal>
    );
};

export default PostAnnouncementModal;
