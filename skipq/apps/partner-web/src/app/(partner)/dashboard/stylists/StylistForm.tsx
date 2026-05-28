"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import {
  createStylist,
  updateStylist,
  type FormState,
} from "./actions";

export interface StylistFormValues {
  id?: string;
  name: string;
  role: string | null;
  specialty: string | null;
  photo: string | null;
  status: string;
  gender_serves: string[];
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

export function StylistForm({ initial }: { initial?: StylistFormValues }) {
  const isEdit = Boolean(initial?.id);
  const action = isEdit
    ? updateStylist.bind(null, initial!.id as string)
    : createStylist;
  const [state, formAction] = useFormState<FormState, FormData>(action, undefined);

  const err = (key: string) => state?.fieldErrors?.[key];
  const serves = (g: string) => initial?.gender_serves?.includes(g) ?? (g === "all");

  return (
    <form action={formAction} className="space-y-4 max-w-lg">
      <Field label="Name" error={err("name")}>
        <input
          name="name"
          required
          defaultValue={initial?.name ?? ""}
          className="input"
          placeholder="Arjun M"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Role" error={err("role")}>
          <select name="role" defaultValue={initial?.role ?? ""} className="input">
            <option value="">—</option>
            <option value="Junior">Junior</option>
            <option value="Senior">Senior</option>
            <option value="Master">Master</option>
            <option value="Director">Director</option>
          </select>
        </Field>
        <Field label="Status" error={err("status")}>
          <select name="status" defaultValue={initial?.status ?? "available"} className="input">
            <option value="available">Available</option>
            <option value="busy">Busy</option>
            <option value="break">On break</option>
            <option value="off">Off today</option>
          </select>
        </Field>
      </div>

      <Field label="Specialty" error={err("specialty")}>
        <input
          name="specialty"
          defaultValue={initial?.specialty ?? ""}
          className="input"
          placeholder="Hair colour, men's cuts, etc."
        />
      </Field>

      <Field label="Photo URL" error={err("photo")}>
        <input
          name="photo"
          type="url"
          defaultValue={initial?.photo ?? ""}
          className="input"
          placeholder="https://…"
        />
      </Field>

      <fieldset>
        <legend className="text-xs font-semibold text-skip-slate">Serves</legend>
        <div className="mt-1 flex gap-4 text-sm text-skip-slate">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="gender_serves" value="all" defaultChecked={serves("all")} className="h-4 w-4" />
            Everyone
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="gender_serves" value="male" defaultChecked={serves("male")} className="h-4 w-4" />
            Men
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="gender_serves" value="female" defaultChecked={serves("female")} className="h-4 w-4" />
            Women
          </label>
        </div>
        {err("gender_serves") ? (
          <span className="text-xs text-red-600 mt-1 block">{err("gender_serves")}</span>
        ) : null}
      </fieldset>

      {state?.error ? (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}

      <div className="flex items-center gap-3 pt-2">
        <Submit label={isEdit ? "Save changes" : "Add stylist"} />
        <Link href="/dashboard/stylists" className="text-sm text-skip-stone hover:text-skip-ink">
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
