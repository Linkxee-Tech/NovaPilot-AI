import { useState } from 'react';
import { Edit3, Trash2, FileText, Sparkles } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import client from '../api/client';
import PostComposer from '../components/scheduler/PostComposer';
import AIComposer from '../components/drafts/AIComposer';

interface Draft {
    id: number;
    content: string;
    platform?: 'linkedin' | 'twitter' | null;
    updated_at: string;
}

const platformLabel = (platform?: 'linkedin' | 'twitter' | null) => {
    if (platform === 'linkedin') return 'LinkedIn';
    if (platform === 'twitter') return 'Twitter';
    return 'Unassigned';
};

const DraftsPage = () => {
    const queryClient = useQueryClient();
    const [isComposerOpen, setComposerOpen] = useState(false);
    const [isAIComposerOpen, setAIComposerOpen] = useState(false);
    const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null);

    const { data: drafts = [], isLoading } = useQuery({
        queryKey: ['drafts'],
        queryFn: async () => {
            const response = await client.get('/posts/drafts');
            return response.data as Draft[];
        }
    });

    const handleDelete = async (id: number) => {
        const confirmed = window.confirm('Delete this draft?');
        if (!confirmed) return;

        try {
            await client.delete(`/posts/drafts/${id}`);
            toast.success('Draft deleted.');
            queryClient.invalidateQueries({ queryKey: ['drafts'] });
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete draft.');
        }
    };

    const handleEdit = (draft: Draft) => {
        setSelectedDraft(draft);
        setComposerOpen(true);
    };

    const handleApplyAI = (content: string) => {
        setAIComposerOpen(false);
        setSelectedDraft({
            id: 0,
            content,
            platform: 'linkedin',
            updated_at: new Date().toISOString()
        });
        setComposerOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Drafts</h1>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Manage your unfinished posts and ideas.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setAIComposerOpen(true)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <Sparkles size={16} />
                        Generate with AI
                    </button>
                    <button
                        onClick={() => { setSelectedDraft(null); setComposerOpen(true); }}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        New Draft
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="text-sm text-slate-400">Loading drafts...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {drafts.map((draft) => (
                        <div key={draft.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm dark:shadow-none group">
                            <div className="flex justify-between items-start mb-3">
                                <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${draft.platform === 'linkedin'
                                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                            : 'bg-slate-700 text-slate-300 border-slate-600'
                                        }`}
                                >
                                    {platformLabel(draft.platform)}
                                </span>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleEdit(draft)}
                                        className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                    >
                                        <Edit3 size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(draft.id)}
                                        className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            <p className="text-slate-700 dark:text-slate-300 text-sm line-clamp-3 mb-4">{draft.content}</p>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
                                <div className="flex items-center gap-1.5">
                                    <FileText size={12} />
                                    <span>Updated {new Date(draft.updated_at).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {drafts.length === 0 && (
                        <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl bg-white/50 dark:bg-transparent">
                            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400 dark:text-slate-500">
                                <FileText size={20} />
                            </div>
                            <h3 className="text-slate-900 dark:text-slate-300 font-medium">No drafts</h3>
                            <p className="text-slate-600 dark:text-slate-500 text-sm mt-1">Create a new draft to get started.</p>
                        </div>
                    )}
                </div>
            )}

            <PostComposer
                isOpen={isComposerOpen}
                onClose={() => setComposerOpen(false)}
                initialContent={selectedDraft?.content}
                initialDraftId={selectedDraft?.id}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['drafts'] });
                    queryClient.invalidateQueries({ queryKey: ['posts'] });
                }}
            />

            <AIComposer
                isOpen={isAIComposerOpen}
                onClose={() => setAIComposerOpen(false)}
                onApply={handleApplyAI}
                draftId={selectedDraft?.id}
            />
        </div>
    );
};

export default DraftsPage;
