import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Logo } from "@/components/Logo";
import { colors, radii, shadow, spacing } from "@/theme";
import { supabase } from "@/lib/supabase";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/u;

export default function LoginScreen() {
  const router = useRouter();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function sendOtp() {
    setError(null);
    const cleaned = email.trim();
    if (!EMAIL_RE.test(cleaned)) {
      setError("Enter a valid email address");
      return;
    }
    setSending(true);
    const { error: err } = await supabase.auth.signInWithOtp({
      email: cleaned,
      options: { shouldCreateUser: true },
    });
    setSending(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push({
      pathname: "/auth/verify",
      params: { email: cleaned, ...(redirect ? { redirect } : {}) },
    });
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <Logo size={30} />
          <Text style={styles.title}>
            One quick step{"\n"}to{" "}
            <Text style={{ color: colors.accent }}>skip the line</Text>
          </Text>
          <Text style={styles.subtitle}>
            We&apos;ll email you a 6-digit code to confirm it&apos;s you.
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrap}>
              <TextInput
                placeholder="you@email.com"
                placeholderTextColor={colors.stone}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoComplete="email"
                autoCapitalize="none"
                style={styles.input}
                editable={!sending}
              />
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>

          <Pressable
            onPress={sendOtp}
            disabled={sending}
            style={({ pressed }) => [
              styles.cta,
              (pressed || sending) && { opacity: 0.85 },
            ]}
          >
            {sending ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.ctaText}>Send code</Text>
            )}
          </Pressable>

          <Text style={styles.tos}>
            By continuing you agree to SkipQ&apos;s Terms and Privacy Policy.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.mist },
  container: { flex: 1, padding: spacing.lg, paddingTop: spacing.xl },
  title: {
    marginTop: spacing.xl,
    fontSize: 30,
    fontWeight: "800",
    color: colors.ink,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  subtitle: { marginTop: spacing.sm, fontSize: 15, color: colors.slate },
  fieldGroup: { marginTop: spacing.xl },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.slate,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  inputWrap: {
    marginTop: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    height: 56,
    justifyContent: "center",
    ...shadow.card,
  },
  input: { fontSize: 18, color: colors.ink, fontWeight: "600" },
  error: { marginTop: spacing.sm, fontSize: 13, color: colors.accent, fontWeight: "500" },
  cta: {
    marginTop: spacing.xl,
    backgroundColor: colors.accent,
    borderRadius: radii.lg,
    paddingVertical: 16,
    alignItems: "center",
    ...shadow.card,
  },
  ctaText: { color: colors.white, fontSize: 17, fontWeight: "700", letterSpacing: 0.2 },
  tos: { marginTop: spacing.lg, fontSize: 12, color: colors.stone, textAlign: "center" },
});
