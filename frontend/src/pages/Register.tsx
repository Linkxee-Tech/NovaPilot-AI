import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import AuthLayout from '../components/layout/AuthLayout';
import client from '../api/client';
import { useAuth } from '../store/useAuth';
import { normalizeApiErrorMessage } from '../utils/apiError';

import PasswordToggle from '../components/common/PasswordToggle';

const Register = () => {
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { setAuth, setAuthChecked } = useAuth();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        if (!acceptedTerms) {
            toast.error("Please accept our Terms and Privacy Policy to continue.");
            return;
        }

        setIsLoading(true);

        try {
            await client.post('/auth/register', {
                email,
                password,
                full_name: fullName,
                is_active: true,
                is_superuser: false,
                is_verified: false,
            });

            // Automatically log in after registration
            const formData = new URLSearchParams();
            formData.append('username', email);
            formData.append('password', password);

            const loginRes = await client.post('/auth/login', formData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            const user = loginRes.data?.user ?? (await client.get('/auth/me')).data;
            setAuth(user);
            setAuthChecked(true);

            toast.success('Account created! Welcome to NovaPilot.');
            navigate('/onboarding');
        } catch (error) {
            const apiError = error as { response?: { data?: { detail?: unknown; message?: unknown } }; message?: string };
            const message = normalizeApiErrorMessage(
                apiError.response?.data?.detail ?? apiError.response?.data?.message ?? apiError.message,
                'Registration failed. Please try again.'
            );
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Create Account"
            description="Join the next generation of social automation."
        >
            <form onSubmit={handleRegister} className="space-y-4">
                <div>
                    <label className="block text-slate-600 dark:text-slate-400 text-sm font-medium mb-1.5 ml-1">Full Name</label>
                    <div className="relative group">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                            className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 focus:border-blue-600 text-slate-900 dark:text-white pl-10 pr-4 py-3 rounded-2xl outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 group-hover:border-slate-300 dark:group-hover:border-slate-700"
                            placeholder="John Doe"
                        />
                    </div>
                </div>

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
                    id="password"
                    label="Password"
                />

                <PasswordToggle
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    icon={<Lock size={18} />}
                    id="confirmPassword"
                    label="Confirm Password"
                    placeholder="••••••••"
                />

                <div className="flex items-start gap-3 px-4">
                    <div className="relative flex items-center h-5">
                        <input
                            id="terms"
                            type="checkbox"
                            checked={acceptedTerms}
                            onChange={(e) => setAcceptedTerms(e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-slate-300 dark:border-slate-800 rounded focus:ring-blue-500 bg-white dark:bg-slate-950/50 accent-blue-600 transition-all cursor-pointer"
                        />
                    </div>
                    <label htmlFor="terms" className="text-[10px] text-slate-500 leading-relaxed cursor-pointer select-none">
                        By creating an account, you agree to our <Link to="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">Privacy Policy</Link>.
                    </label>
                </div>

                <button
                    type="submit"
                    disabled={isLoading || !acceptedTerms}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 group"
                >
                    {isLoading ? 'Creating account...' : (
                        <>
                            Get Started
                            <UserPlus size={18} className="group-hover:translate-x-0.5 transition-transform" />
                        </>
                    )}
                </button>
            </form>

            <div className="mt-8 text-center text-sm">
                <p className="text-slate-600 dark:text-slate-500">
                    Already have an account?{' '}
                    <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-medium transition-colors">Log In</Link>
                </p>
            </div>
        </AuthLayout>
    );
};

export default Register;
