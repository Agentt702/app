import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Feather from "@react-native-vector-icons/feather";
import { WebView } from "react-native-webview";

import { absAudioUrl, api, youtubeSearchUrl } from "@/src/api";
import { audioStore, useAudioState } from "@/src/audio-store";
import { getDeviceId } from "@/src/device";
import { colors, fonts, radius, spacing } from "@/src/theme";

const HERO_FALLBACK =
  "https://images.unsplash.com/photo-1772289935653-f5a7950205cf?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODF8MHwxfHNlYXJjaHwzfHxEZXNlcnQlMjBtb3VudGFpbnMlMjBzdGFycnklMjBza3klMjBjYWxtJTIwbGFuZHNjYXBlfGVufDB8fHx8MTc5MDYyODY3OXww&ixlib=rb-4.1.0&q=85";

type Section = "story" | "miracles" | "lessons" | "video";

export default function StoryDetail() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();

  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [section, setSection] = useState<Section>("story");
  const audio = useAudioState();

  useEffect(() => {
    getDeviceId().then(setDeviceId);
  }, []);

  const prophetQ = useQuery({
    queryKey: ["prophet", id],
    queryFn: () => api.getProphet(id as string),
    enabled: !!id,
  });

  const bmQ = useQuery({
    queryKey: ["bookmarks", deviceId],
    queryFn: () => api.bookmarks(deviceId!),
    enabled: !!deviceId,
  });
  const isBookmarked = !!bmQ.data?.some((b) => b.prophet_id === id);

  const toggleBookmark = useMutation({
    mutationFn: async () => {
      if (!deviceId) return;
      if (isBookmarked) await api.removeBookmark(deviceId, id as string);
      else await api.addBookmark(deviceId, id as string);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bookmarks", deviceId] }),
  });

  const ttsMut = useMutation({
    mutationFn: async () => {
      if (!prophetQ.data) return;
      const text = `${prophetQ.data.name_ar}. ${prophetQ.data.story}`;
      const res = await api.ttsGenerate(text);
      await audioStore.load(
        absAudioUrl(res.audio_url),
        prophetQ.data.name_ar,
        text,
      );
    },
  });

  if (prophetQ.isLoading || !prophetQ.data) {
    return (
      <View style={[styles.center, { paddingTop: insets.top + spacing.xl }]}>
        <ActivityIndicator color={colors.brandPrimary} />
      </View>
    );
  }

  const p = prophetQ.data;
  const isCurrentAudio =
    audio.currentTitle === p.name_ar && !!audio.currentUrl;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xxxl + 80 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Image source={{ uri: HERO_FALLBACK }} style={StyleSheet.absoluteFill} contentFit="cover" />
          <LinearGradient
            colors={["rgba(28,25,23,0.35)", "rgba(28,25,23,0.9)"]}
            style={StyleSheet.absoluteFill}
          />

          <View style={[styles.heroTop, { paddingTop: insets.top + spacing.sm }]}>
            <Pressable testID="back-btn" onPress={() => router.back()} style={styles.iconBtn}>
              <Feather name="chevron-right" size={22} color={colors.onSurfaceInverse} />
            </Pressable>
            <Pressable
              testID="bookmark-btn"
              onPress={() => toggleBookmark.mutate()}
              style={styles.iconBtn}
            >
              <Feather
                name="bookmark"
                size={20}
                color={isBookmarked ? colors.brandSecondary : colors.onSurfaceInverse}
              />
            </Pressable>
          </View>

          <View style={styles.heroBody}>
            <Text style={styles.heroEra}>{p.era}</Text>
            <Text style={styles.heroName}>{p.name_ar}</Text>
            <Text style={styles.heroLoc}>{p.location}</Text>
          </View>
        </View>

        {/* Section tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.sm, paddingVertical: spacing.md }}
        >
          <SectionChip active={section === "story"} label="القصة" onPress={() => setSection("story")} testID="chip-story" />
          <SectionChip active={section === "video"} label="فيديو" onPress={() => setSection("video")} testID="chip-video" />
          <SectionChip active={section === "miracles"} label="المعجزات" onPress={() => setSection("miracles")} testID="chip-miracles" />
          <SectionChip active={section === "lessons"} label="الدروس" onPress={() => setSection("lessons")} testID="chip-lessons" />
        </ScrollView>

        {section === "story" && (
          <View style={styles.body}>
            <Text style={styles.summary}>{p.summary}</Text>
            <Text style={styles.story}>{p.story}</Text>
          </View>
        )}

        {section === "video" && (
          <View style={styles.body}>
            <Text style={styles.blockTitle}>مقاطع ذات صلة من يوتيوب</Text>
            <View style={styles.videoBox}>
              {Platform.OS === "web" ? (
                <View style={[styles.videoFallback]}>
                  <Feather name="youtube" size={36} color={colors.brandPrimary} />
                  <Text style={styles.videoFallbackTxt}>
                    اضغط للاستماع أو استخدم تطبيق الجوال لمشاهدة الفيديو
                  </Text>
                </View>
              ) : (
                <WebView
                  testID={`youtube-webview-${p.id}`}
                  source={{ uri: youtubeSearchUrl(p.youtube_query) }}
                  style={{ flex: 1 }}
                  allowsFullscreenVideo
                  javaScriptEnabled
                  domStorageEnabled
                />
              )}
            </View>
            <Text style={styles.videoNote}>
              يتم البحث عن قصة {p.name_short} تلقائيًا في يوتيوب.
            </Text>
          </View>
        )}

        {section === "miracles" && (
          <View style={styles.body}>
            <Text style={styles.blockTitle}>أبرز المعجزات</Text>
            {p.miracles.map((m, i) => (
              <View key={i} style={styles.item} testID={`miracle-${i}`}>
                <View style={styles.itemBullet}>
                  <Feather name="star" size={14} color={colors.brandSecondary} />
                </View>
                <Text style={styles.itemText}>{m}</Text>
              </View>
            ))}
          </View>
        )}

        {section === "lessons" && (
          <View style={styles.body}>
            <Text style={styles.blockTitle}>الدروس المستفادة</Text>
            {p.lessons.map((m, i) => (
              <View key={i} style={styles.item} testID={`lesson-${i}`}>
                <View style={styles.itemBullet}>
                  <Feather name="check" size={14} color={colors.success} />
                </View>
                <Text style={styles.itemText}>{m}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Listen button */}
      <Pressable
        testID="listen-fab"
        onPress={() => {
          if (isCurrentAudio) audioStore.toggle();
          else ttsMut.mutate();
        }}
        style={[styles.fab, { bottom: insets.bottom + spacing.lg }]}
      >
        {ttsMut.isPending || (audio.loading && isCurrentAudio) ? (
          <ActivityIndicator color={colors.onBrand} />
        ) : (
          <Feather
            name={isCurrentAudio && audio.playing ? "pause" : "play"}
            size={20}
            color={colors.onBrand}
          />
        )}
        <Text style={styles.fabTxt}>
          {isCurrentAudio && audio.playing ? "إيقاف" : "استمع للقصة"}
        </Text>
      </Pressable>
    </View>
  );
}

