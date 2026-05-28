import Link from "next/link";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { requirePartner } from "@/lib/auth";
import { PosterActions } from "./PosterActions";

export const dynamic = "force-dynamic";

function buildLandingUrl(salonId: string): string {
  const base = process.env.NEXT_PUBLIC_PARTNER_URL ?? "https://skipq-partner.vercel.app";
  return `${base}/s/${salonId}`;
}

export default async function QrPosterPage() {
  const { partner } = await requirePartner();
  const supabase = createClient();
  const { data: salon } = await supabase
    .from("salons")
    .select("name, area, city")
    .eq("id", partner.salon_id)
    .single();

  const landingUrl = buildLandingUrl(partner.salon_id);
  const qrSvg = await QRCode.toString(landingUrl, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 1,
    color: { dark: "#1A1F2E", light: "#FFFFFF" },
  });

  return (
    <main className="px-6 py-8 sm:px-10 sm:py-10 max-w-5xl">
      <Link href="/dashboard" className="text-sm font-medium text-skip-slate hover:text-skip-ink">
        ← Back to queue
      </Link>
      <header className="mt-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-skip-ink leading-tight">
          Print-ready poster
        </h1>
        <p className="mt-2 text-skip-slate max-w-2xl">
          Stick this at the reception desk. Customers scan it with any camera, land on
          your SkipQ page, and join the queue from their phone — no app install needed
          to start.
        </p>
      </header>

      <section className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div id="poster-print" className="skip-card p-10 flex flex-col items-center text-center">
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-skip-stone">
            Skip the wait at
          </span>
          <h2 className="mt-2 text-3xl font-extrabold text-skip-ink leading-tight">
            {salon?.name ?? "Your salon"}
          </h2>
          {salon?.area || salon?.city ? (
            <p className="mt-1 text-sm text-skip-slate">
              {[salon?.area, salon?.city].filter(Boolean).join(", ")}
            </p>
          ) : null}
          <div
            className="mt-6 w-64 h-64 [&_svg]:w-full [&_svg]:h-full"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
          <p className="mt-6 text-base font-bold text-skip-ink">Scan to join the queue</p>
          <p className="mt-1 text-xs text-skip-stone">Powered by SkipQ</p>
        </div>

        <div className="skip-card p-6 sm:p-8">
          <h3 className="text-lg font-bold text-skip-ink">How it works</h3>
          <ol className="mt-3 space-y-2 text-sm text-skip-slate list-decimal pl-4">
            <li>Print this page (or save as PDF) and stick it where customers wait.</li>
            <li>Customer scans → opens the SkipQ landing page for {salon?.name ?? "your salon"}.</li>
            <li>They tap &ldquo;Open in app&rdquo; or &ldquo;Join here&rdquo; to enter the queue.</li>
            <li>You see them in the live queue dashboard within seconds.</li>
          </ol>

          <div className="mt-6 pt-6 border-t border-skip-stone/10">
            <p className="text-xs font-semibold uppercase tracking-wider text-skip-stone">
              QR Target URL
            </p>
            <p className="mt-1 text-sm text-skip-ink font-mono break-all">{landingUrl}</p>
          </div>

          <div className="mt-6">
            <PosterActions />
          </div>
        </div>
      </section>

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #poster-print, #poster-print * { visibility: visible !important; }
          #poster-print { position: absolute; left: 0; top: 0; box-shadow: none !important; border: none !important; width: 100%; padding: 4rem !important; }
        }
      `}</style>
    </main>
  );
}
