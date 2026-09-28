import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Feather from "@react-native-vector-icons/feather";
import * as Haptics from "expo-haptics";

import { api } from "@/src/api";
import { getDeviceId } from "@/src/device";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

const useStyles = makeStyles((colors) => ({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xxl, gap: spacing.md },
  header: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  back: {
    width: 40, height: 40, borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1, borderColor: colors.border,
    alignItems: "center", justifyContent: "center",
  },
  headerMid: { flex: 1, alignItems: "center" },
  hTitle: { fontFamily: fonts.displayBold, fontSize: 22, color: colors.brandPrimary },
  hSub: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 2 },
  hRight: { width: 40, alignItems: "center", justifyContent: "center" },
  hCounter: { fontFamily: fonts.bodyBold, color: colors.onSurface, fontSize: 14 },
  progressBar: {
    height: 6, backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.pill, overflow: "hidden",
    marginHorizontal: spacing.lg, marginTop: spacing.md,
  },
  progressFill: { height: "100%", backgroundColor: colors.brandSecondary },
  body: { padding: spacing.lg, gap: spacing.md },
  question: {
    fontFamily: fonts.displayBold, fontSize: 22, color: colors.onSurface,
    textAlign: "right", lineHeight: 32, marginTop: spacing.md,
  },
  option: { padding: spacing.lg, borderRadius: radius.md, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border },
  optionCorrect: { backgroundColor: colors.success, borderColor: colors.success },
  optionWrong: { backgroundColor: colors.error, borderColor: colors.error },
  optionText: { fontFamily: fonts.bodySemi, fontSize: 16, color: colors.onSurface, textAlign: "right" },
  optionTextOn: { fontFamily: fonts.bodySemi, fontSize: 16, color: colors.onBrand, textAlign: "right" },
  explain: { padding: spacing.lg, backgroundColor: colors.brandTertiary, borderRadius: radius.md, marginTop: spacing.md },
  explainTxt: { fontFamily: fonts.body, color: colors.onBrandTertiary, fontSize: 14, lineHeight: 24, textAlign: "right" },
  nextBtn: {
    marginTop: spacing.md, flexDirection: "row", alignItems: "center", gap: 6,
    alignSelf: "flex-start", backgroundColor: colors.brandPrimary,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.pill,
  },
  nextTxt: { color: colors.onBrand, fontFamily: fonts.bodyBold, fontSize: 13 },
  // Result
  resultTitle: { fontFamily: fonts.displayBold, fontSize: 30, color: colors.brandPrimary },
  resultScore: { fontFamily: fonts.body, fontSize: 20, color: colors.onSurfaceSecondary },
  starsRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  actionBtn: {
    marginTop: spacing.md, backgroundColor: colors.brandSecondary,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.pill,
  },
  actionTxt: { fontFamily: fonts.bodyBold, color: colors.onBrandSecondary },
  secondaryBtn: {
    marginTop: spacing.sm, backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.border,
  },
  secondaryTxt: { fontFamily: fonts.bodySemi, color: colors.onSurface },
  resultBanner: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    alignItems: "center",
    gap: spacing.sm,
  },
  bannerPass: { backgroundColor: colors.brandTertiary },
  bannerFail: { backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.error },
  bannerTitle: { fontFamily: fonts.displayBold, fontSize: 24, color: colors.brandPrimary },
  bannerText: { fontFamily: fonts.body, color: colors.onSurfaceSecondary, textAlign: "center" },
}));

