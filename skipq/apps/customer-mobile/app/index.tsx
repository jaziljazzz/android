import { SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function Home() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.kicker}>skipQ</Text>
        <Text style={styles.title}>Skip the wait.</Text>
        <Text style={styles.body}>
          Customer app scaffolding. Live wait times and queue join land next.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F4F5F7" },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  kicker: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F8B8D",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  title: {
    marginTop: 12,
    fontSize: 36,
    fontWeight: "800",
    color: "#0E1116",
    textAlign: "center",
  },
  body: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
  },
});
