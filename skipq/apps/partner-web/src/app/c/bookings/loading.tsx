export default function BookingsLoading() {
  return (
    <main className="max-w-3xl mx-auto px-5 py-6 animate-pulse">
      <div className="h-4 w-16 rounded bg-skip-mist" />
      <div className="mt-4 h-6 w-32 rounded bg-skip-mist" />
      <section className="mt-6 skip-card p-6 space-y-3">
        <div className="flex items-start gap-5">
          <div className="w-20 h-20 rounded-3xl bg-skip-mist" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-32 rounded bg-skip-mist" />
            <div className="h-6 w-40 rounded bg-skip-mist" />
            <div className="h-3 w-24 rounded bg-skip-mist" />
          </div>
        </div>
      </section>
    </main>
  );
}
