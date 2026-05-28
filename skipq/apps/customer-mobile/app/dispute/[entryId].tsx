import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { colors, radii, shadow, spacing } from "@/theme";
import { supabase } from "@/lib/supabase";

const PRESETS = [
  "Stylist refused service",
  "Charged more than the agreed price",
  "Service didn't match what I booked",
  "I was marked no-show but I was there",
];

export default function DisputeScreen() {
  const { entryId } = useLocalSearchParams<{ entryId: string }>();
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!entryId || !reason.trim()) return;
    setBusy(true);
    const { error } = await supabase.rpc("file_dispute", {
      p_queue_entry_id: entryId,
      p_reason: reason.trim().slice(0, 500),
    });
    setBusy(false);
    if (error) {
      Alert.alert("Couldn't file", error.message);
      return;
    }
    Alert.alert(
      "Got it",
      "We've logged your report. The SkipQ team reviews disputes within 48 hours and will reach out.",
      [{ text: "OK", onPress: () => router.back() }],
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={colors.ink} />
        </Pressable>
        <Text style={styles.title}>Report an issue</Text>
        <Text style={styles.subtitle}>
          Tell us what went wrong. We&apos;ll review and follow up — if we can verify, we&apos;ll
          refund any pre-payment.
        </Text>

        <View style={styles.presets}>
          {PRESETS.map((p) => (
            <Pressable key={p} onPress={() => setReason(p)} style={styles.presetChip}>
              <Text style={styles.presetText}>{p}</Text>
            </Pressable>
          ))}
        </View>

        <TextInput
          value={reason}
          onChangeText={setReason}
          multiline
          maxLength={500}
          placeholder="What happened?"
          placeholderTextColor={colors.stone}
          style={styles.input}
          textAlignVertical="top"
        />
        <Text style={styles.counter}>{reason.length}/500</Text>

        <Pressable
          onPress={submit}
          disabled={busy || !reason.trim()}
          style={({ pressed }) => [
            styles.cta,
            (pressed || busy || !reason.trim()) && { opacity: 0.6 },
          ]}
        >
          {busy ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.ctaText}>Submit</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.mist },
  container: { padding: spacing.lg },
  back: {
    width: 36, height: 36, borderRadius: radii.pill, backgroundColor: colors.white,
    alignItems: "center", justifyContent: "center", ...shadow.card, marginBottom: spacing.md,
  },
  title: { fontSize: 26, fontWeight: "800", color: colors.ink, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: colors.slate, marginTop: spacing.sm },
  presets: { marginTop: spacing.lg, flexDirection: "row", flexWrap: "wrap", gap: 8 },
  presetChip: { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radii.pill, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  presetText: { color: colors.ink, fontSize: 12, fontWeight: "700" },
  input: {
    marginTop: spacing.lg, backgroundColor: colors.white, borderRadius: radii.lg,
    padding: spacing.md, minHeight: 140, color: colors.ink, fontSize: 15,
    borderWidth: 1, borderColor: colors.border,
  },
  counter: { textAlign: "right", color: colors.stone, fontSize: 11, marginTop: 4 },
  cta: {
    marginTop: spacing.lg, paddingVertical: 14, borderRadius: radii.lg,
    backgroundColor: colors.accent, alignItems: "center", ...shadow.card,
  },
  ctaText: { color: colors.white, fontWeight: "800" },
});
