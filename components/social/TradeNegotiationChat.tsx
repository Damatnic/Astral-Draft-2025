/**
 * Trade Negotiation Chat Component
 * Real-time chat system for trade discussions
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Widget } from '../ui/Widget';
import { Player, Team, User } from '../../types';
import { 
    MessageCircleIcon, 
    SendIcon, 
    PaperclipIcon, 
    SmileIcon,
    PhoneIcon,
    VideoIcon,
    InfoIcon,
    XIcon,
    CheckIcon,
    ClockIcon,
    AlertCircleIcon,
    ThumbsUpIcon,
    ThumbsDownIcon
} from 'lucide-react';

export interface TradeMessage {
    id: string;
    senderId: string;
    senderName: string;
    senderAvatar?: string;
    content: string;
    timestamp: Date;
    type: 'text' | 'trade_proposal' | 'counter_offer' | 'system' | 'reaction';
    attachments?: TradeAttachment[];
    tradeProposal?: TradeProposal;
    reactions?: MessageReaction[];
    isRead: boolean;
    isEdited?: boolean;
    editedAt?: Date;
}

export interface TradeAttachment {
    id: string;
    type: 'image' | 'player_card' | 'stats_comparison' | 'projection';
    url?: string;
    data?: any;
    metadata?: Record<string, any>;
}

export interface TradeProposal {
    id: string;
    fromTeamId: number;
    toTeamId: number;
    fromPlayers: Player[];
    toPlayers: Player[];
    status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'withdrawn';
    expiresAt: Date;
    fairnessScore?: number;
    notes?: string;
}

export interface MessageReaction {
    id: string;
    emoji: string;
    userId: string;
    userName: string;
    timestamp: Date;
}

export interface TradeChatSession {
    id: string;
    participants: User[];
    teamIds: number[];
    title: string;
    status: 'active' | 'completed' | 'archived';
    createdAt: Date;
    lastActivity: Date;
    messageCount: number;
    unreadCount: number;
    currentProposal?: TradeProposal;
    metadata?: {
        originalTopic?: string;
        relatedPlayers?: Player[];
        priority?: 'low' | 'medium' | 'high';
    };
}

interface TradeNegotiationChatProps {
    session: TradeChatSession;
    messages: TradeMessage[];
    currentUser: User & { teamId?: number };
    onSendMessage: (content: string, type?: string, attachments?: TradeAttachment[]) => void;
    onSendTradeProposal: (proposal: Omit<TradeProposal, 'id' | 'status'>) => void;
    onReactToMessage: (messageId: string, emoji: string) => void;
    onAcceptTrade: (proposalId: string) => void;
    onRejectTrade: (proposalId: string, reason?: string) => void;
    onArchiveChat: () => void;
    isLoading?: boolean;
    className?: string;
}

const TradeNegotiationChat: React.FC<TradeNegotiationChatProps> = ({
    session,
    messages,
    currentUser,
    onSendMessage,
    onSendTradeProposal,
    onReactToMessage,
    onAcceptTrade,
    onRejectTrade,
    onArchiveChat,
    isLoading = false,
    className = ''
}) => {
    const [newMessage, setNewMessage] = React.useState('');
    const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);
    const [showTradeBuilder, setShowTradeBuilder] = React.useState(false);
    const [showAttachments, setShowAttachments] = React.useState(false);
    const [isTyping, setIsTyping] = React.useState(false);
    const messagesEndRef = React.useRef<HTMLDivElement>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Auto-scroll to bottom when new messages arrive
    React.useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input on mount
    React.useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() && !isLoading) {
            onSendMessage(newMessage.trim());
            setNewMessage('');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(e);
        }
    };

    const formatTimestamp = (timestamp: Date) => {
        const now = new Date();
        const diff = now.getTime() - timestamp.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return timestamp.toLocaleDateString();
    };

    const getMessageTypeIcon = (type: string) => {
        switch (type) {
            case 'trade_proposal':
                return <MessageCircleIcon className="w-4 h-4 text-blue-400" />;
            case 'counter_offer':
                return <ClockIcon className="w-4 h-4 text-orange-400" />;
            case 'system':
                return <InfoIcon className="w-4 h-4 text-gray-400" />;
            default:
                return null;
        }
    };

    const getProposalStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'text-yellow-400 bg-yellow-500/20';
            case 'accepted':
                return 'text-green-400 bg-green-500/20';
            case 'rejected':
                return 'text-red-400 bg-red-500/20';
            case 'expired':
                return 'text-gray-400 bg-gray-500/20';
            case 'withdrawn':
                return 'text-orange-400 bg-orange-500/20';
            default:
                return 'text-gray-400 bg-gray-500/20';
        }
    };

    const renderTradeProposal = (proposal: TradeProposal, messageId: string) => (
        <div className="mt-3 p-4 bg-blue-500/10 border border-blue-400/30 rounded-lg">
            <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-blue-400">Trade Proposal</h4>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getProposalStatusColor(proposal?.status)}`}>
                    {proposal.status.toUpperCase()}
                </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div>
                    <h5 className="text-sm font-medium text-[var(--text-secondary)] mb-2">Offering</h5>
                    <div className="space-y-1">
                        {proposal.fromPlayers.map((player: any) => (
                            <div key={player.id} className="text-sm text-[var(--text-primary)]">
                                {player.name} ({player.position})
                            </div>
                        ))}
                    </div>
                </div>
                
                <div>
                    <h5 className="text-sm font-medium text-[var(--text-secondary)] mb-2">Requesting</h5>
                    <div className="space-y-1">
                        {proposal.toPlayers.map((player: any) => (
                            <div key={player.id} className="text-sm text-[var(--text-primary)]">
                                {player.name} ({player.position})
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            {proposal.fairnessScore && (
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-[var(--text-secondary)]">Fairness Score:</span>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                        proposal.fairnessScore >= 80 ? 'text-green-400 bg-green-500/20' :
                        proposal.fairnessScore >= 60 ? 'text-yellow-400 bg-yellow-500/20' :
                        'text-red-400 bg-red-500/20'
                    }`}>
                        {proposal.fairnessScore}/100
                    </div>
                </div>
            )}
            
            {proposal.notes && (
                <div className="text-sm text-[var(--text-secondary)] mb-3">
                    "{proposal.notes}"
                </div>
            )}
            
            {proposal?.status === 'pending' && proposal.toTeamId === currentUser.teamId && (
                <div className="flex gap-2">
                    <button
                        onClick={() => onAcceptTrade(proposal.id)}
                        className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                    >
                        <CheckIcon className="w-4 h-4" />
                        Accept
                    </button>
                    <button
                        onClick={() => onRejectTrade(proposal.id)}
                        className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                    >
                        <XIcon className="w-4 h-4" />
                        Reject
                    </button>
                </div>
            )}
            
            <div className="text-xs text-[var(--text-secondary)] mt-2">
                Expires: {new Date(proposal.expiresAt).toLocaleString()}
            </div>
        </div>
    );

    const renderMessage = (message: TradeMessage, index: number) => {
        const isOwnMessage = message.senderId === currentUser.id;
        const showAvatar = index === 0 || messages[index - 1].senderId !== message.senderId;

        return (
            <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} ${showAvatar ? 'mt-4' : 'mt-1'}`}
            >
                {showAvatar && !isOwnMessage && (
                    <div className="flex-shrink-0">
                        <img
                            src={message.senderAvatar || '/default-avatar.png'}
                            alt={message.senderName}
                            className="w-8 h-8 rounded-full"
                        />
                    </div>
                )}
                
                <div className={`flex-1 max-w-[80%] ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                    {showAvatar && (
                        <div className={`flex items-center gap-2 mb-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                            <span className="text-sm font-medium text-[var(--text-primary)]">
                                {message.senderName}
                            </span>
                            {getMessageTypeIcon(message.type)}
                            <span className="text-xs text-[var(--text-secondary)]">
                                {formatTimestamp(message.timestamp)}
                            </span>
                        </div>
                    )}
                    
                    <div className={`inline-block p-3 rounded-lg ${
                        isOwnMessage 
                            ? 'bg-blue-500 text-white'
                            : message.type === 'system'
                            ? 'bg-gray-500/20 text-[var(--text-secondary)]'
                            : 'bg-[var(--panel-bg)] border border-[var(--panel-border)] text-[var(--text-primary)]'
                    }`}>
                        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                        
                        {message.tradeProposal && renderTradeProposal(message.tradeProposal, message.id)}
                        
                        {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-2 space-y-2">
                                {message.attachments.map((attachment: any) => (
                                    <div key={attachment.id} className="text-xs opacity-75">
                                        📎 {attachment.type}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    {message.reactions && message.reactions.length > 0 && (
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                            {Object.entries(
                                message.reactions.reduce((acc, reaction) => {
                                    acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
                                    return acc;
                                }, {} as Record<string, number>)
                            ).map(([emoji, count]) => (
                                <button
                                    key={emoji}
                                    onClick={() => onReactToMessage(message.id, emoji)}
                                    className="flex items-center gap-1 px-2 py-1 bg-white/10 rounded-full text-xs hover:bg-white/20 transition-colors"
                                >
                                    <span>{emoji}</span>
                                    <span>{count}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                
                {showAvatar && isOwnMessage && (
                    <div className="flex-shrink-0">
                        <img
                            src={currentUser.avatar || '/default-avatar.png'}
                            alt={currentUser.name}
                            className="w-8 h-8 rounded-full"
                        />
                    </div>
                )}
            </motion.div>
        );
    };

    return (
        <div className={`h-full flex flex-col bg-[var(--panel-bg)] ${className}`}>
            {/* Chat Header */}
            <div className="flex-shrink-0 p-4 border-b border-[var(--panel-border)]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <MessageCircleIcon className="w-6 h-6 text-blue-400" />
                        <div>
                            <h3 className="font-bold text-lg text-[var(--text-primary)]">
                                {session.title}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                                <span>{session.participants.length} participants</span>
                                {session.currentProposal && (
                                    <>
                                        <span>•</span>
                                        <span className="text-blue-400">Active proposal</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowTradeBuilder(true)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            title="Create trade proposal"
                        >
                            <MessageCircleIcon className="w-5 h-5 text-[var(--text-secondary)]" />
                        </button>
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                            <PhoneIcon className="w-5 h-5 text-[var(--text-secondary)]" />
                        </button>
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                            <VideoIcon className="w-5 h-5 text-[var(--text-secondary)]" />
                        </button>
                        <button
                            onClick={onArchiveChat}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <XIcon className="w-5 h-5 text-[var(--text-secondary)]" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
                <AnimatePresence>
                    {messages.map((message, index) => renderMessage(message, index))}
                </AnimatePresence>
                
                {isTyping && (
                    <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm">
                        <div className="flex gap-1">
                            <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span>Someone is typing...</span>
                    </div>
                )}
                
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="flex-shrink-0 p-4 border-t border-[var(--panel-border)]">
                <form onSubmit={handleSendMessage} className="flex items-end gap-3">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <button
                                type="button"
                                onClick={() => setShowAttachments(!showAttachments)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <PaperclipIcon className="w-4 h-4 text-[var(--text-secondary)]" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <SmileIcon className="w-4 h-4 text-[var(--text-secondary)]" />
                            </button>
                        </div>
                        
                        <div className="relative">
                            <input
                                ref={inputRef}
                                type="text"
                                value={newMessage}
                                onChange={(e: any) => setNewMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Type a message..."
                                className="w-full px-4 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                    
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || isLoading}
                        className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <SendIcon className="w-5 h-5" />
                    </button>
                </form>
            </div>

            {/* Quick Reactions */}
            {showEmojiPicker && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-20 left-4 right-4 bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-lg p-3 shadow-lg"
                >
                    <div className="grid grid-cols-8 gap-2">
                        {['👍', '👎', '😄', '😮', '😢', '😡', '❤️', '🔥'].map((emoji: any) => (
                            <button
                                key={emoji}
                                onClick={() => {
                                    // Would add reaction to last message or selected message
                                    setShowEmojiPicker(false);
                                }}
                                className="p-2 hover:bg-white/10 rounded text-xl"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default TradeNegotiationChat;
