import { Gavel, AlertTriangle, ShieldCheck, Scale, ArrowLeft, Terminal, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/common/Logo';

const TermsPage = () => {
    const navigate = useNavigate();

    const sections = [
        {
            title: "1. Acceptance of Terms",
            content: "By accessing or using NovaPilot AI, you agree to be bound by these Terms of Service. If you do not agree, you must immediately cease all use of the platform and automated services.",
            icon: Scale
        },
        {
            title: "2. Service Autonomy",
            content: "NovaPilot AI provides autonomous agents for social media management. You remain responsible for all content dispatched by your agents. You agree not to use the platform for spam, misinformation, or any activity that violates third-party platform terms.",
            icon: Terminal
        },
        {
            title: "3. Responsible AI Disclosure",
            content: "Our services utilize advanced AI models (Amazon Nova). While we strive for accuracy, AI-generated content may contain errors. You are encouraged to review all autonomous dispatches through the system audit logs.",
            icon: AlertTriangle
        },
        {
            title: "4. Termination of License",
            content: "We reserve the right to suspend or terminate your access to the platform without notice if you violate these terms or engage in activity that threatens the integrity of our network or third-party integrations.",
            icon: ShieldCheck
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
                        <h1 className="text-4xl font-black uppercase italic tracking-tighter">Terms of Service</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium tracking-wide">Last Updated: February 21, 2026</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 md:p-12 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-10">
                    <div className="bg-rose-500/5 border border-rose-500/10 p-4 rounded-2xl flex gap-3">
                        <Gavel className="text-rose-600 dark:text-rose-500 shrink-0" size={20} />
                        <p className="text-xs text-rose-700 dark:text-rose-400 leading-relaxed font-medium">
                            IMPORTANT: By activating NovaPilot AI agents, you enter into a binding agreement and take full responsibility for all autonomous activity initiated through your terminal.
                        </p>
                    </div>

                    <div className="space-y-8">
                        {sections.map((section, i) => (
                            <div key={i} className="group">
                                <div className="flex items-center gap-4 mb-3">
                                    <div className="w-10 h-10 bg-indigo-600/10 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
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
                            The future of social media is autonomous. Use it responsibly.
                        </p>
                    </div>
                </div>

                <footer className="text-center pt-8">
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-600 flex items-center justify-center gap-2">
                        <Globe size={12} />
                        Legal Compliance Protocol v2.6.0
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default TermsPage;
