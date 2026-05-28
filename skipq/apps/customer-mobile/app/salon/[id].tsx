import { useEffect, useState } from "react";
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
import { calculateWaitTime, formatEta, type ServiceRequest } from "@skipq/algorithm";
import { colors, radii, shadow, spacing } from "@/theme";
import { supabase } from "@/lib/supabase";

interface SalonRow {
  id: string;
  name: string;
  tagline: string | null;
  type: string | null;
  area: string | null;
  city: string;
  address: string;
  status: string;
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
  total_services: number;
}

export default function SalonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [salon, setSalon] = useState<SalonRow | null>(null);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [stylists, setStylists] = useState<StylistRow[]>([]);
  const [queueAhead, setQueueAhead] = useState<number>(0);
  const [waitMin, setWaitMin] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [{ data: s }, { data: sv }, { data: st }, { count }] = await Promise.all([
        supabase
          .from("salons")
          .select("id, name, tagline, type, area, city, address, status")
          .eq("id", id)
          .single(),
        supabase
          .from("services")
          .select("id, name, category, price, default_duration")
          .eq("salon_id", id)
          .eq("active", true)
          .order("display_order", { ascending: true }),
        supabase
          .from("stylists")
          .select("id, name, role, total_services")
          .eq("salon_id", id)
          .order("name"),
        supabase
          .from("queue_entries")
          .select("id", { count: "exact", head: true })
          .eq("salon_id", id)
          .in("status", ["waiting", "arrived", "serving"]),
      ]);

      setSalon(s);
      setServices(sv ?? []);
      setStylists(st ?? []);
      setQueueAhead(count ?? 0);

      // Cheap initial ETA: assume each customer ahead takes the average of
      // the salon's services as their service time. Real ETA per-stylist
      // happens at queue-join time using calculateWaitTime.
      if (sv && sv.length > 0) {
        const avgMin =
          sv.reduce((acc, s) => acc + s.default_duration, 0) / sv.length;
        const avgRequest: ServiceRequest[] = [
          { serviceId: "x", defaultDurationMin: avgMin, category: "hair" },
        ];
        const ahead = Array.from({ length: count ?? 0 }, () => ({
          services: avgRequest,
        }));
        const r = calculateWaitTime({
          ahead,
          services: avgRequest,
          stylistCompletedServices: 50,
        });
        setWaitMin(Math.max(0, r.totalEtaMin - avgMin));
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!salon) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <Text style={{ color: colors.stone }}>Salon not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const noWait = queueAhead === 0;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={26} color={colors.ink} />
        </Pressable>

        <Text style={styles.title}>{salon.name}</Text>
        <Text style={styles.subtitle}>
          {salon.tagline ?? (salon.type ? `${salon.type[0]?.toUpperCase()}${salon.type.slice(1)} Salon` : "Salon")}
        </Text>
        <Text style={styles.address}>{salon.address}</Text>

        <View style={styles.waitRow}>
          <View style={[styles.waitCircle, noWait && styles.waitCircleSuccess]}>
            <Text style={styles.waitCircleNum}>{queueAhead}</Text>
          </View>
          <View style={{ marginLeft: spacing.lg }}>
            <Text style={styles.waitLabel}>Waiting time</Text>
            <Text style={styles.waitValue}>
              {noWait ? "No wait" : formatEta(waitMin + 1)}
            </Text>
            <Text style={styles.waitHint}>
              {queueAhead === 0
                ? "Walk right in"
                : `${queueAhead} ${queueAhead === 1 ? "person" : "people"} ahead`}
            </Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.bookCta, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.bookCtaText}>Book a slot</Text>
        </Pressable>

        <SectionHeader title="Services" />
        {services.length === 0 ? (
          <Text style={styles.muted}>No active services right now.</Text>
        ) : (
          <View style={{ gap: spacing.sm }}>
            {services.map((s) => (
              <View key={s.id} style={styles.serviceRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.serviceName}>{s.name}</Text>
                  <Text style={styles.serviceMeta}>
                    {s.default_duration} min{s.category ? ` · ${s.category}` : ""}
                  </Text>
                </View>
                <Text style={styles.servicePrice}>₹{Number(s.price).toFixed(0)}</Text>
              </View>
            ))}
          </View>
        )}

        {stylists.length > 0 ? (
          <>
            <SectionHeader title="Stylists" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
              {stylists.map((st) => (
                <View key={st.id} style={styles.stylistChip}>
                  <View style={styles.stylistAvatar}>
                    <Text style={styles.stylistInitials}>
                      {st.name
                        .split(/\s+/)
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((p) => p[0]?.toUpperCase() ?? "")
                        .join("")}
                    </Text>
                  </View>
                  <Text style={styles.stylistName}>{st.name}</Text>
                  {st.role ? <Text style={styles.stylistRole}>{st.role}</Text> : null}
                </View>
              ))}
            </ScrollView>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.section}>{title}</Text>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.mist },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
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
  address: { fontSize: 14, color: colors.stone, marginTop: 2 },
  waitRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xl,
  },
  waitCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  waitCircleSuccess: { backgroundColor: colors.success },
  waitCircleNum: { fontSize: 38, fontWeight: "800", color: colors.white },
  waitLabel: { fontSize: 14, color: colors.slate },
  waitValue: { fontSize: 28, fontWeight: "800", color: colors.ink, letterSpacing: -0.5 },
  waitHint: { fontSize: 12, color: colors.stone, marginTop: 2 },
  bookCta: {
    backgroundColor: colors.accent,
    borderRadius: radii.lg,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: spacing.xl,
    ...shadow.card,
  },
  bookCtaText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  section: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.ink,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: radii.lg,
    ...shadow.card,
  },
  serviceName: { fontSize: 15, fontWeight: "600", color: colors.ink },
  serviceMeta: { fontSize: 12, color: colors.stone, marginTop: 2, textTransform: "capitalize" },
  servicePrice: { fontSize: 16, fontWeight: "800", color: colors.ink },
  muted: { color: colors.stone, fontSize: 14 },
  stylistChip: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    minWidth: 96,
    ...shadow.card,
  },
  stylistAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentLo,
    alignItems: "center",
    justifyContent: "center",
  },
  stylistInitials: { color: colors.accent, fontWeight: "800", fontSize: 14 },
  stylistName: { marginTop: 6, fontWeight: "700", color: colors.ink, fontSize: 13 },
  stylistRole: { fontSize: 11, color: colors.stone, marginTop: 1 },
});
