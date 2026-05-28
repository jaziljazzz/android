import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { colors } from "@/theme";
import { supabase } from "@/lib/supabase";
import {
  clearPushExternalId,
  initPush,
  setPushExternalId,
} from "@/lib/push";

export default function RootLayout() {
  useEffect(() => {
    initPush();

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
    };
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
