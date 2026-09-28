import { Pressable, Text, View, ActivityIndicator } from "react-native";
import Feather from "@react-native-vector-icons/feather";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { audioStore, formatTime, useAudioState } from "@/src/audio-store";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

const useStyles = makeStyles((colors) => ({
  wrap: { position: "absolute", left: spacing.md, right: spacing.md },
  card: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    backgroundColor: colors.surfaceInverse, borderRadius: radius.lg,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  closeBtn: {
    width: 28, height: 28, borderRadius: radius.pill,
    backgroundColor: "rgba(253,251,247,0.1)",
    alignItems: "center", justifyContent: "center",
  },
  playBtn: {
    width: 40, height: 40, borderRadius: radius.pill,
    backgroundColor: colors.brandSecondary,
    alignItems: "center", justifyContent: "center",
  },
  title: { fontFamily: fonts.bodyBold, color: colors.onSurfaceInverse, fontSize: 13, textAlign: "right" },
  progressRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: 4 },
  timeTxt: { fontFamily: fonts.body, fontSize: 10, color: "#B8B0A5" },
  progressBar: { flex: 1, height: 3, backgroundColor: "rgba(253,251,247,0.15)", borderRadius: radius.pill, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: colors.brandSecondary },
}));

export default function MiniPlayer() {
  const audio = useAudioState();
  const insets = useSafeAreaInsets();
  const barHeight = 49 + insets.bottom;
  const styles = useStyles();
  const { colors } = useTheme();

  if (!audio.currentUrl) return null;

  const progress = audio.durationMillis > 0 ? audio.positionMillis / audio.durationMillis : 0;

  return (
    <View testID="mini-player" pointerEvents="box-none" style={[styles.wrap, { bottom: barHeight + spacing.sm }]}>
      <View style={styles.card}>
        <Pressable testID="mini-close" onPress={() => audioStore.stopAndClear()} style={styles.closeBtn}>
          <Feather name="x" size={16} color={colors.muted} />
        </Pressable>
        <Pressable testID="mini-toggle" onPress={() => audioStore.toggle()} style={styles.playBtn}>
          {audio.loading ? (
            <ActivityIndicator color={colors.onBrand} />
          ) : (
            <Feather name={audio.playing ? "pause" : "play"} size={20} color={colors.onBrandSecondary} />
          )}
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={styles.title}>{audio.currentTitle}</Text>
          <View style={styles.progressRow}>
            <Text style={styles.timeTxt}>
              {formatTime(audio.positionMillis)} / {formatTime(audio.durationMillis)}
            </Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min(100, progress * 100)}%` }]} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
