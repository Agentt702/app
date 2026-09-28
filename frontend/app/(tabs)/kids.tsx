import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Feather from "@react-native-vector-icons/feather";

import { api } from "@/src/api";
import { getDeviceId } from "@/src/device";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

type Tab = "tree" | "stories";

const useStyles = makeStyles((colors) => ({
  header: {
    paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  headerRow: { flexDirection: "row", alignItems: "center" },
  title: { fontFamily: fonts.displayBold, fontSize: 28, color: colors.brandPrimary, textAlign: "right" },
  subtitle: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 2, textAlign: "right" },
  kidsBadge: {
    width: 48, height: 48, borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: colors.brandSecondary,
  },
  progressStrip: {
    marginTop: spacing.md,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressStat: { flex: 1, alignItems: "center" },
  statNumber: { fontFamily: fonts.displayBold, fontSize: 22, color: colors.brandSecondary },
  statLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 2 },
  tabs: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  chip: { height: 36, paddingHorizontal: spacing.lg, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  chipActive: { backgroundColor: colors.brandSecondary },
  chipIdle: { backgroundColor: colors.surfaceSecondary },
  chipActiveTxt: { fontFamily: fonts.bodyBold, color: colors.onBrandSecondary, fontSize: 13 },
  chipIdleTxt: { fontFamily: fonts.bodyBold, color: colors.onSurfaceSecondary, fontSize: 13 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xxl, gap: spacing.md },
  // Skill tree
  treeContainer: { paddingVertical: spacing.xl, alignItems: "center" },
  levelWrap: { alignItems: "center", marginVertical: spacing.md },
  node: {
    width: 76, height: 76, borderRadius: radius.pill,
    alignItems: "center", justifyContent: "center",
  },
  nodeLocked: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 2, borderColor: colors.border,
  },
  nodeAvailable: {
    backgroundColor: colors.brandPrimary,
    borderWidth: 3, borderColor: colors.brandSecondary,
    shadowColor: colors.brandSecondary,
    shadowOpacity: 0.6, shadowRadius: 12, shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  nodeCompleted: {
    backgroundColor: colors.success,
    borderWidth: 2, borderColor: colors.brandSecondary,
  },
  nodeNumLocked: { fontFamily: fonts.displayBold, fontSize: 22, color: colors.muted },
  nodeNumAvailable: { fontFamily: fonts.displayBold, fontSize: 22, color: colors.onBrand },
  nodeNumCompleted: { fontFamily: fonts.displayBold, fontSize: 22, color: colors.onSuccess },
  starsRow: {
    marginTop: 6, flexDirection: "row", gap: 3, alignItems: "center",
    justifyContent: "center",
  },
  starOn: { color: colors.brandSecondary },
  starOff: { color: colors.border },
  levelLabel: {
    marginTop: 4,
    fontFamily: fonts.bodyBold, fontSize: 11, color: colors.muted,
  },
  currentTag: {
    position: "absolute", top: -14, alignSelf: "center",
    backgroundColor: colors.brandSecondary,
    paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill,
  },
  currentTagTxt: {
    fontFamily: fonts.bodyBold, fontSize: 9, color: colors.onBrandSecondary,
    letterSpacing: 0.5,
  },
  // Kids stories
  kidsCard: {
    backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.brandSecondary + "40",
  },
  kidsCardHeader: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.md },
  kidsOrder: {
    width: 36, height: 36, borderRadius: radius.pill,
    backgroundColor: colors.brandSecondary, alignItems: "center", justifyContent: "center",
  },
  kidsOrderTxt: { fontFamily: fonts.bodyBold, color: colors.onBrandSecondary },
  kidsName: { flex: 1, fontFamily: fonts.displayBold, fontSize: 22, color: colors.brandPrimary, textAlign: "right" },
  kidsText: { fontFamily: fonts.body, fontSize: 15, color: colors.onSurfaceSecondary, lineHeight: 26, textAlign: "right" },
}));

