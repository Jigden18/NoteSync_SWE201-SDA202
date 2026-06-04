import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform, // Add Platform import
} from "react-native";
import { C } from "../constants/colors";
import { delay, User } from "../utils/helpers";
import { MOCK_MODULES, Module } from "../data/mockData";
import { Header } from "../components/layout/Header";
import { Btn } from "../components/ui/Btn";
import { Input } from "../components/ui/Input";
import { Sheet } from "../components/ui/Sheet";
import { Toast } from "../components/ui/Toast";
import { EmptyState } from "../components/ui/EmptyState";
import { ListSkeleton } from "../components/ui/ListSkeleton";
import { Ionicons } from "@expo/vector-icons";

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
      <Text style={styles.moduleName} numberOfLines={1}>
        {mod.name}
      </Text>
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
  user: User;
  navigate: (screen: string, params?: any) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ user, navigate }) => {
  const [modules, setModules] = useState<Module[] | null>(null);
  const [joinSheet, setJoinSheet] = useState(false);
  const [createSheet, setCreateSheet] = useState(false);
  const [code, setCode] = useState("");
  const [moduleName, setModuleName] = useState("");
  const [moduleCode, setModuleCode] = useState("");
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    delay(400).then(() => setModules(MOCK_MODULES));
  }, []);

  const toast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const handleJoin = async () => {
    await delay(400);
    setJoinSheet(false);
    setCode("");
    toast("Module joined successfully!");
  };

  const handleCreate = async () => {
    await delay(400);
    setCreateSheet(false);
    setModuleName("");
    setModuleCode("");
    toast("Module created!");
  };

  return (
    <View style={styles.container}>
      <Header
        title="My Modules"
        right={
          user.role === "lecturer" ? (
            <View style={styles.headerActions}>
              <Btn
                size="sm"
                variant="secondary"
                onPress={() => navigate("reviewQueue")}
              >
                Review Queue
              </Btn>
              <Btn size="sm" onPress={() => setCreateSheet(true)}>
                + New Module
              </Btn>
            </View>
          ) : (
            <Btn
              size="sm"
              variant="secondary"
              onPress={() => setJoinSheet(true)}
            >
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
            <EmptyState
              iconName="book-outline"
              title="No modules yet"
              sub="Join or create a module to get started"
            />
          ) : (
            modules.map((m) => (
              <ModuleCard
                key={m.id}
                mod={m}
                role={user.role}
                onClick={() => navigate("module", { id: m.id })}
              />
            ))
          )}
        </View>
      </ScrollView>

      <Sheet
        open={joinSheet}
        onClose={() => setJoinSheet(false)}
        title="Join a Module"
      >
        <Text style={styles.sheetText}>
          Enter the 6-character enrolment code from your lecturer.
        </Text>
        <Input
          value={code}
          onChangeText={(v) => setCode(v.toUpperCase())}
          placeholder="e.g. XPD301"
        />
        <View style={{ height: 14 }} />
        <Btn onPress={handleJoin} full disabled={code.length < 3}>
          Join Module
        </Btn>
      </Sheet>

      <Sheet
        open={createSheet}
        onClose={() => setCreateSheet(false)}
        title="Create Module"
      >
        <Input
          value={moduleName}
          onChangeText={setModuleName}
          placeholder="Module Name"
        />
        <View style={{ height: 10 }} />
        <Input
          value={moduleCode}
          onChangeText={setModuleCode}
          placeholder="Module Code (e.g. CS301)"
        />
        <View style={{ height: 14 }} />
        <Btn onPress={handleCreate} full disabled={!moduleName || !moduleCode}>
          Create Module
        </Btn>
      </Sheet>

      {toastMsg && <Toast msg={toastMsg} onClose={() => setToastMsg("")} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  content: {
    flex: 1,
    paddingBottom: 80,
  },
  moduleList: {
    padding: 16,
    gap: 12,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  moduleCard: {
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  moduleCodeContainer: {
    backgroundColor: C.accentLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  moduleCode: {
    color: C.accent,
    fontWeight: "700",
    fontSize: 13,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  moduleInfo: {
    flex: 1,
  },
  moduleName: {
    marginBottom: 2,
    fontWeight: "600",
    fontSize: 15,
    color: C.textPrimary,
  },
  moduleSubtitle: {
    fontSize: 12,
    color: C.textSecondary,
  },
  sheetText: {
    fontSize: 13,
    color: C.textSecondary,
    marginBottom: 12,
  },
});
