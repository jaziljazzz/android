import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors, radii, shadow, spacing } from "@/theme";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/hooks/useSession";

interface HistoryEntry {
  id: string;
  salon_id: string;
  status: string;
  joined_at: string;
  completed_at: string | null;
  total_price: number | null;
  salons: { name: string; area: string | null } | { name: string; area: string | null }[] | null;
  has_review: boolean;
}

function pickOne<T>(v: T | T[] | null): T | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0] ?? null : v;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function statusLabel(status: string): { label: string; color: string; bg: string } {
  switch (status) {
    case "completed":
      return { label: "Completed", color: colors.success, bg: colors.successLo };
    case "cancelled":
      return { label: "Cancelled", color: colors.stone, bg: colors.mist };
    case "no_show":
      return { label: "Missed", color: colors.accent, bg: colors.accentLo };
    default:
      return { label: status, color: colors.stone, bg: colors.mist };
  }
}

export default function HistoryScreen() {
  const router = useRouter();
  const { session, loading: sessionLoading } = useSession();
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    if (!session) {
      setEntries([]);
      return;
    }
    const [{ data: rows }, { data: reviewRows }] = await Promise.all([
      supabase
        .from("queue_entries")
        .select(
          `id, salon_id, status, joined_at, completed_at, total_price,
           salons ( name, area )`,
        )
        .eq("user_id", session.user.id)
        .in("status", ["completed", "cancelled", "no_show"])
        .order("joined_at", { ascending: false })
        .limit(50),
      supabase
        .from("reviews")
        .select("queue_entry_id")
        .eq("user_id", session.user.id),
    ]);

    const reviewed = new Set((reviewRows ?? []).map((r) => r.queue_entry_id));
    const enriched: HistoryEntry[] = (rows ?? []).map((r) => ({
      ...(r as Omit<HistoryEntry, "has_review">),
      has_review: reviewed.has(r.id),
    }));
    setEntries(enriched);
  }

  useEffect(() => {
    if (!sessionLoading) load();
  }, [sessionLoading, session?.user.id]);

  if (sessionLoading || entries === null) {
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
        <View style={styles.container}>
          <Text style={styles.title}>History</Text>
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="time-outline" size={28} color={colors.accent} />
            </View>
            <Text style={styles.emptyTitle}>Sign in to see your history</Text>
            <Pressable
              onPress={() => router.push("/auth/login")}
              style={styles.signInCta}
            >
              <Text style={styles.signInCtaText}>Sign in</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.container}
        ListHeaderComponent={<Text style={styles.title}>History</Text>}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        renderItem={({ item }) => {
          const salon = pickOne(item.salons);
          const badge = statusLabel(item.status);
          const canRate = item.status === "completed" && !item.has_review;
          return (
            <View style={styles.card}>
              <Pressable
                onPress={() => router.push(`/salon/${item.salon_id}`)}
                style={styles.cardRow}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.salonName}>{salon?.name ?? "Salon"}</Text>
                  <Text style={styles.meta}>
                    {formatDate(item.joined_at)}
                    {salon?.area ? ` · ${salon.area}` : ""}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 6 }}>
                  {item.total_price != null && item.total_price > 0 ? (
                    <Text style={styles.price}>₹{Number(item.total_price).toFixed(0)}</Text>
                  ) : null}
                  <View style={[styles.statusPill, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.statusPillText, { color: badge.color }]}>{badge.label}</Text>
                  </View>
                </View>
              </Pressable>
              {canRate ? (
                <Pressable
                  onPress={() => router.push(`/review/${item.id}`)}
                  style={styles.rateBtn}
                >
                  <Ionicons name="star-outline" size={16} color={colors.accent} />
                  <Text style={styles.rateBtnText}>Rate this visit</Text>
                </Pressable>
              ) : item.has_review ? (
                <View style={styles.ratedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                  <Text style={styles.ratedBadgeText}>You rated this visit</Text>
                </View>
              ) : null}
              {item.status === "completed" ? (
                <Pressable
                  onPress={() => router.push(`/style/${item.id}`)}
                  style={styles.styleBtn}
                >
                  <Ionicons name="images-outline" size={16} color={colors.slate} />
                  <Text style={styles.styleBtnText}>Style notes &amp; photos</Text>
                </Pressable>
              ) : null}
              {item.status === "completed" || item.status === "no_show" ? (
                <Pressable
                  onPress={() => router.push(`/dispute/${item.id}`)}
                  style={styles.disputeBtn}
                >
                  <Ionicons name="alert-circle-outline" size={16} color={colors.stone} />
                  <Text style={styles.disputeBtnText}>Report an issue</Text>
                </Pressable>
              ) : null}
            </View>
          );
        }}
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
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="time-outline" size={28} color={colors.accent} />
            </View>
            <Text style={styles.emptyTitle}>No past visits yet</Text>
            <Text style={styles.emptyBody}>
              Your finished services will show up here.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.mist },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.5,
    marginBottom: spacing.lg,
  },
  empty: {
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
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.md,
    ...shadow.card,
  },
  cardRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  salonName: { fontSize: 16, fontWeight: "700", color: colors.ink },
  meta: { fontSize: 12, color: colors.stone, marginTop: 2 },
  price: { fontSize: 15, fontWeight: "800", color: colors.ink },
  statusPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  rateBtn: {
    marginTop: spacing.md,
    paddingVertical: 10,
    borderRadius: radii.md,
    backgroundColor: colors.accentLo,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  rateBtnText: { color: colors.accent, fontSize: 13, fontWeight: "700" },
  ratedBadge: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  ratedBadgeText: { color: colors.success, fontSize: 12, fontWeight: "600" },
  styleBtn: {
    marginTop: spacing.sm,
    paddingVertical: 10,
    borderRadius: radii.md,
    backgroundColor: colors.mist,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  styleBtnText: { color: colors.slate, fontSize: 13, fontWeight: "600" },
  disputeBtn: {
    marginTop: spacing.sm,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  disputeBtnText: { color: colors.stone, fontSize: 12, fontWeight: "600" },
});
