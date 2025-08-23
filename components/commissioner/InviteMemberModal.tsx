import React from 'react';
import { motion } from 'framer-motion';
import { useAppState } from '../../contexts/AppContext';
import Modal from '../ui/Modal';
import { UserPlusIcon } from '../icons/UserPlusIcon';
import type { League } from '../../types';
import { ClipboardIcon } from '../icons/ClipboardIcon';
import { CheckIcon } from '../icons/CheckIcon';
import useCopyToClipboard from '../../hooks/useCopyToClipboard';

interface InviteMemberModalProps {
    league: League;
    onClose: () => void;
}

const InviteMemberModal: React.FC<InviteMemberModalProps> = ({ league, onClose }) => {
    const { dispatch } = useAppState();
    const [email, setEmail] = React.useState('');
    const [copiedLink, setCopiedLink] = React.useState<string | null>(null);
    const { copy } = useCopyToClipboard();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim().includes('@')) {
            dispatch({ type: 'ADD_NOTIFICATION', payload: { message: "Please enter a valid email.", type: 'SYSTEM' } });
            return;
        }
        dispatch({ type: 'INVITE_MEMBER', payload: { leagueId: league.id, invitation: { email, status: 'PENDING', leagueId: league.id } } });
        setEmail('');
    };

    const handleCopy = (link: string) => {
        copy(link);
        setCopiedLink(link);
        setTimeout(() => setCopiedLink(null), 2000);
    };

    return (
        <Modal onClose={onClose}>
            <motion.div
                className="glass-pane rounded-xl shadow-2xl w-full max-w-lg"
                onClick={e => e.stopPropagation()}
                {...{
                    initial: { opacity: 0, scale: 0.95 },
                    animate: { opacity: 1, scale: 1 },
                }}
            >
                <header className="p-4 border-b border-[var(--panel-border)]">
                    <h2 className="text-xl font-bold font-display flex items-center gap-2"><UserPlusIcon /> Invite Members</h2>
                </header>
                <form onSubmit={handleSubmit} className="p-4">
                    <label htmlFor="invite-email" className="block text-sm font-medium text-gray-400 mb-1">Manager Email</label>
                    <div className="flex gap-2">
                        <input
                            id="invite-email"
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="flex-grow w-full bg-black/20 p-2 rounded-md border border-white/10"
                            placeholder="new.manager@email.com"
                        />
                        <button type="submit" className="px-4 py-2 text-sm font-bold bg-cyan-500 text-black rounded-md">Send Invite</button>
                    </div>
                </form>
                <div className="p-4 border-t border-[var(--panel-border)] max-h-64 overflow-y-auto">
                    <h3 className="font-semibold text-sm mb-2">Pending Invitations</h3>
                    {league.invitations && league.invitations.length > 0 ? (
                        <div className="space-y-2">
                            {league.invitations.map((inv: any) => (
                                <div key={inv.id} className="p-2 bg-black/10 rounded-md flex justify-between items-center">
                                    <span className="text-sm text-gray-300">{inv.email}</span>
                                    <button onClick={() => handleCopy(inv.link)} className="flex items-center gap-1 text-xs text-cyan-300">
                                        {copiedLink === inv.link ? <CheckIcon /> : <ClipboardIcon />}
                                        {copiedLink === inv.link ? 'Copied!' : 'Copy Link'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-gray-500">No pending invites.</p>
                    )}
                </div>
            </motion.div>
        </Modal>
    );
};

export default InviteMemberModal;