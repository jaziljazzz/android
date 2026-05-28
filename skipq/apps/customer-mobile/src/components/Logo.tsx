import { Text, type TextStyle } from "react-native";
import { colors } from "@/theme";

export function Logo({
  size = 28,
  variant = "default",
  style,
}: {
  size?: number;
  variant?: "default" | "light";
  style?: TextStyle;
}) {
  const skipColor = variant === "light" ? colors.white : colors.ink;
  return (
    <Text
      style={[
        { fontSize: size, fontWeight: "800", letterSpacing: -0.5 },
        style,
      ]}
    >
      <Text style={{ color: skipColor }}>Skip</Text>
      <Text style={{ color: colors.accent }}>Q</Text>
    </Text>
  );
}
