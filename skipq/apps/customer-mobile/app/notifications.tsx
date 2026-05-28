import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
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

interface NotificationRow {
  id: string;
  channel: string;
  template: string | null;
  content: string;
  sent_at: string;
}

function relative(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function iconForTemplate(template: string | null): keyof typeof Ionicons.glyphMap {
  if (!template) return "notifications-outline";
  if (template.startsWith("queue_serving")) return "person-outline";
  if (template.startsWith("queue_cancelled")) return "close-circle-outline";
  if (template.startsWith("queue_no_show")) return "alert-circle-outline";
  if (template.startsWith("queue_arrived")) return "checkmark-circle-outline";
  return "notifications-outline";
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { session, loading: sessionLoading } = useSession();
  const [rows, setRows] = useState<NotificationRow[] | null>(null);

  useEffect(() => {
    if (sessionLoading) return;
    if (!session) {
      setRows([]);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("notifications_log")
        .select("id, channel, template, content, sent_at")
        .eq("user_id", session.user.id)
        .order("sent_at", { ascending: false })
        .limit(60);
      setRows((data ?? []) as NotificationRow[]);
    })();
  }, [session, sessionLoading]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.ink} />
        </Pressable>
        <Text style={styles.title}>Notifications</Text>
      </View>

      {rows === null ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : rows.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="notifications-outline" size={28} color={colors.accent} />
          </View>
          <Text style={styles.emptyTitle}>You&apos;re all caught up</Text>
          <Text style={styles.emptyBody}>
            Queue updates from the salons you book with land here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.rowIcon}>
                <Ionicons name={iconForTemplate(item.template)} size={20} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowText}>{item.content}</Text>
                <Text style={styles.rowMeta}>
                  {relative(item.sent_at)} · {item.channel}
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.mist },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.card,
  },
  title: { fontSize: 22, fontWeight: "800", color: colors.ink, letterSpacing: -0.3 },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  row: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.md,
    alignItems: "flex-start",
    ...shadow.card,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentLo,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: { fontSize: 14, color: colors.ink, lineHeight: 20 },
  rowMeta: { fontSize: 11, color: colors.stone, marginTop: 4 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accentLo,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: colors.ink, marginTop: spacing.sm },
  emptyBody: {
    fontSize: 14,
    color: colors.slate,
    textAlign: "center",
    marginTop: spacing.sm,
    maxWidth: 280,
  },
});
