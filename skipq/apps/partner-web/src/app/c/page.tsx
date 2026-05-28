import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function CustomerRoot() {
  // Anyone can browse. Login is only required at the moment of joining a queue.
  redirect("/c/home");
}
