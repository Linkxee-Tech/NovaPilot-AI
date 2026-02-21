import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { useTheme } from '../../context/useTheme';

interface PerformanceData {
    name: string;
    impressions: number;
    clicks: number;
}

interface NovaPerformanceChartProps {
    data: PerformanceData[];
}

const PerformanceChart = ({ data }: NovaPerformanceChartProps) => {
    const { theme } = useTheme();

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 rounded-2xl p-8 h-[400px] relative overflow-hidden shadow-md dark:shadow-2xl group transition-colors">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Signal Propagation</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Tactical Engagement Trending</p>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Impressions</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-500" />
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Clicks</span>
                    </div>
                </div>
            </div>

            <div className="h-full pb-12">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'} vertical={false} opacity={theme === 'dark' ? 0.3 : 0.8} />
                        <XAxis
                            dataKey="name"
                            stroke={theme === 'dark' ? '#475569' : '#94a3b8'}
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            fontFamily="Inter"
                            fontWeight="bold"
                        />
                        <YAxis
                            stroke={theme === 'dark' ? '#475569' : '#94a3b8'}
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            fontFamily="Inter"
                            fontWeight="bold"
                            tickFormatter={(value: number) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toString()}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                                borderColor: theme === 'dark' ? '#1e293b' : '#e2e8f0',
                                borderRadius: '12px',
                                border: '1px solid rgba(0,0,0,0.05)',
                                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
                            }}
                            itemStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                            labelStyle={{ color: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: '10px', fontWeight: 'bold', marginBottom: '4px' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="impressions"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorImpressions)"
                            animationDuration={2000}
                        />
                        <Area
                            type="monotone"
                            dataKey="clicks"
                            stroke="#8b5cf6"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorClicks)"
                            animationDuration={2500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default PerformanceChart;
