import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Feather from "@react-native-vector-icons/feather";

import { api, Prophet } from "@/src/api";
import { getDeviceId } from "@/src/device";
import { colors, fonts, radius, spacing } from "@/src/theme";

export default function BookmarksTab() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    getDeviceId().then(setDeviceId);
  }, []);

  const bmQ = useQuery({
    queryKey: ["bookmarks", deviceId],
    queryFn: () => api.bookmarks(deviceId!),
    enabled: !!deviceId,
  });

  const listQ = useQuery({
    queryKey: ["prophets", "chrono"],
    queryFn: () => api.listProphets("chrono"),
  });

  const ids = new Set((bmQ.data ?? []).map((b) => b.prophet_id));
  const items: Prophet[] = (listQ.data ?? []).filter((p) => ids.has(p.id));

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.title}>المفضلة</Text>
        <Text style={styles.subtitle}>القصص التي حفظتها للرجوع إليها</Text>
      </View>

      {bmQ.isLoading || listQ.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.brandPrimary} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Feather name="bookmark" size={54} color={colors.brandSecondary} />
          <Text style={styles.emptyTitle}>لا مفضلات بعد</Text>
          <Text style={styles.emptyText}>
            اضغط على أيقونة الحفظ في أعلى أي قصة لإضافتها هنا.
          </Text>
          <Pressable
            testID="empty-goto-stories"
            onPress={() => router.push("/(tabs)/stories")}
            style={styles.cta}
          >
            <Text style={styles.ctaTxt}>تصفح الأنبياء</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl }}
          renderItem={({ item }) => (
            <Pressable
              testID={`bookmark-${item.id}`}
              onPress={() => router.push(`/story/${item.id}`)}
              style={styles.row}
            >
              <View style={styles.badge}>
                <Text style={styles.badgeTxt}>{item.order}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName}>{item.name_ar}</Text>
                <Text style={styles.rowSub} numberOfLines={1}>
                  {item.era}
                </Text>
              </View>
              <Feather name="chevron-left" size={20} color={colors.muted} />
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  title: { fontFamily: fonts.displayBold, fontSize: 30, color: colors.brandPrimary, textAlign: "right" },
  subtitle: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 2, textAlign: "right" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xxl, gap: spacing.md },
  emptyTitle: { fontFamily: fonts.displayBold, fontSize: 22, color: colors.onSurface },
  emptyText: { fontFamily: fonts.body, fontSize: 14, color: colors.muted, textAlign: "center", lineHeight: 22 },
  cta: {
    marginTop: spacing.md,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },
  ctaTxt: { color: colors.onBrand, fontFamily: fonts.bodyBold },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badge: {
    width: 44, height: 44, borderRadius: radius.pill,
    backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center",
  },
  badgeTxt: { fontFamily: fonts.displayBold, fontSize: 16, color: colors.brandPrimary },
  rowName: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.onSurface, textAlign: "right" },
  rowSub: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 2, textAlign: "right" },
});
