"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import {
  createStylist,
  updateStylist,
  type FormState,
} from "./actions";

const BUCKET = "salon-photos";

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
    <button type="submit" disabled={pending} className="skip-btn-primary">
      {pending ? "Saving…" : label}
    </button>
  );
}

export function StylistForm({ salonId, initial }: { salonId: string; initial?: StylistFormValues }) {
  const supabase = createClient();
  const isEdit = Boolean(initial?.id);
  const action = isEdit
    ? updateStylist.bind(null, initial!.id as string)
    : createStylist;
  const [state, formAction] = useFormState<FormState, FormData>(action, undefined);
  const [photoUrl, setPhotoUrl] = useState<string | null>(initial?.photo ?? null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const err = (key: string) => state?.fieldErrors?.[key];
  const serves = (g: string) => initial?.gender_serves?.includes(g) ?? (g === "all");

  async function uploadPhoto(file: File) {
    setUploadError(null);
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${salonId}/stylist-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
        upsert: false,
        cacheControl: "3600",
        contentType: file.type,
      });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      setPhotoUrl(data.publicUrl);
    } catch (e: unknown) {
      setUploadError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form action={formAction} className="skip-card p-6 sm:p-8 space-y-5 max-w-2xl">
      <Field label="Name" error={err("name")}>
        <input
          name="name"
          required
          defaultValue={initial?.name ?? ""}
          className="skip-input"
          placeholder="Arjun M"
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Role" error={err("role")}>
          <select name="role" defaultValue={initial?.role ?? ""} className="skip-input">
            <option value="">—</option>
            <option value="Junior">Junior</option>
            <option value="Senior">Senior</option>
            <option value="Master">Master</option>
            <option value="Director">Director</option>
          </select>
        </Field>
        <Field label="Status" error={err("status")}>
          <select name="status" defaultValue={initial?.status ?? "available"} className="skip-input">
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
          className="skip-input"
          placeholder="Hair colour, men's cuts, etc."
        />
      </Field>

      <Field label="Photo" error={err("photo")}>
        <input type="hidden" name="photo" value={photoUrl ?? ""} />
        <div className="flex items-center gap-4">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="" className="w-16 h-16 rounded-full object-cover bg-skip-mist" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-skip-mist flex items-center justify-center text-skip-stone text-xs">
              No photo
            </div>
          )}
          <div className="flex flex-col gap-1">
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadPhoto(file);
                e.target.value = "";
              }}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={uploading}
                className="skip-btn-secondary text-sm"
              >
                {uploading ? "Uploading…" : photoUrl ? "Replace" : "Upload"}
              </button>
              {photoUrl ? (
                <button
                  type="button"
                  onClick={() => setPhotoUrl(null)}
                  disabled={uploading}
                  className="text-sm font-medium text-skip-stone hover:text-skip-accent"
                >
                  Remove
                </button>
              ) : null}
            </div>
            {uploadError ? (
              <span className="text-xs text-skip-accent">{uploadError}</span>
            ) : null}
          </div>
        </div>
      </Field>

      <fieldset>
        <legend className="text-xs font-semibold text-skip-slate uppercase tracking-wide">Serves</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {[
            { value: "all", label: "Everyone" },
            { value: "male", label: "Men" },
            { value: "female", label: "Women" },
          ].map((g) => (
            <label
              key={g.value}
              className="inline-flex items-center gap-2 rounded-xl border border-skip-stone/20 bg-white px-4 py-2 cursor-pointer hover:border-skip-accent transition has-[:checked]:bg-skip-accentLo has-[:checked]:border-skip-accent has-[:checked]:text-skip-accent"
            >
              <input
                type="checkbox"
                name="gender_serves"
                value={g.value}
                defaultChecked={serves(g.value)}
                className="h-4 w-4 accent-skip-accent"
              />
              <span className="text-sm font-medium">{g.label}</span>
            </label>
          ))}
        </div>
        {err("gender_serves") ? (
          <span className="text-xs text-skip-accent mt-1.5 block">{err("gender_serves")}</span>
        ) : null}
      </fieldset>

      {state?.error ? (
        <div className="rounded-xl bg-skip-accentLo border border-skip-accent/20 px-4 py-3" role="alert">
          <p className="text-sm text-skip-accent font-medium">{state.error}</p>
        </div>
      ) : null}

      <div className="flex items-center gap-3 pt-3 border-t border-skip-stone/10">
        <Submit label={isEdit ? "Save changes" : "Add stylist"} />
        <Link href="/dashboard/stylists" className="text-sm font-medium text-skip-slate hover:text-skip-ink">
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
