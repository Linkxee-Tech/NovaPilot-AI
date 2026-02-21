import { Share, FileText, CheckCircle2, AlertTriangle, Clock, Terminal } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useSocket } from '../../hooks/useSocket';
import { useMemo } from 'react';

type Activity = {
    id: number;
    type: 'success' | 'warning' | 'in-progress' | 'error';
    action: string;
    target: string;
    time: string;
    traceId: string;
};

const getIcon = (type: string) => {
    switch (type) {
        case 'success': return <CheckCircle2 size={16} className="text-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />;
        case 'warning': return <AlertTriangle size={16} className="text-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.3)]" />;
        case 'error': return <AlertTriangle size={16} className="text-red-500 shadow-[0_0_8px_rgba(239,68,68,0.3)]" />;
        case 'in-progress': return <Clock size={16} className="text-blue-500 animate-spin-slow" />;
        default: return <FileText size={16} className="text-slate-500" />;
    }
};

const ActivityFeed = () => {
    const { activities: socketActivities } = useSocket();
    const activities = useMemo<Activity[]>(() => {
        const base: Activity = {
            id: 1,
            type: 'success',
            action: 'Connected',
            target: 'Automation Service',
            time: 'Now',
            traceId: 'sys-001',
        };

        const mapped: Activity[] = socketActivities.map((payload): Activity => {
            let mappedType: Activity['type'] = 'success';
            if (payload.status === 'ERROR') mappedType = 'error';
            if (payload.status === 'WARNING') mappedType = 'warning';

            return {
                id: payload.id,
                type: mappedType,
                action: payload.action,
                target: 'Automation Engine',
                time: new Date(payload.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                traceId: payload.trace_id || 'manual-ext',
            };
        });

        return [base, ...mapped].slice(0, 10);
    }, [socketActivities]);

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 rounded-2xl p-6 h-full shadow-md dark:shadow-2xl relative overflow-hidden transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] dark:opacity-5 text-slate-900 dark:text-white">
                <Terminal size={120} />
            </div>

            <div className="flex items-center justify-between mb-8 relative z-10">
                <div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Live Activity</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Recent Automation Events</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            </div>

            <div className="relative space-y-0 relative z-10">
                {/* Vertical Line */}
                <div className="absolute left-6 top-2 bottom-2 w-px bg-gradient-to-b from-blue-500/50 via-slate-200 dark:via-slate-800 to-slate-100 dark:to-slate-900" />

                <div className="space-y-4">
                    {activities.map((activity) => (
                        <div key={activity.id} className="relative pl-12 group animate-in slide-in-from-right-4 fade-in duration-500">
                            <div className={cn(
                                "absolute left-4 top-4 w-4 h-4 rounded-full border bg-white dark:bg-slate-950 flex items-center justify-center z-10 transition-all group-hover:scale-110 shadow-sm dark:shadow-none",
                                activity.type === 'success' ? "border-emerald-500/50" :
                                    activity.type === 'warning' ? "border-orange-500/50" :
                                        activity.type === 'error' ? "border-red-500/50" : "border-blue-500/50"
                            )}>
                                <div className={cn("w-1.5 h-1.5 rounded-full",
                                    activity.type === 'success' ? "bg-emerald-500" :
                                        activity.type === 'warning' ? "bg-orange-500" :
                                            activity.type === 'error' ? "bg-red-500" : "bg-blue-500"
                                )} />
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-800/50 rounded-xl p-4 hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-all hover:border-blue-500/30 group-hover:translate-x-1">
                                <div className="flex items-center justify-between gap-4">
                                    <span className="text-xs font-black text-slate-900 dark:text-slate-200 flex items-center gap-2 uppercase tracking-tight">
                                        {getIcon(activity.type)}
                                        {activity.action}
                                    </span>
                                    <span className="text-[10px] text-slate-600 font-bold font-mono">{activity.time}</span>
                                </div>
                                <div className="mt-3 flex items-center justify-between">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest pl-6">{activity.target}</p>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[9px] bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded text-slate-500 font-mono tracking-tighter shadow-inner group-hover:text-blue-600 dark:group-hover:text-blue-400">Trace: {activity.traceId}</span>
                                        <Share size={12} className="text-slate-700 hover:text-white cursor-pointer transition-colors" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <button className="w-full mt-8 py-3 bg-slate-100 dark:bg-slate-800/30 hover:bg-slate-200 dark:hover:bg-slate-800/50 border border-slate-200 dark:border-slate-800/50 rounded-xl text-[10px] font-black text-slate-600 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white uppercase tracking-[0.2em] transition-all relative z-10 active:scale-95">
                View Full Log
            </button>
        </div>
    );
};

export default ActivityFeed;
