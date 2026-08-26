import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import 'react-native-reanimated';
import { Theme } from '../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

// Prevent auto hiding splash screen
try {
  SplashScreen.preventAutoHideAsync().catch(() => {});
} catch (e) {}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const router = useRouter();
  const [hasCheckedOnboarding, setHasCheckedOnboarding] = useState(false);

  useEffect(() => {
    if (loaded || error) {
      try {
        SplashScreen.hideAsync().catch(() => {});
      } catch (e) {}
    }
  }, [loaded, error]);

  useEffect(() => {
    if (!loaded || hasCheckedOnboarding) return;
    if (error) {
      setHasCheckedOnboarding(true);
      return;
    }
    (async () => {
      try {
        let seen: string | null = null;
        try {
          seen = await AsyncStorage.getItem('setting_hasSeenOnboarding');
        } catch {}
        if (!seen) {
          try {
            const db = await import('../database/db');
            seen = await db.getUserSetting('hasSeenOnboarding', '');
          } catch {}
        }
        if (!seen) {
          (router as any).replace('/onboarding');
        }
      } catch {}
      setHasCheckedOnboarding(true);
    })();
  }, [loaded, error, hasCheckedOnboarding]);

  if (!loaded && !error) {
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.loadingText}>Loading Tikrar...</Text>
      </View>
    );
  }

  return (
    <ThemeProvider value={DarkTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: Theme.colors.bgDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Theme.colors.accentGold,
    fontSize: 16,
    fontWeight: '700',
  },
});
