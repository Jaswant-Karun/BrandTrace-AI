import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-2xl mx-auto my-12 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 rounded-2xl shadow-sm text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {this.props.fallbackTitle || 'Component Error Encountered'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              An unexpected render issue occurred in this workspace module. The error details have been logged.
            </p>
          </div>
          {this.state.error?.message && (
            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg text-left font-mono text-[11px] text-rose-700 dark:text-rose-400 border border-slate-200 dark:border-slate-800 overflow-x-auto max-h-32">
              {this.state.error.message}
            </div>
          )}
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={this.handleReset} icon={<RefreshCw className="w-3.5 h-3.5" />}>
              Retry View
            </Button>
            {this.props.onReset && (
              <Button variant="primary" size="sm" onClick={this.props.onReset} icon={<Home className="w-3.5 h-3.5" />}>
                Return to Command Center
              </Button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
