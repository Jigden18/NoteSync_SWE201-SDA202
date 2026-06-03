import React from "react";
import { View, StyleSheet } from "react-native";
import { C } from "../../constants/colors";

interface DividerProps {
  my?: number;
}

export const Divider: React.FC<DividerProps> = ({ my = 16 }) => (
  <View style={[styles.divider, { marginVertical: my }]} />
);

const styles = StyleSheet.create({
  divider: {
    height: 1,
    backgroundColor: C.border,
  },
});