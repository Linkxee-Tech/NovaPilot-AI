import { Shield, Lock, FileText, ArrowLeft, Globe, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/common/Logo';

const PrivacyPage = () => {
    const navigate = useNavigate();

    const sections = [
        {
            title: "1. Information We Collect",
            content: "We collect information you provide directly to us when you create an account, connect social media platforms, or interact with our AI agents. This includes your name, email address, encrypted credentials for third-party platforms, and any content generated through the Service.",
            icon: FileText
        },
        {
            title: "2. How We Use Information",
            content: "Your data is used solely to provide and improve NovaPilot AI services, including autonomous social media management, content generation, and system auditing. We do not sell your personal data to third parties.",
            icon: Shield
        },
        {
            title: "3. Data Security",
            content: "We implement enterprise-grade security protocols, including AES-256 encryption and isolated browser environments. Your credentials are never stored in plaintext and are protected by multi-layer hardware security modules.",
            icon: Lock
        },
        {
            title: "4. Your Rights",
            content: "You have the right to access, correct, or delete your personal data at any time through your account settings. You may also request a full export of your data and audit logs.",
            icon: Eye
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 py-20 px-6 transition-colors">
            <div className="max-w-3xl mx-auto space-y-12">
                <div className="flex flex-col items-center justify-center text-center space-y-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors bg-white dark:bg-slate-900 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm"
                    >
                        <ArrowLeft size={16} />
                        <span className="text-sm font-bold uppercase tracking-widest">Back</span>
                    </button>
                    <Logo className="h-12" />
                    <div className="space-y-2">
                        <h1 className="text-4xl font-black uppercase italic tracking-tighter">Privacy Policy</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium tracking-wide">Last Updated: February 21, 2026</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 md:p-12 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-10">
                    <p className="text-lg leading-relaxed text-slate-600 dark:text-slate-400">
                        At NovaPilot AI, privacy is not just a policy—it's a core protocol. We are committed to protecting your personal information and your right to privacy. This policy explains our data handling practices.
                    </p>

                    <div className="space-y-8">
                        {sections.map((section, i) => (
                            <div key={i} className="group">
                                <div className="flex items-center gap-4 mb-3">
                                    <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                        <section.icon size={20} />
                                    </div>
                                    <h3 className="text-xl font-bold uppercase italic tracking-tight">{section.title}</h3>
                                </div>
                                <p className="text-slate-600 dark:text-slate-500 leading-relaxed pl-14">
                                    {section.content}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
                        <p className="text-sm text-slate-500 dark:text-slate-600 italic">
                            By continuing to use NovaPilot AI, you acknowledge and agree to this Privacy Policy.
                        </p>
                    </div>
                </div>

                <footer className="text-center pt-8">
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-600 flex items-center justify-center gap-2">
                        <Globe size={12} />
                        Global Compliance Framework Active
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default PrivacyPage;
