import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { avatarColor, initials } from "../../utils/helpers";

interface AvatarProps {
  name: string;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

export const Avatar: React.FC<AvatarProps> = ({ name, size = 36, color, style }) => (
  <View style={[
    styles.container,
    {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: color || avatarColor(name),
    },
    style
  ]}>
    <Text style={[styles.text, { fontSize: size * 0.36 }]}>
      {initials(name)}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  text: {
    color: "#fff",
    fontWeight: "600",
  },
});