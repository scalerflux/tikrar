import { Platform, ViewStyle } from 'react-native';

const cardShadow: ViewStyle = Platform.select<ViewStyle>({
  android: { elevation: 3 },
  default: {
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
}) as ViewStyle;

const goldGlow: ViewStyle = Platform.select<ViewStyle>({
  android: { elevation: 6 },
  default: {
    shadowColor: '#DDB252',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
}) as ViewStyle;

export const Theme = {
  colors: {
    bgDark: '#070F1C',
    bgCard: '#0F1B2E',
    bgCardHover: '#18294A',
    bgHero: '#12213A',
    surface1: '#0F1B2E',
    surface2: '#16263F',
    inputBg: 'rgba(5, 12, 24, 0.55)',
    accentGold: '#DDB252',
    accentGoldSoft: '#F0D48A',
    accentGoldMuted: 'rgba(221, 178, 82, 0.13)',
    accentGoldBorder: 'rgba(221, 178, 82, 0.28)',
    textPrimary: '#F4F1EA',
    textSecondary: '#A3B1C6',
    textMuted: '#7F92AB',
    successGreen: '#2DD4A0',
    successGreenBg: 'rgba(45, 212, 160, 0.13)',
    successGreenBorder: 'rgba(45, 212, 160, 0.3)',
    warningAmber: '#F5A524',
    warningAmberBg: 'rgba(245, 165, 36, 0.12)',
    errorRed: '#F26D6D',
    errorRedBg: 'rgba(242, 109, 109, 0.09)',
    errorRedBorder: 'rgba(242, 109, 109, 0.28)',
    border: 'rgba(148, 170, 205, 0.13)',
    borderBright: 'rgba(148, 170, 205, 0.26)',
    tabBarBg: '#060C17',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 10,
    md: 14,
    lg: 20,
    xl: 28,
    full: 9999,
  },
  shadow: {
    card: cardShadow,
    glow: goldGlow,
  },
  fonts: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  }
};
