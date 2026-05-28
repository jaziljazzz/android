"use client";

import { useState } from "react";

export function UploadPhotoButton({ label = "Upload" }: { label?: string }) {
  const [uploading, setUploading] = useState(false);
  return (
    <label
      className={`block w-full py-2.5 text-center text-sm font-semibold cursor-pointer ${
        uploading
          ? "text-skip-stone"
          : "text-skip-ink hover:bg-skip-mist active:bg-skip-mist"
      }`}
    >
      {uploading ? "Uploading…" : label}
      <input
        type="file"
        name="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.currentTarget.files?.length) {
            setUploading(true);
            const form = e.currentTarget.closest("form");
            if (form) form.requestSubmit();
          }
        }}
      />
    </label>
  );
}
