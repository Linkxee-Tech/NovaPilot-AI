import { Activity, Radio } from 'lucide-react';
import { useSocket } from '../../hooks/useSocket';

const StatusWidget = () => {
    const { isConnected } = useSocket();

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 relative overflow-hidden transition-colors duration-300 shadow-sm dark:shadow-none">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full animate-ping ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <span className={`relative w-2.5 h-2.5 rounded-full block border border-white dark:border-slate-900 ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-200 uppercase tracking-tighter italic text-sm">System Status</h3>
                </div>
                <div className={`px-2 py-1 border rounded-md text-[10px] font-bold uppercase tracking-widest ${isConnected ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'}`}>
                    {isConnected ? 'Operational' : 'Disconnected'}
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-transparent rounded-lg">
                    <div className="flex items-center gap-3">
                        <Radio size={18} className="text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Automation Controller</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono font-bold">v2.4.1</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-transparent rounded-lg">
                    <div className="flex items-center gap-3">
                        <Activity size={18} className="text-indigo-600 dark:text-purple-400" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Execution Engine</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-yellow-500'}`} />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{isConnected ? 'Active' : 'Connecting...'}</span>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Latency</p>
                            <p className={`text-xs font-black mt-1 italic ${isConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                                {isConnected ? '45ms' : '-'}
                            </p>
                        </div>
                        <div>
                            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Uptime</p>
                            <p className="text-xs font-black text-blue-600 dark:text-blue-400 mt-1 italic">99.9%</p>
                        </div>
                        <div>
                            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Error Rate</p>
                            <p className="text-xs font-black text-slate-900 dark:text-slate-200 mt-1 italic">0.0%</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatusWidget;
