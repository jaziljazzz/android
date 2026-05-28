"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { updateSalonProfile, type FormState } from "../actions";

export interface SalonInitial {
  name: string;
  tagline: string | null;
  type: string | null;
  address: string;
  area: string | null;
  city: string;
  state: string;
  phone: string | null;
  email: string | null;
  status: string;
  upi_id: string | null;
  gst_number: string | null;
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="skip-btn-primary">
      {pending ? "Saving…" : "Save changes"}
    </button>
  );
}

export function ProfileForm({ initial }: { initial: SalonInitial }) {
  const [state, formAction] = useFormState<FormState, FormData>(updateSalonProfile, undefined);
  const err = (k: string) => state?.fieldErrors?.[k];

  return (
    <form action={formAction} className="skip-card p-6 sm:p-8 space-y-5 max-w-2xl">
      <Field label="Salon name" error={err("name")}>
        <input name="name" required defaultValue={initial.name} className="skip-input" />
      </Field>

      <Field label="Tagline" error={err("tagline")}>
        <input
          name="tagline"
          defaultValue={initial.tagline ?? ""}
          className="skip-input"
          placeholder="Premium Unisex Salon"
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Type" error={err("type")}>
          <select name="type" defaultValue={initial.type ?? ""} className="skip-input">
            <option value="">—</option>
            <option value="mens">Men&apos;s</option>
            <option value="ladies">Ladies</option>
            <option value="unisex">Unisex</option>
          </select>
        </Field>
        <Field label="Status" error={err("status")}>
          <select name="status" defaultValue={initial.status} className="skip-input">
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </Field>
      </div>

      <Field label="Address" error={err("address")}>
        <textarea
          name="address"
          required
          rows={2}
          defaultValue={initial.address}
          className="skip-input resize-none"
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="Area" error={err("area")}>
          <input name="area" defaultValue={initial.area ?? ""} className="skip-input" placeholder="Edapally" />
        </Field>
        <Field label="City" error={err("city")}>
          <input name="city" required defaultValue={initial.city} className="skip-input" />
        </Field>
        <Field label="State" error={err("state")}>
          <input name="state" required defaultValue={initial.state} className="skip-input" />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Phone" error={err("phone")}>
          <input
            name="phone"
            type="tel"
            defaultValue={initial.phone ?? ""}
            className="skip-input"
            placeholder="+91 …"
          />
        </Field>
        <Field label="Email" error={err("email")}>
          <input
            name="email"
            type="email"
            defaultValue={initial.email ?? ""}
            className="skip-input"
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="UPI ID (for payouts)" error={err("upi_id")}>
          <input
            name="upi_id"
            defaultValue={initial.upi_id ?? ""}
            className="skip-input"
            placeholder="yoursalon@upi"
          />
        </Field>
        <Field label="GST number (optional)" error={err("gst_number")}>
          <input
            name="gst_number"
            defaultValue={initial.gst_number ?? ""}
            className="skip-input"
          />
        </Field>
      </div>

      {state?.error ? (
        <div className="rounded-xl bg-skip-accentLo border border-skip-accent/20 px-4 py-3" role="alert">
          <p className="text-sm text-skip-accent font-medium">{state.error}</p>
        </div>
      ) : null}

      <div className="flex items-center gap-3 pt-3 border-t border-skip-stone/10">
        <Submit />
        <Link
          href="/dashboard/profile"
          className="text-sm font-medium text-skip-slate hover:text-skip-ink"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-skip-slate uppercase tracking-wide">{label}</span>
      <div className="mt-2">{children}</div>
      {error ? <span className="text-xs text-skip-accent mt-1.5 block">{error}</span> : null}
    </label>
  );
}
