import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Image as ImageIcon, Calendar, Linkedin, Clock, Save, Loader2, SendHorizontal, WandSparkles, Mic, Video, FolderOpen, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import client from '../../api/client';
import { aiService } from '../../api/aiService';
import { normalizeApiErrorMessage } from '../../utils/apiError';

interface InitialPost {
    id?: number;
    content?: string;
    platform?: string;
    media_url?: string | null;
    scheduled_at?: string | null;
}

interface PostComposerProps {
    isOpen: boolean;
    onClose: () => void;
    initialContent?: string;
    initialDraftId?: number;
    initialPost?: InitialPost | null;
    initialDate?: Date | null;
    onSuccess?: () => void;
    onLaunchAI?: () => void;
}

const PostComposer = ({
    isOpen,
    onClose,
    initialContent = '',
    initialDraftId,
    initialPost,
    initialDate,
    onSuccess,
    onLaunchAI
}: PostComposerProps) => {
    const [content, setContent] = useState(initialContent);
    const [platform, setPlatform] = useState<'linkedin' | 'twitter'>('linkedin');
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [previewMode, setPreviewMode] = useState(true);
    const [mediaUrl, setMediaUrl] = useState<string | null>(null);
    const [mediaMetadata, setMediaMetadata] = useState<Record<string, unknown> | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [editingDraftId, setEditingDraftId] = useState<number | undefined>(initialDraftId);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isCopilotOpenMobile, setIsCopilotOpenMobile] = useState(false);
    const resolveMediaUrl = (url: string | null) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        const apiBase = client.defaults.baseURL || '';
        const serverHost = apiBase.split('/api/v1')[0];
        return `${serverHost}${url}`;
    };

    useEffect(() => {
        if (isOpen) {
            if (initialPost) {
                setContent(initialPost.content || '');
                setPlatform((initialPost.platform as 'linkedin' | 'twitter') || 'linkedin');
                setMediaUrl(initialPost.media_url || null);
                setEditingDraftId(undefined);
                if (initialPost.scheduled_at) {
                    const dt = new Date(initialPost.scheduled_at);
                    setScheduledDate(dt.toISOString().split('T')[0]);
                    setScheduledTime(dt.toTimeString().split(' ')[0].substring(0, 5));
                }
            } else if (initialDate) {
                setContent(initialContent);
                setMediaUrl(null);
                setMediaMetadata(null);
                setEditingDraftId(initialDraftId);
                setScheduledDate(initialDate.toISOString().split('T')[0]);
                setScheduledTime(new Date().toTimeString().split(' ')[0].substring(0, 5));
            } else {
                setContent(initialContent);
                setMediaUrl(null);
                setMediaMetadata(null);
                setEditingDraftId(initialDraftId);
            }
            setIsCopilotOpenMobile(false);
        }
    }, [initialContent, initialDraftId, initialPost, initialDate, isOpen]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await client.post('/posts/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setMediaUrl(response.data.media_url);
            setMediaMetadata(response.data.metadata ?? null);
            toast.success('Media uploaded successfully!');
        } catch (error) {
            console.error('Upload failed:', error);
            toast.error('Failed to upload media.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleOptimize = async () => {
        if (!content && !aiPrompt) {
            toast.error('Please enter content or an AI prompt.');
            return;
        }

        setIsOptimizing(true);
        try {
            const promptContext = aiPrompt ? `Instruction: ${aiPrompt}\n\nExisting Content: ${content}` : content;

            const optimizedResponse = mediaUrl
                ? await aiService.optimizeMultimodalContent(
                    promptContext,
                    {
                        media_url: mediaUrl,
                        ...(mediaMetadata ?? {})
                    },
                    'professional',
                    'tech professionals'
                )
                : await client.post('/posts/optimize/caption', {
                    caption: promptContext,
                    tone: 'professional',
                    target_audience: 'tech professionals'
                }).then((res) => res.data);

            const optimized = optimizedResponse.optimized_caption;
            const tags = Array.isArray(optimizedResponse.hashtags) ? optimizedResponse.hashtags.join(' ') : '';
            setContent(`${optimized}\n\n${tags}`);
            setAiPrompt('');
            toast.success('AI Optimization complete!');
        } catch (error) {
            console.error('AI Optimization failed:', error);
            toast.error('Failed to optimize with AI.');
        } finally {
            setIsOptimizing(false);
        }
    };

    const handleAction = async (action: 'save' | 'schedule') => {
        if (!content) {
            toast.error('Content cannot be empty.');
            return;
        }

        if (action === 'schedule' && (!scheduledDate || !scheduledTime)) {
            toast.error('Please select both date and time for scheduling.');
            return;
        }

        setIsSaving(true);
        try {
            if (action === 'save') {
                if (editingDraftId && editingDraftId > 0) {
                    await client.patch(`/posts/drafts/${editingDraftId}`, {
                        content,
                        platform,
                        media_url: mediaUrl
                    });
                    toast.success('Draft updated.');
                } else {
                    await client.post('/posts/drafts', {
                        content,
                        platform,
                        media_url: mediaUrl
                    });
                    toast.success('Draft saved.');
                }
            } else {
                if (initialPost) {
                    // Update existing scheduled post
                    await client.patch(`/posts/posts/${initialPost.id}`, {
                        content,
                        platform,
                        media_url: mediaUrl,
                        scheduled_at: `${scheduledDate}T${scheduledTime}:00`
                    });
                    toast.success('Post updated.');
                } else {
                    const postResponse = await client.post('/posts/posts', {
                        content,
                        platform,
                        media_url: mediaUrl,
                        scheduled_at: `${scheduledDate}T${scheduledTime}:00`
                    });
                    await client.post(`/posts/posts/${postResponse.data.id}/schedule`);
                    toast.success('Post scheduled.');
                }
            }

            onSuccess?.();
            onClose();
        } catch (error) {
            console.error('Failed to save post:', error);
            const apiError = error as { response?: { data?: { detail?: unknown; message?: unknown } }; message?: string };
            toast.error(
                normalizeApiErrorMessage(
                    apiError.response?.data?.detail ?? apiError.response?.data?.message ?? apiError.message,
                    'Failed to process request.'
                )
            );
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md transition-all duration-300">
            <div className={`bg-white dark:bg-slate-900 border-x-0 sm:border border-slate-200 dark:border-slate-800 w-full ${previewMode ? 'max-w-6xl' : 'max-w-2xl'} rounded-none sm:rounded-3xl shadow-2xl flex flex-col h-full sm:h-auto max-h-full sm:max-h-[90vh] min-h-0 overflow-hidden transition-all duration-500`}>
                <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <SendHorizontal size={16} className="text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                            Compose Post
                        </h3>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4">
                        <button
                            onClick={() => setIsCopilotOpenMobile((prev) => !prev)}
                            className={`md:hidden text-xs font-bold px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${isCopilotOpenMobile ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}
                            aria-expanded={isCopilotOpenMobile}
                            aria-label={isCopilotOpenMobile ? 'Hide AI Co-Pilot panel' : 'Show AI Co-Pilot panel'}
                        >
                            <WandSparkles size={12} />
                            {isCopilotOpenMobile ? 'Hide AI' : 'Show AI'}
                        </button>
                        <button
                            onClick={() => setPreviewMode(!previewMode)}
                            className={`text-xs font-bold px-4 py-1.5 rounded-full border transition-all ${previewMode ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}
                        >
                            {previewMode ? 'Hide Preview' : 'Show Preview'}
                        </button>
                        <button onClick={onClose} className="p-2 text-rose-500 hover:text-rose-600 transition-all hover:scale-110 active:scale-95 group" title="Close">
                            <X size={24} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-300" />
                        </button>
                    </div>
                </div>

                <div className="flex flex-1 min-h-0 overflow-hidden flex-col md:flex-row pb-20 md:pb-0">
                    {/* Editor Section */}
                    <div className="flex-1 min-w-0 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
                        {/* Platform Selector */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex gap-2 w-full sm:w-auto">
                                <button
                                    onClick={() => setPlatform('linkedin')}
                                    className={`flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all ${platform === 'linkedin' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' : 'bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-blue-500/30 dark:hover:border-slate-700'}`}
                                >
                                    <Linkedin size={14} fill={platform === 'linkedin' ? 'white' : 'currentColor'} />
                                    LinkedIn
                                </button>
                                <button
                                    onClick={() => setPlatform('twitter')}
                                    className={`flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all ${platform === 'twitter' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-lg shadow-black/10 dark:shadow-white/10' : 'bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-blue-500/30 dark:hover:border-slate-700'}`}
                                >
                                    <span className="font-bold text-sm leading-none">X</span>
                                    Twitter / X
                                </button>
                            </div>
                            <div className="flex gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 self-start sm:self-auto">
                                <Link to="/drafts" className="hover:text-blue-400">Drafts</Link>
                                <span>|</span>
                                <Link to="/audit-logs" className="hover:text-blue-400">History</Link>
                            </div>
                        </div>

                        {/* Unified Compose Box */}
                        <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden focus-within:border-blue-500/50 transition-all shadow-inner">
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="w-full h-40 bg-transparent p-5 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none resize-none font-medium leading-relaxed"
                                placeholder="Write your post..."
                            ></textarea>

                            {mediaUrl && (
                                <div className="px-5 pb-4 relative group">
                                    <img src={resolveMediaUrl(mediaUrl)} alt="Attachment" className="w-40 h-24 object-cover rounded-xl border border-slate-800" />
                                    <button
                                        onClick={() => {
                                            setMediaUrl(null);
                                            setMediaMetadata(null);
                                        }}
                                        className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            )}

                            <div className="px-4 py-3 bg-white/50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800/50 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex flex-wrap items-center gap-2">
                                    <label className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg cursor-pointer transition-all active:scale-90 border border-slate-200 dark:border-slate-700">
                                        {isUploading ? <Loader2 size={18} className="animate-spin text-blue-400" /> : <ImageIcon size={18} />}
                                        <input type='file' className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                                    </label>
                                    <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1" />
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Calendar size={16} className="text-slate-500" />
                                        <input
                                            type="date"
                                            value={scheduledDate}
                                            onChange={(e) => setScheduledDate(e.target.value)}
                                            className="bg-transparent text-xs font-bold text-slate-700 dark:text-white outline-none w-24 sm:w-28 [color-scheme:dark]"
                                        />
                                        <Clock size={16} className="text-slate-500 ml-1" />
                                        <input
                                            type="time"
                                            value={scheduledTime}
                                            onChange={(e) => setScheduledTime(e.target.value)}
                                            className="bg-transparent text-xs font-bold text-slate-700 dark:text-white outline-none w-20 [color-scheme:dark]"
                                        />

                                    </div>
                                </div>
                                <div className="text-[10px] font-bold text-slate-600 self-end sm:self-auto">
                                    {content.length} {platform === 'twitter' ? '/ 280' : 'chars'}
                                </div>
                            </div>
                        </div>

                        {/* Live Preview - Conditionally Rendered */}
                        {previewMode && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 ml-1">Live Signal Preview</label>
                                {platform === 'linkedin' ? (
                                    <div className="bg-white dark:bg-[#1d2226] rounded-lg p-4 shadow-xl text-slate-900 dark:text-white/90 space-y-3 border border-slate-100 dark:border-slate-800 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <div className="w-10 h-10 rounded bg-slate-200 dark:bg-slate-800" />
                                            <div>
                                                <div className="h-2.5 w-24 bg-slate-200 dark:bg-slate-800 rounded mb-1" />
                                                <div className="h-2 w-16 bg-slate-100 dark:bg-slate-900 rounded" />
                                            </div>
                                        </div>
                                        <div className="whitespace-pre-wrap text-sm min-h-[100px] leading-relaxed">
                                            {content || <span className="text-slate-400 italic">Post content will appear here...</span>}
                                        </div>
                                        {mediaUrl && <img src={resolveMediaUrl(mediaUrl)} className="w-full rounded-lg" />}
                                    </div>
                                ) : (
                                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-xl text-white space-y-3">
                                        <div className="flex gap-3">
                                            <div className="w-10 h-10 bg-blue-600 rounded-full" />
                                            <div className="flex-1">
                                                <div className="h-3 bg-slate-800 rounded w-16 mb-2" />
                                                <div className="text-[14px] whitespace-pre-wrap leading-tight">
                                                    {content || <span className="text-slate-700 italic">X Preview...</span>}
                                                </div>
                                                {mediaUrl && <img src={resolveMediaUrl(mediaUrl)} className="mt-3 w-full rounded-xl" />}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* AI Chat Side Panel */}
                    <div className={`shrink-0 w-full md:w-[260px] lg:w-[290px] xl:w-[330px] bg-slate-50 dark:bg-slate-950/50 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 flex-col min-h-0 max-h-[42vh] md:max-h-none ${isCopilotOpenMobile ? 'flex' : 'hidden'} md:flex`}>
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-transparent">
                            <div className="flex items-center gap-2">
                                <WandSparkles size={16} className="text-blue-500" />
                                <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight uppercase tracking-widest text-[10px]">AI Co-Pilot</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Active</span>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            <div className="bg-blue-600/5 border border-blue-500/10 p-4 rounded-xl">
                                <p className="text-[11px] text-slate-400 leading-relaxed italic">
                                    "I can help you generate captions, brainstorm hashtags, or optimize your tone. Upload files to give me more context."
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    if (onLaunchAI) {
                                        onLaunchAI();
                                    } else {
                                        onClose();
                                    }
                                }}
                                className="w-full py-3 px-4 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold border border-indigo-500/20 transition-all flex items-center justify-center gap-2 group"
                            >
                                <Sparkles size={14} className="group-hover:rotate-12 transition-transform" />
                                Launch Post Generator
                            </button>
                        </div>
                        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-4 bg-white dark:bg-transparent">
                            <div className="flex items-center justify-center gap-2 flex-wrap">
                                <label className="p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-blue-500 hover:text-blue-600 hover:border-blue-400 dark:hover:border-blue-700 transition-all cursor-pointer" title="Upload Image">
                                    <ImageIcon size={14} />
                                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={isUploading} />
                                </label>
                                <label className="p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-blue-500 hover:text-blue-600 hover:border-blue-400 dark:hover:border-blue-700 transition-all cursor-pointer" title="Upload Any File">
                                    <FolderOpen size={14} />
                                    <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                                </label>
                                <label className="p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-blue-500 hover:text-blue-600 hover:border-blue-400 dark:hover:border-blue-700 transition-all cursor-pointer" title="Upload Audio">
                                    <Mic size={14} />
                                    <input type="file" className="hidden" accept="audio/*" onChange={handleFileUpload} disabled={isUploading} />
                                </label>
                                <label className="p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-blue-500 hover:text-blue-600 hover:border-blue-400 dark:hover:border-blue-700 transition-all cursor-pointer" title="Upload Video">
                                    <Video size={14} />
                                    <input type="file" className="hidden" accept="video/*" onChange={handleFileUpload} disabled={isUploading} />
                                </label>
                            </div>
                            <div className="relative group">
                                <input
                                    type="text"
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                    placeholder="Ask AI to write a post..."
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-4 pr-10 py-3 text-xs outline-none focus:border-blue-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                />
                                {mediaUrl && (
                                    <div className="absolute -top-6 right-0 bg-emerald-500/10 text-emerald-500 text-[8px] font-bold px-4 py-1 rounded-full border border-emerald-500/20 animate-pulse z-10">
                                        Media Attached
                                    </div>
                                )}
                                <button
                                    onClick={handleOptimize}
                                    disabled={isOptimizing || (!content && !aiPrompt)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-500 transition-all shadow-md shadow-blue-600/20 disabled:opacity-100 disabled:cursor-not-allowed text-white"
                                >
                                    {isOptimizing ? (
                                        <Loader2 size={20} strokeWidth={2.5} className="animate-spin flex-shrink-0" />
                                    ) : (
                                        <SendHorizontal size={22} strokeWidth={2.5} className="text-white flex-shrink-0 min-w-[22px] min-h-[22px]" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-800 shrink-0 sticky bottom-16 sm:bottom-0 z-20 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-slate-900/95 backdrop-blur-md">
                    <div className="hidden sm:flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">System Online</span>
                    </div>
                    <div className="flex flex-row flex-wrap items-center justify-center sm:justify-end gap-2 sm:gap-3 w-full">
                        <button onClick={onClose} className="px-4 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all uppercase tracking-widest">Abort</button>
                        <button
                            onClick={() => handleAction('save')}
                            disabled={isSaving}
                            className="flex-1 sm:flex-none justify-center px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-white rounded-xl font-bold text-xs border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 shadow-sm"
                        >
                            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                            Save
                        </button>
                        <button
                            onClick={() => handleAction('schedule')}
                            disabled={isSaving}
                            className={`flex-[1.5] sm:flex-none justify-center px-6 py-2.5 rounded-xl font-bold text-xs shadow-xl transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 ${platform === 'linkedin' ? 'bg-blue-600 text-white shadow-blue-600/20' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-black/10 dark:shadow-white/10'}`}
                        >
                            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <SendHorizontal size={14} />}
                            Post Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PostComposer;


