"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import {
  createService,
  updateService,
  type FormState,
} from "./actions";

export interface ServiceFormValues {
  id?: string;
  name: string;
  category: string | null;
  price: number;
  default_duration: number;
  gender: string | null;
  active: boolean;
  display_order: number;
}

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="skip-btn-primary">
      {pending ? "Saving…" : label}
    </button>
  );
}

export function ServiceForm({ initial }: { initial?: ServiceFormValues }) {
  const isEdit = Boolean(initial?.id);
  const action = isEdit
    ? updateService.bind(null, initial!.id as string)
    : createService;
  const [state, formAction] = useFormState<FormState, FormData>(action, undefined);

  const err = (key: string) => state?.fieldErrors?.[key];

  return (
    <form action={formAction} className="skip-card p-6 sm:p-8 space-y-5 max-w-2xl">
      <Field label="Name" error={err("name")}>
        <input
          name="name"
          required
          defaultValue={initial?.name ?? ""}
          className="skip-input"
          placeholder="Haircut"
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Price (₹)" error={err("price")}>
          <input
            name="price"
            type="number"
            min={0}
            step={1}
            required
            defaultValue={initial?.price ?? ""}
            className="skip-input"
            placeholder="350"
          />
        </Field>
        <Field label="Duration (min)" error={err("default_duration")}>
          <input
            name="default_duration"
            type="number"
            min={1}
            max={480}
            step={1}
            required
            defaultValue={initial?.default_duration ?? ""}
            className="skip-input"
            placeholder="30"
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Category" error={err("category")}>
          <select name="category" defaultValue={initial?.category ?? ""} className="skip-input">
            <option value="">—</option>
            <option value="hair">Hair</option>
            <option value="beard">Beard</option>
            <option value="colour">Colour</option>
            <option value="facial">Facial</option>
          </select>
        </Field>
        <Field label="For" error={err("gender")}>
          <select name="gender" defaultValue={initial?.gender ?? "all"} className="skip-input">
            <option value="all">Everyone</option>
            <option value="male">Men</option>
            <option value="female">Women</option>
          </select>
        </Field>
      </div>

      <Field label="Display order" error={err("display_order")}>
        <input
          name="display_order"
          type="number"
          step={1}
          defaultValue={initial?.display_order ?? 0}
          className="skip-input"
        />
      </Field>

      <label className="flex items-center gap-3 text-sm text-skip-slate cursor-pointer">
        <input
          name="active"
          type="checkbox"
          defaultChecked={initial?.active ?? true}
          className="h-5 w-5 rounded accent-skip-accent"
        />
        <span>Active &mdash; shown to customers</span>
      </label>

      {state?.error ? (
        <div className="rounded-xl bg-skip-accentLo border border-skip-accent/20 px-4 py-3" role="alert">
          <p className="text-sm text-skip-accent font-medium">{state.error}</p>
        </div>
      ) : null}

      <div className="flex items-center gap-3 pt-3 border-t border-skip-stone/10">
        <Submit label={isEdit ? "Save changes" : "Add service"} />
        <Link href="/dashboard/services" className="text-sm font-medium text-skip-slate hover:text-skip-ink">
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
