import React from 'react';
import logger from '../utils/logger';
import AppShellVisualLayer from './AppShellVisualLayer';

function readPrefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    logger.error(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
      props: this.props
    });

    // Update state with error info for debugging
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null 
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      // Default fallback UI — same Colosseum-style shell as the main app
      const reducedMotion = readPrefersReducedMotion();
      return (
        <div className="relative min-h-screen min-w-0 overflow-hidden page-app deep-trade-bg page-variant-trade">
          <AppShellVisualLayer reducedMotion={reducedMotion} />
          <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
            <div
              className="max-w-md w-full rounded-xl border p-6 text-center glass"
              style={{ borderColor: 'var(--border-color)' }}
            >
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Something went wrong
            </h2>
            <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-4 text-left">
                <summary className="cursor-pointer mb-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Error Details (Development Only)
                </summary>
                <pre className="text-xs p-3 rounded bg-gray-900 text-red-400 overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 rounded-lg border transition-colors"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)'
                }}
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="px-4 py-2 rounded-lg bg-cyan-500 text-white hover:bg-cyan-600 transition-colors"
              >
                Reload Page
              </button>
            </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

