import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as Font from "expo-font";
import { I18nManager, LogBox, View, Text, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { ErrorBoundary } from "@/src/components/error-boundary";
import { queryClient } from "@/src/query-client";
import { colors } from "@/src/theme";

LogBox.ignoreAllLogs(true);

// Force RTL as early as possible (Arabic-first app)
try {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (I18nManager as any).swapLeftAndRightInRTL?.(true);
} catch {}

async function loadFonts() {
  try {
    await Font.loadAsync({
      Amiri_400Regular: {
        uri: "https://fonts.gstatic.com/s/amiri/v27/J7aRnpd8CGxBHqUpvrIw74NL.ttf",
      },
      Amiri_700Bold: {
        uri: "https://fonts.gstatic.com/s/amiri/v27/J7acnpd8CGxBHp2VkZY4xJ9CGyAa.ttf",
      },
      Cairo_400Regular: {
        uri: "https://fonts.gstatic.com/s/cairo/v28/SLXgc1nY6HkvangtZmpQdkhzfH5lkSs2SgRjCAGMQ1z0hOA-W1Q.ttf",
      },
      Cairo_600SemiBold: {
        uri: "https://fonts.gstatic.com/s/cairo/v28/SLXgc1nY6HkvangtZmpQdkhzfH5lkSs2SgRjCAGMQ1z0hOA-a1c.ttf",
      },
      Cairo_700Bold: {
        uri: "https://fonts.gstatic.com/s/cairo/v28/SLXgc1nY6HkvangtZmpQdkhzfH5lkSs2SgRjCAGMQ1z0hOA-a1c.ttf",
      },
    });
  } catch (e) {
    console.log("Font load fallback", e);
  }
}

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadFonts().finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <View
        testID="app-loading"
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.surface,
        }}
      >
        <ActivityIndicator color={colors.brandPrimary} />
        <Text style={{ marginTop: 12, color: colors.muted }}>جارٍ التحميل...</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <KeyboardProvider>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: colors.surface },
                }}
              />
            </KeyboardProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
