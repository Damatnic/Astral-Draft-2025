import React from 'react';
import { useAppState } from '../contexts/AppContext';
import { MailIcon } from '../components/icons/MailIcon';
import ConversationList from '../components/messages/ConversationList';
import MessageThread from '../components/messages/MessageThread';
import EmptyState from '../components/ui/EmptyState';
import { InboxIcon } from '../components/icons/InboxIcon';

const MessagesView: React.FC = () => {
    const { state, dispatch } = useAppState();
    const [selectedUserId, setSelectedUserId] = React.useState<string | null>(null);
    const [showNewMessage, setShowNewMessage] = React.useState(false);

    const handleSelectUser = (userId: string) => {
        setSelectedUserId(userId);
        setShowNewMessage(false);
    }
    
    const handleStartNewMessage = () => {
        setSelectedUserId(null);
        setShowNewMessage(true);
    };
    
    // Auto-select first user with unread messages
    React.useEffect(() => {
        const firstUnread = state.directMessages.find(dm => dm.toUserId === state.user.id && !dm.isRead);
        if (firstUnread) {
            setSelectedUserId(firstUnread.fromUserId);
        }
    }, []);

    return (
        <div className="w-full h-full flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <header className="flex-shrink-0 flex justify-between items-center mb-6">
                <div>
                    <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-wider uppercase flex items-center gap-3">
                        <MailIcon />
                        MESSAGES
                    </h1>
                </div>
                <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'DASHBOARD' })} className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20">
                    Back to Dashboard
                </button>
            </header>
            <main className="flex-grow glass-pane rounded-2xl overflow-hidden flex">
                <div className="w-1/3 border-r border-[var(--panel-border)] flex flex-col">
                    <ConversationList 
                        selectedUserId={selectedUserId} 
                        onSelectUser={handleSelectUser}
                        onStartNewMessage={handleStartNewMessage}
                        isNewMessageActive={showNewMessage}
                    />
                </div>
                <div className="w-2/3">
                    {selectedUserId ? (
                        <MessageThread userId={selectedUserId} />
                    ) : showNewMessage ? (
                         <MessageThread userId={null} onUserSelected={handleSelectUser}/>
                    ) : (
                        <div className="h-full flex items-center justify-center">
                            <EmptyState 
                                illustration={<InboxIcon />}
                                message="Select a conversation or start a new one."
                            />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default MessagesView;