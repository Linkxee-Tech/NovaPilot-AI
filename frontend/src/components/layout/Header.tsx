import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, Sun, Moon, CheckCircle2, AlertTriangle, Info, Clock, ExternalLink, Menu, ChevronDown, User, Settings as SettingsIcon, LogOut } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useTheme } from '../../context/useTheme';
import Logo from '../common/Logo';
import client from '../../api/client';
import { useAuth } from '../../store/useAuth';

interface Notification {
    id: number;
    type: 'success' | 'warning' | 'info';
    title: string;
    message: string;
    time: string;
    read: boolean;
}

interface HeaderProps {
    collapsed: boolean;
    setCollapsed: (collapsed: boolean) => void;
}

const Header = ({ collapsed, setCollapsed }: HeaderProps) => {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const { user, clearAuth } = useAuth();
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    // Get initials from user name
    const getInitials = () => {
        if (!user?.full_name) return 'NP';
        return user.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const [notifications] = useState<Notification[]>([
        { id: 1, type: 'success', title: 'Post Published', message: 'Your LinkedIn post was successfully published.', time: '2 mins ago', read: false },
        { id: 2, type: 'warning', title: 'Rate Limit Warning', message: 'LinkedIn API reaching daily limit (85%).', time: '1 hour ago', read: false },
        { id: 3, type: 'info', title: 'System Update', message: 'Nova AI 2.0 is now active with better optimization.', time: '3 hours ago', read: true },
    ]);

    const handleLogout = async () => {
        try {
            await client.post('/auth/logout');
        } catch {
            // Ignore logout errors and clear local auth state regardless.
        } finally {
            clearAuth();
            navigate('/login');
        }
    };

    return (
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm px-4 md:px-6 flex items-center justify-between sticky top-0 z-50 w-full transition-colors duration-300">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <Menu size={20} />
                    </button>
                    <div
                        onClick={() => navigate("/onboarding")}
                        className="flex items-center gap-2 cursor-pointer group"
                    >
                        <Logo className="h-8" />
                    </div>
                </div>

                <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 mx-2 hidden lg:block" />

                <div className="relative w-full max-w-sm hidden sm:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Omni Search (⌘K)"
                        className="w-64 bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-2 pl-10 pr-4 text-xs font-bold text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-1 focus:ring-blue-500/50 transition-all"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative">
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className={`p-2.5 rounded-xl border transition-all relative ${showNotifications ? 'bg-blue-600/10 border-blue-500/30 text-blue-600' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-blue-500/30 dark:hover:border-slate-700'}`}
                    >
                        <Bell size={18} />
                        <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-blue-600 rounded-full border-2 border-white dark:border-slate-900 shadow-[0_0_8px_rgba(37,99,235,0.5)]" />
                    </button>

                    {showNotifications && (
                        <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
                                <h3 className="font-semibold text-slate-900 dark:text-white">Notifications</h3>
                                <button className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors">Mark all read</button>
                            </div>
                            <div className="max-h-[300px] overflow-y-auto">
                                {notifications.map((n: Notification) => (
                                    <div key={n.id} className={cn("p-4 border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group", !n.read && "bg-blue-500/5")}>
                                        <div className={cn(
                                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                            n.type === 'success' ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                                                n.type === 'warning' ? "bg-orange-500/10 text-orange-600 dark:text-orange-400" : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                        )}>
                                            {n.type === 'success' ? <CheckCircle2 size={14} /> :
                                                n.type === 'warning' ? <AlertTriangle size={14} /> : <Info size={14} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <p className="text-xs font-bold text-slate-900 dark:text-slate-200 leading-tight">{n.title}</p>
                                                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                                    <Clock size={10} /> {n.time}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed line-clamp-2">{n.message}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-3 text-center border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30">
                                <button className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 mx-auto">
                                    View all activity <ExternalLink size={12} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                <button
                    onClick={toggleTheme}
                    className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                    title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 mx-2" />
                <div className="relative">
                    <button
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className={cn(
                            "flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 rounded-lg transition-colors border border-transparent",
                            showProfileMenu && "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                        )}
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-blue-600/20">
                            {getInitials()}
                        </div>
                        <ChevronDown size={14} className={cn("text-slate-400 transition-transform", showProfileMenu && "rotate-180")} />
                    </button>

                    {showProfileMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                            <button
                                onClick={() => { setShowProfileMenu(false); navigate('/settings'); }}
                                className="w-full text-left px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-2"
                            >
                                <User size={14} />
                                Profile
                            </button>
                            <button
                                onClick={() => { setShowProfileMenu(false); navigate('/settings'); }}
                                className="w-full text-left px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-2"
                            >
                                <SettingsIcon size={14} />
                                Settings
                            </button>
                            <div className="h-[1px] bg-slate-100 dark:bg-slate-800 my-1" />
                            <button
                                onClick={handleLogout}
                                className="w-full text-left px-4 py-2 text-sm text-red-500 dark:text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                            >
                                <LogOut size={14} />
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
