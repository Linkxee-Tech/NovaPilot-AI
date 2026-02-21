import { ShieldCheck, Zap } from 'lucide-react';
import { cn } from '../utils/cn';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface FeatureFlag {
    id: string;
    name: string;
    description: string;
    status: 'active' | 'beta' | 'inactive';
    type: 'core' | 'experimental' | 'enhancement' | 'debug';
}

const getSafeStorage = (): Storage | null => {
    if (typeof window === 'undefined') return null;
    const storage = window.localStorage;
    if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function') {
        return null;
    }
    return storage;
};

const FeatureFlagsPage = () => {
    const initialFlags: FeatureFlag[] = [
        { id: 'flag-1', name: 'linkedin-v2-selectors', description: 'Enable heuristic selector engine v2 for LinkedIn', status: 'active', type: 'core' },
        { id: 'flag-2', name: 'twitter-beta-access', description: 'Unlock Twitter/X automation module', status: 'beta', type: 'experimental' },
        { id: 'flag-3', name: 'ai-caption-optimizer', description: 'Use Nova Pro for caption generation instead of Nova Lite', status: 'inactive', type: 'enhancement' },
        { id: 'flag-4', name: 'debug-mode-tracing', description: 'Enable verbose tracing for all agent actions', status: 'inactive', type: 'debug' },
    ];

    const [flags, setFlags] = useState(() => {
        const storage = getSafeStorage();
        const saved = storage?.getItem('nova_feature_flags');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch {
                return initialFlags;
            }
        }
        return initialFlags;
    });

    useEffect(() => {
        const storage = getSafeStorage();
        storage?.setItem('nova_feature_flags', JSON.stringify(flags));
    }, [flags]);

    const toggleFlag = (id: string) => {
        setFlags((prevFlags: FeatureFlag[]) => prevFlags.map((flag: FeatureFlag) => {
            if (flag.id === id) {
                const newStatus = flag.status === 'inactive' ? 'active' : 'inactive';
                toast.success(`${flag.name} ${newStatus === 'active' ? 'enabled' : 'disabled'}`);
                return { ...flag, status: newStatus };
            }
            return flag;
        }));
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <ShieldCheck className="text-blue-600 dark:text-blue-500" />
                    Feature Flags
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Control system behavior and roll out features safely.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {flags.map((flag: FeatureFlag) => (
                    <div key={flag.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm dark:shadow-none transition-colors">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-2">
                                <Zap size={16} className={cn(
                                    flag.status === 'active' ? "text-emerald-500" :
                                        flag.status === 'beta' ? "text-purple-500" : "text-slate-500"
                                )} />
                                <h3 className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-200">{flag.name}</h3>
                            </div>
                            <span className={cn(
                                "px-2 py-0.5 rounded text-[10px] uppercase font-bold border",
                                flag.status === 'active' ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" :
                                    flag.status === 'beta' ? "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20" :
                                        "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700"
                            )}>
                                {flag.status}
                            </span>
                        </div>

                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">{flag.description}</p>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                            <span className="text-xs text-slate-500 font-mono uppercase tracking-tighter">{flag.type}</span>
                            <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                                <input
                                    type="checkbox"
                                    name="toggle"
                                    id={flag.id}
                                    className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 right-5"
                                    checked={flag.status !== 'inactive'}
                                    onChange={() => toggleFlag(flag.id)}
                                />
                                <label htmlFor={flag.id} className={cn("toggle-label block overflow-hidden h-5 rounded-full cursor-pointer transition-colors", flag.status !== 'inactive' ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700")}></label>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {/* Warning banner */}
            <div className="bg-orange-500/10 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-500/20 rounded-xl p-4 flex items-start gap-3 transition-colors">
                <ShieldCheck className="text-orange-600 dark:text-orange-500 shrink-0 mt-0.5" />
                <div>
                    <h4 className="text-sm font-bold text-orange-700 dark:text-orange-400 uppercase tracking-tight">Caution: System-wide Impact</h4>
                    <p className="text-[11px] text-orange-800/80 dark:text-orange-300/80 mt-1 font-medium leading-relaxed">Modifying feature flags affects all active agents immediately. Ensure you have coordinated with the dev team before toggling core flags.</p>
                </div>
            </div>
        </div>
    );
};

export default FeatureFlagsPage;
