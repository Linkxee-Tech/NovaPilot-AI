import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 text-white p-4">
                    <div className="max-w-2xl w-full bg-slate-900 border border-red-500/50 rounded-xl p-8 shadow-2xl">
                        <h1 className="text-2xl font-bold text-red-500 mb-4">Application Error</h1>
                        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-sm overflow-auto max-h-[60vh] text-slate-300">
                            {this.state.error?.toString()}
                            {this.state.error?.stack && (
                                <div className="mt-4 pt-4 border-t border-slate-800 text-slate-500">
                                    {this.state.error.stack}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
                        >
                            Reload Application
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
