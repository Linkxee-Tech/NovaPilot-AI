import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, Shield, Zap, CheckCircle2, ArrowRight, Globe } from 'lucide-react';
import { toast } from 'sonner';
import PlatformModal from '../components/platforms/PlatformModal';

const Onboarding = () => {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [workspaceName, setWorkspaceName] = useState('New Workspace');
    const [platforms, setPlatforms] = useState<string[]>([]);
    const [activePlatformModal, setActivePlatformModal] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleNext = async () => {
        if (step === 1) {
            setStep(2);
        } else if (step === 2) {
            if (platforms.length === 0) {
                toast.warning('Connect at least one platform to proceed for optimal results.');
            }
            setStep(3);
        } else {
            setIsLoading(true);
            try {
                // Finalize onboarding status
                await new Promise(resolve => setTimeout(resolve, 1000));
                toast.success('System initialized. Welcome to the flight deck.');
                navigate('/dashboard');
            } catch (error) {
                console.error('Onboarding finalize failed:', error);
                navigate('/dashboard');
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handlePlatformSuccess = (name: string) => {
        if (!platforms.includes(name)) {
            setPlatforms([...platforms, name]);
        }
    };

    const togglePlatform = (name: string) => {
        if (platforms.includes(name)) {
            // In onboarding, once connected, we keep it connected or allow disconnection via settings
            toast.info(`${name} is already connected.`);
        } else {
            setActivePlatformModal(name);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors duration-500">
            {/* Progress Bar */}
            <div className="w-full max-w-2xl flex gap-2 mb-12 relative z-10">
                {[1, 2, 3].map((s) => (
                    <div
                        key={s}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${s <= step ? 'bg-blue-600' : 'bg-slate-800'}`}
                    />
                ))}
            </div>

            <div className="w-full max-w-2xl bg-white dark:bg-slate-900/50 backdrop-blur-3xl border border-slate-200 dark:border-white/10 rounded-3xl p-8 md:p-12 relative z-10 shadow-2xl transition-all duration-500">
                {step === 1 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600/10 rounded-2xl mb-6 border border-blue-500/20">
                                <Rocket className="text-blue-500" size={32} />
                            </div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight italic uppercase">Welcome to your flight deck</h1>
                            <p className="text-slate-400 max-w-md mx-auto">Let's configure your workspace for peak performance. First, name your brand or workspace.</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-slate-400 text-sm font-medium mb-2 ml-1">Workspace Name</label>
                                <input
                                    type="text"
                                    value={workspaceName}
                                    onChange={(e) => setWorkspaceName(e.target.value)}
                                    className="w-full bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 focus:border-blue-600 text-slate-900 dark:text-white px-5 py-4 rounded-2xl outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                    placeholder="e.g. Acme Marketing"
                                />
                                {workspaceName && <div className="hidden" />}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-100 dark:bg-slate-950/50 border border-blue-600/50 dark:border-blue-600/50 p-4 rounded-2xl cursor-pointer hover:border-blue-600 transition-all group">
                                    <Globe className="text-blue-500 mb-2" size={20} />
                                    <h3 className="text-slate-900 dark:text-white font-medium text-sm">Personal Brand</h3>
                                    <p className="text-slate-500 text-[10px] mt-1 uppercase tracking-widest font-bold">Optimized for individual growth</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl cursor-pointer hover:border-blue-600 transition-all group">
                                    <Shield className="text-slate-500 group-hover:text-blue-500 mb-2" size={20} />
                                    <h3 className="text-slate-900 dark:text-white font-medium text-sm">Enterprise</h3>
                                    <p className="text-slate-500 text-[10px] mt-1 uppercase tracking-widest font-bold">Scale across multiple brands</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600/10 rounded-2xl mb-6 border border-indigo-500/20">
                                <Zap className="text-indigo-500" size={32} />
                            </div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight italic uppercase">Connect Platforms</h1>
                            <p className="text-slate-400 max-w-md mx-auto">NovaPilot works best when connected to your social profiles for AI-driven post scheduling.</p>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => togglePlatform('LinkedIn')}
                                className={`w-full flex items-center justify-between p-5 bg-slate-950/50 border transition-all rounded-2xl group ${platforms.includes('LinkedIn') ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-800 hover:border-blue-400'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-600/10 rounded-xl flex items-center justify-center">
                                        <span className="text-blue-600 dark:text-blue-500 font-bold text-lg">in</span>
                                    </div>
                                    <span className="text-slate-900 dark:text-white font-medium">LinkedIn</span>
                                </div>
                                {platforms.includes('LinkedIn') ? (
                                    <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
                                        <CheckCircle2 size={14} /> Connected
                                    </div>
                                ) : (
                                    <span className="text-xs text-blue-500 font-semibold group-hover:translate-x-1 transition-transform">Connect Profile →</span>
                                )}
                            </button>

                            <button
                                onClick={() => togglePlatform('Twitter')}
                                className={`w-full flex items-center justify-between p-5 bg-slate-950/50 border transition-all rounded-2xl group ${platforms.includes('Twitter') ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-800 hover:border-slate-400'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-slate-100 dark:bg-white/10 rounded-xl flex items-center justify-center">
                                        <span className="text-slate-900 dark:text-white font-bold text-xl block transform -rotate-12 italic tracking-tighter">𝕏</span>
                                    </div>
                                    <span className="text-slate-900 dark:text-white font-medium">Twitter (X)</span>
                                </div>
                                {platforms.includes('Twitter') ? (
                                    <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
                                        <CheckCircle2 size={14} /> Connected
                                    </div>
                                ) : (
                                    <span className="text-xs text-slate-500 font-semibold group-hover:translate-x-1 transition-transform">Connect Account →</span>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700 text-center">
                        <div className="relative inline-block">
                            <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20">
                                <CheckCircle2 className="text-green-500" size={48} />
                            </div>
                            <div className="absolute top-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center animate-bounce shadow-lg shadow-blue-600/30">
                                <Zap className="text-white" size={16} />
                            </div>
                        </div>

                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight italic uppercase">You're cleared for takeoff</h1>
                            <p className="text-slate-400 max-w-md mx-auto italic">"The best way to predict the future is to create it." - Peter Drucker</p>
                        </div>

                        <div className="bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl text-left">
                            <h3 className="text-slate-900 dark:text-white font-semibold mb-2 italic uppercase text-xs tracking-widest">Next Steps:</h3>
                            <ul className="space-y-3 text-sm text-slate-400">
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                                    Create your first post in the Dashboard
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                                    Schedule content for automated delivery
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                                    Track performance via AI analytics
                                </li>
                            </ul>
                        </div>
                    </div>
                )}

                <div className="mt-12 flex flex-col gap-4">
                    <button
                        onClick={handleNext}
                        disabled={isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                    >
                        {isLoading ? 'Preparing Radar...' : (
                            <>
                                {step === 3 ? 'Blast Off' : 'Continue'}
                                <ArrowRight size={20} />
                            </>
                        )}
                    </button>

                    {step < 3 && (
                        <button
                            onClick={() => setStep(step + 1)}
                            className="text-slate-500 text-sm hover:text-white transition-colors py-2"
                        >
                            Skip this part for now
                        </button>
                    )}
                </div>
            </div>

            <PlatformModal
                isOpen={!!activePlatformModal}
                onClose={() => setActivePlatformModal(null)}
                platformName={activePlatformModal || ''}
                onSuccess={handlePlatformSuccess}
            />
        </div>
    );
};

export default Onboarding;
