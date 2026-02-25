import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, BarChart3, Settings, FileText } from 'lucide-react';
import { cn } from '../../utils/cn';

const BottomNav = () => {
    const location = useLocation();

    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/scheduler', label: 'Scheduler', icon: CalendarDays },
        { path: '/drafts', label: 'Drafts', icon: FileText },
        { path: '/analytics', label: 'Analytics', icon: BarChart3 },
        { path: '/settings', label: 'Settings', icon: Settings },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-lg border-t border-slate-800 lg:hidden">
            <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-4">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 min-w-[64px] transition-all",
                                isActive ? "text-blue-500" : "text-slate-400 hover:text-slate-200"
                            )}
                        >
                            <item.icon size={20} className={cn(isActive && "animate-pulse")} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNav;
