import PerformanceChart from '../components/analytics/PerformanceChart';
import EngagementTable from '../components/analytics/EngagementTable';
import KPICard from '../components/dashboard/KPICard';
import { Target, TrendingUp, Eye, Sparkles, BarChart3, Globe } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import client from '../api/client';
import Skeleton, { KPICardSkeleton, ChartSkeleton, TableSkeleton } from '../components/ui/Skeleton';
import { toast } from 'sonner';

interface AnalyticsData {
    timestamp?: string;
    impressions?: number;
    clicks?: number;
    engagement_rate?: string;
    platform?: string;
}

const AnalyticsPage = () => {
    const { data: analytics = [], isLoading } = useQuery({
        queryKey: ['analytics-full'],
        queryFn: async () => {
            const response = await client.get('/analytics/');
            return response.data;
        }
    });

    const handleExport = () => {
        if (!analytics || analytics.length === 0) {
            toast.error("No data available for export");
            return;
        }

        const headers = ["Timestamp", "Impressions", "Clicks", "Engagement Rate", "Platform"];
        const rows = analytics.map((item: AnalyticsData) => [
            item.timestamp || new Date().toISOString(),
            item.impressions || 0,
            item.clicks || 0,
            item.engagement_rate || '0%',
            item.platform || 'unknown'
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map((r: (string | number)[]) => r.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `novapilot_analytics_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Analytics exported successfully.");
    };

    if (isLoading) {
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
                    <div className="bg-slate-900 border border-slate-800/50 rounded-2xl p-8 h-[400px]">
                        <Skeleton className="h-full w-full" />
                    </div>
                </div>
                <TableSkeleton />
            </div>
        );
    }

    // Aggregate metrics
    const totalImpressions = analytics.reduce((acc: number, curr: AnalyticsData) => acc + (curr.impressions || 0), 0);
    const totalClicks = analytics.reduce((acc: number, curr: AnalyticsData) => acc + (curr.clicks || 0), 0);
    const avgEngagement = analytics.length > 0 ? (analytics.reduce((acc: number, curr: AnalyticsData) => acc + parseFloat(curr.engagement_rate || '0'), 0) / analytics.length).toFixed(1) + '%' : '4.2%';

    // Mock chart data for trend (since backend doesn't provide historical yet)
    const chartData = [
        { name: 'Mon', clicks: totalClicks * 0.1, impressions: totalImpressions * 0.12 },
        { name: 'Tue', clicks: totalClicks * 0.15, impressions: totalImpressions * 0.08 },
        { name: 'Wed', clicks: totalClicks * 0.08, impressions: totalImpressions * 0.25 },
        { name: 'Thu', clicks: totalClicks * 0.12, impressions: totalImpressions * 0.15 },
        { name: 'Fri', clicks: totalClicks * 0.20, impressions: totalImpressions * 0.18 },
        { name: 'Sat', clicks: totalClicks * 0.25, impressions: totalImpressions * 0.12 },
        { name: 'Sun', clicks: totalClicks * 0.10, impressions: totalImpressions * 0.10 },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Globe className="text-blue-500" size={14} />
                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Analytics</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">Analytics</h1>
                    <p className="text-slate-600 dark:text-slate-500 text-sm font-medium">Performance overview for your recent posts.</p>
                </div>
                <div className="flex flex-col xs:flex-row items-start sm:items-center gap-3">
                    <select className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl text-[10px] font-black uppercase text-slate-900 dark:text-white px-4 py-2.5 outline-none cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors w-full xs:w-auto">
                        <option>All Platforms</option>
                        <option>LinkedIn</option>
                        <option>Twitter</option>
                    </select>
                    <button
                        onClick={handleExport}
                        className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95 w-full xs:w-auto"
                    >
                        <BarChart3 size={14} />
                        Export Data
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard title="Total Signal" value={totalImpressions.toLocaleString()} trend="+12.5%" trendUp={true} icon={Eye} color="blue" />
                <KPICard title="Engagement Delta" value={avgEngagement} trend="+0.2%" trendUp={true} icon={Target} color="green" />
                <KPICard title="Conversion Link" value={totalClicks.toLocaleString()} trend="+18%" trendUp={true} icon={TrendingUp} color="purple" />
                <KPICard title="Node Growth" value="+1,204" trend="5.4%" trendUp={false} icon={Globe} color="orange" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <PerformanceChart data={chartData} />
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 rounded-2xl p-8 h-[400px] flex flex-col shadow-md dark:shadow-2xl relative overflow-hidden group transition-colors">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Platform Distribution</h2>
                            <p className="text-[10px] text-slate-600 dark:text-slate-500 font-bold uppercase tracking-widest">Audience Breakdown</p>
                        </div>
                    </div>

                    <div className="flex-1 flex items-center justify-center relative">
                        <div className="absolute inset-0 bg-gradient-to-t from-blue-600/5 to-transparent pointer-events-none" />
                        <div className="relative">
                            <div className="w-48 h-48 rounded-full border-[12px] border-slate-100 dark:border-slate-800 border-t-blue-500 border-r-purple-500 border-b-indigo-500 shadow-[0_0_50px_rgba(59,130,246,0.1)] animate-spin-slow-reverse" />
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-black text-slate-900 dark:text-white italic">72%</span>
                                <span className="text-[8px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-widest">Global Reach</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-6">
                        {['LinkedIn', 'Twitter', 'Direct'].map((label, i) => (
                            <div key={label} className="text-center p-2 bg-slate-50 dark:bg-slate-950/50 rounded-lg border border-slate-200 dark:border-slate-800">
                                <p className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter mb-1">{label}</p>
                                <p className="text-xs text-slate-900 dark:text-white font-black italic">{[45, 30, 25][i]}%</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 rounded-2xl p-8 shadow-md dark:shadow-2xl relative overflow-hidden transition-colors">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Sparkles size={160} />
                </div>

                <div className="flex items-center gap-4 mb-8 relative z-10">
                    <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                        <Sparkles size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">AI Insights</h3>
                        <p className="text-[10px] text-slate-600 dark:text-slate-500 font-bold uppercase tracking-widest">Suggested Improvements</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                    {[
                        {
                            title: "Best Posting Window",
                            recommendation: "LinkedIn engagement peaks between 09:00 and 11:00 UTC on Tuesdays.",
                            status: "Predictive"
                        },
                        {
                            title: "Content Trend",
                            recommendation: "Posts about agentic AI are currently outperforming general tech topics.",
                            status: "Verified"
                        },
                        {
                            title: "Audience Shift",
                            recommendation: "Healthtech audience engagement increased this week. Consider adding more related posts.",
                            status: "Strategic"
                        }
                    ].map((insight, i) => (
                        <div key={i} className="p-6 bg-white dark:bg-slate-800/20 rounded-2xl border border-slate-200 dark:border-slate-800/50 hover:border-indigo-500/30 shadow-sm dark:shadow-none transition-all hover:translate-y-[-4px] group">
                            <div className="flex justify-between items-start mb-4">
                                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{insight.title}</h4>
                                <span className="text-[8px] font-black uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded-lg shadow-sm">
                                    {insight.status}
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium group-hover:text-slate-900 dark:group-hover:text-slate-300 transition-colors">{insight.recommendation}</p>
                        </div>
                    ))}
                </div>
            </div>

            <EngagementTable />
        </div>
    );
};

export default AnalyticsPage;
