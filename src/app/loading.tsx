export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Title skeleton */}
      <div className="h-7 w-48 bg-gray-800/60 rounded" />

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-800/50 bg-gray-900/50 p-5 space-y-3">
            <div className="h-4 w-24 bg-gray-800/60 rounded" />
            <div className="h-8 w-16 bg-gray-800/60 rounded" />
            <div className="h-3 w-32 bg-gray-800/40 rounded" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl border border-gray-800/50 bg-gray-900/50 p-4 space-y-3">
        <div className="h-5 w-36 bg-gray-800/60 rounded" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-800/30 rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}
