import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
  isPermissionError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '', isPermissionError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    let message = error.message || 'An unexpected application error occurred.';
    let isPerm = false;
    try {
      const parsed = JSON.parse(error.message) as { error?: string; operationType?: string; path?: string };
      if (parsed && parsed.error) {
        message = `${parsed.error}${parsed.path ? ` (${parsed.operationType || 'op'} on ${parsed.path})` : ''}`;
        if (parsed.error.toLowerCase().includes('permission') || parsed.error.toLowerCase().includes('insufficient')) {
          isPerm = true;
        }
      }
    } catch {
      if (message.toLowerCase().includes('permission')) {
        isPerm = true;
      }
    }
    return { hasError: true, errorMessage: message, isPermissionError: isPerm };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('CREOVATE ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAF9FC] dark:bg-[#0B0814] p-6">
          <div className="max-w-lg w-full bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B] rounded-2xl p-8">
            <div className="w-11 h-11 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mb-5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-[#110D1F] dark:text-[#F4F2FA] mb-2">
              {this.state.isPermissionError ? 'Access Verification Required' : 'Something Went Wrong'}
            </h2>
            <p className="text-sm text-[#58506E] dark:text-[#A89EC4] leading-relaxed mb-5">
              {this.state.isPermissionError
                ? 'This operation was blocked by security rules. Please confirm you are signed in with a verified account that owns this workspace.'
                : 'An unexpected issue interrupted this view. You can reload the workspace safely below.'}
            </p>
            <div className="p-3.5 rounded-xl bg-[#F4F1FA] dark:bg-[#1B1433] text-xs font-mono text-[#3F3756] dark:text-[#C4B8E3] break-words mb-6">
              {this.state.errorMessage}
            </div>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, errorMessage: '', isPermissionError: false });
                window.location.reload();
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-sm font-semibold transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-4 h-4" />
              Reload Workspace
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
