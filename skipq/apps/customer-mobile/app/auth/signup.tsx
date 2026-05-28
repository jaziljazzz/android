import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Logo } from "@/components/Logo";
import { colors, radii, shadow, spacing } from "@/theme";
import { supabase } from "@/lib/supabase";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/u;

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSignup() {
    setError(null);
    if (!EMAIL_RE.test(email.trim())) {
      setError("Enter a valid email address");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setBusy(true);
    const { data, error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    if (!data.session) {
      // Confirm email enabled in Supabase — user must click email link first
      Alert.alert(
        "Check your email",
        `We sent a confirmation link to ${email.trim()}. Tap it, then come back here to sign in.`,
        [{ text: "OK", onPress: () => router.replace("/auth/login") }],
      );
    } else {
      router.replace("/");
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <Logo size={28} />
          <Text style={styles.title}>Create your{"\n"}SkipQ account</Text>

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
                editable={!busy}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrap}>
              <TextInput
                placeholder="At least 8 characters"
                placeholderTextColor={colors.stone}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="new-password"
                style={styles.input}
                editable={!busy}
              />
            </View>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            onPress={onSignup}
            disabled={busy}
            style={({ pressed }) => [
              styles.cta,
              (pressed || busy) && { opacity: 0.85 },
            ]}
          >
            {busy ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.ctaText}>Create account</Text>
            )}
          </Pressable>

          <Pressable onPress={() => router.replace("/auth/login")} style={styles.signinLink}>
            <Text style={styles.signinLinkText}>
              Already have an account?{" "}
              <Text style={{ color: colors.accent, fontWeight: "700" }}>Sign in</Text>
            </Text>
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
    marginTop: spacing.lg,
    fontSize: 28,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  fieldGroup: { marginTop: spacing.lg },
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
  input: { fontSize: 17, color: colors.ink, fontWeight: "600" },
  error: { marginTop: spacing.md, fontSize: 13, color: colors.accent, fontWeight: "500" },
  cta: {
    marginTop: spacing.xl,
    backgroundColor: colors.accent,
    borderRadius: radii.lg,
    paddingVertical: 16,
    alignItems: "center",
    ...shadow.card,
  },
  ctaText: { color: colors.white, fontSize: 17, fontWeight: "700", letterSpacing: 0.2 },
  signinLink: { marginTop: spacing.lg, alignItems: "center" },
  signinLinkText: { color: colors.slate, fontSize: 14 },
});
