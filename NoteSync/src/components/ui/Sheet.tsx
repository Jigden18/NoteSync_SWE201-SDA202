import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Dimensions,
} from "react-native";
import { C } from "../../constants/colors";

const { height: windowHeight } = Dimensions.get("window");

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  half?: boolean;
}

export const Sheet: React.FC<SheetProps> = ({ open, onClose, title, children, half }) => {
  if (!open) return null;

  return (
    <Modal transparent visible={open} animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableWithoutFeedback>
          <View
            style={[
              styles.sheet,
              { maxHeight: half ? windowHeight * 0.55 : windowHeight * 0.85 },
            ]}
          >
            <View style={styles.handle} />
            {title && <Text style={styles.title}>{title}</Text>}
            <ScrollView showsVerticalScrollIndicator={false}>
              {children}
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 32,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.border,
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    marginBottom: 16,
    fontSize: 17,
    fontWeight: "700",
    color: C.textPrimary,
  },
});