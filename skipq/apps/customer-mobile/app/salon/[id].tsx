import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { comboMultiplier, formatEta, MIN_SAMPLES_FOR_POINT_ESTIMATE } from "@skipq/algorithm";
import { colors, radii, shadow, spacing } from "@/theme";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/hooks/useSession";
import { useFavourites } from "@/hooks/useFavourites";
import { computeOpenState, type HoursJson } from "@/lib/salonHours";

interface SalonRow {
  id: string;
  name: string;
  tagline: string | null;
  type: string | null;
  area: string | null;
  city: string;
  address: string;
  status: string;
  cover_image: string | null;
  photos: string[] | null;
  hours: HoursJson | null;
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
  photo: string | null;
}

export default function SalonDetailScreen() {
  const { id, rebook } = useLocalSearchParams<{ id: string; rebook?: string }>();
  const router = useRouter();
  const { session } = useSession();
  const { toggle, isFavourite } = useFavourites(session?.user.id);
  const [salon, setSalon] = useState<SalonRow | null>(null);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [stylists, setStylists] = useState<StylistRow[]>([]);
  const [queueAhead, setQueueAhead] = useState<number>(0);
  const [waitMin, setWaitMin] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [selectedStylist, setSelectedStylist] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [lastVisit, setLastVisit] = useState<{ service_ids: string[]; stylist_id: string | null } | null>(null);

  async function refreshQueueCount() {
    if (!id) return;
    const [{ count }, { data: etaData }] = await Promise.all([
      supabase
        .from("queue_entries")
        .select("id", { count: "exact", head: true })
        .eq("salon_id", id)
        .in("status", ["waiting", "arrived", "serving"]),
      supabase.rpc("salon_live_eta", { p_salon_id: id }),
    ]);
    setQueueAhead(count ?? 0);
    setWaitMin(Number(etaData ?? 0));
  }

  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`salon-detail:${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "queue_entries",
          filter: `salon_id=eq.${id}`,
        },
        () => refreshQueueCount(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [{ data: s }, { data: sv }, { data: st }, { count }] = await Promise.all([
        supabase
          .from("salons")
          .select("id, name, tagline, type, area, city, address, status, cover_image, photos, hours")
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
          .select("id, name, role, total_services, photo")
          .eq("salon_id", id)
          .neq("status", "off")
          .order("name"),
        supabase
          .from("queue_entries")
          .select("id", { count: "exact", head: true })
          .eq("salon_id", id)
          .in("status", ["waiting", "arrived", "serving"]),
      ]);

      setSalon(s ? { ...s, hours: (s.hours ?? null) as HoursJson | null } : null);
      setServices(sv ?? []);
      setStylists(st ?? []);
      setQueueAhead(count ?? 0);

      const { data: etaData } = await supabase.rpc("salon_live_eta", { p_salon_id: id });
      setWaitMin(Number(etaData ?? 0));

      if (session) {
        const { data: lv } = await supabase.rpc("my_last_visit", { p_salon_id: id });
        const row = Array.isArray(lv) ? lv[0] : null;
        if (row?.service_ids?.length) {
          setLastVisit({
            service_ids: row.service_ids as string[],
            stylist_id: row.stylist_id ?? null,
          });
          if (rebook === "1") {
            setSelectedServices(new Set(row.service_ids as string[]));
            setSelectedStylist(row.stylist_id ?? null);
            setSheetOpen(true);
          }
        }
      }
      setLoading(false);
    })();
  }, [id, session, rebook]);

  const totalPrice = useMemo(
    () =>
      services
        .filter((s) => selectedServices.has(s.id))
        .reduce((acc, s) => acc + Number(s.price), 0),
    [services, selectedServices],
  );
  const totalDuration = useMemo(
    () =>
      services
        .filter((s) => selectedServices.has(s.id))
        .reduce((acc, s) => acc + s.default_duration, 0),
    [services, selectedServices],
  );
  const comboSavingMin = useMemo(() => {
    if (selectedServices.size < 2) return 0;
    const cats = services
      .filter((s) => selectedServices.has(s.id))
      .map((s) => s.category ?? "other");
    const mult = comboMultiplier(cats);
    return Math.max(0, Math.round(totalDuration * (1 - mult) / 5) * 5);
  }, [services, selectedServices, totalDuration]);

  function toggleService(serviceId: string) {
    setSelectedServices((prev) => {
      const next = new Set(prev);
      if (next.has(serviceId)) next.delete(serviceId);
      else next.add(serviceId);
      return next;
    });
  }

  function onBookPress() {
    if (!session) {
      router.push({
        pathname: "/auth/login",
        params: { redirect: `/salon/${id}` },
      });
      return;
    }
    setSheetOpen(true);
  }

  async function submitBooking() {
    if (selectedServices.size === 0) {
      setBookingError("Pick at least one service.");
      return;
    }
    setBookingError(null);
    setSubmitting(true);
    const { data, error } = await supabase.rpc("queue_join", {
      p_salon_id: id as string,
      p_service_ids: Array.from(selectedServices),
      p_preferred_stylist_id: selectedStylist ?? undefined,
    });
    setSubmitting(false);
    if (error) {
      setBookingError(error.message);
      return;
    }
    const result = Array.isArray(data) ? data[0] : data;
    if (!result) return;
    setSheetOpen(false);
    router.replace({
      pathname: "/booking-confirmed",
      params: {
        entryId: result.queue_entry_id,
        position: String(result.queue_position),
        etaMin: String(result.estimated_wait_min),
        salonName: salon?.name ?? "",
        total: String(totalPrice),
      },
    });
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

  if (!salon) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <Text style={{ color: colors.stone }}>Salon not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const openState = computeOpenState(salon.hours);
  const noWait = openState.open && queueAhead === 0;
  const gallery = salon.photos ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.lg }}>
          <Pressable onPress={() => router.back()} style={styles.back}>
            <Ionicons name="chevron-back" size={26} color={colors.ink} />
          </Pressable>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <Pressable
              onPress={() =>
                Share.share({
                  message: `${salon.name} on SkipQ — see the live queue and book from your phone. https://skipq.in/s/${id}`,
                })
              }
              style={styles.back}
            >
              <Ionicons name="share-outline" size={22} color={colors.ink} />
            </Pressable>
            {session && id ? (
              <Pressable onPress={() => toggle(id)} style={styles.back}>
                <Ionicons
                  name={isFavourite(id) ? "heart" : "heart-outline"}
                  size={22}
                  color={isFavourite(id) ? colors.accent : colors.ink}
                />
              </Pressable>
            ) : null}
          </View>
        </View>

        {salon.cover_image ? (
          <Image source={{ uri: salon.cover_image }} style={styles.cover} resizeMode="cover" />
        ) : null}

        {gallery.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.sm, marginTop: spacing.md }}
          >
            {gallery.map((p) => (
              <Image key={p} source={{ uri: p }} style={styles.galleryItem} resizeMode="cover" />
            ))}
          </ScrollView>
        ) : null}

        <Text style={styles.title}>{salon.name}</Text>
        <Text style={styles.subtitle}>
          {salon.tagline ?? (salon.type ? `${salon.type[0]?.toUpperCase()}${salon.type.slice(1)} Salon` : "Salon")}
        </Text>
        <Text style={styles.address}>{salon.address}</Text>

        <View style={styles.waitRow}>
          <View style={[styles.waitCircle, noWait && styles.waitCircleSuccess, !openState.open && styles.waitCircleClosed]}>
            <Text style={[styles.waitCircleNum, !openState.open && { color: colors.slate }]}>
              {openState.open ? queueAhead : "—"}
            </Text>
          </View>
          <View style={{ marginLeft: spacing.lg, flex: 1 }}>
            <Text style={styles.waitLabel}>
              {openState.open ? "Waiting time" : openState.closedToday ? "Closed today" : "Currently closed"}
            </Text>
            <Text style={styles.waitValue}>
              {!openState.open
                ? openState.opensAt
                  ? `Opens ${openState.opensAt}`
                  : "Closed"
                : noWait
                ? "No wait"
                : formatEta(waitMin)}
            </Text>
            {openState.open && !noWait && waitMin > 0 ? (
              <Text style={styles.waitHint}>
                Could be {Math.max(0, Math.round((waitMin * 0.8) / 5) * 5)}–
                {Math.round((waitMin * 1.25) / 5) * 5} min · {queueAhead}{" "}
                {queueAhead === 1 ? "person" : "people"} ahead
                {openState.closesAt ? ` · until ${openState.closesAt}` : ""}
              </Text>
            ) : (
              <Text style={styles.waitHint}>
                {!openState.open
                  ? "Come back during opening hours"
                  : queueAhead === 0
                  ? "Walk right in"
                  : `${queueAhead} ${queueAhead === 1 ? "person" : "people"} ahead${openState.closesAt ? ` · until ${openState.closesAt}` : ""}`}
              </Text>
            )}
          </View>
        </View>

        <Pressable
          onPress={onBookPress}
          disabled={!openState.open}
          style={({ pressed }) => [
            styles.bookCta,
            !openState.open && styles.bookCtaDisabled,
            pressed && openState.open && { opacity: 0.85 },
          ]}
        >
          <Text style={[styles.bookCtaText, !openState.open && { color: colors.stone }]}>
            {openState.open ? "Book a slot" : "Closed right now"}
          </Text>
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
                  {st.photo ? (
                    <Image source={{ uri: st.photo }} style={styles.stylistPhoto} />
                  ) : (
                    <View style={styles.stylistAvatar}>
                      <Text style={styles.stylistInitials}>
                        {st.name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("")}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.stylistName}>{st.name}</Text>
                  {st.role ? <Text style={styles.stylistRole}>{st.role}</Text> : null}
                </View>
              ))}
            </ScrollView>
          </>
        ) : null}
      </ScrollView>

      <Modal visible={sheetOpen} animationType="slide" transparent onRequestClose={() => setSheetOpen(false)}>
        <Pressable style={styles.scrim} onPress={() => setSheetOpen(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetGrabber} />
          <Text style={styles.sheetTitle}>Pick your services</Text>
          {lastVisit && lastVisit.service_ids.length > 0 ? (
            <Pressable
              onPress={() => {
                setSelectedServices(new Set(lastVisit.service_ids));
                setSelectedStylist(lastVisit.stylist_id);
              }}
              style={styles.lastVisitChip}
            >
              <Ionicons name="repeat" size={14} color={colors.accent} />
              <Text style={styles.lastVisitText}>Same as last time</Text>
            </Pressable>
          ) : null}
          <ScrollView style={{ maxHeight: 360 }} contentContainerStyle={{ gap: spacing.sm }}>
            {services.map((s) => {
              const selected = selectedServices.has(s.id);
              return (
                <Pressable
                  key={s.id}
                  onPress={() => toggleService(s.id)}
                  style={[styles.sheetService, selected && styles.sheetServiceSelected]}
                >
                  <View style={[styles.checkbox, selected && styles.checkboxOn]}>
                    {selected ? <Ionicons name="checkmark" size={16} color={colors.white} /> : null}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sheetServiceName}>{s.name}</Text>
                    <Text style={styles.sheetServiceMeta}>{s.default_duration} min</Text>
                  </View>
                  <Text style={styles.sheetServicePrice}>₹{Number(s.price).toFixed(0)}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {stylists.length > 0 ? (
            <>
              <Text style={styles.sheetSubLabel}>Preferred stylist</Text>
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
                  const newStylist = st.total_services < MIN_SAMPLES_FOR_POINT_ESTIMATE;
                  return (
                    <Pressable
                      key={st.id}
                      onPress={() => setSelectedStylist(st.id)}
                      style={[styles.stylistPill, selected && styles.stylistPillSelected]}
                    >
                      <Text style={[styles.stylistPillText, selected && styles.stylistPillTextSelected]}>
                        {st.name}
                      </Text>
                      {newStylist ? (
                        <Text
                          style={[
                            styles.stylistNewTag,
                            selected && { color: "rgba(255,255,255,0.7)" },
                          ]}
                        >
                          new
                        </Text>
                      ) : null}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </>
          ) : null}

          {selectedStylist
            ? (() => {
                const st = stylists.find((x) => x.id === selectedStylist);
                if (!st || st.total_services >= MIN_SAMPLES_FOR_POINT_ESTIMATE) return null;
                return (
                  <Text style={styles.calibrationHint}>
                    {st.name} is still calibrating ({st.total_services}/
                    {MIN_SAMPLES_FOR_POINT_ESTIMATE} services). ETAs show as a range until
                    they cross the threshold.
                  </Text>
                );
              })()
            : null}

          {bookingError ? <Text style={styles.error}>{bookingError}</Text> : null}

          {comboSavingMin > 0 ? (
            <View style={styles.comboPill}>
              <Ionicons name="flash" size={12} color={colors.success} />
              <Text style={styles.comboText}>
                Combo · save ~{comboSavingMin} min, stylist runs both in parallel
              </Text>
            </View>
          ) : null}

          <View style={styles.sheetFooter}>
            <View>
              <Text style={styles.sheetFooterPrice}>₹{totalPrice.toFixed(0)}</Text>
              <Text style={styles.sheetFooterMeta}>
                {selectedServices.size === 0
                  ? "No services selected"
                  : `${selectedServices.size} services · ${totalDuration - comboSavingMin} min`}
              </Text>
            </View>
            <Pressable
              onPress={submitBooking}
              disabled={submitting || selectedServices.size === 0}
              style={({ pressed }) => [
                styles.confirmCta,
                (pressed || submitting || selectedServices.size === 0) && { opacity: 0.6 },
              ]}
            >
              {submitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.confirmCtaText}>Skip the queue</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.section}>{title}</Text>;
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
  cover: {
    width: "100%",
    height: 200,
    borderRadius: radii.lg,
    backgroundColor: colors.mist,
    marginBottom: spacing.md,
  },
  galleryItem: {
    width: 120,
    height: 88,
    borderRadius: radii.md,
    backgroundColor: colors.mist,
  },
  title: { fontSize: 28, fontWeight: "800", color: colors.ink, letterSpacing: -0.5, marginTop: spacing.md },
  subtitle: { fontSize: 16, color: colors.slate, marginTop: 4 },
  address: { fontSize: 14, color: colors.stone, marginTop: 2 },
  waitRow: { flexDirection: "row", alignItems: "center", marginTop: spacing.xl },
  waitCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  waitCircleSuccess: { backgroundColor: colors.success },
  waitCircleClosed: { backgroundColor: colors.mist, borderWidth: 1, borderColor: colors.border },
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
  bookCtaText: { color: colors.white, fontSize: 17, fontWeight: "700", letterSpacing: 0.2 },
  bookCtaDisabled: { backgroundColor: colors.mist, borderWidth: 1, borderColor: colors.border, shadowOpacity: 0 },
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
  stylistPhoto: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.mist },
  stylistName: { marginTop: 6, fontWeight: "700", color: colors.ink, fontSize: 13 },
  stylistRole: { fontSize: 11, color: colors.stone, marginTop: 1 },

  // Bottom sheet
  scrim: { flex: 1, backgroundColor: "rgba(26,31,46,0.45)" },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  sheetGrabber: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  sheetTitle: { fontSize: 20, fontWeight: "800", color: colors.ink, marginBottom: spacing.md },
  sheetService: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.mist,
    padding: spacing.md,
    borderRadius: radii.lg,
    gap: spacing.md,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  sheetServiceSelected: { backgroundColor: colors.accentLo, borderColor: colors.accent },
  sheetServiceName: { fontSize: 15, fontWeight: "600", color: colors.ink },
  sheetServiceMeta: { fontSize: 12, color: colors.stone, marginTop: 2 },
  sheetServicePrice: { fontSize: 16, fontWeight: "800", color: colors.ink },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.stone,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  sheetSubLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.slate,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  stylistPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.mist,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  stylistPillSelected: { backgroundColor: colors.accentLo, borderColor: colors.accent },
  stylistPillText: { fontSize: 13, fontWeight: "600", color: colors.slate },
  stylistPillTextSelected: { color: colors.accent },
  sheetFooter: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetFooterPrice: { fontSize: 20, fontWeight: "800", color: colors.ink },
  sheetFooterMeta: { fontSize: 12, color: colors.stone, marginTop: 2 },
  comboPill: {
    marginTop: spacing.md,
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radii.pill,
    backgroundColor: colors.successLo, alignSelf: "flex-start",
  },
  comboText: { color: colors.success, fontSize: 12, fontWeight: "700" },
  lastVisitChip: {
    marginBottom: spacing.md,
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radii.pill,
    backgroundColor: colors.accentLo, alignSelf: "flex-start",
  },
  lastVisitText: { color: colors.accent, fontSize: 12, fontWeight: "700" },
  stylistNewTag: {
    color: colors.stone, fontSize: 10, fontWeight: "800",
    marginLeft: 4, textTransform: "uppercase", letterSpacing: 1,
  },
  calibrationHint: { marginTop: spacing.sm, color: colors.stone, fontSize: 11, lineHeight: 16 },
  confirmCta: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
    borderRadius: radii.lg,
  },
  confirmCtaText: { color: colors.white, fontWeight: "700", fontSize: 15 },
  error: { marginTop: spacing.md, fontSize: 13, color: colors.accent, fontWeight: "500" },
});
