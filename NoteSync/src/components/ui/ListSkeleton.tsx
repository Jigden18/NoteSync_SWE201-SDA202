import React from "react";
import { View, StyleSheet } from "react-native";
import { C } from "../../constants/colors";
import { Skeleton } from "./Skeleton";

interface ListSkeletonProps {
  count?: number;
}

export const ListSkeleton: React.FC<ListSkeletonProps> = ({ count = 3 }) => (
  <View style={styles.container}>
    {Array.from({ length: count }).map((_, i) => (
      <View key={i} style={styles.card}>
        <Skeleton h={16} w="60%" />
        <View style={{ height: 8 }} />
        <Skeleton h={12} w="40%" />
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    gap: 12,
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
});