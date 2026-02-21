import { useState } from 'react';
import { Activity, Clock, RefreshCcw, Search, BrainCircuit, ListChecks, Play } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import client from '../api/client';
import { aiService } from '../api/aiService';
import { cn } from '../utils/cn';

type PostStatus = 'draft' | 'scheduled' | 'running' | 'published' | 'failed';

interface PostJob {
    id: number;
    platform: string;
    status: PostStatus;
    content: string;
    scheduled_at?: string | null;
    created_at: string;
}

interface JobStatusResponse {
    job_id: string;
    state: string;
    retry_count: number;
    trace_id?: string | null;
    error?: string | null;
}

interface PlannedTask {
    id: number;
    title: string;
    goal: string;
    action_type: string;
    requires_human_approval: boolean;
}

interface PlanExecutionItem {
    task_id: number;
    task_title: string;
    status: string;
    job_id?: string | null;
    error?: string | null;
}

interface PlanResponse {
    goal: string;
    summary: string;
    source: string;
    trace_id?: string | null;
    tasks: PlannedTask[];
    execution?: PlanExecutionItem[] | null;
}

const progressByStatus: Record<PostStatus, number> = {
    draft: 0,
    scheduled: 25,
    running: 70,
    published: 100,
    failed: 100
};

const AutomationPage = () => {
    const queryClient = useQueryClient();
    const [jobIdInput, setJobIdInput] = useState('');
    const [jobStatus, setJobStatus] = useState<JobStatusResponse | null>(null);
    const [checkingJobStatus, setCheckingJobStatus] = useState(false);
    const [planGoal, setPlanGoal] = useState('');
    const [isPlanning, setIsPlanning] = useState(false);
    const [executePlan, setExecutePlan] = useState(false);
    const [planResult, setPlanResult] = useState<PlanResponse | null>(null);

    const { data: posts = [], isLoading, refetch } = useQuery({
        queryKey: ['automation-posts'],
        queryFn: async () => {
            const response = await client.get('/posts/posts?limit=50');
            return response.data as PostJob[];
        }
    });

    const retryPost = async (postId: number) => {
        try {
            const response = await client.post(`/posts/posts/${postId}/schedule`);
            toast.success('Retry queued.');
            queryClient.invalidateQueries({ queryKey: ['automation-posts'] });
            if (response.data?.job_id) {
                setJobIdInput(response.data.job_id);
                toast.info(`Job ID: ${response.data.job_id}`);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to retry post.');
        }
    };

    const checkJobStatus = async () => {
        if (!jobIdInput.trim()) {
            toast.error('Enter a job ID first.');
            return;
        }
        setCheckingJobStatus(true);
        try {
            const response = await client.get(`/automation/jobs/${jobIdInput.trim()}`);
            setJobStatus(response.data);
        } catch (error) {
            console.error(error);
            toast.error('Unable to fetch job status.');
        } finally {
            setCheckingJobStatus(false);
        }
    };

    const generatePlan = async () => {
        if (!planGoal.trim()) {
            toast.error('Enter a goal first.');
            return;
        }

        setIsPlanning(true);
        try {
            const response = await aiService.generateAutomationPlan(
                planGoal.trim(),
                { source: 'automation_page' },
                5,
                executePlan
            );
            setPlanResult(response as PlanResponse);

            if (executePlan && Array.isArray(response.execution)) {
                const firstQueued = response.execution.find((item: PlanExecutionItem) => item.job_id);
                if (firstQueued?.job_id) {
                    setJobIdInput(firstQueued.job_id);
                }
            }
            toast.success(executePlan ? 'Plan generated and execution attempted.' : 'Plan generated.');
        } catch (error) {
            console.error(error);
            toast.error('Unable to generate plan.');
        } finally {
            setIsPlanning(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Automation</h1>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Track queued and running publishing jobs.</p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm flex items-center gap-2 transition-colors border border-slate-200 dark:border-transparent"
                >
                    <RefreshCcw size={16} />
                    Refresh
                </button>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 shadow-sm dark:shadow-none transition-colors">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <BrainCircuit size={16} className="text-blue-600 dark:text-blue-400" />
                    <label className="text-xs text-slate-500 dark:text-slate-400">Plan automation workflow</label>
                </div>
                <div className="space-y-2">
                    <textarea
                        value={planGoal}
                        onChange={(e) => setPlanGoal(e.target.value)}
                        placeholder="Example: Generate a LinkedIn post about AI reliability, optimize tone, and schedule it for tomorrow morning."
                        className="w-full min-h-[88px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-blue-500 resize-y transition-colors"
                    />
                    <div className="flex items-center justify-between gap-3">
                        <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                            <input
                                type="checkbox"
                                checked={executePlan}
                                onChange={(e) => setExecutePlan(e.target.checked)}
                                className="accent-blue-600 dark:accent-blue-500"
                            />
                            Execute auto-approved steps
                        </label>
                        <button
                            onClick={generatePlan}
                            disabled={isPlanning}
                            className="px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 text-sm flex items-center gap-2 disabled:opacity-60"
                        >
                            {executePlan ? <Play size={16} /> : <ListChecks size={16} />}
                            {isPlanning ? 'Planning...' : executePlan ? 'Plan + Run' : 'Generate Plan'}
                        </button>
                    </div>
                </div>
                {planResult && (
                    <div className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 space-y-3">
                        <div className="flex items-center justify-between gap-4">
                            <div>Source: <span className="font-semibold uppercase">{planResult.source}</span></div>
                            {planResult.trace_id && <div>Trace: <span className="font-mono">{planResult.trace_id}</span></div>}
                        </div>
                        <p className="text-slate-400">{planResult.summary}</p>
                        <div className="space-y-2">
                            {planResult.tasks.map((task) => (
                                <div key={task.id} className="border border-slate-200 dark:border-slate-800 rounded p-2">
                                    <div className="font-semibold text-slate-900 dark:text-slate-200">#{task.id} {task.title}</div>
                                    <div className="text-slate-400 mt-1">{task.goal}</div>
                                    <div className="mt-1 text-[10px] uppercase text-slate-500">
                                        {task.action_type}
                                        {task.requires_human_approval ? ' - requires approval' : ''}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {planResult.execution && planResult.execution.length > 0 && (
                            <div className="space-y-1">
                                <div className="text-slate-400">Execution</div>
                                {planResult.execution.map((item) => (
                                    <div key={`${item.task_id}-${item.status}`} className="text-[11px] text-slate-300">
                                        #{item.task_id} {item.task_title}: <span className="font-semibold">{item.status}</span>
                                        {item.job_id ? ` (job ${item.job_id})` : ''}
                                        {item.error ? ` - ${item.error}` : ''}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 shadow-sm dark:shadow-none transition-colors">
                <label className="text-xs text-slate-600 dark:text-slate-400">Check job by ID</label>
                <div className="flex gap-2">
                    <input
                        value={jobIdInput}
                        onChange={(e) => setJobIdInput(e.target.value)}
                        placeholder="Paste Celery job ID"
                        className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-200 outline-none focus:border-blue-500 transition-colors"
                    />
                    <button
                        onClick={checkJobStatus}
                        disabled={checkingJobStatus}
                        className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 text-sm flex items-center gap-2 disabled:opacity-60"
                    >
                        <Search size={16} />
                        Check
                    </button>
                </div>
                {jobStatus && (
                    <div className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3">
                        <div>State: <span className="font-semibold">{jobStatus.state}</span></div>
                        <div>Retries: <span className="font-semibold">{jobStatus.retry_count}</span></div>
                        {jobStatus.trace_id && <div>Trace ID: <span className="font-mono">{jobStatus.trace_id}</span></div>}
                        {jobStatus.error && <div className="text-red-400">Error: {jobStatus.error}</div>}
                    </div>
                )}
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm dark:shadow-none transition-colors">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-2">
                        <Activity size={18} className="text-blue-600 dark:text-blue-400" />
                        Recent Posts
                    </h3>
                    <span className="text-xs text-slate-500">{posts.length} items</span>
                </div>

                {isLoading ? (
                    <div className="p-4 text-sm text-slate-400">Loading jobs...</div>
                ) : posts.length === 0 ? (
                    <div className="p-4 text-sm text-slate-400">No posts yet.</div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {posts.map((post) => (
                            <div key={post.id} className="p-4">
                                <div className="flex items-start justify-between gap-4 mb-3">
                                    <div>
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">Post #{post.id} ({post.platform})</p>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{post.content}</p>
                                        <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                                            <Clock size={12} />
                                            {post.scheduled_at
                                                ? `Scheduled: ${new Date(post.scheduled_at).toLocaleString()}`
                                                : `Created: ${new Date(post.created_at).toLocaleString()}`}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={cn(
                                                'px-2 py-1 rounded text-[10px] uppercase font-bold border',
                                                post.status === 'published' && 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                                                post.status === 'running' && 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                                                post.status === 'scheduled' && 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
                                                post.status === 'failed' && 'bg-red-500/10 text-red-400 border-red-500/20',
                                                post.status === 'draft' && 'bg-slate-700 text-slate-300 border-slate-600'
                                            )}
                                        >
                                            {post.status}
                                        </span>
                                        {post.status === 'failed' && (
                                            <button
                                                onClick={() => retryPost(post.id)}
                                                className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                                                title="Retry"
                                            >
                                                <RefreshCcw size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                    <div
                                        className={cn(
                                            'h-full transition-all duration-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]',
                                            post.status === 'failed' ? 'bg-red-500' : 'bg-blue-600 dark:bg-blue-500'
                                        )}
                                        style={{ width: `${progressByStatus[post.status]}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AutomationPage;
