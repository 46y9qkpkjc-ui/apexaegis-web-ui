import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center bg-gray-900 border border-gray-800 rounded-2xl p-10">
        <div className="w-12 h-12 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-blue-500/20">
          A
        </div>
        <div className="text-6xl font-extrabold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-2">
          404
        </div>
        <h2 className="text-xl font-semibold text-gray-200 mb-3">
          Page Not Found
        </h2>
        <p className="text-sm text-gray-400 leading-relaxed mb-6">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
