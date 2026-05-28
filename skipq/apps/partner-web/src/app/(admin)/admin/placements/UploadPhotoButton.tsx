"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  placementId: string;
  label?: string;
}

export function UploadPhotoButton({ placementId, label = "Upload" }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setProgress(0);

    const supabase = createClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      setError("Sign in expired");
      setProgress(null);
      return;
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    if (!supabaseUrl) {
      setError("Missing config");
      setProgress(null);
      return;
    }

    const ext =
      (file.name.split(".").pop() || "jpg")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `placements/${placementId}/${Date.now()}.${ext}`;
    const uploadUrl = `${supabaseUrl}/storage/v1/object/brand-assets/${path}`;
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/brand-assets/${path}`;

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", uploadUrl, true);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.setRequestHeader(
        "Content-Type",
        file.type || "application/octet-stream",
      );
      xhr.setRequestHeader("x-upsert", "true");
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress(Math.min(99, Math.round((e.loaded / e.total) * 100)));
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed (${xhr.status})`));
        }
      };
      xhr.onerror = () => reject(new Error("Network error"));
      xhr.send(file);
    }).then(
      async () => {
        const res = await fetch("/api/admin/placements/media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: placementId, url: publicUrl }),
        });
        if (!res.ok) {
          setError("Save failed");
          setProgress(null);
          return;
        }
        setProgress(100);
        // Tiny delay so the user sees 100% then reload
        setTimeout(() => window.location.reload(), 250);
      },
      (e: Error) => {
        setError(e.message);
        setProgress(null);
      },
    );
  }

  const uploading = progress !== null;

  return (
    <label
      className={`relative block w-full py-2.5 text-center text-sm font-semibold overflow-hidden ${
        uploading
          ? "text-skip-stone cursor-default"
          : "text-skip-ink hover:bg-skip-mist active:bg-skip-mist cursor-pointer"
      }`}
    >
      {uploading ? (
        <>
          <span
            aria-hidden
            className="absolute inset-y-0 left-0 bg-skip-accent/15 transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
          <span className="relative">
            {error
              ? error
              : progress === 100
              ? "Done"
              : `Uploading… ${progress}%`}
          </span>
        </>
      ) : (
        <span className="relative">{error ? `Retry · ${error}` : label}</span>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={uploading}
        onChange={(e) => {
          const f = e.currentTarget.files?.[0];
          if (f) void handleFile(f);
          e.currentTarget.value = "";
        }}
      />
    </label>
  );
}
