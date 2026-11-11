import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Theme } from '../constants/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found', headerShown: false }} />
      <View style={styles.container}>
        <Text style={styles.title}>This screen does not exist.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Back to Today</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Theme.spacing.lg,
    backgroundColor: Theme.colors.bgDark,
  },
  title: {
    color: Theme.colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  link: {
    marginTop: Theme.spacing.md,
    paddingVertical: Theme.spacing.md,
  },
  linkText: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.accentGold,
  },
});
