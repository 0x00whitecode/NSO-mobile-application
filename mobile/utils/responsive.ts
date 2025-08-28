import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

export const isTablet = () => {
  const aspectRatio = height / width;
  return (
    (Platform.OS === 'ios' && aspectRatio < 1.6) ||
    (Platform.OS === 'android' && width >= 600)
  );
};

export const isSmallScreen = () => width < 375;
export const isMediumScreen = () => width >= 375 && width < 414;
export const isLargeScreen = () => width >= 414;

export const getResponsiveValue = (small: number, medium: number, large: number) => {
  if (isSmallScreen()) return small;
  if (isMediumScreen()) return medium;
  return large;
};

export const getResponsivePadding = () => {
  return getResponsiveValue(12, 16, 20);
};

export const getResponsiveFontSize = (baseSize: number) => {
  const scale = getResponsiveValue(0.9, 1, 1.1);
  return Math.round(baseSize * scale);
};

export const getGridColumns = () => {
  if (isTablet()) return 3;
  return 2;
};

export const getCardWidth = (padding: number = 16) => {
  const columns = getGridColumns();
  const totalPadding = padding * (columns + 1);
  return (width - totalPadding) / columns;
};

// Safe area helpers for mobile devices
export const getSafeAreaPadding = () => {
  return {
    top: Platform.OS === 'ios' ? 44 : 24,
    bottom: Platform.OS === 'ios' ? 34 : 0,
  };
};

export const getStatusBarHeight = () => {
  return Platform.OS === 'ios' ? 44 : 24;
};

// Touch target helpers
export const ensureMinTouchTarget = (size: number, minSize: number = 44) => {
  return Math.max(size, minSize);
};

export const getOptimalButtonHeight = () => {
  return getResponsiveValue(48, 52, 56);
};

export const getOptimalInputHeight = () => {
  return getResponsiveValue(48, 52, 56);
};

// Screen dimension helpers
export const screenWidth = width;
export const screenHeight = height;
export const isPortrait = height > width;
export const isLandscape = width > height;

// Responsive breakpoints
export const breakpoints = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
};

export const isBreakpoint = (breakpoint: keyof typeof breakpoints) => {
  return width >= breakpoints[breakpoint];
};
