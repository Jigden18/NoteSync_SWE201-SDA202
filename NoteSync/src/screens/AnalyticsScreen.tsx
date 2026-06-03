import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from "react-native";
import { C } from "../constants/colors";
import { MOCK_MODULES, MOCK_NOTES } from "../data/mockData";
import { Header } from "../components/layout/Header";
import { Badge } from "../components/ui/Badge";

interface AnalyticsScreenProps {
  moduleId: string;
  onBack: () => void;
}

export const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({ moduleId, onBack }) => {
  const mod = MOCK_MODULES.find((m) => m.id === moduleId);
  const stats = [
    { label: "Total Proposals", value: "12", color: C.accent },
    { label: "Approval Rate", value: "67%", color: C.success },
    { label: "Avg Upvotes", value: "7.5", color: C.warning },
  ];

  const bars = MOCK_NOTES.filter((n) => n.moduleId === moduleId).map((n, i) => ({
    label: n.title.split(" ").slice(0, 2).join(" ") + "…",
    count: [12, 8, 5][i] || 3,
  }));
  const maxCount = Math.max(...bars.map((b) => b.count));

  const getBarColor = (index: number) => {
    const colors = [C.warning, C.accent, C.success, C.danger];
    return colors[index % colors.length];
  };

  return (
    <View style={styles.container}>
      <Header title="Analytics" sub={mod?.name} onBack={onBack} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsGrid}>
          {stats.map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>PROPOSALS PER LECTURE</Text>
          {bars.map((b, idx) => (
            <View key={b.label} style={styles.barItem}>
              <View style={styles.barHeader}>
                <Text style={styles.barLabel}>{b.label}</Text>
                <Text style={styles.barCount}>{b.count}</Text>
              </View>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${(b.count / maxCount) * 100}%`,
                      backgroundColor: getBarColor(idx),
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>

        <View style={styles.rankingCard}>
          <Text style={styles.chartTitle}>MOST ACTIVE LECTURES</Text>
          {bars.slice(0, 3).map((b, i) => (
            <View key={b.label} style={styles.rankingItem}>
              <View
                style={[
                  styles.rankBadge,
                  {
                    backgroundColor:
                      i === 0 ? C.warningLight : i === 1 ? C.accentLight : C.bg,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.rankNumber,
                    {
                      color:
                        i === 0 ? C.warning : i === 1 ? C.accent : C.textMuted,
                    },
                  ]}
                >
                  {i + 1}
                </Text>
              </View>
              <Text style={styles.rankingLabel}>{b.label}</Text>
              <Badge
                label={`${b.count} proposals`}
                color={i === 0 ? "warning" : i === 1 ? "accent" : "gray"}
                small
              />
            </View>
          ))}
        </View>
      </ScrollView>
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
    padding: 16,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  statValue: {
    fontWeight: "700",
    fontSize: 22,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: C.textSecondary,
    textAlign: "center",
    lineHeight: 14,
  },
  chartCard: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: C.textSecondary,
    marginBottom: 16,
  },
  barItem: {
    marginBottom: 14,
  },
  barHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  barLabel: {
    fontSize: 12,
    color: C.textPrimary,
  },
  barCount: {
    fontSize: 12,
    fontWeight: "600",
    color: C.accent,
  },
  barTrack: {
    height: 10,
    backgroundColor: C.bg,
    borderRadius: 5,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 5,
  },
  rankingCard: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  rankingItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  rankNumber: {
    fontSize: 13,
    fontWeight: "700",
  },
  rankingLabel: {
    flex: 1,
    fontSize: 14,
    color: C.textPrimary,
  },
});