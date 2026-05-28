import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { colors, radii, shadow, spacing } from "@/theme";
import { supabase } from "@/lib/supabase";

interface Entry {
  id: string;
  salon_id: string;
  status: string;
  preferred_stylist_id: string | null;
  total_price: number | null;
}

interface ServiceRow {
  id: string;
  name: string;
  category: string | null;
  price: number;
  default_duration: number;
}

interface StylistRow {
  id: string;
  name: string;
  role: string | null;
}

export default function EditBookingScreen() {
  const { entryId } = useLocalSearchParams<{ entryId: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [entry, setEntry] = useState<Entry | null>(null);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [stylists, setStylists] = useState<StylistRow[]>([]);
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [selectedStylist, setSelectedStylist] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!entryId) return;
    (async () => {
      const { data: e, error: eErr } = await supabase
        .from("queue_entries")
        .select("id, salon_id, status, preferred_stylist_id, total_price")
        .eq("id", entryId)
        .maybeSingle();
      if (eErr || !e) {
        setError(eErr?.message ?? "Booking not found");
        setLoading(false);
        return;
      }
      if (e.status !== "waiting") {
        setError("This booking is already locked in.");
        setEntry(e);
        setLoading(false);
        return;
      }
      const [{ data: qes }, { data: sv }, { data: st }] = await Promise.all([
        supabase
          .from("queue_entry_services")
          .select("service_id")
          .eq("queue_entry_id", entryId),
        supabase
          .from("services")
          .select("id, name, category, price, default_duration")
          .eq("salon_id", e.salon_id)
          .eq("active", true)
          .order("display_order"),
        supabase
          .from("stylists")
          .select("id, name, role")
          .eq("salon_id", e.salon_id)
          .neq("status", "off")
          .order("name"),
      ]);
      setEntry(e);
      setServices(sv ?? []);
      setStylists(st ?? []);
      setSelectedServices(new Set((qes ?? []).map((r) => r.service_id).filter((v): v is string => !!v)));
      setSelectedStylist(e.preferred_stylist_id);
      setLoading(false);
    })();
  }, [entryId]);

  const totalPrice = useMemo(
    () =>
      services
        .filter((s) => selectedServices.has(s.id))
        .reduce((acc, s) => acc + Number(s.price), 0),
    [services, selectedServices],
  );

  function toggleService(id: string) {
    setSelectedServices((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function save() {
    if (!entry) return;
    if (selectedServices.size === 0) {
      setError("Pick at least one service.");
      return;
    }
    setError(null);
    setSubmitting(true);
    const { error: rpcErr } = await supabase.rpc("modify_queue_entry", {
      p_entry_id: entry.id,
      p_service_ids: Array.from(selectedServices),
      p_preferred_stylist_id: selectedStylist ?? undefined,
    });
    setSubmitting(false);
    if (rpcErr) {
      setError(rpcErr.message);
      return;
    }
    router.back();
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

  if (!entry || entry.status !== "waiting") {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.container}>
          <Pressable onPress={() => router.back()} style={styles.back}>
            <Ionicons name="chevron-back" size={26} color={colors.ink} />
          </Pressable>
          <Text style={styles.title}>Can&apos;t edit</Text>
          <Text style={styles.muted}>
            {error ??
              "This booking is no longer in the waiting state. Talk to the salon if anything's wrong."}
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={26} color={colors.ink} />
        </Pressable>
        <Text style={styles.title}>Edit booking</Text>
        <Text style={styles.muted}>
          Changes only allowed while you&apos;re still waiting. Once the salon marks you arrived,
          this locks.
        </Text>

        <Text style={styles.sectionLabel}>Services</Text>
        {services.length === 0 ? (
          <Text style={styles.muted}>No services available right now.</Text>
        ) : (
          <View style={{ gap: spacing.sm }}>
            {services.map((s) => {
              const selected = selectedServices.has(s.id);
              return (
                <Pressable
                  key={s.id}
                  onPress={() => toggleService(s.id)}
                  style={[styles.serviceRow, selected && styles.serviceRowSelected]}
                >
                  <View style={[styles.checkbox, selected && styles.checkboxOn]}>
                    {selected ? <Ionicons name="checkmark" size={16} color={colors.white} /> : null}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.serviceName}>{s.name}</Text>
                    <Text style={styles.serviceMeta}>{s.default_duration} min</Text>
                  </View>
                  <Text style={styles.servicePrice}>₹{Number(s.price).toFixed(0)}</Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {stylists.length > 0 ? (
          <>
            <Text style={styles.sectionLabel}>Preferred stylist</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              <Pressable
                onPress={() => setSelectedStylist(null)}
                style={[styles.stylistPill, !selectedStylist && styles.stylistPillSelected]}
              >
                <Text style={[styles.stylistPillText, !selectedStylist && styles.stylistPillTextSelected]}>
                  Any available
                </Text>
              </Pressable>
              {stylists.map((st) => {
                const selected = selectedStylist === st.id;
                return (
                  <Pressable
                    key={st.id}
                    onPress={() => setSelectedStylist(st.id)}
                    style={[styles.stylistPill, selected && styles.stylistPillSelected]}
                  >
                    <Text style={[styles.stylistPillText, selected && styles.stylistPillTextSelected]}>
                      {st.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.footer}>
          <View>
            <Text style={styles.footerPrice}>₹{totalPrice.toFixed(0)}</Text>
            <Text style={styles.footerMeta}>{selectedServices.size} service{selectedServices.size === 1 ? "" : "s"}</Text>
          </View>
          <Pressable
            onPress={save}
            disabled={submitting || selectedServices.size === 0}
            style={({ pressed }) => [
              styles.saveCta,
              (pressed || submitting || selectedServices.size === 0) && { opacity: 0.6 },
            ]}
          >
            {submitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.saveCtaText}>Save changes</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
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
  muted: { fontSize: 14, color: colors.stone, marginTop: spacing.sm },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.slate,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  serviceRowSelected: { borderColor: colors.accent },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  serviceName: { fontSize: 15, fontWeight: "700", color: colors.ink },
  serviceMeta: { fontSize: 12, color: colors.stone, marginTop: 2 },
  servicePrice: { fontSize: 15, fontWeight: "700", color: colors.ink },
  stylistPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stylistPillSelected: { backgroundColor: colors.ink, borderColor: colors.ink },
  stylistPillText: { color: colors.ink, fontSize: 13, fontWeight: "600" },
  stylistPillTextSelected: { color: colors.white },
  error: { marginTop: spacing.md, fontSize: 13, color: colors.accent, fontWeight: "500" },
  footer: {
    marginTop: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerPrice: { fontSize: 22, fontWeight: "800", color: colors.ink },
  footerMeta: { fontSize: 12, color: colors.stone, marginTop: 2 },
  saveCta: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
    borderRadius: radii.lg,
    ...shadow.card,
  },
  saveCtaText: { color: colors.white, fontWeight: "700", fontSize: 15 },
});
