"use client";

import { useRef, useState } from "react";

export function UploadPhotoButton() {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [uploading, setUploading] = useState(false);
  return (
    <label
      className={`text-sm py-2 px-3 font-semibold cursor-pointer border border-skip-stone/20 rounded-lg ${
        uploading ? "text-skip-stone" : "text-skip-slate hover:text-skip-ink"
      }`}
    >
      {uploading ? "Uploading…" : "Upload photo"}
      <input
        type="file"
        name="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.currentTarget.files?.length) {
            setUploading(true);
            // Walk up to the parent form
            const form = e.currentTarget.closest("form");
            if (form) {
              formRef.current = form;
              form.requestSubmit();
            }
          }
        }}
      />
    </label>
  );
}
