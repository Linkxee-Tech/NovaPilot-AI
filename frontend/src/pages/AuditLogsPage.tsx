import { Search, Filter, ShieldCheck, FileCheck, AlertTriangle } from 'lucide-react';
import { cn } from '../utils/cn';
import { useQuery } from '@tanstack/react-query';
import client from '../api/client';
import { useState } from 'react';
import EvidenceModal from '../components/dashboard/EvidenceModal';
import Skeleton, { TableSkeleton } from '../components/ui/Skeleton';

interface AuditLog {
    id: string;
    trace_id: string;
    status: 'SUCCESS' | 'WARNING' | 'ERROR';
    action: string;
    platform: string | null;
    user: string | null;
    timestamp: string;
    evidence_hash: string | null;
}

const AuditLogsPage = () => {
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data: logs = [], isLoading } = useQuery({
        queryKey: ['audit-logs'],
        queryFn: async () => {
            const response = await client.get('/audit/');
            return response.data;
        }
    });

    const handleRowClick = (log: AuditLog) => {
        setSelectedLog(log);
        setIsModalOpen(true);
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
                <TableSkeleton />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <ShieldCheck className="text-blue-500" size={14} />
                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Immutable Ledger Active</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">Audit Trail</h1>
                    <p className="text-slate-600 dark:text-slate-500 text-sm font-medium">Verifiable record of all automated tactical operations.</p>
                </div>
                <div className="flex flex-col xs:flex-row items-center gap-3 w-full sm:w-auto">
                    <button className="flex items-center justify-center gap-2 px-6 py-2.5 bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-slate-200 dark:border-slate-700 active:scale-95 w-full xs:w-auto shadow-sm dark:shadow-none">
                        <Filter size={14} />
                        Filter Output
                    </button>
                    <button className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95 w-full xs:w-auto">
                        <ShieldCheck size={14} />
                        Verify Hash Integrity
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 rounded-2xl overflow-hidden shadow-md dark:shadow-2xl transition-colors">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex gap-4 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                        <input
                            type="text"
                            placeholder="Trace ID, Operation Type, or Node..."
                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/50 rounded-xl pl-12 pr-4 py-3 text-sm text-slate-900 dark:text-slate-200 focus:ring-1 focus:ring-blue-500/50 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-700 transition-all font-medium"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                        <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-500 uppercase font-bold text-[10px] tracking-[0.1em]">
                            <tr>
                                <th className="px-8 py-5">Trace ID</th>
                                <th className="px-8 py-5">Operation</th>
                                <th className="px-8 py-5">Status</th>
                                <th className="px-8 py-5">Platform</th>
                                <th className="px-8 py-5">Operator</th>
                                <th className="px-8 py-5">Timestamp</th>
                                <th className="px-8 py-5 text-right">Integrity Hash</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {logs.map((log: AuditLog) => (
                                <tr
                                    key={log.id}
                                    onClick={() => handleRowClick(log)}
                                    className="hover:bg-blue-500/5 transition-all cursor-pointer group border-transparent hover:border-blue-500/20"
                                >
                                    <td className="px-8 py-5 font-mono text-[10px] text-blue-400/80 font-bold group-hover:text-blue-400 group-hover:translate-x-1 transition-transform">{log.trace_id}</td>
                                    <td className="px-8 py-5 font-black text-slate-900 dark:text-white flex items-center gap-3 uppercase tracking-tighter italic">
                                        {log.status === 'SUCCESS' ? <FileCheck size={14} className="text-emerald-600 dark:text-emerald-500" /> :
                                            log.status === 'WARNING' ? <AlertTriangle size={14} className="text-orange-600 dark:text-orange-500" /> :
                                                <AlertTriangle size={14} className="text-red-600 dark:text-red-500" />}
                                        {log.action.replace('_', ' ')}
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className={cn(
                                            "inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                                            log.status === 'SUCCESS' ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.1)]" :
                                                log.status === 'WARNING' ? "bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-500/20 shadow-[0_0_8px_rgba(249,115,22,0.1)]" :
                                                    "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.1)]"
                                        )}>
                                            {log.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">{log.platform || 'System'}</span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase">
                                                {log.user?.charAt(0) || 'S'}
                                            </div>
                                            <span className="text-xs transition-colors group-hover:text-slate-900 dark:group-hover:text-slate-200">{log.user || 'NovaPilot'}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-[10px] font-bold text-slate-500 group-hover:text-slate-400 transition-colors uppercase">
                                        {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                    </td>
                                    <td className="px-8 py-5 text-right font-mono text-[10px] text-slate-400 dark:text-slate-700 group-hover:text-blue-500/50 transition-colors">
                                        {log.evidence_hash?.substring(0, 8)}...
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <EvidenceModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                log={selectedLog}
            />
        </div>
    );
};

export default AuditLogsPage;
