import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-brand-paper rounded-3xl border border-brand-coral/20 text-center">
          <h2 className="text-xl font-serif text-brand-navy mb-4">Something went wrong.</h2>
          <p className="text-sm text-brand-navy/60">Please try refreshing the page or contact support.</p>
        </div>
      );
    }

    return this.props.children;
  }
}
