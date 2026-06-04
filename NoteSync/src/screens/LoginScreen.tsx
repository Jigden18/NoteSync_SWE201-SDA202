import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { C } from "../constants/colors";
import { delay, User } from "../utils/helpers";
import { MOCK_STUDENT, MOCK_LECTURER } from "../data/mockData";
import { Btn } from "../components/ui/Btn";
import { Input } from "../components/ui/Input";
import { Ionicons } from "@expo/vector-icons";

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [selectedRole, setSelectedRole] = useState<"student" | "lecturer">(
    "student",
  );
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleLogin = async () => {
    if (!id || !pw) {
      setErr("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setErr("");
    await delay(600);
    const user = selectedRole === "lecturer" ? MOCK_LECTURER : MOCK_STUDENT;
    setLoading(false);
    onLogin(user as User);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.logo}>NoteSync</Text>
          <Text style={styles.tagline}>
            Collaborative lecture notes, reimagined
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Demo role</Text>
          <View style={styles.roleRow}>
            <TouchableOpacity
              onPress={() => setSelectedRole("student")}
              style={[
                styles.roleChip,
                selectedRole === "student" && styles.roleChipActive,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Select student role"
            >
              <Text
                style={[
                  styles.roleChipText,
                  selectedRole === "student" && styles.roleChipTextActive,
                ]}
              >
                Student
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setSelectedRole("lecturer")}
              style={[
                styles.roleChip,
                selectedRole === "lecturer" && styles.roleChipActive,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Select lecturer role"
            >
              <Text
                style={[
                  styles.roleChipText,
                  selectedRole === "lecturer" && styles.roleChipTextActive,
                ]}
              >
                Lecturer
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Student ID or Email</Text>
          <Input
            value={id}
            onChangeText={setId}
            placeholder="e.g. STU2024001 or name@cst.edu.bt"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordContainer}>
            <Input
              value={pw}
              onChangeText={setPw}
              placeholder="Password"
              secureTextEntry={!showPw}
              style={styles.passwordInput}
            />
            <TouchableOpacity
              onPress={() => setShowPw(!showPw)}
              style={styles.eyeBtn}
            >
              <Ionicons
                name={showPw ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={C.textMuted}
              />
            </TouchableOpacity>
          </View>

          {err && <Text style={styles.error}>{err}</Text>}

          <View style={styles.spacing} />
          <Btn onPress={handleLogin} full disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </Btn>

          <Text style={styles.demoText}>
            Demo: choose a role above, then use any ID/email and password
          </Text>
        </View>

        <TouchableOpacity onPress={() => alert("Registration flow")}>
          <Text style={styles.registerText}>
            Don't have an account?{" "}
            <Text style={styles.registerLink}>Register</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingVertical: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    fontSize: 36,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontWeight: "400",
    marginBottom: 8,
    color: C.textPrimary,
  },
  tagline: {
    color: C.textSecondary,
    fontSize: 14,
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 28,
    borderWidth: 1,
    borderColor: C.border,
    width: "100%",
    maxWidth: 400,
  },
  label: {
    fontSize: 12,
    color: C.textMuted,
    marginBottom: 6,
  },
  roleRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  roleChip: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: C.surface,
  },
  roleChipActive: {
    backgroundColor: C.accentLight,
    borderColor: C.accent,
  },
  roleChipText: {
    fontSize: 13,
    color: C.textSecondary,
    fontWeight: "600",
  },
  roleChipTextActive: {
    color: C.accent,
  },
  passwordContainer: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 40,
  },
  eyeBtn: {
    position: "absolute",
    right: 12,
    top: 12,
  },
  error: {
    color: C.danger,
    fontSize: 13,
    marginTop: 8,
  },
  spacing: {
    height: 18,
  },
  demoText: {
    textAlign: "center",
    fontSize: 13,
    color: C.textMuted,
    marginTop: 16,
  },
  registerText: {
    textAlign: "center",
    fontSize: 13,
    color: C.textSecondary,
    marginTop: 20,
  },
  registerLink: {
    color: C.accent,
  },
});
