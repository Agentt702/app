import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Feather from "@react-native-vector-icons/feather";

import { api } from "@/src/api";
import { colors, fonts, radius, spacing } from "@/src/theme";

const HERO_IMG =
  "https://images.unsplash.com/photo-1772289935653-f5a7950205cf?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODF8MHwxfHNlYXJjaHwzfHxEZXNlcnQlMjBtb3VudGFpbnMlMjBzdGFycnklMjBza3klMjBjYWxtJTIwbGFuZHNjYXBlfGVufDB8fHx8MTc5MDYyODY3OXww&ixlib=rb-4.1.0&q=85";

const KIDS_IMG =
  "https://images.unsplash.com/photo-1657260745787-25e32c977056?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzN8MHwxfHNlYXJjaHwyfHxJc2xhbWljJTIwZ2VvbWV0cmljJTIwcGF0dGVybiUyMGJhY2tncm91bmR8ZW58MHx8fHwxNzkwNjI4Njc1fDA&ixlib=rb-4.1.0&q=85";

export default function Home() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const storyQ = useQuery({ queryKey: ["story-of-day"], queryFn: api.storyOfDay });
  const miracleQ = useQuery({ queryKey: ["miracle-of-day"], queryFn: api.miracleOfDay });
  const chronoQ = useQuery({
    queryKey: ["prophets", "chrono"],
    queryFn: () => api.listProphets("chrono"),
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + spacing.md,
          paddingBottom: spacing.xxl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.appTitle}>قصص الأنبياء</Text>
            <Text style={styles.appSubtitle}>مرجعك اليومي في سِيَر المرسلين</Text>
          </View>
          <View style={styles.logoCircle}>
            <Feather name="book" size={22} color={colors.brandSecondary} />
          </View>
        </View>

        {/* Story of the Day Hero */}
        <Pressable
          testID="hero-story-of-day"
          onPress={() => storyQ.data && router.push(`/story/${storyQ.data.id}`)}
          style={styles.hero}
        >
          <Image source={{ uri: HERO_IMG }} style={StyleSheet.absoluteFill} contentFit="cover" />
          <LinearGradient
            colors={["rgba(28,25,23,0.1)", "rgba(28,25,23,0.85)"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroContent}>
            <Text style={styles.heroBadge}>قصة اليوم</Text>
            {storyQ.isLoading ? (
              <ActivityIndicator color={colors.brandSecondary} />
            ) : (
              <>
                <Text style={styles.heroTitle}>{storyQ.data?.name_ar}</Text>
                <Text style={styles.heroSummary} numberOfLines={2}>
                  {storyQ.data?.summary}
                </Text>
                <View style={styles.heroCta}>
                  <Text style={styles.heroCtaText}>اقرأ القصة</Text>
                  <Feather name="chevron-left" size={16} color={colors.onSurfaceInverse} />
                </View>
              </>
            )}
          </View>
        </Pressable>

        {/* Miracle of the Day */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>معجزة اليوم</Text>
          <View style={styles.miracleCard} testID="miracle-of-day-card">
            {miracleQ.isLoading ? (
              <ActivityIndicator color={colors.brandPrimary} />
            ) : (
              <>
                <View style={styles.miracleIcon}>
                  <Feather name="star" size={20} color={colors.brandSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.miracleTitle}>{miracleQ.data?.title}</Text>
                  <Text style={styles.miracleText}>{miracleQ.data?.text}</Text>
                  <Pressable
                    onPress={() =>
                      miracleQ.data && router.push(`/story/${miracleQ.data.prophet_id}`)
                    }
                    style={styles.miracleLink}
                  >
                    <Text style={styles.miracleLinkText}>
                      إلى قصة {miracleQ.data?.prophet_name}
                    </Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Continue Reading / Prophets horizontal */}
        <View style={[styles.section, { paddingHorizontal: 0 }]}>
          <Text style={[styles.sectionTitle, { paddingHorizontal: spacing.lg }]}>
            تصفّح الأنبياء
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md }}
          >
            {(chronoQ.data ?? []).slice(0, 10).map((p) => (
              <Pressable
                key={p.id}
                testID={`home-prophet-${p.id}`}
                onPress={() => router.push(`/story/${p.id}`)}
                style={styles.pCard}
              >
                <View style={styles.pCardBadge}>
                  <Text style={styles.pCardOrder}>{p.order}</Text>
                </View>
                <Text style={styles.pCardName}>{p.name_short}</Text>
                <Text style={styles.pCardEra} numberOfLines={1}>
                  {p.era}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Kids Section CTA */}
        <Pressable
          testID="home-kids-cta"
          onPress={() => router.push("/(tabs)/kids")}
          style={styles.kidsCta}
        >
          <Image source={{ uri: KIDS_IMG }} style={StyleSheet.absoluteFill} contentFit="cover" />
          <LinearGradient
            colors={["rgba(179,138,88,0.25)", "rgba(30,58,47,0.85)"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={{ padding: spacing.lg }}>
            <Text style={styles.kidsTitle}>قسم الأطفال</Text>
            <Text style={styles.kidsText}>قصص مبسّطة وأسئلة تفاعلية</Text>
            <View style={styles.kidsCtaBtn}>
              <Text style={styles.kidsCtaText}>ادخل الآن</Text>
            </View>
          </View>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  appTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 28,
    color: colors.brandPrimary,
    textAlign: "right",
  },
  appSubtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
    textAlign: "right",
  },
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  hero: {
    marginHorizontal: spacing.lg,
    height: 240,
    borderRadius: radius.lg,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  heroContent: {
    padding: spacing.lg,
  },
  heroBadge: {
    alignSelf: "flex-start",
    color: colors.brandSecondary,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 1,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
  },
  heroTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 30,
    color: colors.onSurfaceInverse,
    textAlign: "right",
  },
  heroSummary: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: "#F0EAD8",
    marginTop: spacing.xs,
    textAlign: "right",
    lineHeight: 22,
  },
  heroCta: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "rgba(253,251,247,0.15)",
    borderColor: "rgba(253,251,247,0.3)",
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  heroCtaText: {
    color: colors.onSurfaceInverse,
    fontFamily: fonts.bodySemi,
    fontSize: 13,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  sectionTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 20,
    color: colors.onSurface,
    marginBottom: spacing.md,
    textAlign: "right",
  },
  miracleCard: {
    flexDirection: "row",
    gap: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  miracleIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  miracleTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 18,
    color: colors.brandPrimary,
    textAlign: "right",
  },
  miracleText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.onSurfaceSecondary,
    marginTop: spacing.xs,
    lineHeight: 24,
    textAlign: "right",
  },
  miracleLink: { marginTop: spacing.sm, alignSelf: "flex-end" },
  miracleLinkText: {
    fontFamily: fonts.bodySemi,
    color: colors.brandPrimary,
    fontSize: 13,
  },
  pCard: {
    width: 140,
    height: 160,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    justifyContent: "space-between",
    flexShrink: 0,
  },
  pCardBadge: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  pCardOrder: {
    color: colors.onBrand,
    fontFamily: fonts.bodyBold,
    fontSize: 13,
  },
  pCardName: {
    fontFamily: fonts.displayBold,
    fontSize: 22,
    color: colors.onSurface,
    textAlign: "right",
  },
  pCardEra: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.muted,
    textAlign: "right",
  },
  kidsCta: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    height: 150,
    borderRadius: radius.lg,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  kidsTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 26,
    color: colors.onSurfaceInverse,
    textAlign: "right",
  },
  kidsText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: "#F0EAD8",
    marginTop: 2,
    textAlign: "right",
  },
  kidsCtaBtn: {
    alignSelf: "flex-start",
    marginTop: spacing.md,
    backgroundColor: colors.brandSecondary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  kidsCtaText: {
    fontFamily: fonts.bodyBold,
    color: colors.onBrandSecondary,
    fontSize: 13,
  },
});
