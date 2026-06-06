import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import { C } from "../constants/colors";
import { useAuth } from "../contexts/AuthContext";
import { apiFetch } from "../api/client";
import { Header } from "../components/layout/Header";
import { Avatar } from "../components/ui/Avatar";
import { Badge } from "../components/ui/Badge";
import { Btn } from "../components/ui/Btn";
import { Input } from "../components/ui/Input";
import { Divider } from "../components/ui/Divider";
import { Sheet } from "../components/ui/Sheet";
import { Toast } from "../components/ui/Toast";
import { Ionicons } from "@expo/vector-icons";

interface ProfileScreenProps {}

export const ProfileScreen: React.FC<ProfileScreenProps> = () => {
  const { user, logout } = useAuth();
  const [notifs, setNotifs] = useState(true);
  const [editSheet, setEditSheet] = useState(false);
  const [pwSheet, setPwSheet] = useState(false);
  const [name, setName] = useState(user?.fullName ?? "");
  const [savingName, setSavingName] = useState(false);
  const [toast, setToast] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  if (!user) return null;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out of NoteSync?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log Out", style: "destructive", onPress: () => logout() },
    ]);
  };

  const handleSaveName = async () => {
    if (!name.trim()) return;
    setSavingName(true);
    try {
      await apiFetch("/api/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({ fullName: name.trim() }),
      });
      setEditSheet(false);
      showToast("Name updated!");
    } catch (e: any) {
      showToast(e.message || "Failed to update name");
    } finally {
      setSavingName(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) { showToast("Passwords do not match!"); return; }
    if (newPassword.length < 6) { showToast("Password must be at least 6 characters!"); return; }
    setSavingPw(true);
    try {
      await apiFetch("/api/auth/password", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setPwSheet(false);
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      showToast("Password updated!");
    } catch (e: any) {
      showToast(e.message || "Failed to update password");
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Profile" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Avatar name={user.fullName} size={60} color={user.avatarColor} />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{name}</Text>
              <Text style={styles.profileSub}>{user.studentId || user.email}</Text>
              <Badge
                label={user.role === "lecturer" ? "Lecturer" : "Student"}
                color={user.role === "lecturer" ? "accent" : "gray"}
              />
            </View>
          </View>

          <Divider my={0} />

          <TouchableOpacity onPress={() => setEditSheet(true)} style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="create-outline" size={20} color={C.textPrimary} />
              <Text style={styles.menuItemText}>Edit Name</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={C.textMuted} />
          </TouchableOpacity>

          <Divider my={0} />

          <TouchableOpacity onPress={() => setPwSheet(true)} style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="lock-closed-outline" size={20} color={C.textPrimary} />
              <Text style={styles.menuItemText}>Change Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={C.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.preferencesCard}>
          <Text style={styles.preferencesTitle}>PREFERENCES</Text>
          <View style={styles.preferenceItem}>
            <Text style={styles.preferenceLabel}>Push Notifications</Text>
            <Switch value={notifs} onValueChange={setNotifs} trackColor={{ false: C.border, true: C.accent }} thumbColor="#fff" />
          </View>
          <View style={styles.preferenceItem}>
            <View>
              <Text style={styles.preferenceLabel}>Dark Mode</Text>
              <Text style={styles.preferenceComingSoon}>Coming soon</Text>
            </View>
            <Switch value={false} disabled trackColor={{ false: C.border, true: C.accent }} thumbColor="#fff" />
          </View>
        </View>

        <Btn full variant="danger" onPress={handleLogout}>
          Log Out
        </Btn>
        <View style={{ height: 20 }} />
      </ScrollView>

      <Sheet open={editSheet} onClose={() => setEditSheet(false)} title="Edit Name" half>
        <Input value={name} onChangeText={setName} placeholder="Enter your name" />
        <View style={{ height: 14 }} />
        <Btn full onPress={handleSaveName} disabled={!name.trim() || savingName}>
          {savingName ? "Saving…" : "Save"}
        </Btn>
      </Sheet>

      <Sheet open={pwSheet} onClose={() => setPwSheet(false)} title="Change Password" half>
        <Input placeholder="Current password" secureTextEntry value={currentPassword} onChangeText={setCurrentPassword} />
        <View style={{ height: 8 }} />
        <Input placeholder="New password" secureTextEntry value={newPassword} onChangeText={setNewPassword} />
        <View style={{ height: 8 }} />
        <Input placeholder="Confirm new password" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />
        <View style={{ height: 14 }} />
        <Btn full onPress={handleUpdatePassword} disabled={!currentPassword || !newPassword || !confirmPassword || savingPw}>
          {savingPw ? "Updating…" : "Update Password"}
        </Btn>
      </Sheet>

      {toast ? <Toast msg={toast} onClose={() => setToast("")} /> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { flex: 1, padding: 20 },
  profileCard: { backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 20, marginBottom: 16 },
  profileHeader: { flexDirection: "row", gap: 16, alignItems: "center", marginBottom: 16 },
  profileInfo: { flex: 1, gap: 4 },
  profileName: { fontSize: 18, fontWeight: "700", color: C.textPrimary },
  profileSub: { fontSize: 13, color: C.textSecondary },
  menuItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14 },
  menuItemLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  menuItemText: { fontSize: 14, color: C.textPrimary },
  preferencesCard: { backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 20, marginBottom: 16 },
  preferencesTitle: { fontSize: 15, fontWeight: "600", color: C.textSecondary, marginBottom: 14 },
  preferenceItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  preferenceLabel: { fontSize: 14, color: C.textPrimary },
  preferenceComingSoon: { fontSize: 12, color: C.textMuted },
});
