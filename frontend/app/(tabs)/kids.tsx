import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
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
import * as Haptics from "expo-haptics";

import { api, Quiz } from "@/src/api";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

type Tab = "stories" | "quiz";

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
  tabs: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  chip: { height: 36, paddingHorizontal: spacing.lg, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  chipActive: { backgroundColor: colors.brandSecondary },
  chipIdle: { backgroundColor: colors.surfaceSecondary },
  chipActiveTxt: { fontFamily: fonts.bodyBold, color: colors.onBrandSecondary, fontSize: 13 },
  chipIdleTxt: { fontFamily: fonts.bodyBold, color: colors.onSurfaceSecondary, fontSize: 13 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xxl, gap: spacing.md },
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
  progressBar: { height: 6, backgroundColor: colors.surfaceTertiary, borderRadius: radius.pill, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: colors.brandSecondary },
  qCount: { fontFamily: fonts.body, color: colors.muted, marginTop: spacing.sm, textAlign: "right" },
  question: { fontFamily: fonts.displayBold, fontSize: 24, color: colors.onSurface, marginTop: spacing.md, textAlign: "right", lineHeight: 34 },
  option: { padding: spacing.lg, borderRadius: radius.md, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border },
  optionCorrect: { backgroundColor: colors.success, borderColor: colors.success },
  optionWrong: { backgroundColor: colors.error, borderColor: colors.error },
  optionText: { fontFamily: fonts.bodySemi, fontSize: 16, color: colors.onSurface, textAlign: "right" },
  optionTextOn: { fontFamily: fonts.bodySemi, fontSize: 16, color: colors.onBrand, textAlign: "right" },
  explain: { marginTop: spacing.lg, padding: spacing.lg, backgroundColor: colors.brandTertiary, borderRadius: radius.md },
  explainTxt: { fontFamily: fonts.body, color: colors.onBrandTertiary, fontSize: 14, lineHeight: 24, textAlign: "right" },
  nextBtn: {
    marginTop: spacing.md, flexDirection: "row", alignItems: "center", gap: 6,
    alignSelf: "flex-start", backgroundColor: colors.brandPrimary,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.pill,
  },
  nextTxt: { color: colors.onBrand, fontFamily: fonts.bodyBold, fontSize: 13 },
  resultTitle: { fontFamily: fonts.displayBold, fontSize: 30, color: colors.brandPrimary },
  resultScore: { fontFamily: fonts.body, fontSize: 20, color: colors.onSurfaceSecondary },
  restartBtn: {
    marginTop: spacing.md, backgroundColor: colors.brandSecondary,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.pill,
  },
  restartTxt: { fontFamily: fonts.bodyBold, color: colors.onBrandSecondary },
}));

export default function KidsTab() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>("stories");
  const styles = useStyles();
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>قسم الأطفال</Text>
            <Text style={styles.subtitle}>قصص مبسّطة ونشاطات ممتعة</Text>
          </View>
          <View style={styles.kidsBadge}>
            <Feather name="smile" size={22} color={colors.brandSecondary} />
          </View>
        </View>

        <View style={styles.tabs}>
          <TabChip active={tab === "stories"} label="قصص للأطفال" onPress={() => setTab("stories")} testID="kids-tab-stories" />
          <TabChip active={tab === "quiz"} label="اختبار ممتع" onPress={() => setTab("quiz")} testID="kids-tab-quiz" />
        </View>
      </View>

      {tab === "stories" ? <KidsStories /> : <KidsQuiz />}
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

function KidsStories() {
  const q = useQuery({ queryKey: ["kids-stories"], queryFn: api.kidsStories });
  const styles = useStyles();
  const { colors } = useTheme();

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

function KidsQuiz() {
  const q = useQuery({ queryKey: ["quizzes"], queryFn: api.quizzes });
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const styles = useStyles();
  const { colors } = useTheme();

  if (q.isLoading)
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.brandPrimary} />
      </View>
    );

  const quizzes: Quiz[] = q.data ?? [];
  if (quizzes.length === 0)
    return (
      <View style={styles.center}>
        <Text>لا توجد أسئلة</Text>
      </View>
    );

  if (done) {
    return (
      <View style={styles.center}>
        <Feather name="award" size={64} color={colors.brandSecondary} />
        <Text style={styles.resultTitle}>أحسنت!</Text>
        <Text style={styles.resultScore}>
          {score} / {quizzes.length}
        </Text>
        <Pressable
          testID="quiz-restart"
          onPress={() => {
            setIdx(0);
            setSelected(null);
            setScore(0);
            setDone(false);
          }}
          style={styles.restartBtn}
        >
          <Text style={styles.restartTxt}>ابدأ من جديد</Text>
        </Pressable>
      </View>
    );
  }

  const cur = quizzes[idx];

  const pick = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    if (i === cur.answer) {
      setScore((s) => s + 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  const next = () => {
    if (idx + 1 >= quizzes.length) {
      setDone(true);
    } else {
      setIdx((n) => n + 1);
      setSelected(null);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((idx + 1) / quizzes.length) * 100}%` }]} />
      </View>
      <Text style={styles.qCount}>
        سؤال {idx + 1} من {quizzes.length}
      </Text>
      <Text style={styles.question}>{cur.question}</Text>

      <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
        {cur.options.map((o, i) => {
          const isCorrect = selected !== null && i === cur.answer;
          const isWrong = selected === i && i !== cur.answer;
          return (
            <Pressable
              testID={`quiz-option-${i}`}
              key={i}
              onPress={() => pick(i)}
              style={[styles.option, isCorrect && styles.optionCorrect, isWrong && styles.optionWrong]}
            >
              <Text style={isCorrect || isWrong ? styles.optionTextOn : styles.optionText}>{o}</Text>
            </Pressable>
          );
        })}
      </View>

      {selected !== null && (
        <View style={styles.explain}>
          <Text style={styles.explainTxt}>{cur.explanation}</Text>
          <Pressable testID="quiz-next" onPress={next} style={styles.nextBtn}>
            <Text style={styles.nextTxt}>{idx + 1 >= quizzes.length ? "النتيجة" : "التالي"}</Text>
            <Feather name="chevron-left" size={16} color={colors.onBrand} />
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}
