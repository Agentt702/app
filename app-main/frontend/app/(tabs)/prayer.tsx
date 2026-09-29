import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import Feather from "@react-native-vector-icons/feather";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { audioStore } from "@/src/audio-store";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

type PrayerKey = "Fajr" | "Sunrise" | "Dhuhr" | "Asr" | "Maghrib" | "Isha";

type Prayer = {
  key: PrayerKey;
  name: string;
  time: string;
};

type PrayerResponse = {
  data?: {
    timings?: Record<string, string>;
    date?: { readable?: string };
  };
};

const PRAYERS: Array<{ key: PrayerKey; name: string }> = [
  { key: "Fajr", name: "الفجر" },
  { key: "Sunrise", name: "الشروق" },
  { key: "Dhuhr", name: "الظهر" },
  { key: "Asr", name: "العصر" },
  { key: "Maghrib", name: "المغرب" },
  { key: "Isha", name: "العشاء" },
];

const ADHAN_URL =
  "https://upload.wikimedia.org/wikipedia/commons/e/e7/Adhan.ogg";

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    content: { paddingTop: spacing.lg, paddingBottom: spacing.xxxl },
    header: {
      paddingHorizontal: spacing.lg,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.lg,
    },
    title: {
      fontFamily: fonts.displayBold,
      color: colors.brandPrimary,
      fontSize: 30,
      textAlign: "right",
    },
    subtitle: {
      fontFamily: fonts.body,
      color: colors.muted,
      fontSize: 12,
      marginTop: 2,
      textAlign: "right",
    },
    locationCard: {
      marginHorizontal: spacing.lg,
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: radius.lg,
      padding: spacing.lg,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    locationIcon: {
      width: 44,
      height: 44,
      borderRadius: radius.pill,
      backgroundColor: colors.brandPrimary,
      alignItems: "center",
      justifyContent: "center",
    },
    locationName: {
      flex: 1,
      fontFamily: fonts.bodyBold,
      color: colors.onSurface,
      fontSize: 15,
      textAlign: "right",
    },
    locationHint: {
      flex: 1,
      fontFamily: fonts.body,
      color: colors.muted,
      fontSize: 11,
      marginTop: 2,
      textAlign: "right",
    },
    refreshBtn: {
      width: 38,
      height: 38,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceTertiary,
      alignItems: "center",
      justifyContent: "center",
    },
    nextCard: {
      marginHorizontal: spacing.lg,
      marginTop: spacing.lg,
      padding: spacing.xl,
      borderRadius: radius.lg,
      backgroundColor: colors.brandPrimary,
      overflow: "hidden",
    },
    nextLabel: {
      color: colors.brandSecondary,
      fontFamily: fonts.bodySemi,
      fontSize: 12,
      textAlign: "right",
    },
    nextName: {
      color: colors.onBrand,
      fontFamily: fonts.displayBold,
      fontSize: 30,
      textAlign: "right",
      marginTop: 2,
    },
    nextTime: {
      color: colors.onBrand,
      fontFamily: fonts.bodyBold,
      fontSize: 21,
      textAlign: "right",
      marginTop: spacing.xs,
    },
    countdown: {
      color: colors.brandSecondary,
      fontFamily: fonts.displayBold,
      fontSize: 28,
      textAlign: "right",
      marginTop: spacing.md,
    },
    section: {
      paddingHorizontal: spacing.lg,
      marginTop: spacing.xl,
    },
    sectionTitle: {
      fontFamily: fonts.displayBold,
      color: colors.onSurface,
      fontSize: 20,
      textAlign: "right",
      marginBottom: spacing.md,
    },
    prayerCard: {
      minHeight: 70,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginBottom: spacing.sm,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    prayerCardNext: {
      borderColor: colors.brandSecondary,
      backgroundColor: colors.surfaceTertiary,
    },
    prayerIcon: {
      width: 40,
      height: 40,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceTertiary,
      alignItems: "center",
      justifyContent: "center",
    },
    prayerName: {
      flex: 1,
      fontFamily: fonts.bodyBold,
      color: colors.onSurface,
      fontSize: 15,
      textAlign: "right",
    },
    prayerSub: {
      fontFamily: fonts.body,
      color: colors.muted,
      fontSize: 10,
      textAlign: "right",
      marginTop: 1,
    },
    prayerTime: {
      fontFamily: fonts.bodyBold,
      color: colors.brandPrimary,
      fontSize: 17,
      minWidth: 64,
      textAlign: "left",
    },
    switchBtn: {
      width: 38,
      height: 38,
      borderRadius: radius.pill,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surfaceTertiary,
    },
    switchOn: { backgroundColor: colors.brandPrimary },
    footerNote: {
      marginHorizontal: spacing.lg,
      marginTop: spacing.lg,
      color: colors.muted,
      fontFamily: fonts.body,
      fontSize: 11,
      lineHeight: 19,
      textAlign: "right",
    },
  }),
);

