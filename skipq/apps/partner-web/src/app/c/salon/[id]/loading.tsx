export default function SalonLoading() {
  return (
    <main className="max-w-3xl mx-auto px-5 py-6 animate-pulse">
      <div className="h-4 w-12 rounded bg-skip-mist" />
      <div className="mt-4 w-full h-48 rounded-2xl bg-skip-mist" />
      <div className="mt-4 h-6 w-3/5 rounded bg-skip-mist" />
      <div className="mt-2 h-4 w-2/5 rounded bg-skip-mist" />
      <section className="mt-6 skip-card p-5 space-y-3">
        <div className="h-3 w-24 rounded bg-skip-mist" />
        <div className="h-8 w-32 rounded bg-skip-mist" />
        <div className="h-3 w-40 rounded bg-skip-mist" />
      </section>
      <div className="mt-8 h-5 w-32 rounded bg-skip-mist" />
      <div className="mt-3 space-y-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skip-card p-4 h-14" />
        ))}
      </div>
    </main>
  );
}
