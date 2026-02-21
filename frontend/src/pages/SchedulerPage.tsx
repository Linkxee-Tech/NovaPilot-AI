import { useState } from 'react';
import CalendarView from '../components/scheduler/CalendarView';
import PostComposer from '../components/scheduler/PostComposer';

const SchedulerPage = () => {
    const [isComposerOpen, setComposerOpen] = useState(false);

    return (
        <div className="h-full flex flex-col gap-6">
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Content Scheduler</h1>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Plan and automate your social media presence.</p>
                </div>
            </div>

            <div className="flex-1 min-h-0">
                <CalendarView onDateSelect={() => setComposerOpen(true)} />
            </div>

            <PostComposer isOpen={isComposerOpen} onClose={() => setComposerOpen(false)} />
        </div>
    );
};

export default SchedulerPage;
