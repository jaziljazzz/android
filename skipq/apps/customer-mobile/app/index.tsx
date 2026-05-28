import { SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function Home() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.brand}>
          <Text style={styles.brandSkip}>Skip</Text>
          <Text style={styles.brandQ}>Q</Text>
        </Text>
        <Text style={styles.title}>
          Book your slot.{"\n"}
          <Text style={styles.titleAccent}>Skip the line.</Text>
        </Text>
        <Text style={styles.body}>
          Customer app scaffolding. Live wait times and queue join land next.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F2F3F5" },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  brand: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  brandSkip: { color: "#1A1F2E" },
  brandQ: { color: "#FF5454" },
  title: {
    marginTop: 32,
    fontSize: 40,
    fontWeight: "800",
    color: "#1A1F2E",
    textAlign: "center",
    lineHeight: 46,
  },
  titleAccent: { color: "#FF5454" },
  body: {
    marginTop: 16,
    fontSize: 16,
    color: "#4A6E8B",
    textAlign: "center",
    maxWidth: 320,
  },
});
