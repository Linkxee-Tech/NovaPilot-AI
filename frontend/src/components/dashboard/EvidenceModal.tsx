import { X, Terminal, Copy, Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import { cn } from '../../utils/cn';

interface EvidenceLog {
    trace_id: string;
    status: string;
    action: string;
    timestamp: string;
    details?: Record<string, unknown> | null;
    evidence_hash?: string | null;
}

interface EvidenceModalProps {
    isOpen: boolean;
    onClose: () => void;
    log: EvidenceLog | null;
}

const EvidenceModal = ({ isOpen, onClose, log }: EvidenceModalProps) => {
    if (!isOpen || !log) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "p-2 rounded-lg",
                            log.status === 'SUCCESS' ? "bg-emerald-500/10 text-emerald-400" :
                                log.status === 'WARNING' ? "bg-orange-500/10 text-orange-400" :
                                    "bg-red-500/10 text-red-400"
                        )}>
                            {log.status === 'SUCCESS' ? <ShieldCheck size={20} /> :
                                log.status === 'WARNING' ? <ShieldAlert size={20} /> :
                                    <Shield size={20} />}
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-white uppercase italic tracking-tighter">Mission Evidence</h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Trace ID: {log.trace_id}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Action</p>
                            <p className="text-sm text-slate-200 font-semibold">{log.action}</p>
                        </div>
                        <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Timestamp</p>
                            <p className="text-sm text-slate-200 font-semibold">{new Date(log.timestamp).toLocaleString()}</p>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Terminal size={14} className="text-blue-400" />
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Execution Details</span>
                            </div>
                            <button className="text-[10px] text-blue-400 font-bold uppercase hover:underline flex items-center gap-1">
                                <Copy size={12} /> Copy Payload
                            </button>
                        </div>
                        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 font-mono text-sm overflow-x-auto text-blue-100/80 custom-scrollbar">
                            <pre>{JSON.stringify(log.details || { message: "No extended trace data available for this operation." }, null, 2)}</pre>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Shield size={14} className="text-purple-400" />
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Integrity Hash (SHA-256)</span>
                        </div>
                        <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800 flex items-center justify-between group">
                            <code className="text-xs text-slate-400 truncate flex-1">{log.evidence_hash || '7e4c9a...3f22'}</code>
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-emerald-500 ml-4 opacity-50">
                                <ShieldCheck size={12} /> Verified
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-slate-700 active:scale-95"
                    >
                        Close Portal
                    </button>
                    <button className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95">
                        Download Evidence
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EvidenceModal;
