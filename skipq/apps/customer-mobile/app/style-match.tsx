import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { colors, radii, shadow, spacing } from "@/theme";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/hooks/useSession";

const CATEGORIES = ["Haircut", "Beard", "Colour", "Facial", "Bridal"];

interface Match {
  stylist_id: string;
  stylist_name: string;
  role: string | null;
  specialty: string | null;
  photo: string | null;
  rating: number | string | null;
  salon_id: string;
  salon_name: string;
  area: string | null;
  distance_km: number | string | null;
}

export default function StyleMatchScreen() {
  const router = useRouter();
  const { session } = useSession();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [uploadingPath, setUploadingPath] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void runMatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  async function pickPhoto() {
    if (!session) {
      router.push("/auth/login");
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== "granted") {
      Alert.alert("Permission needed", "Photo access is required to pick a reference image.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (res.canceled || !res.assets[0]) return;
    setPhotoUri(res.assets[0].uri);
    const ext = res.assets[0].uri.split(".").pop() || "jpg";
    const path = `${session.user.id}/${Date.now()}.${ext}`;
    try {
      const blob = await fetch(res.assets[0].uri).then((r) => r.blob());
      const { error } = await supabase.storage.from("style-references").upload(path, blob, {
        contentType: `image/${ext === "jpg" ? "jpeg" : ext}`,
        upsert: false,
      });
      if (error) throw error;
      setUploadingPath(path);
    } catch (e) {
      Alert.alert("Upload failed", e instanceof Error ? e.message : "Try again.");
    }
  }

  async function runMatch() {
    setLoading(true);
    try {
      let lat: number | null = null;
      let lng: number | null = null;
      const perm = await Location.getForegroundPermissionsAsync();
      if (perm.granted) {
        const pos = await Location.getLastKnownPositionAsync({});
        if (pos) {
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        }
      }
      const { data } = await supabase.rpc("match_style_stylists", {
        p_keyword: category ?? undefined,
        p_lat: lat ?? undefined,
        p_lng: lng ?? undefined,
        p_radius_km: 15,
        p_limit: 12,
      });
      setMatches((data ?? []) as Match[]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={colors.ink} />
        </Pressable>
        <Text style={styles.title}>Find your look</Text>
        <Text style={styles.subtitle}>
          Upload a reference photo or pick a category — we surface the top-rated stylists nearby.
        </Text>

        <Pressable onPress={pickPhoto} style={styles.uploader}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.uploaderImg} resizeMode="cover" />
          ) : (
            <>
              <Ionicons name="image-outline" size={28} color={colors.accent} />
              <Text style={styles.uploaderText}>Tap to upload a reference photo</Text>
              <Text style={styles.uploaderHint}>JPG or PNG, max 5 MB · stays private to you</Text>
            </>
          )}
        </Pressable>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Pressable onPress={() => setCategory(null)} style={[styles.chip, !category && styles.chipActive]}>
            <Text style={[styles.chipText, !category && styles.chipTextActive]}>All</Text>
          </Pressable>
          {CATEGORIES.map((c) => {
            const active = category === c;
            return (
              <Pressable
                key={c}
                onPress={() => setCategory(active ? null : c)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{c}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : matches && matches.length > 0 ? (
          <FlatList
            scrollEnabled={false}
            data={matches}
            keyExtractor={(item) => item.stylist_id}
            ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => router.push(`/salon/${item.salon_id}`)}
                style={styles.matchRow}
              >
                {item.photo ? (
                  <Image source={{ uri: item.photo }} style={styles.matchPhoto} />
                ) : (
                  <View style={[styles.matchPhoto, { alignItems: "center", justifyContent: "center" }]}>
                    <Ionicons name="person" size={20} color={colors.stone} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.matchName}>{item.stylist_name}</Text>
                  <Text style={styles.matchMeta}>
                    {[item.role, item.specialty].filter(Boolean).join(" · ") || "Stylist"}
                  </Text>
                  <Text style={styles.matchSalon}>
                    {item.salon_name}
                    {item.area ? ` · ${item.area}` : ""}
                    {item.distance_km != null
                      ? ` · ${Number(item.distance_km).toFixed(1)} km`
                      : ""}
                  </Text>
                </View>
                {item.rating ? (
                  <View style={styles.ratingPill}>
                    <Ionicons name="star" size={11} color={colors.caution} />
                    <Text style={styles.ratingText}>{Number(item.rating).toFixed(1)}</Text>
                  </View>
                ) : null}
              </Pressable>
            )}
          />
        ) : (
          <Text style={styles.muted}>No matching stylists yet. Try a different category.</Text>
        )}

        {uploadingPath ? (
          <Text style={styles.legal}>
            Your reference photo is private. When you book one of these stylists, we surface it
            in their queue view so they can match the cut you want.
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.mist },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  back: {
    width: 36, height: 36, borderRadius: radii.pill, backgroundColor: colors.white,
    alignItems: "center", justifyContent: "center", ...shadow.card, marginBottom: spacing.md,
  },
  title: { fontSize: 28, fontWeight: "800", color: colors.ink, letterSpacing: -0.5 },
  subtitle: { color: colors.slate, fontSize: 14, marginTop: spacing.sm },
  uploader: {
    marginTop: spacing.lg, padding: spacing.xl, borderRadius: radii.lg, backgroundColor: colors.white,
    alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderStyle: "dashed",
    borderColor: colors.border, minHeight: 160,
  },
  uploaderImg: { width: "100%", height: 200, borderRadius: radii.md },
  uploaderText: { marginTop: spacing.sm, color: colors.ink, fontWeight: "700" },
  uploaderHint: { color: colors.stone, fontSize: 11, marginTop: 4 },
  chips: { gap: 8, paddingVertical: spacing.lg },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radii.pill,
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { color: colors.ink, fontSize: 13, fontWeight: "700" },
  chipTextActive: { color: colors.white },
  loading: { paddingVertical: spacing.xl, alignItems: "center" },
  matchRow: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    backgroundColor: colors.white, padding: spacing.md, borderRadius: radii.lg, ...shadow.card,
  },
  matchPhoto: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.mist },
  matchName: { color: colors.ink, fontWeight: "800", fontSize: 15 },
  matchMeta: { color: colors.slate, fontSize: 12, marginTop: 2 },
  matchSalon: { color: colors.stone, fontSize: 11, marginTop: 2 },
  ratingPill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: colors.mist, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radii.pill,
  },
  ratingText: { fontSize: 11, color: colors.ink, fontWeight: "700" },
  muted: { marginTop: spacing.lg, color: colors.stone, fontSize: 13 },
  legal: { marginTop: spacing.lg, fontSize: 11, color: colors.stone, lineHeight: 16 },
});
