import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * App-wide error boundary: a render crash must never blank the whole app
 * (SIH26229 §43 — polished error states, no blank screens).
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surface in the console for debugging during the demo.
    console.error('Render error caught by boundary:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center px-6">
          <div className="card max-w-md p-8 text-center" role="alert">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-700">
              <AlertTriangle size={22} />
            </span>
            <h1 className="mt-4 font-display text-lg font-bold text-ink">Something went wrong</h1>
            <p className="mt-2 text-[13.5px] text-ink-soft">
              This screen failed to load. Your data is safe — reload to continue the demo.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="btn-primary mx-auto mt-5"
            >
              <RotateCcw size={15} /> Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
