import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors, radii, shadow, spacing } from "@/theme";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/hooks/useSession";

interface ProfileRow {
  name: string | null;
  email: string | null;
  phone: string | null;
  total_visits: number;
  total_spend: number;
}

export default function AccountScreen() {
  const router = useRouter();
  const { session, loading: sessionLoading } = useSession();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (sessionLoading) return;
    if (!session) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("users")
        .select("name, email, phone, total_visits, total_spend")
        .eq("id", session.user.id)
        .maybeSingle();
      setProfile(data ?? null);
      setName(data?.name ?? "");
      setLoading(false);
    })();
  }, [session?.user.id, sessionLoading]);

  async function saveName() {
    if (!session) return;
    setSaving(true);
    const { error } = await supabase
      .from("users")
      .update({ name: name.trim() || null })
      .eq("id", session.user.id);
    setSaving(false);
    if (error) Alert.alert("Couldn't save", error.message);
    else setProfile((p) => (p ? { ...p, name: name.trim() || null } : p));
  }

  function confirmSignOut() {
    Alert.alert("Sign out?", "You'll need to sign back in to join a queue.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace("/auth/login");
        },
      },
    ]);
  }

  function confirmDeleteAccount() {
    Alert.alert(
      "Delete your account?",
      "Your profile and queue history will be permanently removed. Visits to salons may still be retained for those salons' records.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase.rpc("delete_my_account");
            if (error) {
              Alert.alert("Couldn't delete", error.message);
              return;
            }
            await supabase.auth.signOut();
            router.replace("/auth/login");
          },
        },
      ],
    );
  }

  if (loading || sessionLoading) {
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
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Account</Text>
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="person-outline" size={28} color={colors.accent} />
            </View>
            <Text style={styles.emptyTitle}>Sign in to manage your account</Text>
            <Text style={styles.emptyBody}>
              Sign in to update your profile and see your saved details.
            </Text>
            <Pressable
              onPress={() => router.push("/auth/login")}
              style={styles.signInCta}
            >
              <Text style={styles.signInCtaText}>Sign in</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Account</Text>

        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(profile?.name ?? profile?.email ?? "?").slice(0, 1).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={styles.identityName} numberOfLines={1}>
              {profile?.name ?? "Add your name"}
            </Text>
            <Text style={styles.identityEmail} numberOfLines={1}>
              {profile?.email ?? session.user.email ?? profile?.phone ?? "—"}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile?.total_visits ?? 0}</Text>
            <Text style={styles.statLabel}>visits</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              ₹{Number(profile?.total_spend ?? 0).toFixed(0)}
            </Text>
            <Text style={styles.statLabel}>spent</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Your name</Text>
          <View style={styles.fieldRow}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="What should we call you?"
              placeholderTextColor={colors.stone}
              style={styles.input}
              editable={!saving}
              returnKeyType="done"
              onSubmitEditing={saveName}
            />
            <Pressable
              onPress={saveName}
              disabled={saving || name === (profile?.name ?? "")}
              style={[
                styles.saveBtn,
                (saving || name === (profile?.name ?? "")) && { opacity: 0.5 },
              ]}
            >
              <Text style={styles.saveBtnText}>{saving ? "…" : "Save"}</Text>
            </Pressable>
          </View>
        </View>

        <Pressable onPress={confirmSignOut} style={styles.rowAction}>
          <Ionicons name="log-out-outline" size={22} color={colors.slate} />
          <Text style={styles.rowActionText}>Sign out</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.stone} />
        </Pressable>

        <Pressable onPress={confirmDeleteAccount} style={[styles.rowAction, { marginTop: spacing.sm }]}>
          <Ionicons name="trash-outline" size={22} color={colors.accent} />
          <Text style={[styles.rowActionText, { color: colors.accent }]}>Delete account</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.accent} />
        </Pressable>

        <Text style={styles.legal}>
          SkipQ never sells your phone or email. See our Privacy Policy at skipq.in/privacy.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.mist },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  container: { padding: spacing.lg },
  title: { fontSize: 32, fontWeight: "800", color: colors.ink, letterSpacing: -0.5 },
  empty: {
    marginTop: spacing.xl,
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
  emptyTitle: {
    marginTop: spacing.md,
    fontSize: 16,
    fontWeight: "700",
    color: colors.ink,
    textAlign: "center",
  },
  emptyBody: {
    marginTop: 4,
    fontSize: 13,
    color: colors.stone,
    textAlign: "center",
  },
  signInCta: {
    marginTop: spacing.lg,
    backgroundColor: colors.accent,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
  },
  signInCtaText: { color: colors.white, fontWeight: "700" },
  avatarRow: {
    marginTop: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing.md,
    ...shadow.card,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accentLo,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.accent,
  },
  identityName: { fontSize: 17, fontWeight: "700", color: colors.ink },
  identityEmail: { fontSize: 13, color: colors.stone, marginTop: 2 },

  statsRow: {
    marginTop: spacing.md,
    flexDirection: "row",
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.md,
    alignItems: "center",
    ...shadow.card,
  },
  statValue: { fontSize: 22, fontWeight: "800", color: colors.ink },
  statLabel: { fontSize: 11, color: colors.stone, marginTop: 2, textTransform: "uppercase", letterSpacing: 1 },

  section: { marginTop: spacing.xl },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.slate,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 52,
    ...shadow.card,
  },
  input: { flex: 1, fontSize: 16, color: colors.ink, fontWeight: "600" },
  saveBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    backgroundColor: colors.accent,
    borderRadius: radii.md,
  },
  saveBtnText: { color: colors.white, fontWeight: "700", fontSize: 13 },

  rowAction: {
    marginTop: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    gap: spacing.md,
    ...shadow.card,
  },
  rowActionText: { flex: 1, fontSize: 15, fontWeight: "600", color: colors.ink },

  legal: {
    marginTop: spacing.xl,
    fontSize: 11,
    color: colors.stone,
    textAlign: "center",
    paddingHorizontal: spacing.md,
  },
});
