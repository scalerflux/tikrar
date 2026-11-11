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
    shadowColor: '#E3B95B',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
}) as ViewStyle;

export const Theme = {
  // Deep ink-blue surfaces with warm ivory text and a single gold accent.
  // Every text colour clears WCAG AA (4.5:1) on bgCard, the surface most
  // reading happens on; textPrimary and textSecondary clear AAA (7:1).
  colors: {
    bgDark: '#080E19',
    bgCard: '#111A2A',
    bgCardHover: '#1B2740',
    bgHero: '#15213A',
    surface1: '#111A2A',
    surface2: '#192437',
    inputBg: 'rgba(4, 9, 18, 0.5)',
    accentGold: '#E3B95B',
    accentGoldSoft: '#F2D896',
    accentGoldMuted: 'rgba(227, 185, 91, 0.13)',
    accentGoldBorder: 'rgba(227, 185, 91, 0.3)',
    textPrimary: '#F6F2E9',
    textSecondary: '#C5CCD8',
    textMuted: '#94A0B4',
    successGreen: '#3DD6A3',
    successGreenBg: 'rgba(61, 214, 163, 0.13)',
    successGreenBorder: 'rgba(61, 214, 163, 0.32)',
    warningAmber: '#F5AE3D',
    warningAmberBg: 'rgba(245, 174, 61, 0.13)',
    errorRed: '#F58282',
    errorRedBg: 'rgba(245, 130, 130, 0.09)',
    errorRedBorder: 'rgba(245, 130, 130, 0.3)',
    border: 'rgba(160, 178, 208, 0.14)',
    borderBright: 'rgba(160, 178, 208, 0.28)',
    tabBarBg: '#060B14',
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
