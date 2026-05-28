import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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
import * as ImagePicker from "expo-image-picker";
import { colors, radii, shadow, spacing } from "@/theme";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/hooks/useSession";

interface EntryRow {
  id: string;
  salon_id: string;
  stylist_id: string | null;
  user_id: string | null;
  status: string;
  queue_entry_services: { services: { name: string } | { name: string }[] | null }[] | null;
}

interface ExistingRecord {
  id: string;
  customer_notes: string | null;
  stylist_notes: string | null;
  photos: string[];
}

function pickOne<T>(v: T | T[] | null): T | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0] ?? null : v;
}

export default function StyleRecordScreen() {
  const router = useRouter();
  const { entryId } = useLocalSearchParams<{ entryId: string }>();
  const { session } = useSession();

  const [entry, setEntry] = useState<EntryRow | null>(null);
  const [existing, setExisting] = useState<ExistingRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<string[]>([]); // local URIs to upload
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!entryId || !session) return;
    (async () => {
      const [entryRes, recordRes] = await Promise.all([
        supabase
          .from("queue_entries")
          .select(
            `id, salon_id, stylist_id, user_id, status,
             queue_entry_services ( services ( name ) )`,
          )
          .eq("id", entryId)
          .maybeSingle(),
        supabase
          .from("style_records")
          .select("id, customer_notes, stylist_notes, photos")
          .eq("queue_entry_id", entryId)
          .maybeSingle(),
      ]);
      setEntry((entryRes.data as EntryRow | null) ?? null);
      if (recordRes.data) {
        setExisting(recordRes.data as ExistingRecord);
        setNotes((recordRes.data as ExistingRecord).customer_notes ?? "");
      }
      setLoading(false);
    })();
  }, [entryId, session?.user.id]);

  async function pickImage() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "We need access to your photos so you can attach them.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsMultipleSelection: true,
      selectionLimit: 4,
    });
    if (result.canceled) return;
    const uris = result.assets.map((a) => a.uri);
    setPhotos((prev) => [...prev, ...uris].slice(0, 6));
  }

  function removeNewPhoto(i: number) {
    setPhotos((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function uploadPhotos(userId: string): Promise<string[]> {
    const uploaded: string[] = [];
    for (const uri of photos) {
      const ext = uri.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${userId}/${entryId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      // Convert file:// URI to blob/array buffer
      const res = await fetch(uri);
      const blob = await res.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();
      const { error: upErr } = await supabase.storage
        .from("style-records")
        .upload(path, arrayBuffer, {
          contentType: blob.type || `image/${ext}`,
          upsert: false,
        });
      if (upErr) {
        throw new Error(`Photo upload failed: ${upErr.message}`);
      }
      uploaded.push(path);
    }
    return uploaded;
  }

  async function save() {
    if (!entry || !session) return;
    if (entry.status !== "completed") {
      Alert.alert("Wait until the visit is complete", "You can add notes and photos once your stylist marks the service done.");
      return;
    }
    setSubmitting(true);
    try {
      const newPaths = photos.length > 0 ? await uploadPhotos(session.user.id) : [];
      const allPhotos = [...(existing?.photos ?? []), ...newPaths];

      const serviceNames = (entry.queue_entry_services ?? [])
        .map((qes) => {
          const s = pickOne(qes.services);
          return s?.name;
        })
        .filter(Boolean)
        .join(" + ");

      if (existing) {
        const { error } = await supabase
          .from("style_records")
          .update({ customer_notes: notes.trim() || null, photos: allPhotos })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("style_records").insert({
          user_id: session.user.id,
          queue_entry_id: entry.id,
          salon_id: entry.salon_id,
          stylist_id: entry.stylist_id,
          service_summary: serviceNames || null,
          customer_notes: notes.trim() || null,
          photos: allPhotos,
        });
        if (error) throw error;
      }
      Alert.alert("Saved", "Your style record is saved. You can come back any time.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert("Couldn't save", err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
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

          <Text style={styles.title}>Style record</Text>
          <Text style={styles.subtitle}>
            Save your haircut details + photos so future visits feel custom-made for you.
          </Text>

          {existing?.stylist_notes ? (
            <View style={styles.stylistCard}>
              <Text style={styles.stylistLabel}>Stylist notes</Text>
              <Text style={styles.stylistText}>{existing.stylist_notes}</Text>
            </View>
          ) : null}

          <Text style={styles.fieldLabel}>Your notes</Text>
          <View style={styles.textareaWrap}>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="What worked, what you'd change next time, clipper sizes…"
              placeholderTextColor={colors.stone}
              multiline
              numberOfLines={4}
              maxLength={800}
              style={styles.textarea}
              editable={!submitting}
            />
          </View>

          <Text style={styles.fieldLabel}>Photos</Text>
          <View style={styles.photoGrid}>
            {(existing?.photos ?? []).map((path) => (
              <ExistingPhoto key={path} path={path} />
            ))}
            {photos.map((uri, i) => (
              <View key={uri} style={styles.photoTile}>
                <Image source={{ uri }} style={styles.photoImage} />
                <Pressable
                  onPress={() => removeNewPhoto(i)}
                  style={styles.photoRemove}
                  hitSlop={6}
                >
                  <Ionicons name="close" size={14} color={colors.white} />
                </Pressable>
              </View>
            ))}
            {(existing?.photos?.length ?? 0) + photos.length < 6 ? (
              <Pressable onPress={pickImage} style={styles.photoAdd}>
                <Ionicons name="add" size={28} color={colors.accent} />
                <Text style={styles.photoAddText}>Add photo</Text>
              </Pressable>
            ) : null}
          </View>

          <Pressable
            onPress={save}
            disabled={submitting}
            style={({ pressed }) => [styles.cta, (pressed || submitting) && { opacity: 0.85 }]}
          >
            {submitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.ctaText}>{existing ? "Save changes" : "Save style record"}</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ExistingPhoto({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase.storage
      .from("style-records")
      .createSignedUrl(path, 60 * 60)
      .then(({ data }) => {
        if (mounted && data) setUrl(data.signedUrl);
      });
    return () => {
      mounted = false;
    };
  }, [path]);

  return (
    <View style={styles.photoTile}>
      {url ? (
        <Image source={{ uri: url }} style={styles.photoImage} />
      ) : (
        <View style={[styles.photoImage, { backgroundColor: colors.mist }]} />
      )}
    </View>
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
  subtitle: { fontSize: 14, color: colors.slate, marginTop: 6, lineHeight: 20 },
  stylistCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.successLo,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.success + "33",
  },
  stylistLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.success,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  stylistText: { fontSize: 14, color: colors.ink, marginTop: 4 },
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
  textarea: { fontSize: 15, color: colors.ink, minHeight: 90, textAlignVertical: "top" },
  photoGrid: {
    marginTop: spacing.sm,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  photoTile: {
    width: 100,
    height: 100,
    borderRadius: radii.lg,
    overflow: "hidden",
    position: "relative",
  },
  photoImage: { width: "100%", height: "100%" },
  photoRemove: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(26,31,46,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  photoAdd: {
    width: 100,
    height: 100,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.accent,
    borderStyle: "dashed",
    backgroundColor: colors.accentLo,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  photoAddText: { fontSize: 11, color: colors.accent, fontWeight: "700" },
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
