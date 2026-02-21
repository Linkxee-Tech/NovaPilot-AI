import React, { useState } from 'react';
import { X, Shield, Lock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../api/client';
import { normalizeApiErrorMessage } from '../../utils/apiError';

interface PlatformModalProps {
    isOpen: boolean;
    onClose: () => void;
    platformName: string;
    onSuccess: (name: string) => void;
}

const PlatformModal: React.FC<PlatformModalProps> = ({ isOpen, onClose, platformName, onSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !password) {
            toast.error('Please enter both username and password.');
            return;
        }

        setIsLoading(true);
        try {
            await api.post('/platforms/', {
                name: platformName,
                username,
                password
            });
            toast.success(`${platformName} connected securely!`);
            onSuccess(platformName);
            onClose();
        } catch (error) {
            console.error('Connection failure:', error);
            const apiError = error as { response?: { data?: { detail?: unknown; message?: unknown } }; message?: string };
            toast.error(
                normalizeApiErrorMessage(
                    apiError.response?.data?.detail ?? apiError.response?.data?.message ?? apiError.message,
                    `Failed to connect to ${platformName}`
                )
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50 dark:bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                            <Shield className="text-blue-500" size={20} />
                        </div>
                        <div>
                            <h3 className="text-slate-900 dark:text-white font-bold">Connect {platformName}</h3>
                            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Secure Authorization</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors">
                        <X className="text-slate-500 dark:text-slate-400" size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="bg-blue-600/5 border border-blue-500/10 p-4 rounded-2xl flex gap-3">
                        <AlertCircle className="text-blue-600 dark:text-blue-500 shrink-0" size={18} />
                        <p className="text-[11px] text-blue-700 dark:text-blue-400/80 leading-relaxed">
                            Your credentials are encrypted using AES-256 and stored in a secure vault. NovaPilot never stores plaintext passwords.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mb-2 ml-1">Username / Email</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-950 dark:text-white px-4 py-3 rounded-xl outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 text-sm font-medium"
                                placeholder={`Your ${platformName} login`}
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="block text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mb-2 ml-1">Password</label>
                            <div className="relative">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-950 dark:text-white px-4 py-3 rounded-xl outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 text-sm font-medium"
                                    placeholder="••••••••"
                                />
                                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600" size={16} />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                <span>Securing Connection...</span>
                            </div>
                        ) : (
                            <>Authorize {platformName}</>
                        )}
                    </button>

                    <p className="text-center text-slate-500 dark:text-slate-600 text-[10px]">
                        By connecting, you agree to NovaPilot's data security protocols.
                    </p>
                </form>
            </div>
        </div>
    );
};

export default PlatformModal;
