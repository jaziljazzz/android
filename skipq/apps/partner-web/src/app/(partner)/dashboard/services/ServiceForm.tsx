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
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-skip-accent text-white font-semibold px-5 py-2.5 hover:bg-skip-accentHi transition disabled:opacity-60"
    >
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
    <form action={formAction} className="space-y-4 max-w-lg">
      <Field label="Name" error={err("name")}>
        <input
          name="name"
          required
          defaultValue={initial?.name ?? ""}
          className="input"
          placeholder="Haircut"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Price (₹)" error={err("price")}>
          <input
            name="price"
            type="number"
            min={0}
            step={1}
            required
            defaultValue={initial?.price ?? ""}
            className="input"
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
            className="input"
            placeholder="30"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Category" error={err("category")}>
          <select name="category" defaultValue={initial?.category ?? ""} className="input">
            <option value="">—</option>
            <option value="hair">Hair</option>
            <option value="beard">Beard</option>
            <option value="colour">Colour</option>
            <option value="facial">Facial</option>
          </select>
        </Field>
        <Field label="For" error={err("gender")}>
          <select name="gender" defaultValue={initial?.gender ?? "all"} className="input">
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
          className="input"
        />
      </Field>

      <label className="flex items-center gap-2 text-sm text-skip-slate">
        <input
          name="active"
          type="checkbox"
          defaultChecked={initial?.active ?? true}
          className="h-4 w-4"
        />
        Active (shown to customers)
      </label>

      {state?.error ? (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}

      <div className="flex items-center gap-3 pt-2">
        <Submit label={isEdit ? "Save changes" : "Add service"} />
        <Link href="/dashboard/services" className="text-sm text-skip-stone hover:text-skip-ink">
          Cancel
        </Link>
      </div>

      <style>{`
        .input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid rgb(107 114 128 / 0.3);
          background: white;
          padding: 0.625rem 0.75rem;
          color: #0E1116;
        }
        .input:focus {
          outline: none;
          box-shadow: 0 0 0 2px #0F8B8D;
        }
      `}</style>
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
      <span className="text-xs font-semibold text-skip-slate">{label}</span>
      <div className="mt-1">{children}</div>
      {error ? <span className="text-xs text-red-600 mt-1 block">{error}</span> : null}
    </label>
  );
}
