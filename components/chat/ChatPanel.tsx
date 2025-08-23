
import React from 'react';
import { useAppState } from '../../contexts/AppContext';
import { formatRelativeTime } from '../../utils/time';
import { generateTrashTalk } from '../../services/geminiService';
import { SwordIcon } from '../icons/SwordIcon';
import Tooltip from '../ui/Tooltip';
import ReactionPicker from './ReactionPicker';
import TradeEventMessage from './TradeEventMessage';

const ChatPanel: React.FC = () => {
    const { state, dispatch } = useAppState();
    const [newMessage, setNewMessage] = React.useState('');
    const [isGenerating, setIsGenerating] = React.useState(false);
    const messagesEndRef = React.useRef<HTMLDivElement>(null);
    const [showMentions, setShowMentions] = React.useState(false);
    
    const activeLeague = state.leagues.find((l: any) => l.id === state.activeLeagueId);
    const messages = activeLeague?.chatMessages || [];
    const myTeam = activeLeague?.teams.find((t: any) => t.owner.id === state.user.id);
    
    React.useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        if (newMessage.trim() === '' || !activeLeague) return;
        dispatch({
            type: 'ADD_CHAT_MESSAGE',
            payload: {
                leagueId: activeLeague.id,
                message: {
                    user: state.user,
                    text: newMessage,
                }
            },
        });
        setNewMessage('');
    };
    
    const handleGenerateTrashTalk = async () => {
        if (!myTeam || !activeLeague) return;
        const matchup = activeLeague.schedule.find((m: any) => m.week === activeLeague.currentWeek && (m.teamA.teamId === myTeam.id || m.teamB.teamId === myTeam.id));
        if (!matchup) return;
        
        const opponentId = matchup.teamA.teamId === myTeam.id ? matchup.teamB.teamId : matchup.teamA.teamId;
        const opponentTeam = activeLeague.teams.find((t: any) => t.id === opponentId);
        if (!opponentTeam) return;

        setIsGenerating(true);
        const trashTalk = await generateTrashTalk(myTeam, opponentTeam);
        if(trashTalk) {
            setNewMessage(trashTalk);
        }
        setIsGenerating(false);
    };

    const handleReaction = (messageId: string, emoji: string) => {
        if (!activeLeague) return;
        dispatch({
            type: 'ADD_CHAT_REACTION',
            payload: {
                leagueId: activeLeague.id,
                messageId,
                emoji,
                userId: state.user.id,
            }
        });
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const text = e.target.value;
        setNewMessage(text);
        if (text.endsWith('@')) {
            setShowMentions(true);
        } else {
            setShowMentions(false);
        }
    };

    const handleMentionSelect = (name: string) => {
        setNewMessage(prev => prev.slice(0, -1) + `@${name} `);
        setShowMentions(false);
    };

    const canGenerateTrashTalk = myTeam && activeLeague && activeLeague.schedule.some((m: any) => m.week === activeLeague.currentWeek && (m.teamA.teamId === myTeam.id || m.teamB.teamId === myTeam.id));

    return (
        <div className="glass-pane h-full flex flex-col bg-[var(--panel-bg)] border-[var(--panel-border)] rounded-2xl shadow-lg">
            <div className="flex-shrink-0 p-3 text-center border-b border-[var(--panel-border)]">
                <h3 className="font-display text-lg font-bold text-[var(--text-primary)]">LEAGUE CHAT</h3>
            </div>
            <div className="flex-grow p-2 space-y-3 overflow-y-auto">
                {messages.map((msg: any) => {
                    const isMyMention = msg.mentions?.includes(state.user.id);
                    if (msg.isSystemMessage && msg.tradeEvent && activeLeague) {
                        return <TradeEventMessage key={msg.id} message={msg} league={activeLeague} onReact={handleReaction} />;
                    }
                    return msg.isSystemMessage ? (
                         <div key={msg.id} className="text-center text-xs text-cyan-300/80 italic p-2">
                            <span>{msg.text}</span>
                        </div>
                    ) : (
                        <div key={msg.id} className={`flex items-start gap-2.5 text-sm group relative ${msg.user.id === state.user.id ? 'justify-end' : ''}`}>
                            {msg.user.id !== state.user.id && <span className="text-xl mt-1">{msg.user.avatar}</span>}
                            <div className="flex flex-col gap-1 w-full max-w-[85%]">
                                 <ReactionPicker onSelect={(emoji) => handleReaction(msg.id, emoji)} />
                                <div className={`p-2 rounded-lg ${msg.user.id === state.user.id ? 'bg-cyan-600 self-end' : 'bg-black/20 self-start'} ${isMyMention ? 'ring-2 ring-yellow-400' : ''}`}>
                                    <p>{msg.text}</p>
                                </div>
                                {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                    <div className={`flex gap-1 ${msg.user.id === state.user.id ? 'self-end' : 'self-start'}`}>
                                        {Object.entries(msg.reactions).map(([emoji, userIds]) => (
                                            <div key={emoji} className="px-1.5 py-0.5 bg-black/30 rounded-full text-xs flex items-center gap-1">
                                                <span>{emoji}</span>
                                                <span className="text-gray-300">{(userIds as string[]).length}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className={`text-xs text-gray-500 ${msg.user.id === state.user.id ? 'self-end' : 'self-start'}`}>
                                    {msg.user.name} • {formatRelativeTime(msg.timestamp)}
                                </div>
                            </div>
                        </div>
                    )
                })}
                <div ref={messagesEndRef} />
            </div>
             <div className="flex-shrink-0 p-2 border-t border-[var(--panel-border)] relative">
                {showMentions && activeLeague && (
                    <div className="absolute bottom-full left-2 w-1/2 bg-gray-900 border border-white/10 rounded-lg shadow-lg p-1">
                        {activeLeague.members.filter((m: any) => m.id !== state.user.id).map((member: any) => (
                            <button key={member.id} onClick={() => handleMentionSelect(member.name)} className="w-full text-left p-1.5 text-sm rounded hover:bg-white/10">
                                {member.name}
                            </button>
                        ))}
                    </div>
                )}
                <div className="flex gap-2">
                    {canGenerateTrashTalk && (
                        <Tooltip text="Generate AI Trash Talk">
                            <button onClick={handleGenerateTrashTalk} disabled={isGenerating} className="p-2 bg-black/10 dark:bg-gray-900/50 border border-[var(--panel-border)] rounded-md text-purple-400 hover:bg-black/20 disabled:opacity-50">
                                {isGenerating ? <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div> : <SwordIcon />}
                            </button>
                        </Tooltip>
                    )}
                    <input
                        type="text"
                        placeholder={isGenerating ? "Cooking up some spice..." : "Send a message..."}
                        value={newMessage}
                        onChange={handleInputChange}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                        className="flex-grow bg-black/10 dark:bg-gray-900/50 border border-[var(--panel-border)] rounded-md px-3 py-1.5 text-sm placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-cyan-400"
                    />
                    <button onClick={handleSend} disabled={!newMessage} className="px-4 py-1.5 bg-cyan-500 text-black font-bold text-sm rounded-md hover:bg-cyan-400 disabled:opacity-50">Send</button>
                </div>
            </div>
        </div>
    );
};

export default ChatPanel;
