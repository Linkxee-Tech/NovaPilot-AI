import {
    Users,
    Target,
    Zap,
    Clock
} from 'lucide-react';
import KPICard from '../components/dashboard/KPICard';
import StatusWidget from '../components/dashboard/StatusWidget';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import { useQuery } from '@tanstack/react-query';
import client from '../api/client';

import Skeleton, { KPICardSkeleton, ChartSkeleton } from '../components/ui/Skeleton';

interface Post {
    id: string;
    status: string;
    content: string;
    platform: string;
    scheduled_at: string | null;
}

interface AnalyticsData {
    id: string;
    impressions: number;
    engagement: number;
    platform: string;
}

const Dashboard = () => {
    // Fetch posts to count actions
    const { data: posts = [], isLoading: loadingPosts } = useQuery({
        queryKey: ['posts'],
        queryFn: async () => {
            const response = await client.get('/posts/posts');
            return response.data;
        }
    });

    // Fetch analytics sum (client-side aggregation for demo)
    const { data: analytics = [], isLoading: loadingAnalytics } = useQuery({
        queryKey: ['analytics'],
        queryFn: async () => {
            const response = await client.get('/analytics/');
            return response.data;
        }
    });

    if (loadingPosts || loadingAnalytics) {
        return (
            <div className="space-y-8 animate-in fade-in duration-700">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-3 w-32" />
                        <Skeleton className="h-10 w-64" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KPICardSkeleton />
                    <KPICardSkeleton />
                    <KPICardSkeleton />
                    <KPICardSkeleton />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <ChartSkeleton />
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 rounded-2xl p-8 h-[400px]">
                        <Skeleton className="h-full w-full" />
                    </div>
                </div>
            </div>
        );
    }

    // Calculations
    const totalActions = posts.length || 1245; // Fallback to mock if empty
    const publishedCount = posts.filter((p: Post) => p.status === 'published').length;
    const successRate = totalActions > 0 ? ((publishedCount / totalActions) * 100).toFixed(1) + '%' : '98.2%';

    // Sum of impressions from all analytics
    const totalImpressions = analytics.reduce((acc: number, curr: AnalyticsData) => acc + (curr.impressions || 0), 0);

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700 overflow-x-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">System Online</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">Overview</h1>
                    <p className="text-slate-500 text-xs md:text-sm font-medium">Real-time publishing and performance metrics.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-start sm:items-end gap-1">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Workspace</span>
                        <div className="bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-lg px-3 py-1.5 flex items-center gap-3">
                            <span className="text-xs text-slate-900 dark:text-white font-bold">Default Workspace</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    title="Success Rate"
                    value={successRate}
                    trend="+0.3%"
                    trendUp={true}
                    icon={Target}
                    color="green"
                />
                <KPICard
                    title="Active Jobs"
                    value="4"
                    trend="Stable"
                    trendUp={true}
                    icon={Zap}
                    color="blue"
                />
                <KPICard
                    title="Total Impressions"
                    value={totalImpressions > 0 ? totalImpressions.toLocaleString() : "1.2k"}
                    trend="+12%"
                    trendUp={true}
                    icon={Users}
                    color="purple"
                />
                <KPICard
                    title="Total Posts"
                    value={totalActions.toString()}
                    trend="+5%"
                    trendUp={true}
                    icon={Clock}
                    color="orange"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 rounded-2xl p-8 h-96 relative overflow-hidden group shadow-md dark:shadow-2xl">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Post Volume</h2>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Last 7 Days</p>
                            </div>
                            <div className="flex gap-2">
                                <span className="w-3 h-3 rounded-full bg-blue-600/20 border border-blue-500/50" />
                                <span className="w-3 h-3 rounded-full bg-blue-600/40 border border-blue-500/50" />
                                <span className="w-3 h-3 rounded-full bg-blue-600/60 border border-blue-500/50 shadow-[0_0_10px_rgba(37,99,235,0.4)]" />
                            </div>
                        </div>

                        <div className="absolute inset-0 bg-gradient-to-t from-blue-600/10 via-transparent to-transparent pointer-events-none" />

                        <div className="h-48 flex items-end justify-between gap-3 px-2 pb-2 mt-12">
                            {[35, 45, 30, 60, 75, 50, 65, 80, 70, 55, 40, 60].map((h, i) => (
                                <div key={i} style={{ height: `${h}%` }} className="w-full bg-blue-600/20 border-t border-blue-500/30 rounded-t-lg hover:bg-blue-600/50 transition-all cursor-pointer relative group/bar shadow-[0_0_15px_rgba(37,99,235,0.1)]">
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-black py-1.5 px-3 rounded-lg opacity-0 group-hover/bar:opacity-100 transition-all whitespace-nowrap z-10 shadow-xl translate-y-2 group-hover/bar:translate-y-0 text-slate-900 dark:text-white">
                                        {h} posts
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 flex justify-between px-2">
                            {['02:00', '06:00', '10:00', '14:00', '18:00', '22:00'].map((t) => (
                                <span key={t} className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{t}</span>
                            ))}
                        </div>
                    </div>

                    <StatusWidget />
                </div>

                <div className="lg:col-span-1">
                    <ActivityFeed />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
