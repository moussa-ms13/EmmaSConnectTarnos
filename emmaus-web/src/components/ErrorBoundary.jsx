import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * ErrorBoundary — Catches React render errors and shows a user-friendly
 * fallback instead of a white screen (WSOD).
 *
 * Wraps any subtree that might throw during rendering (e.g. missing relation
 * data after an optimistic UI update or aggressive PWA cache miss).
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught render error:', error, info);
  }

  handleReload() {
    // Clear boundary state then reload the page for a full clean re-fetch
    this.setState({ hasError: false, error: null });
    window.location.reload();
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6">
          <div className="bg-white rounded-2xl border border-red-200 shadow-lg p-10 max-w-md w-full text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Une erreur est survenue
              </h2>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                L'affichage de cette page a échoué. Les données sont sûres —
                cliquez sur « Recharger » pour revenir à la normale.
              </p>
              {this.state.error?.message && (
                <p className="text-xs text-gray-400 mt-3 font-mono bg-gray-50 rounded-lg px-3 py-2 text-left break-all">
                  {this.state.error.message}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => this.handleReload()}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow-md shadow-blue-600/25 hover:bg-blue-700 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Recharger la page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
