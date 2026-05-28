"use client";

import { useState } from "react";

export function OpenInAppButton({ deepLink }: { deepLink: string }) {
  const [trying, setTrying] = useState(false);

  function open() {
    setTrying(true);
    window.location.href = deepLink;
    // After a moment, if we're still here, the app probably isn't installed.
    setTimeout(() => setTrying(false), 1500);
  }

  return (
    <div className="mt-8 flex flex-col gap-3">
      <button type="button" onClick={open} className="skip-btn-primary w-full text-base py-4">
        {trying ? "Opening SkipQ…" : "Open in SkipQ app"}
      </button>
      <p className="text-center text-xs text-skip-stone">
        SkipQ on Android · iOS coming soon
      </p>
    </div>
  );
}