function cleanTime(value: string | undefined) {
  return (value || "").replace(/\s*\([^)]*\)/g, "").trim().slice(0, 5);
}

function timeToDate(time: string, date = new Date()) {
  const [h, m] = time.split(":").map(Number);
  const result = new Date(date);
  result.setHours(h || 0, m || 0, 0, 0);
  return result;
}

function formatRemaining(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h > 0 ? `${h} س ` : ""}${m} د ${s.toString().padStart(2, "0")} ث`;
}

function formatDateForApi(date: Date) {
  return `${String(date.getDate()).padStart(2, "0")}-${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}-${date.getFullYear()}`;
}

function nextPrayer(prayers: Prayer[], now = new Date()) {
  for (const prayer of prayers.filter((p) => p.key !== "Sunrise")) {
    if (timeToDate(prayer.time, now).getTime() > now.getTime()) return prayer;
  }
  return null;
}

async function fetchPrayerTimes(latitude: number, longitude: number, date = new Date()) {
  const url =
    `https://api.aladhan.com/v1/timings/${formatDateForApi(date)}` +
    `?latitude=${latitude}&longitude=${longitude}&method=8`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("تعذر جلب مواقيت الصلاة");
  const json = (await response.json()) as PrayerResponse;
  return json.data;
}

async function schedulePrayerNotifications(latitude: number, longitude: number) {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    const permissions = await Notifications.getPermissionsAsync();
    if (permissions.status !== "granted") return;

    const now = new Date();

    // Schedule the next 7 days because prayer times change from day to day.
    for (let offset = 0; offset < 7; offset++) {
      const day = new Date(now);
      day.setDate(now.getDate() + offset);

      const data = await fetchPrayerTimes(latitude, longitude, day);
      const dayPrayers: Prayer[] = PRAYERS.map(({ key, name }) => ({
        key,
        name,
        time: cleanTime(data?.timings?.[key]),
      })).filter((p) => p.time);

      for (const prayer of dayPrayers.filter((p) => p.key !== "Sunrise")) {
        const at = timeToDate(prayer.time, day);
        if (at <= now) continue;

        await Notifications.scheduleNotificationAsync({
          content: {
            title: `حان الآن أذان ${prayer.name} 🕌`,
            body: `حان وقت صلاة ${prayer.name}`,
            sound: "default",
            channelId: "prayer-times",
            data: { prayer: prayer.key },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: at,
          },
        });
      }
    }
  } catch {}
}

