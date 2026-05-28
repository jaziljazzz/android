import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Logo } from "@/components/Logo";
import { colors, radii, shadow, spacing } from "@/theme";
import { supabase } from "@/lib/supabase";

interface NearbySalon {
  id: string;
  name: string;
  tagline: string | null;
  area: string | null;
  city: string;
  type: string | null;
  rating: number;
  queue_ahead: number;
}

type Category = { id: string; label: string; icon: keyof typeof Ionicons.glyphMap; active: boolean };

const CATEGORIES: Category[] = [
  { id: "salon", label: "Salons", icon: "cut", active: true },
  { id: "restaurants", label: "Restaurants", icon: "restaurant", active: false },
  { id: "clinics", label: "Clinics", icon: "medkit", active: false },
  { id: "government", label: "Government", icon: "business", active: false },
];

export default function HomeScreen() {
  const router = useRouter();
  const [salons, setSalons] = useState<NearbySalon[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const { data: rows, error } = await supabase
      .from("salons")
      .select("id, name, tagline, area, city, type, rating, status")
      .eq("status", "active")
      .order("rating", { ascending: false });
    if (error) {
      setSalons([]);
      return;
    }
    // Fetch live queue counts per salon. RLS lets us see queue counts for
    // active salons (the count query just hits salon_id, not row contents).
    const enriched = await Promise.all(
      (rows ?? []).map(async (s) => {
        const { count } = await supabase
          .from("queue_entries")
          .select("id", { count: "exact", head: true })
          .eq("salon_id", s.id)
          .in("status", ["waiting", "arrived", "serving"]);
        return {
          id: s.id,
          name: s.name,
          tagline: s.tagline,
          area: s.area,
          city: s.city,
          type: s.type,
          rating: Number(s.rating ?? 0),
          queue_ahead: count ?? 0,
        };
      }),
    );
    setSalons(enriched);
  };

  useEffect(() => {
    load();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <FlatList
        data={salons ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.container}
        ListHeaderComponent={
          <>
            <View style={styles.topRow}>
              <Logo size={26} />
              <Ionicons name="ellipsis-vertical" size={22} color={colors.ink} />
            </View>

            <Text style={styles.hero}>
              Book your slot,{"\n"}
              <Text style={{ color: colors.accent }}>skip the line.</Text>
            </Text>

            <View style={styles.searchRow}>
              <Ionicons name="search" size={18} color={colors.stone} />
              <TextInput
                placeholder="Search for a place…"
                placeholderTextColor={colors.stone}
                style={styles.searchInput}
              />
            </View>

            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => (
                <View
                  key={cat.id}
                  style={[styles.categoryPill, !cat.active && styles.categoryPillMuted]}
                >
                  <Ionicons
                    name={cat.icon}
                    size={18}
                    color={cat.active ? colors.accent : colors.slate}
                  />
                  <Text
                    style={[
                      styles.categoryLabel,
                      !cat.active && { color: colors.stone },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </View>
              ))}
            </View>

            <Text style={styles.sectionHeader}>Nearby salons</Text>
          </>
        }
        renderItem={({ item }) => (
          <SalonCard
            salon={item}
            onPress={() => router.push(`/salon/${item.id}`)}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={
          salons === null ? (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No salons nearby yet</Text>
              <Text style={styles.emptyBody}>
                We&apos;re live in Kochi first. More cities coming soon.
              </Text>
            </View>
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      />
    </SafeAreaView>
  );
}

function SalonCard({
  salon,
  onPress,
}: {
  salon: NearbySalon;
  onPress: () => void;
}) {
  const waitMin = salon.queue_ahead * 25;
  const waitLabel =
    salon.queue_ahead === 0
      ? "No wait"
      : salon.queue_ahead === 1
      ? "1 in queue"
      : `${waitMin} min wait`;
  const noWait = salon.queue_ahead === 0;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.7 }]}>
      <View style={styles.cardIcon}>
        <Ionicons name="cut" size={20} color={colors.slate} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{salon.name}</Text>
        <Text style={styles.cardSub}>
          {salon.tagline ?? (salon.type ? `${salon.type[0]?.toUpperCase()}${salon.type.slice(1)} salon` : "Salon")}
          {salon.area ? ` · ${salon.area}` : ""}
        </Text>
      </View>
      <View style={[styles.waitPill, noWait && styles.waitPillSuccess]}>
        <Text style={[styles.waitText, noWait && { color: colors.success }]}>{waitLabel}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.mist },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  hero: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.ink,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  searchRow: {
    marginTop: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    height: 52,
    gap: spacing.sm,
    ...shadow.card,
  },
  searchInput: {
    flex: 1,
    color: colors.ink,
    fontSize: 16,
  },
  categoryGrid: {
    marginTop: spacing.lg,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.accent,
    ...shadow.card,
  },
  categoryPillMuted: {
    borderColor: colors.border,
  },
  categoryLabel: {
    fontWeight: "600",
    color: colors.ink,
    fontSize: 14,
  },
  sectionHeader: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    fontSize: 20,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.3,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: radii.lg,
    gap: spacing.md,
    ...shadow.card,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.mist,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: colors.ink },
  cardSub: { fontSize: 13, color: colors.stone, marginTop: 2 },
  waitPill: {
    backgroundColor: colors.mist,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  waitPillSuccess: { backgroundColor: colors.successLo },
  waitText: { fontSize: 13, color: colors.slate, fontWeight: "600" },
  loading: { paddingVertical: spacing.xxl, alignItems: "center" },
  empty: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing.xl,
    alignItems: "center",
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: colors.ink },
  emptyBody: { fontSize: 13, color: colors.stone, marginTop: 4, textAlign: "center" },
});