export default function LevelQuiz() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const { n } = useLocalSearchParams<{ n: string }>();
  const level = Math.max(1, Math.min(100, parseInt(n || "1", 10)));
  const styles = useStyles();
  const { colors } = useTheme();

  const [deviceId, setDeviceId] = useState<string | null>(null);
  useEffect(() => {
    getDeviceId().then(setDeviceId);
  }, []);

  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const [submitted, setSubmitted] = useState<null | { passed: boolean; stars: number; current_level: number }>(null);

  const levelQ = useQuery({
    queryKey: ["level", level],
    queryFn: () => api.getLevel(level),
  });

  const submit = useMutation({
    mutationFn: async () => {
      if (!deviceId) return null;
      return api.completeLevel(deviceId, level, correct);
    },
    onSuccess: (res) => {
      if (res) setSubmitted(res);
      qc.invalidateQueries({ queryKey: ["kids-progress"] });
    },
  });

  useEffect(() => {
    if (done && !submitted && !submit.isPending) {
      submit.mutate();
    }
  }, [done, submitted, submit]);

  if (levelQ.isLoading || !levelQ.data) {
    return (
      <View style={[styles.center, { paddingTop: insets.top + spacing.xxl, backgroundColor: colors.surface }]}>
        <ActivityIndicator color={colors.brandPrimary} />
      </View>
    );
  }

  const questions = levelQ.data.questions;
  const cur = questions[idx];
  const tier = level <= 33 ? "سهل" : level <= 66 ? "متوسط" : "صعب";

  const pick = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    if (i === cur.answer) {
      setCorrect((c) => c + 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  const next = () => {
    if (idx + 1 >= questions.length) {
      setDone(true);
    } else {
      setIdx((n) => n + 1);
      setSelected(null);
    }
  };

  if (done) {
    const stars = submitted?.stars ?? 0;
    const passed = submitted?.passed ?? correct >= 6;
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface }}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
          <Pressable testID="level-back" onPress={() => router.replace("/(tabs)/kids")} style={styles.back}>
            <Feather name="chevron-right" size={22} color={colors.onSurface} />
          </Pressable>
          <View style={styles.headerMid}>
            <Text style={styles.hTitle}>النتيجة</Text>
            <Text style={styles.hSub}>المرحلة {level}</Text>
          </View>
          <View style={styles.hRight} />
        </View>

        <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
          <View style={[styles.resultBanner, passed ? styles.bannerPass : styles.bannerFail]}>
            <Feather
              name={passed ? "award" : "refresh-cw"}
              size={48}
              color={passed ? colors.brandSecondary : colors.error}
            />
            <Text style={styles.bannerTitle}>{passed ? "أحسنت! نجحت" : "حاول مرة أخرى"}</Text>
            <Text style={styles.bannerText}>
              {passed
                ? `اجتزت المرحلة ${level} وفُتحت المرحلة ${Math.min(100, level + 1)}.`
                : "تحتاج 6 إجابات صحيحة على الأقل لعبور المرحلة."}
            </Text>
            <View style={styles.starsRow}>
              {[1, 2, 3].map((s) => (
                <Feather
                  key={s}
                  name="star"
                  size={28}
                  color={s <= stars ? colors.brandSecondary : colors.border}
                />
              ))}
            </View>
            <Text style={styles.resultScore}>{correct} / {questions.length}</Text>
          </View>

          <Pressable
            testID="result-retry"
            onPress={() => {
              setIdx(0);
              setSelected(null);
              setCorrect(0);
              setDone(false);
              setSubmitted(null);
            }}
            style={styles.actionBtn}
          >
            <Text style={styles.actionTxt}>أعد المحاولة</Text>
          </Pressable>
          {passed && level < 100 && (
            <Pressable
              testID="result-next-level"
              onPress={() => router.replace(`/kids/level/${level + 1}`)}
              style={styles.actionBtn}
            >
              <Text style={styles.actionTxt}>المرحلة التالية {level + 1}</Text>
            </Pressable>
          )}
          <Pressable
            testID="result-tree"
            onPress={() => router.replace("/(tabs)/kids")}
            style={styles.secondaryBtn}
          >
            <Text style={styles.secondaryTxt}>العودة لشجرة المراحل</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Pressable testID="level-quit" onPress={() => router.back()} style={styles.back}>
          <Feather name="chevron-right" size={22} color={colors.onSurface} />
        </Pressable>
        <View style={styles.headerMid}>
          <Text style={styles.hTitle}>المرحلة {level}</Text>
          <Text style={styles.hSub}>{tier} · {correct} صحيحة</Text>
        </View>
        <View style={styles.hRight}>
          <Text style={styles.hCounter}>{idx + 1}/{questions.length}</Text>
        </View>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((idx + 1) / questions.length) * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.question}>{cur.question}</Text>

        <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
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
              <Text style={styles.nextTxt}>{idx + 1 >= questions.length ? "النتيجة" : "التالي"}</Text>
              <Feather name="chevron-left" size={16} color={colors.onBrand} />
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
