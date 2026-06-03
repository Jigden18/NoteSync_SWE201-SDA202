import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, ViewStyle } from "react-native";

interface SkeletonProps {
  w?: number | string;
  h?: number;
  r?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({ w = "100%", h = 20, r = 8, style }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.7, 0.3],
  });

  // Convert string width to number or handle percentage
  const getWidth = (): number | `${number}%` => {
    if (typeof w === "number") return w;
    if (typeof w === "string") {
      if (w.endsWith("%")) return w as `${number}%`;
      const parsed = parseInt(w, 10);
      return Number.isNaN(parsed) ? "100%" : parsed;
    }
    return "100%";
  };

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { 
          width: getWidth(), 
          height: h, 
          borderRadius: r, 
          opacity 
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: "#EBEBEB",
  },
});