import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { formatEta } from "@skipq/algorithm";
import { colors, radii, shadow, spacing } from "@/theme";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/hooks/useSession";

interface ActiveBooking {
  id: string;
  salon_id: string;
  status: string;
  position: number;
  estimated_wait_min: number | null;
  joined_at: string;
  salons: { name: string; area: string | null; address: string } | { name: string; area: string | null; address: string }[] | null;
}

function pickOne<T>(v: T | T[] | null): T | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0] ?? null : v;
}

export default function BookingsScreen() {
  const router = useRouter();
  const { session, loading: sessionLoading } = useSession();
  const [booking, setBooking] = useState<ActiveBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  async function load() {
    if (!session) {
      setBooking(null);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("queue_entries")
      .select(
        `id, salon_id, status, position, estimated_wait_min, joined_at,
         salons ( name, area, address )`,
      )
      .eq("user_id", session.user.id)
      .in("status", ["waiting", "arrived", "serving"])
      .order("joined_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setBooking((data as ActiveBooking | null) ?? null);
    setLoading(false);
  }

  useEffect(() => {
    if (!sessionLoading) load();
  }, [sessionLoading, session?.user.id]);

  async function cancel() {
    if (!booking) return;
    setCancelling(true);
    await supabase
      .from("queue_entries")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", booking.id);
    setCancelling(false);
    load();
  }

  if (loading || sessionLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Your bookings</Text>
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="log-in-outline" size={28} color={colors.accent} />
            </View>
            <Text style={styles.emptyTitle}>Sign in to see your queue</Text>
            <Text style={styles.emptyBody}>
              We&apos;ll keep your live status here once you skip your first queue.
            </Text>
            <Pressable onPress={() => router.push("/auth/login")} style={styles.signInCta}>
              <Text style={styles.signInCtaText}>Sign in</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const salon = pickOne(booking?.salons ?? null);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
            tintColor={colors.accent}
          />
        }
      >
        <Text style={styles.title}>Your bookings</Text>

        {booking && salon ? (
          <Pressable
            onPress={() => router.push(`/salon/${booking.salon_id}`)}
            style={styles.activeCard}
          >
            <View style={styles.activeRow}>
              <View
                style={[
                  styles.activeCircle,
                  booking.status === "serving" && { backgroundColor: colors.success },
                  booking.status === "arrived" && { backgroundColor: colors.caution },
                ]}
              >
                <Text style={styles.activeNum}>#{booking.position}</Text>
              </View>
              <View style={{ marginLeft: spacing.lg, flex: 1 }}>
                <Text style={styles.activeStatus}>
                  {booking.status === "waiting"
                    ? "You're in the queue"
                    : booking.status === "arrived"
                    ? "Checked in"
                    : "Being served right now"}
                </Text>
                <Text style={styles.activeSalon}>{salon.name}</Text>
                {salon.area ? (
                  <Text style={styles.activeArea}>{salon.area}</Text>
                ) : null}
              </View>
            </View>

            {booking.estimated_wait_min != null ? (
              <View style={styles.etaBox}>
                <Text style={styles.etaLabel}>Estimated wait</Text>
                <Text style={styles.etaValue}>{formatEta(booking.estimated_wait_min)}</Text>
              </View>
            ) : null}

            {booking.status === "waiting" || booking.status === "arrived" ? (
              <Pressable
                onPress={cancel}
                disabled={cancelling}
                style={({ pressed }) => [
                  styles.cancelBtn,
                  (pressed || cancelling) && { opacity: 0.6 },
                ]}
              >
                <Text style={styles.cancelBtnText}>
                  {cancelling ? "Cancelling…" : "Leave queue"}
                </Text>
              </Pressable>
            ) : null}
          </Pressable>
        ) : (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="calendar-outline" size={28} color={colors.accent} />
            </View>
            <Text style={styles.emptyTitle}>No active bookings</Text>
            <Text style={styles.emptyBody}>
              Find a nearby salon and tap &ldquo;Book a slot&rdquo; to skip the line.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.mist },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  container: { padding: spacing.lg },
  title: { fontSize: 32, fontWeight: "800", color: colors.ink, letterSpacing: -0.5 },
  empty: {
    marginTop: spacing.xl,
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing.xl,
    alignItems: "center",
    ...shadow.card,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accentLo,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { marginTop: spacing.md, fontSize: 16, fontWeight: "700", color: colors.ink },
  emptyBody: { marginTop: 4, fontSize: 13, color: colors.stone, textAlign: "center" },
  signInCta: {
    marginTop: spacing.lg,
    backgroundColor: colors.accent,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
  },
  signInCtaText: { color: colors.white, fontWeight: "700" },
  activeCard: {
    marginTop: spacing.xl,
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing.lg,
    ...shadow.card,
  },
  activeRow: { flexDirection: "row", alignItems: "center" },
  activeCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  activeNum: { fontSize: 26, fontWeight: "800", color: colors.white },
  activeStatus: { fontSize: 13, color: colors.slate, fontWeight: "600" },
  activeSalon: { fontSize: 20, fontWeight: "800", color: colors.ink, marginTop: 2 },
  activeArea: { fontSize: 13, color: colors.stone, marginTop: 1 },
  etaBox: {
    marginTop: spacing.lg,
    backgroundColor: colors.mist,
    padding: spacing.md,
    borderRadius: radii.lg,
    alignItems: "center",
  },
  etaLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.slate,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  etaValue: { fontSize: 28, fontWeight: "800", color: colors.ink, marginTop: 2 },
  cancelBtn: {
    marginTop: spacing.md,
    paddingVertical: 12,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
  },
  cancelBtnText: { color: colors.slate, fontWeight: "700" },
});
