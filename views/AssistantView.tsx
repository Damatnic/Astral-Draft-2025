


import React from 'react';
import { useAppState } from '../contexts/AppContext';
import { streamAssistantResponse } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import type { GroundingChunk } from '../types';
import GroundingCitations from '../components/ui/GroundingCitations';

interface Message {
    id: number;
    sender: 'user' | 'ai';
    text: string;
    isLoading?: boolean;
    groundingChunks?: GroundingChunk[];
}

const AssistantView: React.FC = () => {
    const { state, dispatch } = useAppState();
    const [messages, setMessages] = React.useState<Message[]>([
        { id: 1, sender: 'ai', text: "Hello! I'm Astral, your personal fantasy football assistant. How can I help you win today?" }
    ]);
    const [input, setInput] = React.useState('');
    const [isSending, setIsSending] = React.useState(false);
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    React.useEffect(() => {
        setTimeout(scrollToBottom, 100);
    }, [messages]);

    const handleSend = async (prompt?: string) => {
        const currentInput = prompt || input;
        if (currentInput.trim() === '' || isSending) return;
        
        const userMessage: Message = { id: Date.now(), sender: 'user', text: currentInput };
        const aiMessagePlaceholder: Message = { id: Date.now() + 1, sender: 'ai', text: '', isLoading: true, groundingChunks: [] };

        setMessages(prev => [...prev, userMessage, aiMessagePlaceholder]);
        setInput('');
        setIsSending(true);

        try {
            const stream = await streamAssistantResponse(currentInput, state.leagues.filter(l => !l.isMock), state.user);
            let fullText = "";
            let collectedChunks: GroundingChunk[] = [];
            for await (const chunk of stream) {
                fullText += chunk.text;
                const newChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
                if (newChunks) {
                    collectedChunks.push(...newChunks);
                }
                setMessages(prev => prev.map(msg => 
                    msg.id === aiMessagePlaceholder.id ? { ...msg, text: fullText } : msg
                ));
            }

            const uniqueChunks = Array.from(new Map(collectedChunks.filter(c => c.web && c.web.uri).map(item => [item.web!.uri!, item])).values());

            setMessages(prev => prev.map(msg => 
                msg.id === aiMessagePlaceholder.id ? { ...msg, isLoading: false, groundingChunks: uniqueChunks } : msg
            ));

        } catch (error) {
            console.error("Error calling Gemini API:", error);
            setMessages(prev => prev.map(msg => 
                msg.id === aiMessagePlaceholder.id 
                ? { ...msg, text: "My apologies, I'm having trouble connecting to the cosmos. Please try again shortly.", isLoading: false }
                : msg
            ));
        } finally {
            setIsSending(false);
        }
    };
    
    const promptSuggestions = [
        "Analyze my team in 'My Awesome League'.",
        "Who are some good waiver wire targets this week?",
        "Help me with a trade idea.",
        "What's the latest news on Christian McCaffrey?",
    ];

    return (
        <div className="w-full h-full flex flex-col p-4 sm:p-6 lg:p-8 overflow-hidden">
            <header className="flex-shrink-0 flex justify-between items-center mb-6">
                <div>
                    <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-wider uppercase flex items-center gap-3">
                        <SparklesIcon />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-500">
                           ASTRAL ASSISTANT
                        </span>
                    </h1>
                </div>
                <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'DASHBOARD' })} className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20">
                    Back to Dashboard
                </button>
            </header>
            <main className="flex-grow flex flex-col items-center glass-pane rounded-2xl overflow-hidden">
                <div className="flex-grow w-full max-w-4xl p-4 space-y-4 overflow-y-auto">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex gap-3 sm:gap-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.sender === 'ai' && <span className="text-xl sm:text-2xl mt-1 self-start flex-shrink-0">✨</span>}
                            <div className={`max-w-[85%] p-3 rounded-lg text-sm sm:text-base leading-relaxed ${msg.sender === 'user' ? 'bg-cyan-600' : 'bg-black/20'}`}>
                                {msg.isLoading ? (
                                    <div className="flex items-center gap-1.5 p-1">
                                        <span style={{ animationDelay: '0ms' }} className="animate-pulse bg-white/50 rounded-full h-1.5 w-1.5"></span>
                                        <span style={{ animationDelay: '150ms' }} className="animate-pulse bg-white/50 rounded-full h-1.5 w-1.5"></span>
                                        <span style={{ animationDelay: '300ms' }} className="animate-pulse bg-white/50 rounded-full h-1.5 w-1.5"></span>
                                    </div>
                                ) : (
                                    <>
                                        <div className="prose prose-sm prose-invert prose-p:my-0 prose-headings:my-2">
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
                <div className="w-full max-w-4xl p-4 flex-shrink-0">
                    <div className="flex flex-wrap gap-2 mb-2 justify-center">
                        {messages.length <= 1 && promptSuggestions.map(prompt => (
                            <button 
                                key={prompt}
                                onClick={() => handleSend(prompt)}
                                className="px-3 py-1 bg-white/10 text-xs rounded-full hover:bg-white/20"
                            >
                                {prompt}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder={isSending ? "Astral is thinking..." : "Ask anything..."}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                            disabled={isSending}
                            className="flex-grow bg-black/10 dark:bg-gray-900/50 border border-[var(--panel-border)] rounded-lg px-4 py-3 text-sm placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-cyan-400 disabled:opacity-50"
                        />
                        <button onClick={() => handleSend()} disabled={isSending || !input} className="px-6 py-3 bg-cyan-500 text-black font-bold text-sm rounded-lg hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed">Send</button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AssistantView;