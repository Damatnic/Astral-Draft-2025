import { useState, useEffect, useRef } from 'react';
import { 
  Send, Paperclip, Smile, MoreVertical, 
  Reply, Heart, ThumbsUp, Flame as Fire,
  Image as ImageIcon, Link, Hash
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  content: string;
  timestamp: Date;
  user: {
    id: string;
    username: string;
    avatar?: string;
    teamName?: string;
  };
  replyTo?: {
    id: string;
    content: string;
    username: string;
  };
  reactions?: {
    emoji: string;
    users: string[];
  }[];
  attachments?: {
    type: 'IMAGE' | 'LINK';
    url: string;
    title?: string;
  }[];
  edited?: boolean;
  isSystem?: boolean;
}

interface LeagueChatProps {
  leagueId: string;
  userId?: string;
}

const QUICK_REACTIONS = ['👍', '😂', '🔥', '💯', '🤔', '😮'];

export function LeagueChat({ leagueId, userId }: LeagueChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // TODO: Uncomment when league.sendMessage mutation is implemented
  // const sendMessageMutation = api.league.sendMessage.useMutation({
  //   onSuccess: () => {
  //     setNewMessage('');
  //     setReplyingTo(null);
  //     // Optionally refetch messages
  //   },
  //   onError: (error: any) => {
  //     console.error('Failed to send message:', error);
  //   },
  //   onSettled: () => {
  //     setSending(false);
  //   }
  // });

  useEffect(() => {
    fetchMessages();
    // Set up WebSocket connection for real-time messages
    connectToChat();
  }, [leagueId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = () => {
    // For now, use mock messages since API endpoint may not exist
    // In production, would use: api.league.getMessages.useQuery({ leagueId })
    setMessages(mockMessages);
    setLoading(false);
  };

  const connectToChat = () => {
    // WebSocket connection would be established here
    // For demo, using mock data
    setTimeout(() => {
      setMessages(mockMessages);
    }, 500);
    return null;
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    setSending(true);
    
    // Optimistically add message to UI
    const message = {
      id: Date.now().toString(),
      content: newMessage,
      timestamp: new Date(),
      user: {
        id: userId || '1',
        username: 'current_user',
        teamName: 'My Team'
      },
      replyTo: replyingTo ? {
        id: replyingTo.id,
        content: replyingTo.content,
        username: replyingTo.user.username
      } : undefined
    };
    
    setMessages(prev => [...prev, message]);
    
    // Send message via tRPC mutation (placeholder until API is ready)
    // await sendMessageMutation.mutateAsync({ 
    //   leagueId, 
    //   content: newMessage,
    //   replyToId: replyingTo?.id 
    // });
    
    // Reset state after sending
    setNewMessage('');
    setReplyingTo(null);
    setSending(false);
  };

  const addReaction = async (messageId: string, emoji: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id !== messageId) return msg;
      
      const existingReaction = msg.reactions?.find(r => r.emoji === emoji);
      if (existingReaction) {
        // Toggle user's reaction
        const hasReacted = existingReaction.users.includes(userId || '');
        if (hasReacted) {
          existingReaction.users = existingReaction.users.filter(u => u !== userId);
          if (existingReaction.users.length === 0) {
            msg.reactions = msg.reactions?.filter(r => r.emoji !== emoji);
          }
        } else {
          existingReaction.users.push(userId || '');
        }
      } else {
        // Add new reaction
        if (!msg.reactions) msg.reactions = [];
        msg.reactions.push({ emoji, users: [userId || ''] });
      }
      
      return { ...msg };
    }));
  };

  // Mock messages for demonstration
  const mockMessages: Message[] = [
    {
      id: '1',
      content: 'Welcome to the league chat! 🏈',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
      user: {
        id: 'system',
        username: 'League Bot',
      },
      isSystem: true
    },
    {
      id: '2',
      content: 'Anyone interested in trading for a RB1? Looking for WR depth',
      timestamp: new Date(Date.now() - 1000 * 60 * 45),
      user: {
        id: '2',
        username: 'john_doe',
        teamName: 'Team Alpha'
      },
      reactions: [
        { emoji: '👍', users: ['3', '4'] },
        { emoji: '🤔', users: ['5'] }
      ]
    },
    {
      id: '3',
      content: 'I might be interested. Who do you have?',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      user: {
        id: '3',
        username: 'jane_smith',
        teamName: 'Team Beta'
      },
      replyTo: {
        id: '2',
        content: 'Anyone interested in trading for a RB1?',
        username: 'john_doe'
      }
    },
    {
      id: '4',
      content: 'Great game last week! That last-minute TD saved me 🔥',
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      user: {
        id: '4',
        username: 'mike_jones',
        teamName: 'Team Gamma'
      },
      reactions: [
        { emoji: '😂', users: ['2'] },
        { emoji: '🔥', users: ['3', '5', '6'] }
      ]
    },
    {
      id: '5',
      content: 'Check out this article about playoff strategies',
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      user: {
        id: '5',
        username: 'sarah_wilson',
        teamName: 'Team Delta'
      },
      attachments: [
        {
          type: 'LINK',
          url: 'https://example.com/article',
          title: 'Top 10 Playoff Strategies for Fantasy Football'
        }
      ]
    }
  ];

  const MessageBubble = ({ message }: { message: Message }) => {
    const isCurrentUser = message.user.id === userId;
    const [showActions, setShowActions] = useState(false);
    
    return (
      <div 
        className={cn(
          "group flex gap-3 mb-4",
          isCurrentUser && "flex-row-reverse",
          message.isSystem && "justify-center"
        )}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {!message.isSystem && (
          <>
            {message.user.avatar ? (
              <img 
                src={message.user.avatar}
                alt={message.user.username}
                className="h-8 w-8 rounded-full flex-shrink-0"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                {message.user.username[0].toUpperCase()}
              </div>
            )}
          </>
        )}
        
        <div className={cn(
          "flex-1 max-w-md",
          isCurrentUser && "items-end"
        )}>
          {!message.isSystem && (
            <div className={cn(
              "flex items-baseline gap-2 mb-1",
              isCurrentUser && "justify-end"
            )}>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {message.user.username}
              </span>
              {message.user.teamName && (
                <span className="text-xs text-gray-500">
                  {message.user.teamName}
                </span>
              )}
              <span className="text-xs text-gray-400">
                {formatDistanceToNow(message.timestamp, { addSuffix: true })}
              </span>
            </div>
          )}
          
          {message.replyTo && (
            <div className="mb-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg border-l-2 border-blue-500">
              <p className="text-xs text-gray-500 mb-1">
                Replying to @{message.replyTo.username}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-1">
                {message.replyTo.content}
              </p>
            </div>
          )}
          
          <div className={cn(
            "relative",
            message.isSystem && "text-center"
          )}>
            <div className={cn(
              "inline-block px-4 py-2 rounded-2xl",
              message.isSystem 
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                : isCurrentUser
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
            )}>
              <p className="text-sm whitespace-pre-wrap break-words">
                {message.content}
              </p>
              {message.edited && (
                <span className="text-xs opacity-70 ml-2">(edited)</span>
              )}
            </div>
            
            {message.attachments?.map((attachment, index) => (
              <div key={index} className="mt-2">
                {attachment.type === 'LINK' && (
                  <a 
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Link className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-blue-600 hover:underline">
                        {attachment.title || attachment.url}
                      </span>
                    </div>
                  </a>
                )}
              </div>
            ))}
            
            {/* Quick Actions */}
            {showActions && !message.isSystem && (
              <div className={cn(
                "absolute top-0 flex items-center gap-1",
                isCurrentUser ? "right-full mr-2" : "left-full ml-2"
              )}>
                <button
                  onClick={() => setReplyingTo(message)}
                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <Reply className="h-3 w-3" />
                </button>
                <button className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
                  <MoreVertical className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
          
          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {message.reactions.map((reaction, index) => (
                <button
                  key={index}
                  onClick={() => addReaction(message.id, reaction.emoji)}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors",
                    reaction.users.includes(userId || '')
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                      : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                  )}
                >
                  <span>{reaction.emoji}</span>
                  <span>{reaction.users.length}</span>
                </button>
              ))}
            </div>
          )}
          
          {/* Quick Reactions */}
          {showActions && !message.isSystem && (
            <div className="flex gap-1 mt-1">
              {QUICK_REACTIONS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => addReaction(message.id, emoji)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[600px]">
      {/* Chat Header */}
      <div className="p-4 border-b dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">League Chat</h3>
            <p className="text-sm text-gray-500">
              {messages.length} messages
            </p>
          </div>
          <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <Hash className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : messages.length > 0 ? (
          <>
            {messages.map(message => (
              <MessageBubble key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No messages yet. Start the conversation!</p>
          </div>
        )}
      </div>

      {/* Reply Preview */}
      {replyingTo && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs text-gray-500">
                Replying to @{replyingTo.user.username}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-1">
                {replyingTo.content}
              </p>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="p-4 border-t dark:border-gray-700">
        <div className="flex items-end gap-2">
          <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <Paperclip className="h-5 w-5" />
          </button>
          
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Type a message..."
              className="w-full px-3 py-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 resize-none"
              rows={1}
            />
          </div>
          
          <button 
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <Smile className="h-5 w-5" />
          </button>
          
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            variant="default"
            className="px-4"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}