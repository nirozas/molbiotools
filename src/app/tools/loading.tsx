// Global loading skeleton for all /tools/* routes
// Next.js will automatically show this while a tool page's JS is being fetched

export default function ToolsLoading() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center py-10 px-4 md:px-8 animate-pulse">
      <div className="w-full max-w-5xl mb-8 space-y-3">
        {/* Back link skeleton */}
        <div className="h-4 w-28 bg-slate-700/60 rounded" />
        {/* Title skeleton */}
        <div className="h-9 w-80 bg-slate-700/60 rounded" />
        {/* Subtitle skeleton */}
        <div className="h-4 w-2/3 bg-slate-700/40 rounded" />
        <div className="h-4 w-1/2 bg-slate-700/40 rounded" />
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main card skeleton */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-6 space-y-3">
            <div className="h-5 w-40 bg-slate-700/60 rounded border-b border-slate-700 pb-2" />
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="h-10 bg-slate-700/40 rounded-lg" />
              <div className="h-10 bg-slate-700/40 rounded-lg" />
              <div className="h-10 bg-slate-700/40 rounded-lg" />
              <div className="h-10 bg-slate-700/40 rounded-lg" />
            </div>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-6 space-y-3">
            <div className="h-5 w-32 bg-slate-700/60 rounded" />
            <div className="h-24 bg-slate-700/40 rounded-lg" />
            <div className="h-10 bg-slate-700/40 rounded-lg" />
          </div>
        </div>

        {/* Results sidebar skeleton */}
        <div>
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-6 space-y-4">
            <div className="h-5 w-32 bg-slate-700/60 rounded" />
            <div className="space-y-3">
              <div className="h-14 bg-slate-700/40 rounded-lg" />
              <div className="h-14 bg-slate-700/40 rounded-lg" />
              <div className="h-14 bg-slate-700/40 rounded-lg" />
            </div>
            <div className="pt-3 border-t border-slate-700 space-y-2">
              <div className="h-4 w-24 bg-slate-700/40 rounded" />
              <div className="h-20 bg-slate-700/40 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
