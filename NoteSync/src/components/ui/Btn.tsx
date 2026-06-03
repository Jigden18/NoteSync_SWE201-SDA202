import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from "react-native";
import { C } from "../../constants/colors";

interface BtnProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  full?: boolean;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Btn: React.FC<BtnProps> = ({
  children,
  onPress,
  variant = "primary",
  size = "md",
  full,
  disabled,
  loading,
  style,
  textStyle,
}) => {
  const sizeConfig = {
    sm: { height: 36, fontSize: 13, paddingHorizontal: 14 },
    md: { height: 44, fontSize: 14, paddingHorizontal: 18 },
    lg: { height: 50, fontSize: 15, paddingHorizontal: 22 },
  };

  const variantStyles = {
    primary: { backgroundColor: C.accent },
    secondary: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
    danger: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.danger },
    ghost: { backgroundColor: "transparent" },
  };

  const textColors = {
    primary: "#fff",
    secondary: C.textPrimary,
    danger: C.danger,
    ghost: C.textSecondary,
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.base,
        sizeConfig[size],
        variantStyles[variant],
        full && styles.full,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={textColors[variant]} />
      ) : (
        <Text style={[styles.text, { fontSize: sizeConfig[size].fontSize, color: textColors[variant] }, textStyle]}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    fontWeight: "500",
  },
  full: {
    width: "100%",
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: "500",
  },
});