import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn, Github } from 'lucide-react';
import { toast } from 'sonner';
import AuthLayout from '../components/layout/AuthLayout';
import client from '../api/client';
import { useAuth } from '../store/useAuth';
import { normalizeApiErrorMessage } from '../utils/apiError';

import PasswordToggle from '../components/common/PasswordToggle';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isOAuthLoading, setOAuthLoading] = useState(false);
    const navigate = useNavigate();
    const { setAuth, setAuthChecked } = useAuth();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const formData = new URLSearchParams();
            formData.append('username', email); // FastAPI OAuth2 uses 'username'
            formData.append('password', password);

            const response = await client.post('/auth/login', formData, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            const user = response.data?.user ?? (await client.get('/auth/me')).data;
            setAuth(user);
            setAuthChecked(true);

            toast.success('Welcome back, Pilot!');
            navigate('/dashboard');
        } catch (error) {
            // Simplified error logging for production
            const apiError = error as { response?: { data?: { detail?: unknown; message?: unknown } }; message?: string };
            const message = normalizeApiErrorMessage(
                apiError.response?.data?.detail ?? apiError.response?.data?.message ?? apiError.message,
                'Invalid email or password'
            );
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setOAuthLoading(true);
        try {
            const response = await client.get('/auth/google/login');
            if (response.data?.url) {
                window.location.href = response.data.url;
                return;
            }
            toast.error('Google login is not configured.');
        } catch {
            toast.error('Google login is unavailable.');
        } finally {
            setOAuthLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Welcome Back"
            description="Log in to your NovaPilot account."
        >
            <form onSubmit={handleLogin} className="space-y-4">
                <div>
                    <label className="block text-slate-600 dark:text-slate-400 text-sm font-medium mb-1.5 ml-1">Email Address</label>
                    <div className="relative group">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 focus:border-blue-600 text-slate-900 dark:text-white pl-10 pr-4 py-3 rounded-2xl outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 group-hover:border-slate-300 dark:group-hover:border-slate-700"
                            placeholder="name@company.com"
                        />
                    </div>
                </div>

                <PasswordToggle
                    value={password}
                    onChange={setPassword}
                    icon={<Lock size={18} />}
                />

                <div className="flex items-center justify-between text-xs py-1">
                    <label className="flex items-center gap-2 text-slate-500 dark:text-slate-500 cursor-pointer text-[10px] font-medium">
                        <input type="checkbox" className="rounded border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-blue-600 focus:ring-blue-600 w-3 h-3" />
                        <span>Remember me</span>
                    </label>
                    <Link to="/forgot-password" className="text-blue-600 dark:text-blue-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors">Forgot password?</Link>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 group"
                >
                    {isLoading ? 'Logging in...' : (
                        <>
                            Sign In
                            <LogIn size={18} className="group-hover:translate-x-0.5 transition-transform" />
                        </>
                    )}
                </button>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-800"></div>
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                        <span className="bg-white dark:bg-[#0b1120] px-4 text-slate-500 transition-colors">Or continue with</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={isOAuthLoading}
                        className="w-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-medium py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm border border-slate-200 dark:border-slate-700 disabled:opacity-60 shadow-sm dark:shadow-none"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path
                                fill="currentColor"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="currentColor"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        {isOAuthLoading ? 'Redirecting...' : 'Google'}
                    </button>
                    <button
                        type="button"
                        disabled
                        className="w-full bg-slate-50/70 dark:bg-slate-800/70 text-slate-400 font-medium py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm border border-slate-200/50 dark:border-slate-700/50 cursor-not-allowed"
                        title="GitHub login not configured"
                    >
                        <Github size={18} />
                        GitHub (Unavailable)
                    </button>
                </div>
            </form>

            <div className="mt-8 text-center text-sm">
                <p className="text-slate-600 dark:text-slate-500">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-medium transition-colors">Create one free</Link>
                </p>
            </div>
        </AuthLayout>
    );
};

export default Login;
