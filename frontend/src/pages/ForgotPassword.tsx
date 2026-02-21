import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import AuthLayout from '../components/layout/AuthLayout';
import { toast } from 'sonner';
import client from '../api/client';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [resetToken, setResetToken] = useState('');
    const [isRequesting, setRequesting] = useState(false);
    const [isConfirming, setConfirming] = useState(false);

    const handleRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setRequesting(true);
        try {
            const response = await client.post('/auth/password-reset/request', { email });
            toast.success(response.data?.message || 'Reset request sent.');
            if (response.data?.reset_token) {
                setResetToken(response.data.reset_token);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to request password reset.');
        } finally {
            setRequesting(false);
        }
    };

    const handleConfirm = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resetToken || !newPassword) {
            toast.error('Reset token and new password are required.');
            return;
        }
        setConfirming(true);
        try {
            const response = await client.post('/auth/password-reset/confirm', {
                token: resetToken,
                new_password: newPassword,
            });
            toast.success(response.data?.message || 'Password updated.');
        } catch (error) {
            console.error(error);
            toast.error('Failed to update password.');
        } finally {
            setConfirming(false);
        }
    };

    return (
        <AuthLayout
            title="Reset Password"
            description="Enter your email to receive a password reset link."
        >
            <form className="space-y-4" onSubmit={handleRequest}>
                <div>
                    <label className="block text-slate-400 text-sm font-medium mb-1.5 ml-1">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full bg-slate-950/50 border border-slate-800 focus:border-blue-600 text-white pl-10 pr-4 py-2.5 rounded-xl outline-none transition-all placeholder:text-slate-600"
                            placeholder="name@company.com"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isRequesting}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-600/20 transition-all"
                >
                    {isRequesting ? 'Sending...' : 'Send Reset Link'}
                </button>
            </form>

            <form className="space-y-4 mt-6" onSubmit={handleConfirm}>
                <div>
                    <label className="block text-slate-400 text-sm font-medium mb-1.5 ml-1">Reset Token</label>
                    <input
                        type="text"
                        value={resetToken}
                        onChange={(e) => setResetToken(e.target.value)}
                        className="w-full bg-slate-950/50 border border-slate-800 focus:border-blue-600 text-white px-4 py-2.5 rounded-xl outline-none transition-all placeholder:text-slate-600"
                        placeholder="Paste reset token"
                    />
                </div>
                <div>
                    <label className="block text-slate-400 text-sm font-medium mb-1.5 ml-1">New Password</label>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-slate-950/50 border border-slate-800 focus:border-blue-600 text-white px-4 py-2.5 rounded-xl outline-none transition-all placeholder:text-slate-600"
                        placeholder="Enter new password"
                    />
                </div>
                <button
                    type="submit"
                    disabled={isConfirming}
                    className="w-full bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800/50 text-white font-semibold py-3 rounded-xl transition-all"
                >
                    {isConfirming ? 'Updating...' : 'Confirm Password Reset'}
                </button>
            </form>

            <div className="mt-8 text-center text-sm">
                <Link to="/login" className="text-slate-500 hover:text-white transition-colors flex items-center justify-center gap-2">
                    <ArrowLeft size={16} />
                    Back to Login
                </Link>
            </div>
        </AuthLayout>
    );
};

export default ForgotPassword;
