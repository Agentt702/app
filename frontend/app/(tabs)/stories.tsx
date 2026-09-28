import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Feather from "@react-native-vector-icons/feather";

import { api, Prophet } from "@/src/api";
import { colors, fonts, radius, spacing } from "@/src/theme";

type SortKey = "chrono" | "alpha";

export default function StoriesTab() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [sort, setSort] = useState<SortKey>("chrono");
  const [q, setQ] = useState("");

  const listQ = useQuery({
    queryKey: ["prophets", sort],
    queryFn: () => api.listProphets(sort),
  });

  const filtered = useMemo(() => {
    const arr = listQ.data ?? [];
    if (!q.trim()) return arr;
    return arr.filter((p) => p.name_ar.includes(q) || p.name_short.includes(q));
  }, [listQ.data, q]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.title}>الأنبياء</Text>
        <Text style={styles.subtitle}>خمسة وعشرون نبيًا مذكورون في القرآن</Text>

        <View style={styles.searchWrap}>
          <Feather name="search" size={18} color={colors.muted} />
          <TextInput
            testID="stories-search-input"
            value={q}
            onChangeText={setQ}
            placeholder="ابحث باسم النبي..."
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
          />
        </View>

        <View style={styles.tabs}>
          <SortChip
            active={sort === "chrono"}
            label="ترتيب زمني"
            onPress={() => setSort("chrono")}
            testID="sort-chrono"
          />
          <SortChip
            active={sort === "alpha"}
            label="ترتيب أبجدي"
            onPress={() => setSort("alpha")}
            testID="sort-alpha"
          />
        </View>
      </View>

      {listQ.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.brandPrimary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.xxl,
          }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          renderItem={({ item }) => <ProphetRow p={item} onPress={() => router.push(`/story/${item.id}`)} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.empty}>لا نتائج للبحث</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function SortChip({
  active,
  label,
  onPress,
  testID,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
  testID: string;
}) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={[
        styles.chip,
        { backgroundColor: active ? colors.brandPrimary : colors.surfaceSecondary },
      ]}
    >
      <Text
        style={{
          fontFamily: fonts.bodySemi,
          color: active ? colors.onBrand : colors.onSurfaceSecondary,
          fontSize: 13,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ProphetRow({ p, onPress }: { p: Prophet; onPress: () => void }) {
  return (
    <Pressable testID={`prophet-row-${p.id}`} onPress={onPress} style={styles.row}>
      <View style={styles.orderBadge}>
        <Text style={styles.orderText}>{p.order}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowName}>{p.name_ar}</Text>
        <Text style={styles.rowSub} numberOfLines={1}>
          {p.era} · {p.location}
        </Text>
      </View>
      <Feather name="chevron-left" size={20} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomColor: colors.divider,
    borderBottomWidth: 1,
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 30,
    color: colors.brandPrimary,
    textAlign: "right",
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
    textAlign: "right",
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.onSurface,
    textAlign: "right",
    paddingVertical: 0,
  },
  tabs: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  chip: {
    height: 36,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  center: {
    padding: spacing.xxl,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    fontFamily: fonts.body,
    color: colors.muted,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    minHeight: 72,
    borderWidth: 1,
    borderColor: colors.border,
  },
  orderBadge: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  orderText: {
    fontFamily: fonts.displayBold,
    fontSize: 16,
    color: colors.brandPrimary,
  },
  rowName: {
    fontFamily: fonts.displayBold,
    fontSize: 22,
    color: colors.onSurface,
    textAlign: "right",
  },
  rowSub: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
    textAlign: "right",
  },
});
