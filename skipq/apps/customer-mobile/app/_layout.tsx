import { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { colors } from "@/theme";
import { supabase } from "@/lib/supabase";
import {
  clearPushExternalId,
  initPush,
  onNotificationClick,
  setPushExternalId,
} from "@/lib/push";

export default function RootLayout() {
  const router = useRouter();
  useEffect(() => {
    initPush();

    const offClick = onNotificationClick((data) => {
      const kind = String(data?.kind ?? "");
      const queueEntryId = String(data?.queue_entry_id ?? "");
      const salonId = String(data?.salon_id ?? "");
      if (kind === "empty_chair_blast" && salonId) {
        router.push(`/salon/${salonId}`);
      } else if (queueEntryId) {
        router.push("/bookings");
      } else if (salonId) {
        router.push(`/salon/${salonId}`);
      }
    });

    // Sync external user ID with the active Supabase session, so the trigger
    // can target this device via include_aliases.external_id.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user?.id) {
        setPushExternalId(data.session.user.id);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user?.id) {
        setPushExternalId(session.user.id);
      }
      if (event === "SIGNED_OUT") {
        clearPushExternalId();
      }
    });

    return () => {
      sub.subscription.unsubscribe();
      offClick();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.mist },
        }}
      />
    </>
  );
}
