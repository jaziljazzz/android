import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-skip-mist flex items-center justify-center px-5 py-12">
      <div className="max-w-md w-full text-center">
        <p className="text-skip-accent font-extrabold tracking-tight text-2xl">SkipQ</p>
        <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold text-skip-ink leading-tight">
          Skip the wait.
        </h1>
        <p className="mt-2 text-skip-slate">See live queues. Book from anywhere.</p>

        <div className="mt-10 grid grid-cols-1 gap-3">
          <Link href="/c/home" className="skip-btn-primary block">
            I&apos;m a customer
          </Link>
          <Link href="/login" className="skip-btn-secondary block">
            I run a salon
          </Link>
        </div>

        <p className="mt-8 text-xs text-skip-stone">
          <Link href="/privacy" className="underline">Privacy</Link>
        </p>
      </div>
    </main>
  );
}
