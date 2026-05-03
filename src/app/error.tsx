'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the real error for observability — never expose to the user
    console.error('[ApexAegis Error]', error?.digest || 'unknown');
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center bg-gray-900 border border-gray-800 rounded-2xl p-10">
        <div className="w-12 h-12 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-blue-500/20">
          A
        </div>
        <div className="text-5xl font-extrabold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-2">
          Error
        </div>
        <h2 className="text-xl font-semibold text-gray-200 mb-3">
          Something went wrong
        </h2>
        <p className="text-sm text-gray-400 leading-relaxed mb-6">
          An unexpected error occurred. Please try again or contact your administrator if the problem persists.
        </p>
        {error?.digest && (
          <p className="text-xs text-gray-600 font-mono mb-4">
            Reference: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Try Again
        </button>
      </div>
    </div>
  );
}
