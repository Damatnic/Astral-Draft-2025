


import React from 'react';
import type { Player, Team, GroundingChunk } from '../../types';
import { streamOracleResponse } from '../../services/geminiService';
import ReactMarkdown from 'react-markdown';
import GroundingCitations from '../ui/GroundingCitations';

interface Message {
    id: number;
    sender: 'user' | 'ai';
    text: string;
    isLoading?: boolean;
    groundingChunks?: GroundingChunk[];
}

interface ConversationalOracleProps {
    myTeam: Team | undefined;
    availablePlayers: Player[];
}

const ConversationalOracle: React.FC<ConversationalOracleProps> = ({ myTeam, availablePlayers }) => {
    const [messages, setMessages] = React.useState<Message[]>([
        { id: 1, sender: 'ai', text: "Welcome to the Oracle. Ask me anything about your draft strategy." }
    ]);
    const [input, setInput] = React.useState('');
    const [isSending, setIsSending] = React.useState(false);
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    React.useEffect(() => {
        // A slight delay to allow the new message to render before scrolling
        setTimeout(scrollToBottom, 100);
    }, [messages]);

    const handleSend = async () => {
        if (input.trim() === '' || isSending) return;
        
        const userMessage: Message = { id: Date.now(), sender: 'user', text: input };
        const aiMessagePlaceholder: Message = { id: Date.now() + 1, sender: 'ai', text: '', isLoading: true, groundingChunks: [] };

        const currentMessages = [...messages, userMessage];
        setMessages([...currentMessages, aiMessagePlaceholder]);
        setInput('');
        setIsSending(true);

        try {
            // Prepare history for the API call, excluding the initial welcome message
            const historyForApi = currentMessages.slice(1).map((m: any) => ({ sender: m.sender, text: m.text }));

            const stream = await streamOracleResponse(historyForApi, input, myTeam, availablePlayers);
            let fullText = "";
            let collectedChunks: GroundingChunk[] = [];
            for await (const chunk of stream) {
                fullText += chunk.text;
                const newChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
                if (newChunks) {
                    collectedChunks.push(...newChunks);
                }
                setMessages(prev => prev.map((msg: any) => 
                    msg.id === aiMessagePlaceholder.id ? { ...msg, text: fullText } : msg
                ));
            }

            const uniqueChunks = Array.from(new Map(collectedChunks.filter((c: any) => c.web && c.web.uri).map((item: any) => [item.web!.uri!, item])).values());

            setMessages(prev => prev.map((msg: any) => 
                msg.id === aiMessagePlaceholder.id ? { ...msg, isLoading: false, groundingChunks: uniqueChunks } : msg
            ));

        } catch (error) {
            console.error("Error calling Gemini API:", error);
            setMessages(prev => prev.map((msg: any) => 
                msg.id === aiMessagePlaceholder.id 
                ? { ...msg, text: "My apologies, I'm having trouble connecting to the cosmos. Please try again shortly.", isLoading: false }
                : msg
            ));
        } finally {
            setIsSending(false);
        }
    };
    
    return (
        <div className="h-full flex flex-col text-[var(--text-primary)]">
            <div className="flex-shrink-0 p-3 text-center border-b border-[var(--panel-border)]">
                <h3 className="font-display text-lg font-bold">THE ORACLE</h3>
            </div>
            <div className="flex-grow p-2 space-y-4 overflow-y-auto">
                 {messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.sender === 'ai' && <span className="text-lg mt-1 self-start flex-shrink-0">🔮</span>}
                        <div className={`max-w-[85%] p-2.5 rounded-lg text-sm leading-relaxed ${msg.sender === 'user' ? 'bg-cyan-600' : 'bg-black/20'}`}>
                            {msg.isLoading ? (
                                <div className="flex items-center gap-1.5 p-1">
                                    <span style={{ animationDelay: '0ms' }} className="animate-pulse bg-white/50 rounded-full h-1.5 w-1.5"></span>
                                    <span style={{ animationDelay: '150ms' }} className="animate-pulse bg-white/50 rounded-full h-1.5 w-1.5"></span>
                                    <span style={{ animationDelay: '300ms' }} className="animate-pulse bg-white/50 rounded-full h-1.5 w-1.5"></span>
                                </div>
                            ) : (
                                <>
                                    <div className="prose prose-sm prose-invert prose-p:my-0">
                                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                                    </div>
                                    {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                                        <GroundingCitations chunks={msg.groundingChunks} />
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
             <div className="flex-shrink-0 p-2 border-t border-[var(--panel-border)]">
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder={isSending ? "The Oracle is thinking..." : "Ask the Oracle..."}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                        disabled={isSending}
                        className="flex-grow bg-black/10 dark:bg-gray-900/50 border border-[var(--panel-border)] rounded-md px-3 py-1.5 text-sm placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-cyan-400 disabled:opacity-50"
                    />
                    <button onClick={handleSend} disabled={isSending || !input} className="px-4 py-1.5 bg-cyan-500 text-black font-bold text-sm rounded-md hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed">Ask</button>
                </div>
            </div>
        </div>
    );
};

export default ConversationalOracle;
