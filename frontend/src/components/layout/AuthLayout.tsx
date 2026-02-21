import type { ReactNode, FC } from 'react';
import Logo from '../common/Logo';

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    description: string;
}

const AuthLayout: FC<AuthLayoutProps> = ({ children, title, description }) => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 md:p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-100/20 dark:from-blue-900/20 via-slate-50 dark:via-slate-950 to-slate-50 dark:to-slate-950 overflow-x-hidden transition-colors">
            <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                {/* Visual Side */}
                <div className="md:flex lg:flex flex-col space-y-8 animate-in fade-in slide-in-from-left duration-700">
                    <div className="flex items-center gap-3">
                        <Logo className="h-12" />
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-4xl xl:text-5xl font-extrabold text-slate-900 dark:text-white leading-tight transition-colors">
                            Command your <span className="text-blue-600 dark:text-blue-500 italic">social</span> presence at scale.
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 text-lg max-w-md transition-colors">
                            The world's first truly autonomous AI agent for social media orchestration. Post, optimize, and grow while you sleep.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl backdrop-blur-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm dark:shadow-none">
                            <div className="text-blue-600 dark:text-blue-400 font-bold text-xl mb-1">98%</div>
                            <div className="text-slate-500 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider">Save Time</div>
                        </div>
                        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl backdrop-blur-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm dark:shadow-none">
                            <div className="text-indigo-600 dark:text-indigo-400 font-bold text-xl mb-1">10x</div>
                            <div className="text-slate-500 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider">Engagement</div>
                        </div>
                    </div>
                </div>

                {/* Form Side */}
                <div className="w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom lg:slide-in-from-right duration-700">
                    <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-6 md:p-8 rounded-3xl backdrop-blur-md shadow-xl dark:shadow-2xl relative overflow-hidden transition-colors">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600"></div>

                        {/* Mobile Logo */}
                        <div className="flex items-center gap-2 mb-8 lg:hidden">
                            <Logo className="h-8" />
                        </div>

                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 transition-colors">{title}</h2>
                            <p className="text-slate-600 dark:text-slate-400 text-sm transition-colors">{description}</p>
                        </div>

                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
