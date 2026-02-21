import { useState, type ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordToggleProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
    id?: string;
    icon?: ReactNode;
}

const PasswordToggle = ({
    value,
    onChange,
    placeholder = "••••••••",
    label = "Password",
    id = "password",
    icon
}: PasswordToggleProps) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="space-y-2">
            <label htmlFor={id} className="block text-slate-600 dark:text-slate-400 text-sm font-medium ml-1 transition-colors">
                {label}
            </label>
            <div className="relative group">
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
                        {icon}
                    </div>
                )}
                <input
                    id={id}
                    type={showPassword ? "text" : "password"}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={`w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 focus:border-blue-600 text-slate-900 dark:text-white ${icon ? 'pl-10' : 'px-5'} pr-12 py-3 rounded-2xl outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 group-hover:border-slate-300 dark:group-hover:border-slate-700`}
                    placeholder={placeholder}
                    required
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 dark:hover:text-white p-2 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>
        </div>
    );
};

export default PasswordToggle;
