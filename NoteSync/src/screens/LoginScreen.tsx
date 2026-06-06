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
import { useAuth } from "../contexts/AuthContext";
import { Btn } from "../components/ui/Btn";
import { Input } from "../components/ui/Input";
import { Ionicons } from "@expo/vector-icons";

interface LoginScreenProps {
  onLogin: () => void;
  onRegisterPress: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onRegisterPress }) => {
  const { login } = useAuth();
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [selectedRole, setSelectedRole] = useState<"student" | "lecturer">("student");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleLogin = async () => {
    if (!id.trim()) {
      setErr(selectedRole === "lecturer" ? "Please enter your email address." : "Please enter your Student ID or email.");
      return;
    }
    if (!pw.trim()) { setErr("Please enter your password."); return; }
    if (pw.length < 6) { setErr("Password must be at least 6 characters."); return; }

    setLoading(true);
    setErr("");
    try {
      await login(id.trim(), pw);
    } catch (e: any) {
      setErr(e.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.logo}>NoteSync</Text>
          <Text style={styles.tagline}>Collaborative lecture notes, reimagined</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Select a role</Text>
          <View style={styles.roleRow}>
            {(["student", "lecturer"] as const).map((role) => (
              <TouchableOpacity
                key={role}
                onPress={() => { setSelectedRole(role); setId(""); setErr(""); }}
                style={[styles.roleChip, selectedRole === role && styles.roleChipActive]}
              >
                <Text style={[styles.roleChipText, selectedRole === role && styles.roleChipTextActive]}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>
            {selectedRole === "lecturer" ? "Email" : "Student ID or Email"}
          </Text>
          <Input
            value={id}
            onChangeText={(t) => { setId(t); setErr(""); }}
            placeholder={selectedRole === "lecturer" ? "Enter your email" : "Enter Student ID or Email"}
            autoCapitalize="none"
            keyboardType={selectedRole === "lecturer" ? "email-address" : "default"}
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordContainer}>
            <Input
              value={pw}
              onChangeText={(t) => { setPw(t); setErr(""); }}
              placeholder="Password"
              secureTextEntry={!showPw}
              style={styles.passwordInput}
            />
            <TouchableOpacity onPress={() => setShowPw(!showPw)} style={styles.eyeBtn}>
              <Ionicons name={showPw ? "eye-off-outline" : "eye-outline"} size={20} color={C.textMuted} />
            </TouchableOpacity>
          </View>

          {!!err && <Text style={styles.error}>{err}</Text>}
          <View style={styles.spacing} />
          <Btn onPress={handleLogin} full disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </Btn>
        </View>

        <TouchableOpacity onPress={onRegisterPress}>
          <Text style={styles.registerText}>
            Don't have an account?{" "}
            <Text style={styles.registerLink}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scrollContent: { flexGrow: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28, paddingVertical: 40 },
  header: { alignItems: "center", marginBottom: 40 },
  logo: { fontSize: 36, fontFamily: Platform.OS === "ios" ? "Georgia" : "serif", fontWeight: "400", marginBottom: 8, color: C.textPrimary },
  tagline: { color: C.textSecondary, fontSize: 14 },
  card: { backgroundColor: C.surface, borderRadius: 16, padding: 28, borderWidth: 1, borderColor: C.border, width: "100%", maxWidth: 400 },
  label: { fontSize: 12, color: C.textMuted, marginBottom: 6 },
  roleRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  roleChip: { flex: 1, borderRadius: 999, borderWidth: 1, borderColor: C.border, paddingVertical: 10, alignItems: "center", backgroundColor: C.surface },
  roleChipActive: { backgroundColor: C.accentLight, borderColor: C.accent },
  roleChipText: { fontSize: 13, color: C.textSecondary, fontWeight: "600" },
  roleChipTextActive: { color: C.accent },
  passwordContainer: { position: "relative" },
  passwordInput: { paddingRight: 40 },
  eyeBtn: { position: "absolute", right: 12, top: 12 },
  error: { color: C.danger, fontSize: 13, marginTop: 8 },
  spacing: { height: 18 },
  registerText: { textAlign: "center", fontSize: 13, color: C.textSecondary, marginTop: 20 },
  registerLink: { color: C.accent },
});
