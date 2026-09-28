import { Tabs } from "expo-router";
import Feather from "@react-native-vector-icons/feather";
import { Platform, View } from "react-native";
import { colors, fonts } from "@/src/theme";
import MiniPlayer from "@/src/components/mini-player";

export default function TabsLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.brandPrimary,
          tabBarInactiveTintColor: colors.muted,
          tabBarLabelStyle: { fontFamily: fonts.bodySemi, fontSize: 11 },
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            ...(Platform.OS === "web" ? { height: 64 } : {}),
          },
          tabBarItemStyle: { alignSelf: "center" },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "الرئيسية",
            tabBarIcon: ({ color, size }) => (
              <Feather name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="stories"
          options={{
            title: "الأنبياء",
            tabBarIcon: ({ color, size }) => (
              <Feather name="book-open" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="kids"
          options={{
            title: "الأطفال",
            tabBarIcon: ({ color, size }) => (
              <Feather name="smile" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="bookmarks"
          options={{
            title: "المفضلة",
            tabBarIcon: ({ color, size }) => (
              <Feather name="bookmark" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
      <MiniPlayer />
    </View>
  );
}
