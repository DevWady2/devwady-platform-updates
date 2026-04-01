import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  showDetails: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, showDetails: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center gap-4">
        <h2 className="text-2xl font-bold text-foreground">Something went wrong</h2>
        <p className="text-muted-foreground">حدث خطأ ما</p>
        <div className="flex gap-3 mt-2">
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition"
          >
            Reload Page
          </button>
          <button
            onClick={() => { window.location.href = "/"; }}
            className="px-5 py-2.5 rounded-full border border-border text-sm font-medium hover:bg-muted transition"
          >
            Go Home
          </button>
        </div>
        <button
          onClick={() => this.setState((s) => ({ showDetails: !s.showDetails }))}
          className="text-xs text-muted-foreground underline mt-4"
        >
          {this.state.showDetails ? "Hide" : "Show"} Technical Details
        </button>
        {this.state.showDetails && this.state.error && (
          <pre className="mt-2 max-w-lg text-xs text-destructive bg-destructive/5 rounded-xl p-4 text-start overflow-auto whitespace-pre-wrap">
            {this.state.error.message}
          </pre>
        )}
      </div>
    );
  }
}
