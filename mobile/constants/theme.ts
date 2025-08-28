export const Colors = {
  // Medical Green Primary Theme
  primary: {
    main: '#2E7D32',     // Deep medical green
    dark: '#1B5E20',     // Dark green
    light: '#4CAF50',    // Light green
    lightest: '#E8F5E8', // Very light green
  },

  // Clinical Green Secondary
  secondary: {
    main: '#66BB6A',     // Medium green
    dark: '#388E3C',     // Dark green
    light: '#81C784',    // Light green
    lightest: '#F1F8E9', // Very light green
  },

  // Medical Severity Colors
  medical: {
    routine: '#4CAF50',      // Green for routine care
    moderate: '#FF9800',     // Orange for moderate severity
    severe: '#F44336',       // Red for severe conditions
    critical: '#D32F2F',     // Dark red for critical
    emergency: '#B71C1C',    // Very dark red for emergencies
  },

  // Status Colors
  status: {
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: '#2E7D32',        // Green for info instead of blue
    offline: '#9E9E9E',
  },

  // Error Colors
  error: {
    main: '#F44336',
    dark: '#D32F2F',
    light: '#FFCDD2',
    lightest: '#FFEBEE',
  },

  // Warning Colors
  warning: {
    main: '#FF9800',
    dark: '#F57C00',
    light: '#FFE0B2',
    lightest: '#FFF3E0',
  },

  // Success Colors
  success: {
    main: '#4CAF50',
    dark: '#388E3C',
    light: '#C8E6C9',
    lightest: '#E8F5E8',
  },

  // Neutral Colors
  neutral: {
    main: '#9E9E9E',
    dark: '#424242',
    light: '#E0E0E0',
    lightest: '#F5F5F5',
    white: '#FFFFFF',
    medium: '#9E9E9E',
    black: '#212121',
  },

  // Text Colors
  text: {
    primary: '#212121',
    secondary: '#757575',
    light: '#FFFFFF',
    disabled: '#BDBDBD',
    muted: 'rgba(255, 255, 255, 0.7)',
  },

  // Background Colors
  background: {
    primary: '#FFFFFF',
    secondary: '#F8FDF8',   // Very light green tint
    medical: '#F1F8E9',     // Light green medical background
    gradient: ['#2E7D32', '#1B5E20'] as const, // Green gradient
    overlay: 'rgba(46, 125, 50, 0.1)', // Green overlay

    // Status backgrounds
    success: '#E8F5E8',
    warning: '#FFF3E0',
    error: '#FFEBEE',
    info: '#E8F5E8',        // Green info background
  },

  // Border Colors
  border: {
    light: '#E0E0E0',
    medium: '#BDBDBD',
    dark: '#757575',
    focus: '#2E7D32',      // Green focus border
    error: '#F44336',
    success: '#4CAF50',
  },

  // Shadow Colors
  shadow: {
    light: 'rgba(0, 0, 0, 0.08)',
    medium: 'rgba(0, 0, 0, 0.12)',
    dark: 'rgba(0, 0, 0, 0.16)',
  },
};

export const Typography = {
  // Font Sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 36,
    '6xl': 48,
  },
  
  // Font Weights
  fontWeight: {
    light: '300' as const,
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  
  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.6,
    loose: 2,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
  '6xl': 80,
};

export const BorderRadius = {
  none: 0,
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: Colors.shadow.light,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  base: {
    shadowColor: Colors.shadow.medium,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: Colors.shadow.dark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: Colors.shadow.dark,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 12,
  },
};

export const Layout = {
  // Screen dimensions helpers
  screenPadding: Spacing.base,
  cardPadding: Spacing.lg,
  sectionSpacing: Spacing['2xl'],

  // Common component sizes (mobile-optimized)
  buttonHeight: 52, // Increased for better mobile touch
  inputHeight: 52,  // Increased for better mobile touch
  headerHeight: 60,
  tabBarHeight: 80,

  // Mobile touch targets
  minTouchTarget: 44, // Apple/Google recommended minimum
  recommendedTouchTarget: 48,

  // Breakpoints (for responsive design)
  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  },

  // Mobile-specific spacing
  mobile: {
    screenPadding: Spacing.lg,
    cardPadding: Spacing.xl,
    buttonPadding: Spacing.lg,
  },
};

// Theme object combining all constants
export const Theme = {
  colors: Colors,
  typography: Typography,
  spacing: Spacing,
  borderRadius: BorderRadius,
  shadows: Shadows,
  layout: Layout,
};

export default Theme;
