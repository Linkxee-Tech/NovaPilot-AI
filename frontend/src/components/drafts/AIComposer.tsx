import { useState, useEffect, useRef } from 'react';
import { X, Send, Sparkles, MessageSquare, Save, Bot, User } from 'lucide-react';
import { toast } from 'sonner';
import client from '../../api/client';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface AIComposerProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (content: string) => void;
    draftId?: number;
}

const AIComposer: React.FC<AIComposerProps> = ({ isOpen, onClose, onApply, draftId }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        if (!draftId) {
            setMessages([]);
            return;
        }

        let cancelled = false;

        const loadHistory = async () => {
            setIsLoading(true);
            try {
                const response = await client.get(`/chat/history/${draftId}`);
                if (cancelled) return;

                const history: Message[] = Array.isArray(response.data)
                    ? response.data
                        .map((item: { role?: string; content?: string }): Message => {
                            const role: Message['role'] = item.role === 'assistant' ? 'assistant' : 'user';
                            return {
                                role,
                                content: String(item.content ?? '').trim()
                            };
                        })
                        .filter((item) => item.content.length > 0)
                    : [];

                setMessages(history);
            } catch (error) {
                console.error('Failed to load chat history:', error);
                if (!cancelled) {
                    setMessages([]);
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        loadHistory();

        return () => {
            cancelled = true;
        };
    }, [isOpen, draftId]);

    if (!isOpen) return null;

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg: Message = { role: 'user', content: input };
        const nextMessages = [...messages, userMsg];
        setMessages(nextMessages);
        setInput('');
        setIsLoading(true);

        try {
            const response = await client.post('/chat/send', {
                draft_id: draftId || null,
                platform: 'linkedin',
                prompt: input,
                history: nextMessages
            });
            const aiMsg: Message = {
                role: 'assistant',
                content: response.data.response
            };
            setMessages(prev => [...prev, aiMsg]);
            setIsLoading(false);
        } catch (err) {
            console.error(err);
            const errorMsg: Message = {
                role: 'assistant',
                content: "Sorry, I couldn't connect to the AI service. Please check your connection and credentials."
            };
            setMessages(prev => [...prev, errorMsg]);
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-end">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-lg h-full sm:h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 rounded-t-3xl sm:rounded-none mt-auto sm:mt-0">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white/50 dark:bg-slate-900/50 backdrop-blur-md sticky top-0 z-20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                            <Sparkles className="text-white" size={20} />
                        </div>
                        <div>
                            <h2 className="text-slate-900 dark:text-white font-bold">AI Post Generator</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-xs">Chat with AI to craft perfect content</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Chat Content */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500">
                                <MessageSquare size={32} />
                            </div>
                            <div>
                                <h3 className="text-slate-900 dark:text-slate-300 font-medium">Start Generating</h3>
                                <p className="text-slate-500 dark:text-slate-500 text-sm max-w-[240px] mt-1">Describe what you want to post about, and I'll draft it for you.</p>
                            </div>
                        </div>
                    )}

                    {messages.map((msg, i) => (
                        <div key={i} className={`flex gap-4 ${msg.role === 'assistant' ? '' : 'flex-row-reverse'}`}>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${msg.role === 'assistant' ? 'bg-blue-600/10 text-blue-600 dark:bg-blue-600/20 dark:text-blue-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                                }`}>
                                {msg.role === 'assistant' ? <Bot size={18} /> : <User size={18} />}
                            </div>
                            <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'assistant' ? 'bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-200 border border-slate-200 dark:border-slate-700' : 'bg-blue-600 text-white shadow-lg shadow-blue-500/10'
                                }`}>
                                {msg.content}
                                {msg.role === 'assistant' && (
                                    <button
                                        onClick={() => {
                                            onApply(msg.content);
                                            toast.success('Applied to post. You can continue refining or close to view.', { duration: 2000 });
                                        }}
                                        className="mt-3 flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors font-medium border-t border-slate-200 dark:border-slate-700 pt-2 w-full"
                                    >
                                        <Save size={12} />
                                        Apply this to my post
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-600 dark:bg-blue-600/20 dark:text-blue-500 flex items-center justify-center">
                                <Bot size={18} />
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Input area */}
                <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 sticky bottom-16 sm:bottom-0 z-20">
                    <div className="relative">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                            placeholder="Post subject or idea..."
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-600 text-slate-900 dark:text-white p-4 pr-14 rounded-2xl outline-none transition-all resize-none h-24 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-600"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                            className="absolute bottom-3 right-3 p-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white rounded-xl transition-all shadow-lg shadow-blue-500/20"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-3 text-center">AI can make mistakes. Check important info.</p>
                </div>
            </div>
        </div>
    );
};

export default AIComposer;