function SectionChip({ active, label, onPress, testID }: any) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={{
        height: 36,
        paddingHorizontal: spacing.lg,
        borderRadius: radius.pill,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: active ? colors.brandPrimary : colors.surfaceSecondary,
        flexShrink: 0,
      }}
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

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  hero: {
    height: 320,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  heroTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: "rgba(28,25,23,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroBody: { padding: spacing.lg },
  heroEra: {
    color: colors.brandSecondary,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 1,
    marginBottom: spacing.sm,
    textAlign: "right",
  },
  heroName: {
    fontFamily: fonts.displayBold,
    fontSize: 40,
    color: colors.onSurfaceInverse,
    textAlign: "right",
    lineHeight: 52,
  },
  heroLoc: {
    fontFamily: fonts.body,
    color: "#EAE4D9",
    fontSize: 14,
    marginTop: spacing.xs,
    textAlign: "right",
  },
  body: { padding: spacing.lg, gap: spacing.md },
  blockTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 22,
    color: colors.brandPrimary,
    marginBottom: spacing.sm,
    textAlign: "right",
  },
  summary: {
    fontFamily: fonts.bodySemi,
    fontSize: 16,
    color: colors.onSurfaceSecondary,
    lineHeight: 28,
    textAlign: "right",
    fontStyle: "italic",
  },
  story: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.onSurface,
    lineHeight: 32,
    textAlign: "right",
  },
  videoBox: {
    height: 220,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  videoFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSecondary,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  videoFallbackTxt: {
    fontFamily: fonts.body,
    color: colors.muted,
    textAlign: "center",
  },
  videoNote: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.muted,
    marginTop: spacing.sm,
    textAlign: "right",
  },
  item: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
    padding: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemBullet: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  itemText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.onSurfaceSecondary,
    lineHeight: 26,
    textAlign: "right",
  },
  fab: {
    position: "absolute",
    left: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabTxt: { fontFamily: fonts.bodyBold, color: colors.onBrand, fontSize: 14 },
});
