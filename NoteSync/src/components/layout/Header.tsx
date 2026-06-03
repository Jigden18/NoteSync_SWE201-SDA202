import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { C } from "../../constants/colors";
import { Ionicons } from "@expo/vector-icons";

interface HeaderProps {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
  sub?: string;
}

export const Header: React.FC<HeaderProps> = ({ title, onBack, right, sub }) => (
  <View style={styles.container}>
    {onBack && (
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Ionicons name="chevron-back" size={24} color={C.textPrimary} />
      </TouchableOpacity>
    )}
    <View style={styles.titleContainer}>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {sub && <Text style={styles.sub}>{sub}</Text>}
    </View>
    {right && <View style={styles.rightContainer}>{right}</View>}
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backBtn: {
    padding: 0,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: C.textPrimary,
  },
  sub: {
    fontSize: 12,
    color: C.textMuted,
  },
  rightContainer: {
    flexShrink: 0,
  },
});