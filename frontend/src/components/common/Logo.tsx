import React from 'react';

interface LogoProps {
    className?: string;
    showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className = "h-8", showText = true }) => {
    return (
        <div className={`flex items-center gap-2 group transition-all duration-300 ${className}`}>
            <svg
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-full w-auto filter drop-shadow-[0_0_8px_rgba(56,189,248,0.3)] group-hover:drop-shadow-[0_0_12px_rgba(249,115,22,0.4)] transition-all duration-500"
            >
                {/* Outer Orbit */}
                <path
                    d="M85 50C85 69.33 69.33 85 50 85C30.67 85 15 69.33 15 50"
                    stroke="url(#orbit-gradient)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray="4 8"
                    className="animate-[spin_10s_linear_infinite]"
                />

                {/* Rocket Body */}
                <path
                    d="M50 15C50 15 42 35 42 55C42 65 45 72 50 78C55 72 58 65 58 55C58 35 50 15 50 15Z"
                    fill="url(#rocket-gradient)"
                    className="group-hover:translate-y-[-2px] transition-transform duration-500"
                />

                {/* Rocket Accents */}
                <path
                    d="M46 55H54M48 62H52"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    opacity="0.5"
                />

                {/* Engine Flame */}
                <path
                    d="M50 78C48 78 47 85 50 92C53 85 52 78 50 78Z"
                    fill="#f97316"
                    className="animate-pulse"
                />

                {/* Central Star */}
                <circle cx="50" cy="40" r="1.5" fill="white" className="animate-pulse" />

                <defs>
                    <linearGradient id="rocket-gradient" x1="50" y1="15" x2="50" y2="78" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#38bdf8" />
                        <stop offset="1" stopColor="#1e3a8a" />
                    </linearGradient>
                    <linearGradient id="orbit-gradient" x1="15" y1="50" x2="85" y2="50" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#f97316" />
                        <stop offset="1" stopColor="#38bdf8" />
                    </linearGradient>
                </defs>
            </svg>

            {showText && (
                <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white transition-all duration-500 flex items-center">
                    NovaPilot <span className="text-orange-500 ml-1">AI</span>
                </span>
            )}
        </div>
    );
};

export default Logo;
