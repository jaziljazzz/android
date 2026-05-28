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
import { useSession } from "@/hooks/useSession";
import { useFavourites } from "@/hooks/useFavourites";

interface NearbySalon {
  id: string;
  name: string;
  tagline: string | null;
  area: string | null;
  city: string;
  type: string | null;
  rating: number;
  review_count: number;
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
  const { session } = useSession();
  const { favIds, toggle, isFavourite } = useFavourites(session?.user.id);
  const [salons, setSalons] = useState<NearbySalon[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [showFavOnly, setShowFavOnly] = useState(false);

  const filtered = (salons ?? []).filter((s) => {
    if (showFavOnly && !favIds.has(s.id)) return false;
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.area ?? "").toLowerCase().includes(q) ||
      s.city.toLowerCase().includes(q) ||
      (s.tagline ?? "").toLowerCase().includes(q)
    );
  });

  const load = async () => {
    const { data: rows, error } = await supabase
      .from("salons")
      .select("id, name, tagline, area, city, type, rating, review_count, status")
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
          review_count: s.review_count ?? 0,
          queue_ahead: count ?? 0,
        };
      }),
    );
    setSalons(enriched);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("home-queue-stream")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "queue_entries" },
        () => load(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <FlatList
        data={filtered}
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
                placeholder="Search salons by name or area…"
                placeholderTextColor={colors.stone}
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                autoCapitalize="none"
                returnKeyType="search"
              />
              {search ? (
                <Pressable onPress={() => setSearch("")} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color={colors.stone} />
                </Pressable>
              ) : null}
            </View>

            {session ? (
              <View style={{ marginTop: spacing.md, flexDirection: "row", gap: 8 }}>
                <Pressable
                  onPress={() => setShowFavOnly(false)}
                  style={[styles.filterPill, !showFavOnly && styles.filterPillActive]}
                >
                  <Text style={[styles.filterPillText, !showFavOnly && styles.filterPillTextActive]}>
                    All
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setShowFavOnly(true)}
                  style={[styles.filterPill, showFavOnly && styles.filterPillActive]}
                >
                  <Ionicons
                    name="heart"
                    size={14}
                    color={showFavOnly ? colors.accent : colors.stone}
                  />
                  <Text style={[styles.filterPillText, showFavOnly && styles.filterPillTextActive]}>
                    Favourites
                  </Text>
                </Pressable>
              </View>
            ) : null}

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

            <Text style={styles.sectionHeader}>
              {search ? `Results for "${search}"` : "Nearby salons"}
            </Text>
          </>
        }
        renderItem={({ item }) => (
          <SalonCard
            salon={item}
            isFavourite={isFavourite(item.id)}
            canFavourite={!!session}
            onToggleFavourite={() => toggle(item.id)}
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
  isFavourite,
  canFavourite,
  onToggleFavourite,
  onPress,
}: {
  salon: NearbySalon;
  isFavourite: boolean;
  canFavourite: boolean;
  onToggleFavourite: () => void;
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
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>{salon.name}</Text>
          {salon.review_count > 0 ? (
            <View style={styles.ratingPill}>
              <Ionicons name="star" size={11} color={colors.caution} />
              <Text style={styles.ratingPillText}>{salon.rating.toFixed(1)}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.cardSub}>
          {salon.tagline ?? (salon.type ? `${salon.type[0]?.toUpperCase()}${salon.type.slice(1)} salon` : "Salon")}
          {salon.area ? ` · ${salon.area}` : ""}
        </Text>
      </View>
      <View style={{ alignItems: "flex-end", gap: 6 }}>
        <View style={[styles.waitPill, noWait && styles.waitPillSuccess]}>
          <Text style={[styles.waitText, noWait && { color: colors.success }]}>{waitLabel}</Text>
        </View>
        {canFavourite ? (
          <Pressable onPress={onToggleFavourite} hitSlop={8} style={styles.favBtn}>
            <Ionicons
              name={isFavourite ? "heart" : "heart-outline"}
              size={20}
              color={isFavourite ? colors.accent : colors.stone}
            />
          </Pressable>
        ) : null}
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
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: colors.ink, flexShrink: 1 },
  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: colors.mist,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  ratingPillText: { fontSize: 11, fontWeight: "700", color: colors.ink },
  cardSub: { fontSize: 13, color: colors.stone, marginTop: 2 },
  waitPill: {
    backgroundColor: colors.mist,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  waitPillSuccess: { backgroundColor: colors.successLo },
  waitText: { fontSize: 13, color: colors.slate, fontWeight: "600" },
  favBtn: { padding: 4 },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  filterPillActive: { backgroundColor: colors.accentLo, borderColor: colors.accent },
  filterPillText: { fontSize: 13, fontWeight: "600", color: colors.slate },
  filterPillTextActive: { color: colors.accent },
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
