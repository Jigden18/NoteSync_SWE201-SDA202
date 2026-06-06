import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { C } from "../constants/colors";
import { useAuth } from "../contexts/AuthContext";
import { Btn } from "../components/ui/Btn";
import { Input } from "../components/ui/Input";
import { Ionicons } from "@expo/vector-icons";

interface RegisterScreenProps {
  onRegister: () => void;
  onBackToLogin: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onRegister, onBackToLogin }) => {
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = "Full name is required";
    if (!studentId.trim()) e.studentId = "Student ID is required";
    else if (studentId.length < 5) e.studentId = "Student ID must be at least 5 characters";
    if (!email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email address";
    if (!password.trim()) e.password = "Password is required";
    else if (password.length < 6) e.password = "Password must be at least 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await register({
        fullName: fullName.trim(),
        studentId: studentId.trim().toUpperCase(),
        email: email.trim().toLowerCase(),
        role: "student",
        password,
      });
      Alert.alert("Registration Successful!", "Your account has been created.", [
        { text: "OK", onPress: onRegister },
      ]);
    } catch (e: any) {
      Alert.alert("Registration Failed", e.message || "Please try again.");
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
          <Text style={styles.tagline}>Student Registration</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.roleBadge}>
            <Ionicons name="school-outline" size={24} color={C.accent} />
            <Text style={styles.roleBadgeText}>Student Account</Text>
          </View>

          <Text style={styles.label}>Full Name</Text>
          <Input value={fullName} onChangeText={setFullName} placeholder="Enter your full name" />
          {!!errors.fullName && <Text style={styles.error}>{errors.fullName}</Text>}

          <Text style={styles.label}>Student ID</Text>
          <Input value={studentId} onChangeText={setStudentId} placeholder="e.g. STU2024001" autoCapitalize="characters" />
          {!!errors.studentId && <Text style={styles.error}>{errors.studentId}</Text>}

          <Text style={styles.label}>Email Address</Text>
          <Input value={email} onChangeText={setEmail} placeholder="Enter your email" autoCapitalize="none" keyboardType="email-address" />
          {!!errors.email && <Text style={styles.error}>{errors.email}</Text>}

          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordContainer}>
            <Input value={password} onChangeText={setPassword} placeholder="Min. 6 characters" secureTextEntry={!showPw} style={styles.passwordInput} />
            <TouchableOpacity onPress={() => setShowPw(!showPw)} style={styles.eyeBtn}>
              <Ionicons name={showPw ? "eye-off-outline" : "eye-outline"} size={20} color={C.textMuted} />
            </TouchableOpacity>
          </View>
          {!!errors.password && <Text style={styles.error}>{errors.password}</Text>}

          <View style={styles.spacing} />
          <Btn onPress={handleRegister} full disabled={loading}>
            {loading ? "Creating account…" : "Sign Up"}
          </Btn>
        </View>

        <TouchableOpacity onPress={onBackToLogin}>
          <Text style={styles.loginText}>
            Already have an account?{" "}
            <Text style={styles.loginLink}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scrollContent: { flexGrow: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28, paddingVertical: 40 },
  header: { alignItems: "center", marginBottom: 32 },
  logo: { fontSize: 36, fontFamily: Platform.OS === "ios" ? "Georgia" : "serif", fontWeight: "400", marginBottom: 8, color: C.textPrimary },
  tagline: { color: C.textSecondary, fontSize: 18, fontWeight: "600" },
  card: { backgroundColor: C.surface, borderRadius: 16, padding: 28, borderWidth: 1, borderColor: C.border, width: "100%", maxWidth: 400 },
  roleBadge: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 24, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: C.accentLight, borderRadius: 20, alignSelf: "center" },
  roleBadgeText: { fontSize: 14, fontWeight: "600", color: C.accent },
  label: { fontSize: 12, color: C.textMuted, marginBottom: 6, marginTop: 12 },
  error: { color: C.danger, fontSize: 12, marginTop: 4 },
  passwordContainer: { position: "relative" },
  passwordInput: { paddingRight: 40 },
  eyeBtn: { position: "absolute", right: 12, top: 12 },
  spacing: { height: 18 },
  loginText: { textAlign: "center", fontSize: 13, color: C.textSecondary, marginTop: 20 },
  loginLink: { color: C.accent },
});
