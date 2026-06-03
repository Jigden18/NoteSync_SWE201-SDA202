import React from "react";
import {
  TextInput,
  StyleSheet,
  TextInputProps,
  Platform,
} from "react-native";
import { C } from "../../constants/colors";

interface InputProps extends TextInputProps {
  multiline?: boolean;
  rows?: number;
  secureTextEntry?: boolean; // Add this for password fields
}

export const Input: React.FC<InputProps> = ({
  value,
  onChangeText,
  placeholder,
  multiline,
  rows = 3,
  autoFocus,
  style,
  secureTextEntry,
  ...props
}) => {
  const baseStyle = [styles.base, style];

  if (multiline) {
    return (
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        multiline
        numberOfLines={rows}
        autoFocus={autoFocus}
        style={[baseStyle, styles.multiline, { minHeight: rows * 24 }]}
        placeholderTextColor={C.textMuted}
        {...props}
      />
    );
  }

  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      secureTextEntry={secureTextEntry}
      autoFocus={autoFocus}
      style={baseStyle}
      placeholderTextColor={C.textMuted}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    color: C.textPrimary,
    backgroundColor: C.surface,
    height: 44,
  },
  multiline: {
    paddingVertical: 12,
    textAlignVertical: "top",
    lineHeight: 22,
    height: undefined,
    minHeight: 88,
  },
});