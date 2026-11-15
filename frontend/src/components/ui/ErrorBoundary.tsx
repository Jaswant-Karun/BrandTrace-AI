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
      const isDynamicImportError = 
        this.state.error?.message?.includes('dynamically imported module') ||
        this.state.error?.message?.includes('Failed to fetch') ||
        this.state.error?.message?.includes('loading chunk');

      return (
        <div className="p-8 max-w-2xl mx-auto my-12 bg-neutral-950 border border-rose-900/50 rounded-2xl shadow-2xl text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-rose-950/60 border border-rose-800 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">
              {isDynamicImportError ? 'New Version Available' : (this.props.fallbackTitle || 'Component Error Encountered')}
            </h3>
            <p className="text-xs text-neutral-400 max-w-md mx-auto">
              {isDynamicImportError 
                ? 'A new deployment of BrandTrace AI has updated application assets. Please reload to load the latest verified build.'
                : 'An unexpected render issue occurred in this workspace module. The error details have been logged.'}
            </p>
          </div>
          {this.state.error?.message && (
            <div className="p-3 bg-black rounded-lg text-left font-mono text-[11px] text-rose-400 border border-neutral-800 overflow-x-auto max-h-32">
              {this.state.error.message}
            </div>
          )}
          <div className="flex items-center justify-center gap-3 pt-2">
            {isDynamicImportError ? (
              <Button 
                variant="primary" 
                size="sm" 
                onClick={() => window.location.reload()} 
                icon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Reload Latest Version
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={this.handleReset} icon={<RefreshCw className="w-3.5 h-3.5" />}>
                Retry View
              </Button>
            )}
            {this.props.onReset && (
              <Button variant="outline" size="sm" onClick={this.props.onReset} icon={<Home className="w-3.5 h-3.5" />}>
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
