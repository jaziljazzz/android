import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { colors, radii, shadow, spacing } from "@/theme";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/hooks/useSession";
import { ACCOUNT_URL, PRIVACY_URL, SIGNUP_URL } from "@/lib/urls";

interface ProfileRow {
  name: string | null;
  email: string | null;
  phone: string | null;
  profile_photo: string | null;
  total_visits: number;
  total_spend: number;
}

interface ReferralStats {
  my_code: string | null;
  referred_count: number;
}

export default function AccountScreen() {
  const router = useRouter();
  const { session, loading: sessionLoading } = useSession();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [referral, setReferral] = useState<ReferralStats | null>(null);
  const [loyaltyBalance, setLoyaltyBalance] = useState<number>(0);

  useEffect(() => {
    if (sessionLoading) return;
    if (!session) {
      setLoading(false);
      return;
    }
    (async () => {
      const [{ data }, { data: refRows }, { data: bal }] = await Promise.all([
        supabase
          .from("users")
          .select("name, email, phone, profile_photo, total_visits, total_spend")
          .eq("id", session.user.id)
          .maybeSingle(),
        supabase.rpc("my_referral_stats"),
        supabase.rpc("my_loyalty_balance"),
      ]);
      setProfile(data ?? null);
      setName(data?.name ?? "");
      setReferral((refRows?.[0] as ReferralStats | undefined) ?? null);
      setLoyaltyBalance(typeof bal === "number" ? bal : 0);
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

  async function pickAvatar() {
    if (!session) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "We need access to your photos to set an avatar.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled) return;
    const uri = result.assets[0]?.uri;
    if (!uri) return;

    setSaving(true);
    try {
      const ext = uri.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${session.user.id}/avatar-${Date.now()}.${ext}`;
      const res = await fetch(uri);
      const blob = await res.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, arrayBuffer, {
          contentType: blob.type || `image/${ext}`,
          upsert: true,
        });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = pub.publicUrl;
      const { error: updErr } = await supabase
        .from("users")
        .update({ profile_photo: publicUrl })
        .eq("id", session.user.id);
      if (updErr) throw updErr;
      setProfile((p) => (p ? { ...p, profile_photo: publicUrl } : p));
    } catch (err) {
      Alert.alert("Couldn't upload", err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
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

  async function exportMyData() {
    try {
      const { data, error } = await supabase.rpc("export_my_data");
      if (error) throw error;
      const json = JSON.stringify(data ?? {}, null, 2);
      const preview = json.length > 12000 ? json.slice(0, 12000) + `\n\n…truncated for share. Sign in to ${ACCOUNT_URL} to grab the full file.` : json;
      await Share.share({
        title: "My SkipQ data export",
        message: preview,
      });
    } catch (e) {
      Alert.alert("Export failed", e instanceof Error ? e.message : "Try again later.");
    }
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
          <Pressable onPress={pickAvatar} hitSlop={6} style={styles.avatarWrap}>
            {profile?.profile_photo ? (
              <Image source={{ uri: profile.profile_photo }} style={styles.avatar} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(profile?.name ?? profile?.email ?? "?").slice(0, 1).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              <Ionicons name="camera" size={11} color={colors.white} />
            </View>
          </Pressable>
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

        {referral?.my_code ? (
          <View style={styles.referralCard}>
            <View style={styles.referralHeader}>
              <Ionicons name="gift-outline" size={20} color={colors.accent} />
              <Text style={styles.referralTitle}>Invite friends</Text>
              {referral.referred_count > 0 ? (
                <View style={styles.referralCountPill}>
                  <Text style={styles.referralCountText}>{referral.referred_count} joined</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.referralCopy}>
              Share your code. They get a smoother first visit, you get the credit.
            </Text>
            <View style={styles.referralCodeRow}>
              <Text style={styles.referralCode}>{referral.my_code}</Text>
              <Pressable
                onPress={() =>
                  Share.share({
                    message: `Skip the salon queue with me on SkipQ. Use my code ${referral.my_code} when you sign up: ${SIGNUP_URL}`,
                  })
                }
                style={styles.referralShareBtn}
              >
                <Ionicons name="share-social" size={16} color={colors.white} />
                <Text style={styles.referralShareText}>Share</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {loyaltyBalance > 0 ? (
          <View style={styles.loyaltyRow}>
            <View style={styles.loyaltyIcon}>
              <Ionicons name="ribbon" size={20} color={colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.loyaltyTitle}>{loyaltyBalance} SkipQ points</Text>
              <Text style={styles.loyaltyBody}>
                ₹{loyaltyBalance} off your next booking. Redeem from the bookings tab.
              </Text>
            </View>
          </View>
        ) : null}

        <Pressable onPress={() => router.push("/plus")} style={styles.rowAction}>
          <Ionicons name="star-outline" size={22} color={colors.accent} />
          <Text style={styles.rowActionText}>SkipQ Plus</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.stone} />
        </Pressable>

        <Pressable onPress={exportMyData} style={[styles.rowAction, { marginTop: spacing.sm }]}>
          <Ionicons name="download-outline" size={22} color={colors.slate} />
          <Text style={styles.rowActionText}>Download my data</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.stone} />
        </Pressable>

        <Pressable onPress={confirmSignOut} style={[styles.rowAction, { marginTop: spacing.sm }]}>
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
          SkipQ never sells your phone or email. See our Privacy Policy at {PRIVACY_URL}.
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
  avatarWrap: { position: "relative" },
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
  avatarEditBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.white,
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

  loyaltyRow: {
    marginTop: spacing.lg,
    backgroundColor: colors.ink,
    padding: spacing.md,
    borderRadius: radii.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  loyaltyIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.accent, alignItems: "center", justifyContent: "center",
  },
  loyaltyTitle: { color: colors.white, fontWeight: "800", fontSize: 15 },
  loyaltyBody: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 },
  referralCard: {
    marginTop: spacing.xl,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadow.card,
  },
  referralHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  referralTitle: { fontSize: 16, fontWeight: "700", color: colors.ink, flex: 1 },
  referralCountPill: {
    backgroundColor: colors.successLo,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 999,
  },
  referralCountText: { fontSize: 11, fontWeight: "700", color: colors.success },
  referralCopy: { fontSize: 13, color: colors.slate, marginTop: 6, lineHeight: 18 },
  referralCodeRow: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  referralCode: {
    flex: 1,
    fontSize: 22,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: 4,
    backgroundColor: colors.mist,
    paddingVertical: 12,
    borderRadius: radii.md,
    textAlign: "center",
  },
  referralShareBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderRadius: radii.md,
  },
  referralShareText: { color: colors.white, fontWeight: "700", fontSize: 14 },
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
