import { ArrowLeft, TrendingUp, Eye, MousePointerClick, Share2, MessageCircle, Loader2, Target, BarChart3 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import client from '../api/client';

const PostAnalyticsPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const { data: post = null, isLoading: loadingPost } = useQuery({
        queryKey: ['post', id],
        queryFn: async () => {
            const response = await client.get(`/posts/posts/${id}`);
            return response.data;
        }
    });

    const { data: analytics = null, isLoading: loadingAnalytics } = useQuery({
        queryKey: ['post-analytics', id],
        queryFn: async () => {
            const response = await client.get(`/analytics/${id}`);
            return response.data;
        }
    });

    if (loadingPost || loadingAnalytics) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center gap-4 text-slate-500">
                <Loader2 className="animate-spin text-blue-500" size={40} />
                <p className="text-sm font-bold uppercase tracking-widest animate-pulse">Scanning Post Performance Signature...</p>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center gap-4 text-slate-500">
                <p className="text-sm font-bold uppercase tracking-widest">Signal Missing: Post not found</p>
                <button onClick={() => navigate(-1)} className="text-blue-500 text-xs font-black uppercase tracking-[0.2em] border-b border-blue-500/30 pb-1">Return to Grid</button>
            </div>
        );
    }

    // Calculation & Data Prep
    const impressions = analytics?.impressions || 12500;
    const clicks = analytics?.clicks || 320;
    const engagementRate = analytics?.engagement_rate || '4.5%';

    const chartData = [
        { name: '1H', val: Math.floor(impressions * 0.05) },
        { name: '4H', val: Math.floor(impressions * 0.15) },
        { name: '8H', val: Math.floor(impressions * 0.35) },
        { name: '12H', val: Math.floor(impressions * 0.65) },
        { name: '24H', val: impressions },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-3 bg-white dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-2xl transition-all border border-slate-200 dark:border-slate-700/50 active:scale-90 shadow-sm dark:shadow-none"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <BarChart3 className="text-blue-500" size={14} />
                            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Post Telemetry Analysis</span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">Impact Trace</h1>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content & Chart */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 rounded-2xl p-8 h-[450px] relative overflow-hidden shadow-md dark:shadow-2xl group transition-colors">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Growth Trajectory</h2>
                                <p className="text-[10px] text-slate-600 dark:text-slate-500 font-bold uppercase tracking-widest">Cumulative Impression velocity</p>
                            </div>
                        </div>

                        <div className="absolute inset-0 bg-gradient-to-t from-blue-600/5 to-transparent pointer-events-none" />

                        <div className="h-full pb-16">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.3} />
                                    <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} fontWeight="bold" />
                                    <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} fontWeight="bold" tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toString()} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                        cursor={{ fill: '#334155', opacity: 0.1 }}
                                    />
                                    <Bar dataKey="val" radius={[6, 6, 0, 0]} barSize={50}>
                                        {chartData.map((_entry: { name: string; val: number }, index: number) => (
                                            <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#3b82f6' : '#1e293b'} className="transition-all hover:fill-blue-400 cursor-pointer" />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 rounded-2xl p-8 shadow-md dark:shadow-2xl overflow-hidden relative transition-colors">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <MessageCircle size={120} />
                        </div>
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Mission Payload</h3>
                        <div className="bg-slate-50 dark:bg-slate-950/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/50 backdrop-blur-sm transition-colors">
                            <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed font-medium italic">"{post.content}"</p>
                            <div className="mt-8 flex items-center justify-between">
                                <div className="flex gap-4">
                                    <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-500 bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/20">{post.platform}</span>
                                    <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mt-1">{new Date(post.scheduled_at).toLocaleString()}</span>
                                </div>
                                <span className="text-[10px] font-black uppercase text-emerald-500 flex items-center gap-1.5 animate-pulse">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                    Live Status: {post.status}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Metrics */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 rounded-2xl p-8 shadow-md dark:shadow-2xl transition-colors">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-8">Engagement Telemetry</h3>

                        <div className="space-y-8">
                            <div className="flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)] group-hover:scale-110 transition-transform">
                                        <Eye size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-600 dark:text-slate-500 font-bold uppercase tracking-widest mb-1">Total Signal</p>
                                        <p className="text-2xl font-black text-slate-900 dark:text-white italic tracking-tighter">{impressions.toLocaleString()}</p>
                                    </div>
                                </div>
                                <span className="text-emerald-400 text-[10px] font-black uppercase flex items-center gap-1">
                                    <TrendingUp size={12} /> +12%
                                </span>
                            </div>

                            <div className="flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)] group-hover:scale-110 transition-transform">
                                        <MousePointerClick size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-600 dark:text-slate-500 font-bold uppercase tracking-widest mb-1">Click Delta</p>
                                        <p className="text-2xl font-black text-slate-900 dark:text-white italic tracking-tighter">{clicks.toLocaleString()}</p>
                                    </div>
                                </div>
                                <span className="text-emerald-400 text-[10px] font-black uppercase flex items-center gap-1">
                                    <TrendingUp size={12} /> +5%
                                </span>
                            </div>

                            <div className="grid grid-cols-3 gap-3 pt-8 border-t border-slate-100 dark:border-slate-800/50">
                                <div className="text-center p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800/50">
                                    <Share2 size={16} className="mx-auto text-slate-500 dark:text-slate-600 mb-2" />
                                    <p className="text-sm font-black text-slate-900 dark:text-white italic">{analytics?.shares || 45}</p>
                                    <p className="text-[8px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-tighter">Shares</p>
                                </div>
                                <div className="text-center p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800/50">
                                    <MessageCircle size={16} className="mx-auto text-slate-500 dark:text-slate-600 mb-2" />
                                    <p className="text-sm font-black text-slate-900 dark:text-white italic">{analytics?.comments || 28}</p>
                                    <p className="text-[8px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-tighter">COMMS</p>
                                </div>
                                <div className="text-center p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800/50">
                                    <Target size={16} className="mx-auto text-slate-500 dark:text-slate-600 mb-2" />
                                    <p className="text-sm font-black text-blue-600 dark:text-accent-500 italic">{engagementRate}</p>
                                    <p className="text-[8px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-tighter">DELTA</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-600/20 to-blue-600/20 border border-indigo-500/30 rounded-2xl p-8 relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <TrendingUp size={80} />
                        </div>
                        <h3 className="text-xs font-black text-white uppercase italic tracking-tighter mb-4 flex items-center gap-2 relative z-10">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                            Tactical Insight
                        </h3>
                        <p className="text-[11px] text-indigo-100/80 leading-relaxed font-bold uppercase tracking-tight relative z-10">
                            This transmission is performing <span className="text-white underline">2.5x better</span> than session average. Sector saturation at 85%. Recommend secondary wave.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PostAnalyticsPage;
