import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { formatEta } from "@skipq/algorithm";
import { colors, radii, shadow, spacing } from "@/theme";
import { useSession } from "@/hooks/useSession";
import { isPayAvailable, payForQueueEntry } from "@/lib/pay";

export default function BookingConfirmedScreen() {
  const router = useRouter();
  const { session } = useSession();
  const { entryId, position, etaMin, salonName, total } = useLocalSearchParams<{
    entryId?: string;
    position?: string;
    etaMin?: string;
    salonName?: string;
    total?: string;
  }>();

  const pos = Number(position ?? 0);
  const eta = Number(etaMin ?? 0);
  const totalAmount = Number(total ?? 0);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);

  async function onPay() {
    if (!entryId) return;
    if (!session) {
      Alert.alert("Sign in", "Sign in to pay for this booking.");
      return;
    }
    setPaying(true);
    try {
      await payForQueueEntry({
        queueEntryId: entryId,
        customerName: session.user.user_metadata?.name ?? "SkipQ Customer",
        customerPhone: session.user.phone ?? "",
        salonName: salonName ?? "the salon",
      });
      setPaid(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Payment failed";
      Alert.alert("Payment failed", msg);
    } finally {
      setPaying(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.container}>
        <View style={styles.checkCircle}>
          <Ionicons name="checkmark" size={56} color={colors.white} />
        </View>
        <Text style={styles.title}>You&apos;re in the queue!</Text>
        <Text style={styles.subtitle}>
          We&apos;ll WhatsApp you as your turn approaches.
        </Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>You&apos;re number</Text>
            <Text style={styles.value}>#{pos}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>Estimated wait</Text>
            <Text style={styles.value}>{formatEta(eta)}</Text>
          </View>
          {salonName ? (
            <>
              <View style={styles.divider} />
              <View style={styles.row}>
                <Text style={styles.label}>At</Text>
                <Text style={[styles.value, { fontSize: 15 }]} numberOfLines={1}>
                  {salonName}
                </Text>
              </View>
            </>
          ) : null}
          {totalAmount > 0 ? (
            <>
              <View style={styles.divider} />
              <View style={styles.row}>
                <Text style={styles.label}>Total</Text>
                <Text style={styles.value}>₹{totalAmount.toFixed(0)}</Text>
              </View>
            </>
          ) : null}
        </View>

        {totalAmount > 0 && !paid && isPayAvailable() ? (
          <Pressable
            onPress={onPay}
            disabled={paying}
            style={({ pressed }) => [
              styles.payCta,
              (pressed || paying) && { opacity: 0.85 },
            ]}
          >
            {paying ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.payCtaText}>Pay ₹{totalAmount.toFixed(0)} now &amp; confirm slot</Text>
            )}
          </Pressable>
        ) : null}

        {paid ? (
          <View style={styles.paidPill}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={styles.paidPillText}>Paid — slot confirmed</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.footer}>
        <Pressable
          onPress={() => router.replace("/(tabs)/bookings")}
          style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.ctaText}>See live status</Text>
        </Pressable>
        <Pressable onPress={() => router.replace("/")} style={styles.secondary}>
          <Text style={styles.secondaryText}>Back to home</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.mist },
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg },
  checkCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.card,
  },
  title: {
    marginTop: spacing.xl,
    fontSize: 28,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.5,
    textAlign: "center",
  },
  subtitle: {
    marginTop: spacing.sm,
    fontSize: 15,
    color: colors.slate,
    textAlign: "center",
    maxWidth: 320,
  },
  card: {
    marginTop: spacing.xl,
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing.lg,
    width: "100%",
    maxWidth: 380,
    ...shadow.card,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  label: { fontSize: 14, color: colors.slate },
  value: { fontSize: 20, fontWeight: "800", color: colors.ink },
  divider: { height: 1, backgroundColor: colors.border },
  payCta: {
    marginTop: spacing.lg,
    backgroundColor: colors.ink,
    borderRadius: radii.lg,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    ...shadow.card,
  },
  payCtaText: { color: colors.white, fontSize: 15, fontWeight: "700" },
  paidPill: {
    marginTop: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.successLo,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radii.pill,
  },
  paidPillText: { color: colors.success, fontWeight: "700", fontSize: 14 },
  footer: { padding: spacing.lg, gap: spacing.sm },
  cta: {
    backgroundColor: colors.accent,
    borderRadius: radii.lg,
    paddingVertical: 16,
    alignItems: "center",
    ...shadow.card,
  },
  ctaText: { color: colors.white, fontSize: 17, fontWeight: "700", letterSpacing: 0.2 },
  secondary: { alignItems: "center", paddingVertical: spacing.md },
  secondaryText: { color: colors.slate, fontSize: 15, fontWeight: "600" },
});
