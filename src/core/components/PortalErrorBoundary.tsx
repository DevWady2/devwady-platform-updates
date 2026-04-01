/**
 * PortalErrorBoundary — Portal-scoped error boundary with retry.
 * Shows a friendly card instead of crashing the entire app.
 */
import { Component, type ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class PortalErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Card className="border-destructive/15 max-w-md w-full rounded-2xl">
          <CardContent className="flex flex-col items-center gap-5 py-12 text-center">
            <div className="h-14 w-14 rounded-2xl bg-destructive/8 flex items-center justify-center">
              <AlertTriangle className="h-7 w-7 text-destructive/60" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-semibold text-foreground">
                Something went wrong
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                An unexpected error occurred. Please try again or go back to the homepage.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={this.handleRetry} size="sm" className="rounded-full gap-2">
                <RefreshCw className="h-3.5 w-3.5" />
                Try Again
              </Button>
              <Button variant="ghost" size="sm" className="rounded-full gap-2" asChild>
                <a href="/">
                  <Home className="h-3.5 w-3.5" />
                  Go Home
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
}
