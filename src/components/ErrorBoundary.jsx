import React from 'react';
import { AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="fixed inset-0 z-[2000] bg-slate-900 flex flex-col items-center justify-center text-white p-4">
                    <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
                    <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
                    <p className="text-slate-300 text-center mb-4 max-w-md">
                        We encountered an error while loading this view.
                    </p>
                    <div className="bg-slate-800 p-4 rounded-lg overflow-auto max-w-full text-xs font-mono text-red-300 mb-6">
                        {this.state.error?.toString()}
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-primary-600 rounded-full hover:bg-primary-700 transition-colors"
                    >
                        Reload Application
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
