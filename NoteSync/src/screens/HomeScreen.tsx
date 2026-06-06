import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { C } from "../constants/colors";
import { useAuth } from "../contexts/AuthContext";
import { apiFetch } from "../api/client";
import { Header } from "../components/layout/Header";
import { Btn } from "../components/ui/Btn";
import { Input } from "../components/ui/Input";
import { Sheet } from "../components/ui/Sheet";
import { Toast } from "../components/ui/Toast";
import { EmptyState } from "../components/ui/EmptyState";
import { ListSkeleton } from "../components/ui/ListSkeleton";
import { Ionicons } from "@expo/vector-icons";

interface Module {
  id: string;
  code: string;
  name: string;
  lecturerName: string;
  enrollCode: string;
  studentCount: number;
  lectureCount: number;
}

interface ModuleCardProps {
  mod: Module;
  role: "student" | "lecturer";
  onClick: () => void;
}

const ModuleCard: React.FC<ModuleCardProps> = ({ mod, role, onClick }) => (
  <TouchableOpacity onPress={onClick} style={styles.moduleCard}>
    <View style={styles.moduleCodeContainer}>
      <Text style={styles.moduleCode}>{mod.code}</Text>
    </View>
    <View style={styles.moduleInfo}>
      <Text style={styles.moduleName} numberOfLines={1}>{mod.name}</Text>
      <Text style={styles.moduleSubtitle}>
        {role === "student"
          ? mod.lecturerName
          : `${mod.studentCount} students · ${mod.lectureCount} lectures`}
      </Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color={C.textMuted} />
  </TouchableOpacity>
);

interface HomeScreenProps {
  navigate: (screen: string, params?: any) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigate }) => {
  const { user } = useAuth();
  const [modules, setModules] = useState<Module[] | null>(null);
  const [joinSheet, setJoinSheet] = useState(false);
  const [createSheet, setCreateSheet] = useState(false);
  const [code, setCode] = useState("");
  const [moduleName, setModuleName] = useState("");
  const [moduleCode, setModuleCode] = useState("");
  const [enrollCode, setEnrollCode] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const toast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const loadModules = useCallback(async () => {
    try {
      const data = await apiFetch<Module[]>("/api/modules");
      setModules(data);
    } catch {
      setModules([]);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadModules(); }, [loadModules]));

  const handleJoin = async () => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      await apiFetch("/api/modules/enrol", {
        method: "POST",
        body: JSON.stringify({ enrollCode: code.trim().toUpperCase() }),
      });
      setJoinSheet(false);
      setCode("");
      toast("Module joined successfully!");
      loadModules();
    } catch (e: any) {
      toast(e.message || "Failed to join module");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!moduleName.trim() || !moduleCode.trim() || !enrollCode.trim()) return;
    setLoading(true);
    try {
      await apiFetch("/api/modules", {
        method: "POST",
        body: JSON.stringify({
          name: moduleName.trim(),
          code: moduleCode.trim().toUpperCase(),
          enrollCode: enrollCode.trim().toUpperCase(),
        }),
      });
      setCreateSheet(false);
      setModuleName("");
      setModuleCode("");
      setEnrollCode("");
      toast("Module created!");
      loadModules();
    } catch (e: any) {
      toast(e.message || "Failed to create module");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="My Modules"
        right={
          user?.role === "lecturer" ? (
            <View style={styles.headerActions}>
              <Btn size="sm" variant="secondary" onPress={() => navigate("reviewQueue")}>
                Review Queue
              </Btn>
              <Btn size="sm" onPress={() => setCreateSheet(true)}>
                + New Module
              </Btn>
            </View>
          ) : (
            <Btn size="sm" variant="secondary" onPress={() => setJoinSheet(true)}>
              Join Module
            </Btn>
          )
        }
      />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.moduleList}>
          {!modules ? (
            <ListSkeleton />
          ) : modules.length === 0 ? (
            <EmptyState iconName="book-outline" title="No modules yet" sub="Join or create a module to get started" />
          ) : (
            modules.map((m) => (
              <ModuleCard
                key={m.id}
                mod={m}
                role={user?.role || "student"}
                onClick={() => navigate("module", { id: m.id })}
              />
            ))
          )}
        </View>
      </ScrollView>

      <Sheet open={joinSheet} onClose={() => setJoinSheet(false)} title="Join a Module">
        <Text style={styles.sheetText}>Enter the enrolment code from your lecturer.</Text>
        <Input value={code} onChangeText={(v) => setCode(v.toUpperCase())} placeholder="e.g. XPD301" />
        <View style={{ height: 14 }} />
        <Btn onPress={handleJoin} full disabled={code.length < 3 || loading}>
          {loading ? "Joining…" : "Join Module"}
        </Btn>
      </Sheet>

      <Sheet open={createSheet} onClose={() => setCreateSheet(false)} title="Create Module">
        <Input value={moduleName} onChangeText={setModuleName} placeholder="Module Name" />
        <View style={{ height: 10 }} />
        <Input value={moduleCode} onChangeText={setModuleCode} placeholder="Module Code (e.g. CS301)" />
        <View style={{ height: 10 }} />
        <Input value={enrollCode} onChangeText={setEnrollCode} placeholder="Enrol Code (e.g. XPD301)" autoCapitalize="characters" />
        <View style={{ height: 14 }} />
        <Btn onPress={handleCreate} full disabled={!moduleName || !moduleCode || !enrollCode || loading}>
          {loading ? "Creating…" : "Create Module"}
        </Btn>
      </Sheet>

      {toastMsg && <Toast msg={toastMsg} onClose={() => setToastMsg("")} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { flex: 1, paddingBottom: 80 },
  moduleList: { padding: 16, gap: 12 },
  headerActions: { flexDirection: "row", gap: 8, alignItems: "center" },
  moduleCard: { backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 16, flexDirection: "row", alignItems: "center", gap: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  moduleCodeContainer: { backgroundColor: C.accentLight, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  moduleCode: { color: C.accent, fontWeight: "700", fontSize: 13, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
  moduleInfo: { flex: 1 },
  moduleName: { marginBottom: 2, fontWeight: "600", fontSize: 15, color: C.textPrimary },
  moduleSubtitle: { fontSize: 12, color: C.textSecondary },
  sheetText: { fontSize: 13, color: C.textSecondary, marginBottom: 12 },
});
