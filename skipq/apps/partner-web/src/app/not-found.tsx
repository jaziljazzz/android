import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-skip-mist flex items-center justify-center px-5 py-10">
      <div className="max-w-sm w-full text-center">
        <p className="text-skip-accent font-extrabold tracking-tight text-2xl">SkipQ</p>
        <h1 className="mt-6 text-3xl font-extrabold text-skip-ink leading-tight">
          That page doesn&apos;t exist
        </h1>
        <p className="mt-2 text-skip-slate">
          The link might be broken or the page might have moved. Try one of these:
        </p>
        <div className="mt-8 grid grid-cols-1 gap-3">
          <Link href="/c/home" className="skip-btn-primary block">
            Browse salons
          </Link>
          <Link href="/" className="skip-btn-ghost block">
            Back to start
          </Link>
        </div>
      </div>
    </main>
  );
}
