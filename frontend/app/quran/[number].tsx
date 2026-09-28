import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Feather from "@react-native-vector-icons/feather";

import { api } from "@/src/api";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

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
  headerCenter: { flex: 1, alignItems: "center" },
  back: {
    width: 40, height: 40, borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1, borderColor: colors.border,
    alignItems: "center", justifyContent: "center",
  },
  title: { fontFamily: fonts.displayBold, fontSize: 26, color: colors.brandPrimary },
  subtitle: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 2 },
  bism: {
    fontFamily: fonts.displayBold, fontSize: 26, color: colors.brandPrimary,
    textAlign: "center", marginVertical: spacing.xl, lineHeight: 40,
  },
  ayah: {
    fontFamily: fonts.display, fontSize: 24, color: colors.onSurface,
    lineHeight: 52, textAlign: "right",
  },
  ayahNum: {
    display: "flex" as const,
    color: colors.brandSecondary,
    fontFamily: fonts.displayBold,
  },
  page: { padding: spacing.lg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  ayahSep: { height: 1, backgroundColor: colors.divider, marginVertical: spacing.md },
}));

export default function SurahDetail() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { number } = useLocalSearchParams<{ number: string }>();
  const n = parseInt(number || "1", 10);
  const styles = useStyles();
  const { colors } = useTheme();

  const surahQ = useQuery({
    queryKey: ["surah", n],
    queryFn: () => api.getSurah(n),
    enabled: !!n,
  });

  if (surahQ.isLoading || !surahQ.data) {
    return (
      <View style={[styles.center, { paddingTop: insets.top + spacing.xl, backgroundColor: colors.surface }]}>
        <ActivityIndicator color={colors.brandPrimary} />
      </View>
    );
  }

  const s = surahQ.data;
  const type = s.revelationType === "Meccan" ? "مكية" : "مدنية";
  const bism = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
  // Surah 1 and 9 handled specially: Al-Fatiha includes bismillah as ayah 1; At-Tawbah doesn't have one.
  const showBism = n !== 1 && n !== 9;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Pressable testID="surah-back" onPress={() => router.back()} style={styles.back}>
          <Feather name="chevron-right" size={22} color={colors.onSurface} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>{s.name}</Text>
          <Text style={styles.subtitle}>{s.englishName} · {type} · {s.ayahs.length} آيات</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.page}>
        {showBism && <Text style={styles.bism}>{bism}</Text>}
        <Text style={styles.ayah}>
          {s.ayahs.map((a, i) => {
            let text = a.text;
            // Strip leading bismillah copy that appears at the head of most surahs
            if (i === 0 && showBism && text.startsWith(bism)) {
              text = text.slice(bism.length).trim();
            }
            return (
              <Text key={a.number}>
                {text}
                {" "}
                <Text style={styles.ayahNum}>﴿{a.number}﴾ </Text>
              </Text>
            );
          })}
        </Text>
      </ScrollView>
    </View>
  );
}
