import type { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

interface KPICardProps {
    title: string;
    value: string | number;
    trend?: string;
    trendUp?: boolean;
    icon: LucideIcon;
    color?: 'blue' | 'purple' | 'green' | 'orange';
}

const KPICard = ({ title, value, trend, trendUp, icon: Icon, color = 'blue' }: KPICardProps) => {
    const colorMap = {
        blue: 'from-blue-500/20 to-indigo-500/20 text-blue-500 border-blue-500/20',
        purple: 'from-purple-500/20 to-pink-500/20 text-purple-500 border-purple-500/20',
        green: 'from-emerald-500/20 to-teal-500/20 text-emerald-500 border-emerald-500/20',
        orange: 'from-orange-500/20 to-red-500/20 text-orange-500 border-orange-500/20',
    };

    const bgGradient = colorMap[color];

    return (
        <div className="group relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 transition-all duration-300 hover:border-slate-400 dark:hover:border-slate-700 hover:shadow-lg hover:shadow-blue-500/5 dark:hover:shadow-blue-900/10 transition-colors duration-300">
            <div
                className={cn(
                    'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500',
                    bgGradient.split(' ')[0],
                    bgGradient.split(' ')[1]
                )}
            />

            <div className="relative flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
                    <div className="mt-2 flex items-baseline gap-2">
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</h3>
                        {trend && (
                            <span
                                className={cn(
                                    'text-xs font-medium px-1.5 py-0.5 rounded-full flex items-center gap-1',
                                    trendUp ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'
                                )}
                            >
                                <span aria-hidden="true">{trendUp ? '↑' : '↓'}</span>
                                <span>{trend}</span>
                            </span>
                        )}
                    </div>
                </div>
                <div
                    className={cn(
                        'p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 backdrop-blur-sm border',
                        bgGradient.split(' ')[2].replace('text-', 'border-')
                    )}
                >
                    <Icon size={24} className={cn(bgGradient.split(' ')[2])} />
                </div>
            </div>
        </div>
    );
};

export default KPICard;
