import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii, shadow, spacing } from "@/theme";

export default function BookingsScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <Text style={styles.title}>Your bookings</Text>
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="calendar-outline" size={28} color={colors.accent} />
          </View>
          <Text style={styles.emptyTitle}>No active bookings</Text>
          <Text style={styles.emptyBody}>
            When you skip a queue, your live status will live here.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.mist },
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
  },
  emptyBody: {
    marginTop: 4,
    fontSize: 13,
    color: colors.stone,
    textAlign: "center",
  },
});
