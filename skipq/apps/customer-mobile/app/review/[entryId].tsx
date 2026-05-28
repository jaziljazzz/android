import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { colors, radii, shadow, spacing } from "@/theme";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/hooks/useSession";

interface QueueRow {
  id: string;
  salon_id: string;
  stylist_id: string | null;
  user_id: string | null;
  status: string;
  salons: { name: string; area: string | null } | { name: string; area: string | null }[] | null;
}

function pickOne<T>(v: T | T[] | null): T | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0] ?? null : v;
}

export default function ReviewScreen() {
  const router = useRouter();
  const { entryId } = useLocalSearchParams<{ entryId: string }>();
  const { session } = useSession();

  const [entry, setEntry] = useState<QueueRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!entryId || !session) return;
    (async () => {
      const { data } = await supabase
        .from("queue_entries")
        .select(
          `id, salon_id, stylist_id, user_id, status,
           salons ( name, area )`,
        )
        .eq("id", entryId)
        .maybeSingle();
      setEntry((data as QueueRow | null) ?? null);
      setLoading(false);
    })();
  }, [entryId, session?.user.id]);

  async function submit() {
    if (!entry || !session) return;
    if (entry.status !== "completed") {
      Alert.alert("Can't rate yet", "You can rate this visit once the service is complete.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("reviews").insert({
      user_id: session.user.id,
      salon_id: entry.salon_id,
      stylist_id: entry.stylist_id,
      queue_entry_id: entry.id,
      rating,
      text: text.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      if (error.code === "23505") {
        Alert.alert("Already rated", "You've already rated this visit.");
        router.back();
        return;
      }
      Alert.alert("Couldn't save", error.message);
      return;
    }
    Alert.alert("Thanks!", "Your rating helps other customers find the right salon.", [
      { text: "OK", onPress: () => router.replace("/(tabs)/history") },
    ]);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!entry) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <Text style={{ color: colors.stone }}>Booking not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const salon = pickOne(entry.salons);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <Pressable onPress={() => router.back()} style={styles.back}>
            <Ionicons name="chevron-back" size={26} color={colors.ink} />
          </Pressable>

          <Text style={styles.title}>How was your visit?</Text>
          <Text style={styles.subtitle}>{salon?.name ?? "the salon"}</Text>

          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable key={n} onPress={() => setRating(n)} hitSlop={12}>
                <Ionicons
                  name={n <= rating ? "star" : "star-outline"}
                  size={42}
                  color={n <= rating ? colors.caution : colors.stone}
                />
              </Pressable>
            ))}
          </View>
          <Text style={styles.ratingHint}>
            {rating === 5
              ? "Excellent"
              : rating === 4
              ? "Good"
              : rating === 3
              ? "Okay"
              : rating === 2
              ? "Not great"
              : "Bad"}
          </Text>

          <Text style={styles.fieldLabel}>What stood out? (optional)</Text>
          <View style={styles.textareaWrap}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Tell other customers what they should know"
              placeholderTextColor={colors.stone}
              multiline
              numberOfLines={4}
              maxLength={500}
              style={styles.textarea}
              editable={!submitting}
            />
          </View>

          <Pressable
            onPress={submit}
            disabled={submitting}
            style={({ pressed }) => [
              styles.cta,
              (pressed || submitting) && { opacity: 0.85 },
            ]}
          >
            {submitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.ctaText}>Submit rating</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.mist },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  back: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  title: { fontSize: 28, fontWeight: "800", color: colors.ink, letterSpacing: -0.5 },
  subtitle: { fontSize: 16, color: colors.slate, marginTop: 4 },
  starsRow: {
    marginTop: spacing.xxl,
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.sm,
  },
  ratingHint: {
    marginTop: spacing.md,
    fontSize: 16,
    fontWeight: "700",
    color: colors.ink,
    textAlign: "center",
  },
  fieldLabel: {
    marginTop: spacing.xl,
    fontSize: 11,
    fontWeight: "700",
    color: colors.slate,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  textareaWrap: {
    marginTop: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    minHeight: 120,
    ...shadow.card,
  },
  textarea: {
    fontSize: 15,
    color: colors.ink,
    minHeight: 90,
    textAlignVertical: "top",
  },
  cta: {
    marginTop: spacing.xl,
    backgroundColor: colors.accent,
    borderRadius: radii.lg,
    paddingVertical: 16,
    alignItems: "center",
    ...shadow.card,
  },
  ctaText: { color: colors.white, fontSize: 17, fontWeight: "700", letterSpacing: 0.2 },
});
