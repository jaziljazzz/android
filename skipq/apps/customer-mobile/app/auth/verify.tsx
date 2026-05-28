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

export default function VerifyScreen() {
  const router = useRouter();
  const { email, redirect } = useLocalSearchParams<{
    email?: string;
    redirect?: string;
  }>();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  async function verify() {
    setError(null);
    if (!email) {
      setError("Missing email — restart sign-in.");
      return;
    }
    if (!/^\d{4,8}$/u.test(code)) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    setVerifying(true);
    const { error: err } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });
    setVerifying(false);
    if (err) {
      setError(err.message);
      return;
    }
    if (redirect) router.replace(redirect as never);
    else router.replace("/");
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <Logo size={28} />
          <Text style={styles.title}>Enter your code</Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit code to{" "}
            <Text style={{ color: colors.ink, fontWeight: "700" }}>{email}</Text>.
            Check your inbox (or spam folder).
          </Text>

          <View style={styles.inputWrap}>
            <TextInput
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={8}
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              placeholder="••••••"
              placeholderTextColor={colors.stone}
              style={styles.codeInput}
              editable={!verifying}
              autoFocus
            />
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            onPress={verify}
            disabled={verifying}
            style={({ pressed }) => [
              styles.cta,
              (pressed || verifying) && { opacity: 0.85 },
            ]}
          >
            {verifying ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.ctaText}>Verify &amp; continue</Text>
            )}
          </Pressable>

          <Pressable onPress={() => router.back()} style={styles.backLink}>
            <Text style={styles.backLinkText}>← Use a different email</Text>
          </Pressable>
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
    fontSize: 28,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.5,
  },
  subtitle: { marginTop: spacing.sm, fontSize: 15, color: colors.slate },
  inputWrap: {
    marginTop: spacing.xl,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    height: 70,
    justifyContent: "center",
    ...shadow.card,
  },
  codeInput: {
    fontSize: 32,
    color: colors.ink,
    textAlign: "center",
    letterSpacing: 12,
    fontWeight: "700",
  },
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
  backLink: { marginTop: spacing.xl, alignItems: "center" },
  backLinkText: { color: colors.accent, fontWeight: "700", fontSize: 14 },
});
