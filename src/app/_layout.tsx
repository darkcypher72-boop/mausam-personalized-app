import { Stack } from "expo-router";
import { LanguageProvider } from "../hooks/useLanguage";
import UserBootstrap from "../components/UserBootstrap";

const MAUSAM_NAVY = "#071D2B";

export default function RootLayout() {
  return (
    <LanguageProvider>
      <UserBootstrap />

      <Stack
  screenOptions={{
    headerShown: false,
    contentStyle: {
      backgroundColor: "#071D2B",
    },
    animation: "fade",
    animationDuration: 120,
    gestureEnabled: false,
  }}
>
        <Stack.Screen
          name="index"
          options={{
            animation: "fade",
          }}
        />

        <Stack.Screen
          name="onboarding"
          options={{
            animation: "fade",
          }}
        />

        <Stack.Screen
          name="location"
          options={{
            animation: "fade",
          }}
        />

        <Stack.Screen
          name="home"
          options={{
            animation: "fade",
          }}
        />

        <Stack.Screen
          name="profile"
          options={{
            animation: "fade",
          }}
        />
      </Stack>
    </LanguageProvider>
  );
}1