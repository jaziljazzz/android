import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
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
import { computeOpenState, type HoursJson } from "@/lib/salonHours";
import * as Location from "expo-location";

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
  featured: boolean;
  cover_image: string | null;
  hours: HoursJson | null;
  distance_km: number | null;
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
  const [waitFilter, setWaitFilter] = useState<"any" | "no_wait" | "top_rated">("any");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<"unknown" | "granted" | "denied">("unknown");

  const filtered = (salons ?? [])
    .filter((s) => {
      if (showFavOnly && !favIds.has(s.id)) return false;
      if (waitFilter === "no_wait" && s.queue_ahead > 0) return false;
      if (waitFilter === "top_rated" && (s.rating < 4 || s.review_count < 3)) return false;
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        (s.area ?? "").toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        (s.tagline ?? "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (waitFilter === "no_wait") return a.queue_ahead - b.queue_ahead;
      if (waitFilter === "top_rated") return b.rating - a.rating;
      return 0;
    });

  const load = async (loc: { lat: number; lng: number } | null) => {
    type Row = {
      id: string;
      name: string;
      tagline: string | null;
      area: string | null;
      city: string;
      type: string | null;
      rating: number | string | null;
      review_count: number | null;
      featured_until: string | null;
      cover_image: string | null;
      hours: unknown;
      distance_km?: number | string | null;
    };

    let rows: Row[] | null = null;
    if (loc) {
      const { data, error } = await supabase.rpc("nearby_salons", {
        p_lat: loc.lat,
        p_lng: loc.lng,
        p_radius_km: 25,
      });
      if (!error) rows = (data ?? []) as Row[];
    }
    if (!rows) {
      const { data, error } = await supabase
        .from("salons")
        .select(
          "id, name, tagline, area, city, type, rating, review_count, status, featured_until, cover_image, hours",
        )
        .eq("status", "active")
        .order("featured_until", { ascending: false, nullsFirst: false })
        .order("rating", { ascending: false });
      if (error) {
        setSalons([]);
        return;
      }
      rows = (data ?? []) as Row[];
    }

    const enriched = await Promise.all(
      rows.map(async (s) => {
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
          featured: s.featured_until ? new Date(s.featured_until) > new Date() : false,
          cover_image: s.cover_image,
          hours: (s.hours ?? null) as HoursJson | null,
          distance_km: s.distance_km != null ? Number(s.distance_km) : null,
        };
      }),
    );
    setSalons(enriched);
  };

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          setLocationStatus("granted");
          const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCoords(loc);
          await load(loc);
        } else {
          setLocationStatus("denied");
          await load(null);
        }
      } catch {
        setLocationStatus("denied");
        await load(null);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("home-queue-stream")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "queue_entries" },
        () => load(coords),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [coords]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load(coords);
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
              <Pressable onPress={() => router.push("/notifications")} hitSlop={8}>
                <Ionicons name="notifications-outline" size={22} color={colors.ink} />
              </Pressable>
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

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingVertical: spacing.md }}
            >
              <FilterChip
                label="All"
                active={waitFilter === "any" && !showFavOnly}
                onPress={() => {
                  setWaitFilter("any");
                  setShowFavOnly(false);
                }}
              />
              <FilterChip
                label="No wait"
                icon="flash"
                active={waitFilter === "no_wait"}
                onPress={() => {
                  setWaitFilter(waitFilter === "no_wait" ? "any" : "no_wait");
                  setShowFavOnly(false);
                }}
              />
              <FilterChip
                label="Top rated"
                icon="star"
                active={waitFilter === "top_rated"}
                onPress={() => {
                  setWaitFilter(waitFilter === "top_rated" ? "any" : "top_rated");
                  setShowFavOnly(false);
                }}
              />
              {session ? (
                <FilterChip
                  label="Favourites"
                  icon="heart"
                  active={showFavOnly}
                  onPress={() => setShowFavOnly(!showFavOnly)}
                />
              ) : null}
            </ScrollView>

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
              {search
                ? `Results for "${search}"`
                : locationStatus === "granted"
                ? "Salons near you"
                : "All salons"}
            </Text>
            {locationStatus === "denied" ? (
              <Pressable
                onPress={async () => {
                  const { status } = await Location.requestForegroundPermissionsAsync();
                  if (status === "granted") {
                    setLocationStatus("granted");
                    const pos = await Location.getCurrentPositionAsync({
                      accuracy: Location.Accuracy.Balanced,
                    });
                    const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    setCoords(loc);
                    await load(loc);
                  }
                }}
                style={styles.locHint}
              >
                <Ionicons name="location-outline" size={14} color={colors.accent} />
                <Text style={styles.locHintText}>Turn on location to sort by distance</Text>
              </Pressable>
            ) : null}
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

function FilterChip({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.filterPill, active && styles.filterPillActive]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={14}
          color={active ? colors.accent : colors.stone}
        />
      ) : null}
      <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
        {label}
      </Text>
    </Pressable>
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
  const openState = computeOpenState(salon.hours);
  const waitMin = salon.queue_ahead * 25;
  const waitLabel = !openState.open
    ? openState.closedToday
      ? "Closed"
      : openState.opensAt
      ? `Opens ${openState.opensAt}`
      : "Closed"
    : salon.queue_ahead === 0
    ? "No wait"
    : salon.queue_ahead === 1
    ? "1 in queue"
    : `${waitMin} min wait`;
  const noWait = openState.open && salon.queue_ahead === 0;
  const closed = !openState.open;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.7 }]}>
      {salon.cover_image ? (
        <Image source={{ uri: salon.cover_image }} style={styles.cardThumb} resizeMode="cover" />
      ) : (
        <View style={styles.cardIcon}>
          <Ionicons name="cut" size={20} color={colors.slate} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>{salon.name}</Text>
          {salon.featured ? (
            <View style={styles.featuredPill}>
              <Text style={styles.featuredPillText}>Featured</Text>
            </View>
          ) : null}
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
          {salon.distance_km != null
            ? ` · ${salon.distance_km < 1 ? `${Math.round(salon.distance_km * 1000)} m` : `${salon.distance_km.toFixed(1)} km`}`
            : ""}
        </Text>
      </View>
      <View style={{ alignItems: "flex-end", gap: 6 }}>
        <View style={[styles.waitPill, noWait && styles.waitPillSuccess, closed && styles.waitPillClosed]}>
          <Text style={[styles.waitText, noWait && { color: colors.success }, closed && { color: colors.stone }]}>
            {waitLabel}
          </Text>
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
  locHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.accentLo,
    alignSelf: "flex-start",
  },
  locHintText: { color: colors.accent, fontSize: 12, fontWeight: "700" },
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
  cardThumb: {
    width: 56,
    height: 56,
    borderRadius: radii.md,
    backgroundColor: colors.mist,
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
  featuredPill: {
    backgroundColor: colors.accent,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  featuredPillText: { fontSize: 10, fontWeight: "800", color: colors.white, letterSpacing: 0.5 },
  cardSub: { fontSize: 13, color: colors.stone, marginTop: 2 },
  waitPill: {
    backgroundColor: colors.mist,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  waitPillSuccess: { backgroundColor: colors.successLo },
  waitPillClosed: { backgroundColor: colors.mist, borderWidth: 1, borderColor: colors.border },
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
