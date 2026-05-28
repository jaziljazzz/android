"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "salon-photos";
const MAX_GALLERY = 6;

function publicUrl(supabase: ReturnType<typeof createClient>, path: string) {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

function pathFromPublicUrl(url: string): string | null {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  if (i < 0) return null;
  return url.slice(i + marker.length);
}

export function PhotosUploader({
  salonId,
  initialCover,
  initialPhotos,
}: {
  salonId: string;
  initialCover: string | null;
  initialPhotos: string[];
}) {
  const supabase = createClient();
  const router = useRouter();
  const [cover, setCover] = useState<string | null>(initialCover);
  const [photos, setPhotos] = useState<string[]>(initialPhotos);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  async function uploadCover(file: File) {
    setError(null);
    setBusy(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${salonId}/cover-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
        upsert: false,
        cacheControl: "3600",
        contentType: file.type,
      });
      if (upErr) throw upErr;
      const url = publicUrl(supabase, path);
      const { error: dbErr } = await supabase
        .from("salons")
        .update({ cover_image: url })
        .eq("id", salonId);
      if (dbErr) throw dbErr;
      if (cover) {
        const oldPath = pathFromPublicUrl(cover);
        if (oldPath) await supabase.storage.from(BUCKET).remove([oldPath]);
      }
      setCover(url);
      startTransition(() => router.refresh());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function addGalleryPhotos(files: FileList) {
    if (photos.length >= MAX_GALLERY) {
      setError(`Max ${MAX_GALLERY} gallery photos`);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const room = MAX_GALLERY - photos.length;
      const chosen = Array.from(files).slice(0, room);
      const uploaded: string[] = [];
      for (const file of chosen) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${salonId}/g-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
          upsert: false,
          cacheControl: "3600",
          contentType: file.type,
        });
        if (upErr) throw upErr;
        uploaded.push(publicUrl(supabase, path));
      }
      const next = [...photos, ...uploaded];
      const { error: dbErr } = await supabase
        .from("salons")
        .update({ photos: next })
        .eq("id", salonId);
      if (dbErr) throw dbErr;
      setPhotos(next);
      startTransition(() => router.refresh());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function removePhoto(url: string) {
    setError(null);
    setBusy(true);
    try {
      const next = photos.filter((p) => p !== url);
      const { error: dbErr } = await supabase
        .from("salons")
        .update({ photos: next })
        .eq("id", salonId);
      if (dbErr) throw dbErr;
      const path = pathFromPublicUrl(url);
      if (path) await supabase.storage.from(BUCKET).remove([path]);
      setPhotos(next);
      startTransition(() => router.refresh());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Remove failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="skip-card p-6 sm:p-8 space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-bold text-skip-ink">Cover image</h2>
        <p className="mt-1 text-sm text-skip-slate">
          The hero photo customers see at the top of your salon page. JPG/PNG/WebP, max 5 MB.
        </p>
        <div className="mt-4">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="Cover" className="w-full h-48 object-cover rounded-2xl" />
          ) : (
            <div className="w-full h-48 rounded-2xl bg-skip-mist border border-dashed border-skip-stone/30 flex items-center justify-center text-skip-stone text-sm">
              No cover image yet
            </div>
          )}
          <input
            ref={coverInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadCover(file);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            disabled={busy}
            className="skip-btn-secondary mt-3"
          >
            {cover ? "Replace cover" : "Upload cover"}
          </button>
        </div>
      </div>

      <div className="border-t border-skip-stone/10 pt-6">
        <h2 className="text-lg font-bold text-skip-ink">Gallery ({photos.length}/{MAX_GALLERY})</h2>
        <p className="mt-1 text-sm text-skip-slate">
          Extra photos shown below the cover. Interior, work samples, your team.
        </p>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map((url) => (
            <div key={url} className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-28 object-cover rounded-xl" />
              <button
                type="button"
                onClick={() => removePhoto(url)}
                disabled={busy}
                className="absolute top-2 right-2 bg-skip-ink/80 hover:bg-skip-accent text-white text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                aria-label="Remove photo"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              void addGalleryPhotos(e.target.files);
            }
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          disabled={busy || photos.length >= MAX_GALLERY}
          className="skip-btn-secondary mt-4"
        >
          Add photos
        </button>
      </div>

      {error ? (
        <div className="rounded-xl bg-skip-accentLo border border-skip-accent/20 px-4 py-3" role="alert">
          <p className="text-sm text-skip-accent font-medium">{error}</p>
        </div>
      ) : null}
    </div>
  );
}
