import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { Send, Trophy, AlertCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  userId: string;
  username: string;
  teamName?: string;
  content: string;
  type: 'chat' | 'system' | 'pick' | 'trade';
  timestamp: Date;
}

interface DraftChatProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  currentUserId?: string;
}

export function DraftChat({ messages, onSendMessage, currentUserId }: DraftChatProps) {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getMessageIcon = (type: Message['type']) => {
    switch (type) {
      case 'pick':
        return <Trophy className="w-4 h-4 text-green-500" />;
      case 'trade':
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
      case 'system':
        return <Clock className="w-4 h-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const renderMessage = (msg: Message) => {
    const isOwnMessage = msg.userId === currentUserId;

    if (msg.type === 'system' || msg.type === 'pick') {
      return (
        <div
          key={msg.id}
          className="flex items-center justify-center py-2 px-4"
        >
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            {getMessageIcon(msg.type)}
            <span>{msg.content}</span>
          </div>
        </div>
      );
    }

    return (
      <div
        key={msg.id}
        className={cn(
          'flex gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800',
          isOwnMessage && 'bg-primary-50 dark:bg-primary-900/20'
        )}
      >
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-bold">
            {msg.username[0].toUpperCase()}
          </div>
        </div>

        {/* Message content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-sm">
              {msg.username}
            </span>
            {msg.teamName && (
              <span className="text-xs text-gray-500">
                ({msg.teamName})
              </span>
            )}
            <span className="text-xs text-gray-400">
              {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
            </span>
          </div>
          <p className="text-sm mt-1 text-gray-700 dark:text-gray-300 break-words">
            {msg.content}
          </p>
        </div>
      </div>
    );
  };

  const quickMessages = [
    "Good pick!",
    "That's a reach...",
    "Steal!",
    "I wanted that player!",
    "Nice value there",
    "Bold strategy",
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map(renderMessage)}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Quick messages */}
      <div className="px-4 py-2 border-t dark:border-gray-700">
        <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
          {quickMessages.map((quickMsg) => (
            <button
              key={quickMsg}
              onClick={() => {
                setMessage(quickMsg);
                inputRef.current?.focus();
              }}
              className="flex-shrink-0 px-3 py-1 text-xs bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {quickMsg}
            </button>
          ))}
        </div>
      </div>

      {/* Input area */}
      <div className="p-4 border-t dark:border-gray-700">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            size="sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}