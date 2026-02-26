import { useState } from 'react';
import CalendarView from '../components/scheduler/CalendarView';
import PostComposer from '../components/scheduler/PostComposer';
import AIComposer from '../components/drafts/AIComposer';
import { useQueryClient } from '@tanstack/react-query';

interface PostData {
    id?: number;
    content?: string;
    platform?: string;
    media_url?: string | null;
    scheduled_at?: string | null;
}

const SchedulerPage = () => {
    const queryClient = useQueryClient();
    const [isComposerOpen, setComposerOpen] = useState(false);
    const [isAIComposerOpen, setAIComposerOpen] = useState(false);
    const [selectedPost, setSelectedPost] = useState<PostData | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const handleDateSelect = (date: Date) => {
        setSelectedDate(date);
        setSelectedPost(null);
        setComposerOpen(true);
    };

    const handlePostSelect = (post: PostData) => {
        setSelectedPost(post);
        setSelectedDate(null);
        setComposerOpen(true);
    };

    const handleApplyAI = (content: string) => {
        setAIComposerOpen(false);
        setSelectedPost((prev: PostData | null) => ({
            ...(prev || {}),
            content,
            platform: prev?.platform || 'linkedin'
        }));
        setComposerOpen(true);
    };

    const handleAppendAI = (content: string) => {
        setAIComposerOpen(false);
        setSelectedPost((prev: PostData | null) => ({
            ...(prev || {}),
            content: prev?.content ? `${prev.content}\n\n${content}` : content,
            platform: prev?.platform || 'linkedin'
        }));
        setComposerOpen(true);
    };

    return (
        <div className="h-full flex flex-col gap-6">
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Content Scheduler</h1>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Plan and automate your social media presence.</p>
                </div>
            </div>

            <div className="flex-1 min-h-0">
                <CalendarView
                    onDateSelect={handleDateSelect}
                    onPostSelect={handlePostSelect}
                />
            </div>

            <PostComposer
                isOpen={isComposerOpen}
                onClose={() => {
                    setComposerOpen(false);
                    setSelectedPost(null);
                    setSelectedDate(null);
                }}
                initialPost={selectedPost}
                initialDate={selectedDate}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['posts'] });
                }}
                onLaunchAI={() => {
                    setComposerOpen(false);
                    setAIComposerOpen(true);
                }}
            />

            <AIComposer
                isOpen={isAIComposerOpen}
                onClose={() => setAIComposerOpen(false)}
                onApply={handleApplyAI}
                onAppend={handleAppendAI}
                draftId={selectedPost?.id}
            />
        </div>
    );
};

export default SchedulerPage;
