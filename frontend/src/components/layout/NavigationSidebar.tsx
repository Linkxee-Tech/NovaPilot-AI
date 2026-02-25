import { Link } from 'react-router-dom';
import {
    LayoutDashboard,
    CalendarDays,
    BarChart3,
    FileText,
    ScrollText,
    Cpu,
    Settings,
    ShieldCheck,
    Database,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../store/useAuth';

interface SidebarProps {
    collapsed: boolean;
    setCollapsed: (collapsed: boolean) => void;
    mobileOpen?: boolean;
    setMobileOpen?: (open: boolean) => void;
}

const Sidebar = ({
    collapsed,
    mobileOpen,
    setMobileOpen
}: SidebarProps) => {
    const { user } = useAuth();

    // Get initials from user name
    const getInitials = () => {
        if (!user?.full_name) return 'NP';
        return user.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: CalendarDays, label: 'Scheduler', path: '/scheduler' },
        { icon: Cpu, label: 'Automation', path: '/automation' },
        { icon: FileText, label: 'Drafts', path: '/drafts' },
        { icon: BarChart3, label: 'Analytics', path: '/analytics' },
        { icon: Database, label: 'Social Accounts', path: '/settings' },
        { icon: ScrollText, label: 'Audit Logs', path: '/audit-logs' },
        { icon: Settings, label: 'Settings', path: '/settings' },
        { icon: ShieldCheck, label: 'Feature Flags', path: '/feature-flags' },
    ];

    return (
        <>
            {/* Mobile Backdrop */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[55] lg:hidden"
                    onClick={() => setMobileOpen?.(false)}
                />
            )}

            <aside
                className={cn(
                    "h-[calc(100vh-64px)] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white flex flex-col fixed left-0 top-16 z-[40] transition-all duration-300 shadow-xl",
                    collapsed ? "w-20" : "w-[280px]",
                    !mobileOpen && "-translate-x-full lg:translate-x-0"
                )}
            >

                <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                    <ul className="space-y-1 px-2">
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <li key={item.path}>
                                    <Link
                                        to={item.path}
                                        onClick={() => setMobileOpen?.(false)}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
                                            isActive
                                                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 active:scale-95"
                                                : "text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800",
                                            collapsed && "justify-center"
                                        )}
                                    >
                                        <item.icon size={20} className={cn(
                                            "shrink-0 transition-colors",
                                            isActive ? "text-white" : "text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white"
                                        )} />
                                        {!collapsed && <span className="truncate">{item.label}</span>}
                                        {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full" />}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                    <Link
                        to="/settings"
                        onClick={() => setMobileOpen?.(false)}
                        className={cn("flex items-center gap-3 w-full p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors", collapsed ? "justify-center" : "justify-start")}
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/20">
                            <span className="text-[10px] font-black text-white">{getInitials()}</span>
                        </div>
                        {!collapsed && (
                            <div className="text-left overflow-hidden">
                                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.full_name || 'User Profile'}</p>
                                <p className="text-[10px] text-slate-500 truncate lowercase">{user?.email || 'pilot@novapilot.ai'}</p>
                            </div>
                        )}
                    </Link>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
