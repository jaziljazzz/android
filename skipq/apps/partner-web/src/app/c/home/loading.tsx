export default function HomeLoading() {
  return (
    <main className="max-w-3xl mx-auto px-5 py-6">
      <h1 className="text-3xl font-extrabold text-skip-ink leading-tight">
        Book your slot,<br />
        <span className="text-skip-accent">skip the line.</span>
      </h1>
      <h2 className="mt-8 text-lg font-bold text-skip-ink">Active salons</h2>
      <ul className="mt-3 space-y-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <li
            key={i}
            className="skip-card p-4 flex items-center gap-4 animate-pulse"
          >
            <div className="w-14 h-14 rounded-xl bg-skip-mist" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded bg-skip-mist" />
              <div className="h-3 w-48 rounded bg-skip-mist" />
            </div>
            <div className="space-y-2 shrink-0">
              <div className="h-3 w-12 rounded bg-skip-mist" />
              <div className="h-2 w-10 rounded bg-skip-mist" />
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
