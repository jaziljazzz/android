import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { colors, radii, shadow, spacing } from "@/theme";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/hooks/useSession";
import { payForPlus } from "@/lib/pay";

const PERKS = [
  { icon: "flash" as const, title: "Priority join", body: "Skip the regular line at busy salons." },
  { icon: "cash-outline" as const, title: "Zero platform fee", body: "We absorb the booking fee on every visit." },
  { icon: "people-outline" as const, title: "Family profiles", body: "Hold spots for your partner and kids." },
  { icon: "gift-outline" as const, title: "Member-only offers", body: "Exclusive discounts from featured salons." },
];

const TIERS: { months: number; priceInr: number; label: string; hint: string; recommended?: boolean }[] = [
  { months: 1, priceInr: 99, label: "1 month", hint: "Try Plus" },
  { months: 12, priceInr: 799, label: "12 months", hint: "Save ₹389", recommended: true },
];

interface PlusStatus {
  plus_until: string | null;
}

export default function PlusScreen() {
  const router = useRouter();
  const { session } = useSession();
  const [status, setStatus] = useState<PlusStatus | null>(null);
  const [pending, setPending] = useState<number | null>(null);

  async function loadStatus() {
    if (!session) return;
    const { data } = await supabase.from("users").select("plus_until").eq("id", session.user.id).maybeSingle();
    setStatus((data as PlusStatus | null) ?? { plus_until: null });
  }

  useEffect(() => {
    void loadStatus();
  }, [session?.user.id]);

  async function buy(months: 1 | 12) {
    if (!session) {
      router.push("/auth/login");
      return;
    }
    setPending(months);
    try {
      await payForPlus({ months, email: session.user.email ?? "" });
      Alert.alert(
        "Payment received",
        "Plus activates the moment Razorpay confirms — usually within 30 seconds.",
      );
      setTimeout(() => loadStatus(), 5000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Payment cancelled";
      if (!msg.toLowerCase().includes("cancel")) {
        Alert.alert("Couldn't complete", msg);
      }
    } finally {
      setPending(null);
    }
  }

  const until = status?.plus_until ? new Date(status.plus_until) : null;
  const active = until && until > new Date();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.back} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color={colors.ink} />
          </Pressable>
        </View>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>Plus</Text>
        </View>
        <Text style={styles.title}>Skip the wait,{"\n"}every time.</Text>
        <Text style={styles.subtitle}>
          Priority joins · zero platform fees · family profiles · exclusive offers
        </Text>

        {active && until ? (
          <View style={styles.activeBox}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={styles.activeText}>
              Plus active until {until.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </Text>
          </View>
        ) : null}

        <View style={styles.perks}>
          {PERKS.map((p) => (
            <View key={p.title} style={styles.perkRow}>
              <View style={styles.perkIcon}>
                <Ionicons name={p.icon} size={18} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.perkTitle}>{p.title}</Text>
                <Text style={styles.perkBody}>{p.body}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.tiers}>
          {TIERS.map((t) => {
            const busy = pending === t.months;
            return (
              <Pressable
                key={t.months}
                onPress={() => buy(t.months as 1 | 12)}
                disabled={pending !== null}
                style={({ pressed }) => [
                  styles.tier,
                  t.recommended && styles.tierFeatured,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.tierLabel, t.recommended && { color: colors.white }]}>{t.label}</Text>
                  <Text style={[styles.tierHint, t.recommended && { color: "rgba(255,255,255,0.85)" }]}>{t.hint}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={[styles.tierPrice, t.recommended && { color: colors.white }]}>₹{t.priceInr}</Text>
                  {busy ? (
                    <ActivityIndicator color={t.recommended ? colors.white : colors.accent} />
                  ) : (
                    <Text style={[styles.tierBuy, t.recommended && { color: colors.white }]}>Subscribe →</Text>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.legal}>
          Subscriptions are 30 / 365-day prepaid passes. No auto-renew, no surprise charges. Cancel any time
          (it just stops at the end of your current pass).
        </Text>

        {Constants.appOwnership === "expo" ? (
          <Text style={styles.legal}>
            Plus checkout uses the native Razorpay SDK — runs in EAS builds only, not Expo Go.
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.mist },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  header: { marginBottom: spacing.lg },
  back: {
    width: 36, height: 36, borderRadius: radii.pill, backgroundColor: colors.white,
    alignItems: "center", justifyContent: "center", ...shadow.card,
  },
  badge: {
    alignSelf: "flex-start", backgroundColor: colors.ink, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: radii.pill,
  },
  badgeText: { color: colors.white, fontWeight: "800", letterSpacing: 1.5, fontSize: 11 },
  title: { marginTop: spacing.md, fontSize: 32, fontWeight: "800", color: colors.ink, letterSpacing: -0.5, lineHeight: 38 },
  subtitle: { marginTop: spacing.sm, fontSize: 14, color: colors.slate },
  activeBox: {
    marginTop: spacing.lg, backgroundColor: colors.successLo, padding: spacing.md, borderRadius: radii.lg,
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
  },
  activeText: { color: colors.success, fontWeight: "700" },
  perks: { marginTop: spacing.xl, gap: spacing.md },
  perkRow: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start" },
  perkIcon: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: colors.accentLo,
    alignItems: "center", justifyContent: "center",
  },
  perkTitle: { fontWeight: "800", color: colors.ink, fontSize: 15 },
  perkBody: { color: colors.slate, fontSize: 13, marginTop: 2 },
  tiers: { marginTop: spacing.xl, gap: spacing.sm },
  tier: {
    flexDirection: "row", alignItems: "center", padding: spacing.lg, borderRadius: radii.lg,
    backgroundColor: colors.white, ...shadow.card,
  },
  tierFeatured: { backgroundColor: colors.accent },
  tierLabel: { fontWeight: "800", color: colors.ink, fontSize: 17 },
  tierHint: { color: colors.slate, fontSize: 12, marginTop: 2 },
  tierPrice: { fontSize: 22, fontWeight: "800", color: colors.ink },
  tierBuy: { color: colors.accent, fontWeight: "700", fontSize: 12, marginTop: 2 },
  legal: { marginTop: spacing.lg, fontSize: 11, color: colors.stone, lineHeight: 16 },
});
