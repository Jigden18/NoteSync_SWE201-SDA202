import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C } from "../../constants/colors";

interface EmptyStateProps {
  iconName?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  sub?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  iconName = "document-text-outline",
  iconColor = C.textMuted,
  title,
  sub,
}) => (
  <View style={styles.container}>
    <Ionicons name={iconName} size={48} color={iconColor} />
    <Text style={styles.title}>{title}</Text>
    {sub && <Text style={styles.sub}>{sub}</Text>}
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    padding: 48,
    gap: 12,
  },
  title: {
    fontWeight: "600",
    fontSize: 16,
    color: C.textSecondary,
  },
  sub: {
    fontSize: 13,
    color: C.textMuted,
    textAlign: "center",
    maxWidth: 240,
  },
});