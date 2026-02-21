import { useState } from 'react';
import { User, Lock, Bell, Globe, Database, Plus, CheckCircle2, Shield, Monitor, LogOut } from 'lucide-react';
import { cn } from '../utils/cn';
import { useTheme } from '../context/useTheme';
import { toast } from 'sonner';
import client from '../api/client';

const Switch = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
    <button
        onClick={onChange}
        className={cn(
            "relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out outline-none",
            enabled ? "bg-blue-600 shadow-lg shadow-blue-600/20" : "bg-slate-200 dark:bg-slate-800"
        )}
    >
        <span
            className={cn(
                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-300 ease-in-out",
                enabled ? "translate-x-6" : "translate-x-0"
            )}
        />
    </button>
);

const SettingsPage = () => {
    const { theme, toggleTheme } = useTheme();
    const [activeTab, setActiveTab] = useState(0);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [emailNotifications, setEmailNotifications] = useState(true);

    const tabs = [
        { label: 'General', icon: Globe },
        { label: 'Social Accounts', icon: Database },
        { label: 'Security', icon: Lock },
        { label: 'Notifications', icon: Bell },
        { label: 'Profile', icon: User }
    ];

    return (
        <div className="w-full space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Settings</h1>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Manage your profile, security, and integration preferences.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="space-y-1">
                    {tabs.map((item, i) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.label}
                                onClick={() => setActiveTab(i)}
                                className={cn(
                                    "w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-3 border shadow-sm",
                                    activeTab === i
                                        ? 'bg-blue-600 text-white border-blue-500 shadow-blue-500/10'
                                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                                )}
                            >
                                <Icon size={20} className={activeTab === i ? 'text-white' : 'text-slate-400'} />
                                {item.label}
                            </button>
                        );
                    })}
                </div>
                <div className="md:col-span-3 space-y-6">
                    {activeTab === 0 && ( // General Settings
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6">
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-4">General Preferences</h2>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-medium text-slate-900 dark:text-slate-200">Email Notifications</h3>
                                        <p className="text-xs text-slate-600 dark:text-slate-500">Receive daily summaries of automation activity.</p>
                                    </div>
                                    <Switch enabled={emailNotifications} onChange={() => setEmailNotifications(!emailNotifications)} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-medium text-slate-900 dark:text-slate-200">Dark Mode</h3>
                                        <p className="text-xs text-slate-600 dark:text-slate-500">Always use dark theme for the interface.</p>
                                    </div>
                                    <Switch enabled={theme === 'dark'} onChange={toggleTheme} />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 1 && ( // Social Accounts
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6">
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-800 pb-4">Social Account Management</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[
                                        { name: 'LinkedIn', connected: true, user: 'Nova Pilot AI', icon: 'LI' },
                                        { name: 'Twitter / X', connected: false, icon: 'X' },
                                    ].map((acc) => (
                                        <div key={acc.name} className="p-4 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between group hover:border-blue-500/30 transition-colors shadow-sm dark:shadow-none">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700">
                                                    {acc.icon}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900 dark:text-white">{acc.name}</p>
                                                    <p className="text-xs text-slate-500">{acc.connected ? acc.user : 'Not connected'}</p>
                                                </div>
                                            </div>
                                            {acc.connected ? (
                                                <div className="flex items-center gap-2 text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded text-[10px] font-bold uppercase">
                                                    <CheckCircle2 size={12} />
                                                    Active
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        const username = prompt("Enter LinkedIn Username:");
                                                        if (!username) return;
                                                        const password = prompt("Enter LinkedIn Password:");
                                                        if (!password) return;
                                                        client.post('/platforms/', {
                                                            name: acc.name.toLowerCase().includes('linkedin') ? 'linkedin' : 'twitter',
                                                            username,
                                                            password
                                                        })
                                                            .then(() => toast.success('Account connected!'))
                                                            .catch(() => toast.error('Failed to connect account.'));
                                                    }}
                                                    className="text-[10px] font-bold uppercase text-blue-400 hover:underline"
                                                >
                                                    Connect
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button className="p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center gap-2 text-slate-400 hover:text-blue-500 dark:hover:text-slate-400 hover:border-blue-500/50 dark:hover:border-slate-700 transition-all group">
                                        <Plus size={18} className="group-hover:scale-110 transition-transform" />
                                        <span className="text-sm font-medium">Add New Platform</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 2 && ( // Security
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6">
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-4">Security Settings</h2>

                                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-600/10 dark:bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400">
                                            <Shield size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">Two-Factor Authentication</p>
                                            <p className="text-xs text-slate-500">Protect your account with an extra security layer.</p>
                                        </div>
                                    </div>
                                    <button className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all">Enable</button>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-slate-900 dark:text-slate-300 mb-4 flex items-center gap-2">
                                        <Monitor size={16} />
                                        Active Sessions
                                    </h3>
                                    <div className="space-y-2">
                                        {[
                                            { device: 'Windows PC • Chrome', location: 'London, UK', current: true },
                                            { device: 'iPhone 15 • Safari', location: 'London, UK', current: false },
                                        ].map((session, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/50 rounded-lg text-xs">
                                                <div>
                                                    <p className="font-medium text-slate-900 dark:text-slate-200">{session.device} {session.current && <span className="text-emerald-600 dark:text-emerald-400 ml-1">(Current)</span>}</p>
                                                    <p className="text-slate-600 dark:text-slate-500">{session.location}</p>
                                                </div>
                                                {!session.current && <button className="text-red-600 dark:text-red-400 hover:underline">Revoke</button>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 3 && ( // Notifications
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6">
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-4">Notification Preferences</h2>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Configure your system-wide notification rules.</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 4 && ( // Profile
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6">
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-4">Profile Information</h2>

                                <div className="flex items-center gap-6 p-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl">
                                    <div className="relative group">
                                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-blue-500/20 overflow-hidden">
                                            {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover transition-transform group-hover:scale-110" /> : "HP"}
                                        </div>
                                        <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                                            <Plus size={24} className="text-white" />
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const url = URL.createObjectURL(file);
                                                    setAvatarUrl(url);
                                                }
                                            }} />
                                        </label>
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">Pilot Avatar</h3>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">JPG, GIF or PNG. 1MB max. This handles your visual identity across the network.</p>
                                        <div className="flex gap-3 mt-2">
                                            <button className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors">Upload New</button>
                                            <button className="text-[10px] font-black uppercase text-rose-500 hover:text-rose-400 transition-colors">Remove</button>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 ml-1">First Name</label>
                                        <input type="text" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-200 outline-none focus:border-blue-500 transition-all font-medium text-sm" defaultValue="Human" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 ml-1">Last Name</label>
                                        <input type="text" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-200 outline-none focus:border-blue-500 transition-all font-medium text-sm" defaultValue="Pilot" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 ml-1">Email Terminal</label>
                                        <input type="email" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-200 outline-none focus:border-blue-500 transition-all font-medium text-sm" defaultValue="user@example.com" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 ml-1">Role / Designation</label>
                                        <input type="text" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-200 outline-none focus:border-blue-500 transition-all font-medium text-sm" defaultValue="Head of Operations" />
                                    </div>
                                    <div className="space-y-2 sm:col-span-2">
                                        <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 ml-1">Workspace Identity</label>
                                        <input type="text" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-200 outline-none focus:border-blue-500 transition-all font-medium text-sm" defaultValue="NovaPilot Mainframe" />
                                    </div>
                                    <div className="space-y-2 sm:col-span-2">
                                        <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 ml-1">Professional Bio</label>
                                        <textarea className="w-full h-32 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-200 outline-none focus:border-blue-500 transition-all font-medium text-sm resize-none leading-relaxed" placeholder="Tell the network about your mission..." defaultValue="Orchestrating digital expansion via autonomous AI agents and strategic high-frequency content dispatch." />
                                    </div>
                                </div>
                                <div className="pt-4 flex justify-end">
                                    <button className="px-10 py-3.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-blue-600/20 active:scale-95 border border-blue-500">
                                        Save Project Changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="pt-6">
                        <button className="flex items-center gap-2 text-rose-600 dark:text-rose-500 text-xs font-black uppercase tracking-widest hover:bg-rose-500/10 px-6 py-3 rounded-xl transition-all border border-rose-500/20 hover:border-rose-500/40 shadow-sm">
                            <LogOut size={16} />
                            Terminate Account Identity
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
