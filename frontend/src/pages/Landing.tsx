import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Rocket, Zap, Shield, Target, ArrowRight, Star, CheckCircle2, Linkedin, Facebook, Twitter, MessageCircle, Sun, Moon, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../components/common/Logo';
import { useTheme } from '../context/useTheme';

const Landing = () => {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navLinks = [
        { name: 'Features', href: '#features' },
        { name: 'Security', href: '#security' },
        { name: 'Pricing', href: '#landing-cta' }
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0b1120] text-slate-900 dark:text-slate-200 overflow-x-hidden transition-colors">
            {/* Decorative background elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-gradient-to-b from-blue-600/5 dark:from-blue-600/10 to-transparent pointer-events-none" />
            <div className="absolute top-[10%] left-[10%] w-[400px] h-[400px] bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-[30%] right-[10%] w-[300px] h-[300px] bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

            {/* Nav */}
            <nav className="relative z-[100] flex items-center justify-between px-6 py-6 w-full max-w-7xl mx-auto">
                <div className="flex items-center gap-2">
                    <Logo className="h-10" />
                </div>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    {navLinks.map((link) => (
                        <a key={link.name} href={link.href} className="hover:text-blue-600 dark:hover:text-white transition-colors">{link.name}</a>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleTheme}
                        className="p-2.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white transition-all shadow-sm active:scale-95 group"
                        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        {theme === 'dark' ? (
                            <Sun size={18} className="group-hover:rotate-45 transition-transform" />
                        ) : (
                            <Moon size={18} className="group-hover:-rotate-12 transition-transform" />
                        )}
                    </button>

                    <div className="hidden sm:flex items-center gap-4">
                        <Link to="/login" className="text-sm font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white transition-colors">Login</Link>
                        <Link
                            to="/register"
                            className="bg-blue-600 text-white px-5 py-2.5 rounded-full text-sm font-bold uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/20 active:scale-95"
                        >
                            Get Started
                        </Link>
                    </div>

                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden p-2.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 transition-all active:scale-95"
                    >
                        {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                {/* Mobile Menu Overlay */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, x: '100%' }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed inset-0 z-[90] bg-white dark:bg-[#0b1120] p-6 pt-32 flex flex-col gap-8 md:hidden overflow-y-auto"
                        >
                            <div className="flex flex-col gap-6">
                                {navLinks.map((link) => (
                                    <a
                                        key={link.name}
                                        href={link.href}
                                        onClick={() => setIsMenuOpen(false)}
                                        className="text-4xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white hover:text-blue-600 transition-colors"
                                    >
                                        {link.name}
                                    </a>
                                ))}
                            </div>

                            <div className="h-px bg-slate-100 dark:bg-slate-800 w-full" />

                            <div className="flex flex-col gap-4">
                                <Link
                                    to="/login"
                                    className="w-full text-center py-4 rounded-2xl text-lg font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800"
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="w-full text-center py-4 rounded-2xl text-lg font-bold uppercase tracking-widest text-white bg-blue-600 shadow-xl shadow-blue-500/20"
                                >
                                    Get Started
                                </Link>
                            </div>

                            <div className="mt-auto pb-12 text-center space-y-4">
                                <Logo className="h-8 mx-auto opacity-50" />
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic">© 2026 NovaPilot AI</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/* Hero */}
            <section className="relative z-10 pt-20 pb-32 px-6 w-full max-w-7xl mx-auto">
                <div className="text-center space-y-8">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 dark:text-white leading-tight tracking-tight uppercase italic"
                    >
                        Automate your <br className="hidden sm:block" />
                        <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">Social Autonomy</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-base md:text-xl text-slate-600 dark:text-slate-400 w-full leading-relaxed px-4 md:px-0 max-w-3xl mx-auto font-medium"
                    >
                        The world's first AI-driven social media operator. NovaPilot doesn't just schedule—it researches, writes, and engages autonomously using advanced Amazon Nova AI.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
                    >
                        <button
                            onClick={() => navigate('/register')}
                            className="w-full sm:w-auto px-10 py-4 bg-blue-600 text-white rounded-full font-black text-lg uppercase tracking-widest hover:bg-blue-500 transition-all shadow-2xl shadow-blue-600/30 active:scale-95 flex items-center justify-center gap-3"
                        >
                            Get Started
                            <ArrowRight size={20} />
                        </button>
                    </motion.div>
                </div>

                {/* Dashboard Preview */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 40 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="mt-24 relative max-w-5xl mx-auto"
                >
                    <div className="absolute inset-0 bg-blue-600/10 dark:bg-blue-600/20 rounded-3xl blur-[100px] transform rotate-1 scale-95 pointer-events-none" />
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative transition-colors">
                        <div className="h-10 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex items-center px-4 gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-400 dark:bg-red-500/50" />
                            <div className="w-3 h-3 rounded-full bg-orange-400 dark:bg-orange-500/50" />
                            <div className="w-3 h-3 rounded-full bg-green-400 dark:bg-green-500/50" />
                        </div>
                        <div className="aspect-video bg-slate-50 dark:bg-slate-950 flex items-center justify-center transition-colors">
                            <div className="text-center space-y-4">
                                <Rocket className="text-blue-600 dark:text-blue-500 mx-auto animate-bounce" size={48} />
                                <p className="text-slate-600 dark:text-slate-500 font-black uppercase text-[10px] tracking-widest leading-relaxed">
                                    [ Interactive Overview ] <br />
                                    Real-time engine active
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Features */}
            <section id="features" className="py-32 px-6 w-full max-w-7xl mx-auto">
                <div className="text-center mb-20 space-y-4">
                    <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Engineered for Autonomy</h2>
                    <p className="text-slate-600 dark:text-slate-400 font-medium text-lg">Everything you need to scale your presence with zero effort.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        {
                            title: "AI Research Engine",
                            desc: "NovaPro agents scan news and trends to find relevant topics for your niche daily.",
                            icon: Target,
                            color: "text-blue-600 dark:text-blue-400",
                            bg: "bg-blue-500/10"
                        },
                        {
                            title: "Autonomous Scheduling",
                            desc: "Dynamic scheduling based on audience activity data to maximize reach.",
                            icon: Zap,
                            color: "text-amber-600 dark:text-amber-400",
                            bg: "bg-amber-500/10"
                        },
                        {
                            title: "Immutable Auditing",
                            desc: "Every action is logged with evidence and screenshots for 100% transparency.",
                            icon: Shield,
                            color: "text-emerald-600 dark:text-emerald-400",
                            bg: "bg-emerald-500/10"
                        }
                    ].map((feat, i) => (
                        <div key={i} className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl hover:border-blue-500/30 transition-all group shadow-sm dark:shadow-none">
                            <div className={`w-14 h-14 ${feat.bg} ${feat.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                <feat.icon size={28} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3 uppercase italic tracking-tight">{feat.title}</h3>
                            <p className="text-slate-600 dark:text-slate-500 leading-relaxed text-sm font-medium">{feat.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Social Proof / Security */}
            <section id="security" className="py-20 border-y border-slate-200 dark:border-slate-900 bg-white/50 dark:bg-slate-950/50 transition-colors">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="space-y-4 max-w-xl text-center md:text-left">
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Trust is our primary protocol.</h2>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                            We use enterprise-grade encryption and isolated browser environments to ensure your social accounts are safe. No shared sessions, no bot fingerprints.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                        {['Soc2 Type II', 'GDPR Ready', 'AES-256', '2FA Support'].map((label) => (
                            <div key={label} className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 shadow-sm dark:shadow-none transition-colors">
                                <CheckCircle2 size={16} className="text-blue-600 dark:text-blue-500" />
                                {label}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section id="landing-cta" className="py-32 px-6 w-full text-center max-w-7xl mx-auto">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-12 md:p-20 rounded-[40px] shadow-2xl shadow-blue-600/20 space-y-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -mr-32 -mt-32" />
                    <h2 className="text-4xl md:text-6xl font-black text-white leading-tight uppercase italic tracking-tighter">Ready to pilot <br /> the future?</h2>
                    <p className="text-blue-100 text-lg max-w-md mx-auto font-medium leading-relaxed">Join the next generation of autonomous content distribution. Start your 14-day free trial today.</p>
                    <button
                        onClick={() => navigate('/register')}
                        className="px-10 py-5 bg-white text-blue-600 rounded-full font-black text-xl uppercase tracking-widest hover:bg-slate-50 transition-all shadow-xl shadow-white/10 active:scale-95"
                    >
                        Get Started
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-slate-200 dark:border-slate-900 px-6 max-w-7xl mx-auto">
                <div className="w-full flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex flex-col items-center md:items-start gap-4">
                        <div className="flex items-center gap-6 text-slate-400 dark:text-slate-500">
                            <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"><MessageCircle size={20} /></a>
                            <a href="#" className="hover:text-blue-700 dark:hover:text-blue-600 transition-colors"><Facebook size={20} /></a>
                            <a href="#" className="hover:text-blue-800 dark:hover:text-blue-500 transition-colors"><Linkedin size={20} /></a>
                            <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors"><Twitter size={20} /></a>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-600 uppercase tracking-[0.2em] font-black flex items-center gap-2">
                            <Star size={10} className="fill-slate-500 dark:fill-slate-600" />
                            Powered by Amazon Nova Models
                        </p>
                    </div>

                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-600 italic">© 2026 NovaPilot AI. Built for the autonomous age.</p>

                    <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        <Link to="/privacy" className="hover:text-blue-600 dark:hover:text-white transition-colors">Privacy</Link>
                        <Link to="/terms" className="hover:text-blue-600 dark:hover:text-white transition-colors">Terms</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