export default function PrayerTimes() {
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [locationName, setLocationName] = useState("جاري تحديد موقعك...");
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [next, setNext] = useState<Prayer | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [notificationsOn, setNotificationsOn] = useState(true);

  const loadPrayerTimes = async () => {
    setLoading(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        setLocationName("فعّل الموقع لعرض مواقيت منطقتك");
        throw new Error("LOCATION_PERMISSION");
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const [place] = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      const city = place?.city || place?.subregion || place?.region || "موقعك";
      const country = place?.country || "";
      setLocationName(country ? `${city}، ${country}` : city);

      const data = await fetchPrayerTimes(
        position.coords.latitude,
        position.coords.longitude,
      );

      const mapped: Prayer[] = PRAYERS.map(({ key, name }) => ({
        key,
        name,
        time: cleanTime(data?.timings?.[key]),
      })).filter((p) => p.time);

      setPrayers(mapped);
      setNext(nextPrayer(mapped));
      await schedulePrayerNotifications(
        position.coords.latitude,
        position.coords.longitude,
      );
    } catch (error) {
      if ((error as Error).message !== "LOCATION_PERMISSION") {
        setLocationName("تعذر تحديد المنطقة");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPrayerTimes();

    void (async () => {
      const permission = await Notifications.requestPermissionsAsync();
      setNotificationsOn(permission.status === "granted");
    })();
  }, []);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      let current = nextPrayer(prayers, now);

      if (!current && prayers.length) {
        current = prayers.find((p) => p.key === "Fajr") || null;
        if (current) {
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          setRemaining(timeToDate(current.time, tomorrow).getTime() - now.getTime());
        }
      } else {
        setRemaining(current ? timeToDate(current.time, now).getTime() - now.getTime() : 0);
      }

      setNext(current);
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [prayers]);

  const todayRows = useMemo(() => prayers, [prayers]);

  const playAdhan = async () => {
    try {
      await audioStore.load(ADHAN_URL, "الأذان", "أذان الصلاة");
    } catch {
      Alert.alert("تعذر تشغيل الأذان", "تحقق من اتصال الإنترنت ثم حاول مرة أخرى.");
    }
  };

  const toggleNotifications = async () => {
    const nextState = !notificationsOn;
    if (nextState) {
      const permission = await Notifications.requestPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert("التنبيهات متوقفة", "اسمح للتطبيق بالتنبيهات من إعدادات الجهاز.");
        return;
      }
      await schedulePrayerNotifications(prayers);
    } else {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
    setNotificationsOn(nextState);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.surface }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>مواقيت الأذان</Text>
          <Text style={styles.subtitle}>الصلاة على وقتها</Text>
        </View>
        <View style={styles.locationIcon}>
          <Feather name="clock" size={20} color={colors.onBrand} />
        </View>
      </View>

      <View style={styles.locationCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.locationName}>{locationName}</Text>
          <Text style={styles.locationHint}>يتم حساب المواقيت حسب موقع الجهاز</Text>
        </View>
        <Pressable onPress={() => void loadPrayerTimes()} style={styles.refreshBtn}>
          <Feather name="refresh-cw" size={17} color={colors.brandPrimary} />
        </Pressable>
      </View>

      <View style={styles.nextCard}>
        <Text style={styles.nextLabel}>الصلاة القادمة</Text>
        <Text style={styles.nextName}>{next?.name || "—"}</Text>
        <Text style={styles.nextTime}>{next?.time || "--:--"}</Text>
        <Text style={styles.countdown}>
          {loading ? "جاري الحساب..." : next ? `باقي ${formatRemaining(remaining)}` : "لا توجد مواقيت"}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>مواقيت اليوم</Text>

        {loading && !todayRows.length ? (
          <ActivityIndicator size="large" color={colors.brandPrimary} />
        ) : (
          todayRows.map((prayer) => {
            const isNext = prayer.key === next?.key;
            return (
              <View key={prayer.key} style={[styles.prayerCard, isNext && styles.prayerCardNext]}>
                <Pressable
                  onPress={() => void playAdhan()}
                  style={styles.switchBtn}
                  accessibilityLabel={`تشغيل أذان ${prayer.name}`}
                >
                  <Feather name="volume-2" size={17} color={colors.brandPrimary} />
                </Pressable>
                <View style={styles.prayerIcon}>
                  <Feather
                    name={prayer.key === "Fajr" ? "sunrise" : prayer.key === "Isha" ? "moon" : "sun"}
                    size={17}
                    color={colors.brandSecondary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.prayerName}>{prayer.name}</Text>
                  {isNext ? <Text style={styles.prayerSub}>الصلاة القادمة</Text> : null}
                </View>
                <Text style={styles.prayerTime}>{prayer.time}</Text>
              </View>
            );
          })
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>تنبيه الأذان</Text>
        <View style={styles.prayerCard}>
          <View style={[styles.switchBtn, notificationsOn && styles.switchOn]}>
            <Feather name="bell" size={17} color={notificationsOn ? colors.onBrand : colors.brandPrimary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.prayerName}>التنبيه عند دخول وقت الصلاة</Text>
            <Text style={styles.prayerSub}>
              {notificationsOn ? "التنبيهات مفعّلة" : "التنبيهات متوقفة"}
            </Text>
          </View>
          <Pressable onPress={() => void toggleNotifications()} style={styles.switchBtn}>
            <Feather
              name={notificationsOn ? "check" : "bell-off"}
              size={17}
              color={notificationsOn ? colors.brandPrimary : colors.muted}
            />
          </Pressable>
        </View>
      </View>

      <Text style={styles.footerNote}>
        يتم تحديث المواقيت حسب إحداثيات الجهاز. إذا غيّرت المنطقة اضغط زر التحديث لإعادة حساب المواقيت.
      </Text>
    </ScrollView>
  );
}
