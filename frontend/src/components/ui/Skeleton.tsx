import type { CSSProperties } from 'react';

const Skeleton = ({ className, style }: { className?: string; style?: CSSProperties }) => {
    return (
        <div
            className={`animate-pulse bg-slate-800/50 rounded-lg ${className}`}
            style={style}
        />
    );
};

export const KPICardSkeleton = () => (
    <div className="bg-slate-900 border border-slate-800/50 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex justify-between items-start">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8 rounded-xl" />
        </div>
        <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-16" />
        </div>
    </div>
);

export const ChartSkeleton = () => (
    <div className="bg-slate-900 border border-slate-800/50 rounded-2xl p-8 h-[400px] shadow-2xl space-y-8">
        <div className="flex justify-between items-start">
            <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-3 w-32" />
            </div>
            <div className="flex gap-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
            </div>
        </div>
        <div className="flex-1 flex items-end justify-between gap-4 h-48">
            {[...Array(12)].map((_, i) => (
                <Skeleton
                    key={i}
                    className="w-full"
                    style={{ height: `${((i * 7) % 60) + 20}%` }}
                />
            ))}
        </div>
    </div>
);

export const TableSkeleton = () => (
    <div className="bg-slate-900 border border-slate-800/50 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-slate-800/50 space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-3 w-64" />
        </div>
        <div className="p-8 space-y-4">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4 items-center">
                    <Skeleton className="h-10 flex-1" />
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-12" />
                </div>
            ))}
        </div>
    </div>
);

export default Skeleton;
