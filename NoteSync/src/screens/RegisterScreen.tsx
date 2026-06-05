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
import { delay } from "../utils/helpers";
import { Btn } from "../components/ui/Btn";
import { Input } from "../components/ui/Input";
import { Ionicons } from "@expo/vector-icons";

interface RegisterScreenProps {
  onRegister: (userData: any) => void;
  onBackToLogin: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ 
  onRegister, 
  onBackToLogin 
}) => {
  const [studentId, setStudentId] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!studentId.trim()) {
      newErrors.studentId = "Student ID is required";
    } else if (studentId.length < 5) {
      newErrors.studentId = "Student ID must be at least 5 characters";
    }
    
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    await delay(800);
    
    // Create student user object
    const newUser = {
      id: studentId,
      email: email,
      role: "student",
      studentId: studentId,
      name: email.split('@')[0], // Use part of email as name
    };
    
    setLoading(false);
    
    Alert.alert(
      "Registration Successful!",
      `Your student account has been created. You can now login with your Student ID or Email.`,
      [{ text: "Go to Login", onPress: () => onBackToLogin() }]
    );
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
          <Text style={styles.subTagline}>Sign up with your Student ID and Email</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.roleBadge}>
            <Ionicons name="school-outline" size={24} color={C.accent} />
            <Text style={styles.roleBadgeText}>Student Account</Text>
          </View>

          <Text style={styles.label}>Student ID</Text>
          <Input
            value={studentId}
            onChangeText={setStudentId}
            placeholder="Enter your Student ID"
            autoCapitalize="characters"
          />
          {errors.studentId && <Text style={styles.error}>{errors.studentId}</Text>}

          <Text style={styles.label}>Email Address</Text>
          <Input
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your Email Address"
            autoCapitalize="none"
            keyboardType="email-address"
          />
          {errors.email && <Text style={styles.error}>{errors.email}</Text>}

          <View style={styles.spacing} />
          <Btn onPress={handleRegister} full disabled={loading}>
            {loading ? "Creating account..." : "Sign Up"}
          </Btn>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={16} color={C.textMuted} />
            <Text style={styles.infoText}>
              You can login using either your Student ID or Email
            </Text>
          </View>

          <Text style={styles.termsText}>
            By signing up, you agree to our Terms of Service and Privacy Policy
          </Text>
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
    marginBottom: 32,
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
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  subTagline: {
    color: C.textMuted,
    fontSize: 13,
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
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 24,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: C.accentLight,
    borderRadius: 20,
    alignSelf: "center",
  },
  roleBadgeText: {
    fontSize: 14,
    fontWeight: "600",
    color: C.accent,
  },
  label: {
    fontSize: 12,
    color: C.textMuted,
    marginBottom: 6,
    marginTop: 12,
  },
  error: {
    color: C.danger,
    fontSize: 12,
    marginTop: 4,
  },
  spacing: {
    height: 18,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.bg,
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: C.textMuted,
    flex: 1,
  },
  termsText: {
    textAlign: "center",
    fontSize: 12,
    color: C.textMuted,
    marginTop: 16,
  },
  loginText: {
    textAlign: "center",
    fontSize: 13,
    color: C.textSecondary,
    marginTop: 20,
  },
  loginLink: {
    color: C.accent,
  },
});