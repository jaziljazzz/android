import { redirect } from "next/navigation";

// Phone-friendly stylist entry point per spec §8. The actual queue
// view lives at /dashboard/my-queue; this route just redirects so a
// stylist can bookmark partner.skipq.in/stylist.
export const dynamic = "force-dynamic";

export default function StylistEntry() {
  redirect("/dashboard/my-queue");
}
