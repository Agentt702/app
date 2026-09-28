import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Feather from "@react-native-vector-icons/feather";

import { api, Surah } from "@/src/api";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

const useStyles = makeStyles((colors) => ({
  header: {
    paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  title: { fontFamily: fonts.displayBold, fontSize: 30, color: colors.brandPrimary, textAlign: "right" },
  subtitle: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 2, textAlign: "right" },
  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: colors.surfaceSecondary, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: 10, marginTop: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  searchInput: {
    flex: 1, fontFamily: fonts.body, fontSize: 14, color: colors.onSurface,
    textAlign: "right", paddingVertical: 0,
  },
  center: { padding: spacing.xxl, alignItems: "center", justifyContent: "center" },
  row: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    paddingVertical: spacing.md, paddingHorizontal: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, minHeight: 68,
  },
  badge: {
    width: 44, height: 44, borderRadius: radius.pill,
    backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: colors.brandSecondary,
  },
  badgeTxt: { fontFamily: fonts.displayBold, fontSize: 15, color: colors.brandSecondary },
  name: { fontFamily: fonts.displayBold, fontSize: 22, color: colors.onSurface, textAlign: "right" },
  meta: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 2, textAlign: "right" },
  tag: {
    alignSelf: "flex-start", paddingHorizontal: spacing.sm, paddingVertical: 2,
    borderRadius: radius.pill, backgroundColor: colors.surfaceTertiary,
  },
  tagTxt: { fontFamily: fonts.body, fontSize: 10, color: colors.onSurfaceTertiary },
  empty: { fontFamily: fonts.body, color: colors.muted },
}));

export default function QuranTab() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [q, setQ] = useState("");
  const styles = useStyles();
  const { colors } = useTheme();

  const surahsQ = useQuery({ queryKey: ["surahs"], queryFn: api.listSurahs });

  const filtered = useMemo(() => {
    const arr = surahsQ.data ?? [];
    if (!q.trim()) return arr;
    return arr.filter(
      (s) =>
        s.name.includes(q) ||
        s.englishName.toLowerCase().includes(q.toLowerCase()) ||
        String(s.number).includes(q),
    );
  }, [surahsQ.data, q]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.title}>المصحف الشريف</Text>
        <Text style={styles.subtitle}>مئة وأربع عشرة سورة بالرسم العثماني</Text>
        <View style={styles.searchWrap}>
          <Feather name="search" size={18} color={colors.muted} />
          <TextInput
            testID="quran-search-input"
            value={q}
            onChangeText={setQ}
            placeholder="ابحث بالاسم أو الرقم..."
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
          />
        </View>
      </View>

      {surahsQ.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.brandPrimary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(s) => String(s.number)}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          renderItem={({ item }) => (
            <SurahRow s={item} onPress={() => router.push(`/quran/${item.number}`)} />
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.empty}>لا نتائج</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function SurahRow({ s, onPress }: { s: Surah; onPress: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const type = s.revelationType === "Meccan" ? "مكية" : "مدنية";
  return (
    <Pressable testID={`surah-row-${s.number}`} onPress={onPress} style={styles.row}>
      <View style={styles.badge}>
        <Text style={styles.badgeTxt}>{s.number}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{s.name}</Text>
        <Text style={styles.meta}>
          {s.englishName} · {s.numberOfAyahs} آيات
        </Text>
      </View>
      <View style={styles.tag}>
        <Text style={styles.tagTxt}>{type}</Text>
      </View>
      <Feather name="chevron-left" size={20} color={colors.muted} />
    </Pressable>
  );
}
