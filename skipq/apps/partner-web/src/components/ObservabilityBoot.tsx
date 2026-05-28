"use client";

import { useEffect } from "react";
import { initObservability } from "@/lib/observability";

export function ObservabilityBoot() {
  useEffect(() => {
    initObservability();
  }, []);
  return null;
}