export default function KidsTab() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>("tree");
  const styles = useStyles();
  const { colors } = useTheme();

  const [deviceId, setDeviceId] = useState<string | null>(null);
  useEffect(() => {
    getDeviceId().then(setDeviceId);
  }, []);

  const progressQ = useQuery({
    queryKey: ["kids-progress", deviceId],
    queryFn: () => api.getKidsProgress(deviceId!),
    enabled: !!deviceId,
    refetchOnMount: "always",
  });

  const currentLevel = progressQ.data?.current_level ?? 1;
  const totalStars = progressQ.data?.total_stars ?? 0;
  const completedCount = Object.keys(progressQ.data?.levels ?? {}).length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>قسم الأطفال</Text>
            <Text style={styles.subtitle}>تعلّم وتقدّم في المراحل</Text>
          </View>
          <View style={styles.kidsBadge}>
            <Feather name="award" size={22} color={colors.brandSecondary} />
          </View>
        </View>

        <View style={styles.progressStrip}>
          <View style={styles.progressStat}>
            <Text style={styles.statNumber}>{currentLevel}</Text>
            <Text style={styles.statLabel}>المرحلة الحالية</Text>
          </View>
          <View style={styles.progressStat}>
            <Text style={styles.statNumber}>{totalStars}</Text>
            <Text style={styles.statLabel}>مجموع النجوم</Text>
          </View>
          <View style={styles.progressStat}>
            <Text style={styles.statNumber}>{completedCount}</Text>
            <Text style={styles.statLabel}>مراحل مكتملة</Text>
          </View>
        </View>

        <View style={styles.tabs}>
          <TabChip active={tab === "tree"} label="المراحل" onPress={() => setTab("tree")} testID="kids-tab-tree" />
          <TabChip active={tab === "stories"} label="قصص للأطفال" onPress={() => setTab("stories")} testID="kids-tab-stories" />
        </View>
      </View>

      {tab === "tree" ? (
        <SkillTree
          currentLevel={currentLevel}
          levels={progressQ.data?.levels ?? {}}
          totalLevels={progressQ.data?.total_levels ?? 100}
          loading={progressQ.isLoading}
        />
      ) : (
        <KidsStories />
      )}
    </View>
  );
}

function TabChip({ active, label, onPress, testID }: any) {
  const styles = useStyles();
  return (
    <Pressable testID={testID} onPress={onPress} style={[styles.chip, active ? styles.chipActive : styles.chipIdle]}>
      <Text style={active ? styles.chipActiveTxt : styles.chipIdleTxt}>{label}</Text>
    </Pressable>
  );
}

function SkillTree({
  currentLevel,
  levels,
  totalLevels,
  loading,
}: {
  currentLevel: number;
  levels: Record<string, { stars: number; correct: number }>;
  totalLevels: number;
  loading: boolean;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();

  const items = useMemo(() => {
    const list: number[] = [];
    for (let i = 1; i <= totalLevels; i++) list.push(i);
    return list;
  }, [totalLevels]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.brandPrimary} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.treeContainer}>
      {items.map((level) => {
        const state =
          level < currentLevel
            ? "completed"
            : level === currentLevel
              ? "available"
              : "locked";
        const stars = levels[String(level)]?.stars ?? 0;
        // zigzag offset
        const row = level - 1;
        const positions = [-90, -30, 30, 90, 30, -30];
        const offset = positions[row % positions.length];

        return (
          <View key={level} style={[styles.levelWrap, { transform: [{ translateX: offset }] }]}>
            {level === currentLevel && (
              <View style={styles.currentTag}>
                <Text style={styles.currentTagTxt}>أنت هنا</Text>
              </View>
            )}
            <Pressable
              testID={`tree-node-${level}`}
              disabled={state === "locked"}
              onPress={() => router.push(`/kids/level/${level}`)}
              style={[
                styles.node,
                state === "locked" && styles.nodeLocked,
                state === "available" && styles.nodeAvailable,
                state === "completed" && styles.nodeCompleted,
              ]}
            >
              {state === "locked" ? (
                <Feather name="lock" size={22} color={colors.muted} />
              ) : (
                <Text
                  style={
                    state === "available" ? styles.nodeNumAvailable : styles.nodeNumCompleted
                  }
                >
                  {level}
                </Text>
              )}
            </Pressable>
            {state === "completed" && (
              <View style={styles.starsRow}>
                {[1, 2, 3].map((s) => (
                  <Feather
                    key={s}
                    name="star"
                    size={12}
                    color={s <= stars ? colors.brandSecondary : colors.border}
                  />
                ))}
              </View>
            )}
            <Text style={styles.levelLabel}>
              {level <= 33 ? "سهل" : level <= 66 ? "متوسط" : "صعب"}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

function KidsStories() {
  const styles = useStyles();
  const { colors } = useTheme();
  const q = useQuery({ queryKey: ["kids-stories"], queryFn: api.kidsStories });
  if (q.isLoading)
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.brandPrimary} />
      </View>
    );
  return (
    <FlatList
      data={q.data ?? []}
      keyExtractor={(x) => x.id}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl }}
      renderItem={({ item, index }) => (
        <View testID={`kids-story-${item.id}`} style={styles.kidsCard}>
          <View style={styles.kidsCardHeader}>
            <View style={styles.kidsOrder}>
              <Text style={styles.kidsOrderTxt}>{index + 1}</Text>
            </View>
            <Text style={styles.kidsName}>{item.name_ar}</Text>
          </View>
          <Text style={styles.kidsText}>{item.kids_story}</Text>
        </View>
      )}
    />
  );
}
