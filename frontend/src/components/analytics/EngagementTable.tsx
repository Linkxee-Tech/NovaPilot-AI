import { ArrowUpRight, MoreHorizontal, Download, Orbit, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import client from '../../api/client';

interface PostEngagement {
    id: string;
    content: string;
    platform: string;
    status: string;
    scheduled_at: string;
}

const EngagementTable = () => {
    const navigate = useNavigate();

    const { data: posts = [], isLoading } = useQuery({
        queryKey: ['posts-engagement'],
        queryFn: async () => {
            const response = await client.get('/posts/posts');
            return response.data;
        }
    });

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 rounded-2xl p-20 flex flex-col items-center justify-center gap-4 transition-colors">
                <Loader2 className="animate-spin text-blue-600 dark:text-blue-500" size={32} />
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Scanning Tactical Grid...</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 rounded-2xl overflow-hidden shadow-md dark:shadow-2xl transition-colors">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between bg-white dark:bg-slate-900/50 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <Orbit className="text-blue-600 dark:text-blue-500" size={20} />
                    <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">High-Impact Operations</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Top performing content by engagement delta</p>
                    </div>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest border border-slate-200 dark:border-slate-700/50 rounded-xl transition-all active:scale-95">
                    <Download size={14} />
                    Export CSV
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                    <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase font-black text-[10px] tracking-[0.1em]">
                        <tr>
                            <th className="px-8 py-5">Post Title</th>
                            <th className="px-8 py-5">Platform</th>
                            <th className="px-8 py-5">Status</th>
                            <th className="px-8 py-5">Execution Date</th>
                            <th className="px-8 py-5 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        {posts.map((post: PostEngagement) => (
                            <tr
                                key={post.id}
                                onClick={() => navigate(`/analytics/${post.id}`)}
                                className="hover:bg-blue-500/5 transition-all group cursor-pointer border-transparent hover:border-blue-500/20"
                            >
                                <td className="px-8 py-6">
                                    <div className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate max-w-[300px] italic uppercase tracking-tight">
                                        {post.content.substring(0, 40)}...
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-xs font-black uppercase tracking-widest text-slate-500">{post.platform}</td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest">
                                            {post.status}
                                        </span>
                                        <ArrowUpRight size={14} className="text-emerald-500 animate-pulse" />
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-[10px] font-black uppercase text-slate-500">{new Date(post.scheduled_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                <td className="px-8 py-6 text-right">
                                    <button className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                                        <MoreHorizontal size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="p-4 bg-slate-50/50 dark:bg-slate-950/30 flex justify-center border-t border-slate-100 dark:border-slate-800/50">
                <button className="text-[10px] font-black text-slate-500 hover:text-blue-600 dark:hover:text-blue-500 uppercase tracking-[0.2em] transition-all italic">Load More Mission Data</button>
            </div>
        </div>
    );
};

export default EngagementTable;
