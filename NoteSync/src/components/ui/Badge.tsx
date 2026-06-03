import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { C } from "../../constants/colors";

interface BadgeProps {
  label: string;
  color?: "accent" | "success" | "danger" | "warning" | "gray";
  small?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ label, color = "accent", small }) => {
  const colorMap = {
    accent: [C.accentLight, C.accent],
    success: [C.successLight, C.success],
    danger: [C.dangerLight, C.danger],
    warning: [C.warningLight, C.warning],
    gray: ["#F0F0F0", "#6B6B6B"],
  };
  const [bg, fg] = colorMap[color];

  return (
    <View style={[styles.badge, { backgroundColor: bg, paddingHorizontal: small ? 6 : 9, paddingVertical: small ? 2 : 3 }]}>
      <Text style={[styles.text, { color: fg, fontSize: small ? 11 : 12 }]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 99,
    alignSelf: "flex-start",
  },
  text: {
    fontWeight: "600",
  },
});