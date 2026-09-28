import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Feather from "@react-native-vector-icons/feather";

import {
  fonts,
  makeStyles,
  radius,
  setThemePref,
  spacing,
  ThemePref,
  useTheme,
  useThemePref,
} from "@/src/theme";

const useStyles = makeStyles((colors) => ({
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
  title: { fontFamily: fonts.displayBold, fontSize: 26, color: colors.brandPrimary },
  section: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, gap: spacing.md },
  sectionLabel: {
    fontFamily: fonts.bodyBold, fontSize: 12, color: colors.muted,
    letterSpacing: 1, textAlign: "right",
    textTransform: "uppercase" as const,
  },
  card: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    overflow: "hidden",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  optionLast: { borderBottomWidth: 0 },
  optionIconWrap: {
    width: 40, height: 40, borderRadius: radius.pill,
    backgroundColor: colors.surfaceTertiary,
    alignItems: "center", justifyContent: "center",
  },
  optionIconActive: { backgroundColor: colors.brandPrimary },
  optionText: { flex: 1, textAlign: "right" },
  optionTitle: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.onSurface },
  optionSub: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 2 },
  radio: {
    width: 22, height: 22, borderRadius: radius.pill,
    borderWidth: 2, borderColor: colors.borderStrong,
    alignItems: "center", justifyContent: "center",
  },
  radioActive: { borderColor: colors.brandPrimary },
  radioDot: {
    width: 10, height: 10, borderRadius: radius.pill,
    backgroundColor: colors.brandPrimary,
  },
  about: {
    padding: spacing.lg, backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
  },
  aboutTitle: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.brandPrimary, textAlign: "right" },
  aboutText: { fontFamily: fonts.body, fontSize: 14, color: colors.onSurfaceSecondary, lineHeight: 24, marginTop: spacing.sm, textAlign: "right" },
}));

type Choice = { key: ThemePref; title: string; sub: string; icon: "smartphone" | "sun" | "moon" };
const CHOICES: Choice[] = [
  { key: "system", title: "حسب النظام", sub: "يتبع إعدادات جوّالك تلقائيًا", icon: "smartphone" },
  { key: "light", title: "الوضع الفاتح", sub: "خلفية دافئة كورق الكتاب", icon: "sun" },
  { key: "dark", title: "الوضع الداكن", sub: "مريح للقراءة الليلية", icon: "moon" },
];

export default function Settings() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const styles = useStyles();
  const { colors } = useTheme();
  const pref = useThemePref();

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.title}>الإعدادات</Text>
        <Pressable testID="settings-back" onPress={() => router.back()} style={styles.back}>
          <Feather name="chevron-right" size={22} color={colors.onSurface} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxxl }}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>المظهر</Text>
          <View style={styles.card}>
            {CHOICES.map((c, i) => {
              const active = pref === c.key;
              const last = i === CHOICES.length - 1;
              return (
                <Pressable
                  key={c.key}
                  testID={`theme-option-${c.key}`}
                  onPress={() => setThemePref(c.key)}
                  style={[styles.option, last && styles.optionLast]}
                >
                  <View style={styles.radio}>
                    {active ? <View style={styles.radioDot} /> : null}
                  </View>
                  <View style={styles.optionText}>
                    <Text style={styles.optionTitle}>{c.title}</Text>
                    <Text style={styles.optionSub}>{c.sub}</Text>
                  </View>
                  <View style={[styles.optionIconWrap, active && styles.optionIconActive]}>
                    <Feather
                      name={c.icon}
                      size={18}
                      color={active ? colors.onBrand : colors.brandPrimary}
                    />
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>عن التطبيق</Text>
          <View style={styles.about}>
            <Text style={styles.aboutTitle}>قصص الأنبياء</Text>
            <Text style={styles.aboutText}>
              تطبيق عربي يقدّم سِيَر خمسة وعشرين نبيًا مذكورين في القرآن الكريم بأسلوب تحريري
              كريم، مع النصوص، والفيديوهات، والاستماع الصوتي، وقسم مخصّص للأطفال.
              {"\n"}
              الإصدار 1.0.0
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
