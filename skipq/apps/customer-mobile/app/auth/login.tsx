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

type Mode = "password" | "code";

export default function LoginScreen() {
  const router = useRouter();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function validateEmail(): boolean {
    if (!EMAIL_RE.test(email.trim())) {
      setError("Enter a valid email address");
      return false;
    }
    return true;
  }

  async function passwordSignIn() {
    setError(null);
    if (!validateEmail()) return;
    if (password.length < 1) {
      setError("Enter your password");
      return;
    }
    setBusy(true);
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    if (redirect) router.replace(redirect as never);
    else router.replace("/");
  }

  async function sendCode() {
    setError(null);
    if (!validateEmail()) return;
    setBusy(true);
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push({
      pathname: "/auth/verify",
      params: { email: email.trim(), ...(redirect ? { redirect } : {}) },
    });
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <Logo size={28} />
          <Text style={styles.title}>
            Welcome to{" "}
            <Text style={{ color: colors.accent }}>SkipQ</Text>
          </Text>

          <View style={styles.tabs}>
            <Pressable
              onPress={() => setMode("password")}
              style={[styles.tab, mode === "password" && styles.tabActive]}
            >
              <Text style={[styles.tabText, mode === "password" && styles.tabTextActive]}>
                Password
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setMode("code")}
              style={[styles.tab, mode === "code" && styles.tabActive]}
            >
              <Text style={[styles.tabText, mode === "code" && styles.tabTextActive]}>
                Email code
              </Text>
            </Pressable>
          </View>

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

          {mode === "password" ? (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  placeholder="••••••••"
                  placeholderTextColor={colors.stone}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="current-password"
                  style={styles.input}
                  editable={!busy}
                />
              </View>
            </View>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            onPress={mode === "password" ? passwordSignIn : sendCode}
            disabled={busy}
            style={({ pressed }) => [
              styles.cta,
              (pressed || busy) && { opacity: 0.85 },
            ]}
          >
            {busy ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.ctaText}>
                {mode === "password" ? "Sign in" : "Send code"}
              </Text>
            )}
          </Pressable>

          <Pressable onPress={() => router.push("/auth/signup")} style={styles.signupLink}>
            <Text style={styles.signupLinkText}>
              First time?{" "}
              <Text style={{ color: colors.accent, fontWeight: "700" }}>Create an account</Text>
            </Text>
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
    marginTop: spacing.lg,
    fontSize: 28,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.5,
  },
  tabs: {
    marginTop: spacing.lg,
    flexDirection: "row",
    backgroundColor: colors.mist,
    borderRadius: radii.lg,
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radii.md,
    alignItems: "center",
  },
  tabActive: { backgroundColor: colors.white, ...shadow.card },
  tabText: { color: colors.stone, fontWeight: "600", fontSize: 14 },
  tabTextActive: { color: colors.ink },
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
  signupLink: { marginTop: spacing.lg, alignItems: "center" },
  signupLinkText: { color: colors.slate, fontSize: 14 },
  tos: { marginTop: spacing.lg, fontSize: 12, color: colors.stone, textAlign: "center" },
});
