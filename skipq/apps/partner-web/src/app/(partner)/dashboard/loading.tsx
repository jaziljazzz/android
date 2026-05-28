export default function DashboardLoading() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-6 sm:py-10">
      <div className="h-8 w-44 rounded-md bg-skip-stone/15 animate-pulse" />
      <div className="mt-3 h-4 w-72 rounded bg-skip-stone/10 animate-pulse" />

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="skip-card p-5 h-24 bg-white animate-pulse"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="h-4 w-1/2 rounded bg-skip-stone/15" />
            <div className="mt-3 h-3 w-1/3 rounded bg-skip-stone/10" />
          </div>
        ))}
      </div>
    </main>
  );
}
