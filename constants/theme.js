// constants/theme.js

const colors = {
  // Backgrounds
  obsidian: '#0D0D0D',   // primary bg
  midnight: '#111827',   // card bg
  deepNavy: '#0F172A',   // tab bar bg
  
  // Brand Accents
  gold: '#C9A84C',       // primary accent — classic expedition gold
  goldLight: '#E8C97E',  // hover/pressed gold
  goldMuted: '#8A6F34',  // subtle gold
  
  // Secondary Accents
  copper: '#B87333',     // warm secondary accent
  emerald: '#10B981',    // success / detected language
  sapphire: '#3B82F6',   // info / links
  crimson: '#EF4444',    // error
  
  // Text
  ivory: '#F5F0E8',      // primary text
  parchment: '#C9B99A',  // secondary text
  ash: '#6B7280',        // placeholder/disabled
  
  // Borders & Dividers
  borderGold: 'rgba(201, 168, 76, 0.25)',
  borderSilver: 'rgba(255, 255, 255, 0.08)',
  
  // Glass Effect
  glassBg: 'rgba(255, 255, 255, 0.04)',
  glassStroke: 'rgba(255, 255, 255, 0.10)',
};

const typography = {
  displayXL: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 36, letterSpacing: -0.5 },
  displayL: { fontFamily: 'PlayfairDisplay_600SemiBold', fontSize: 28 },
  displayM: { fontFamily: 'PlayfairDisplay_500Medium', fontSize: 22 },
  displayS: { fontFamily: 'PlayfairDisplay_500Medium', fontSize: 18 },
  headingM: { fontFamily: 'Inter_600SemiBold', fontSize: 18, letterSpacing: 0.15 },
  headingS: { fontFamily: 'Inter_600SemiBold', fontSize: 16, letterSpacing: 0.2 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 24 },
  caption: { fontFamily: 'Inter_400Regular', fontSize: 12, letterSpacing: 0.5 },
  label: { fontFamily: 'Inter_500Medium', fontSize: 13, letterSpacing: 1.2, textTransform: 'uppercase' },
};

const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
const radius = { sm: 8, md: 14, lg: 20, xl: 28, pill: 999 };

const shadows = {
  gold: {
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  dark: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
  },
};

export const darkTheme = {
  colors,
  typography,
  spacing,
  radius,
  shadows,
};

// Prepared for future use
export const lightTheme = {
  colors: {
    ...colors,
    obsidian: '#F5F0E8', // ivory bg
    midnight: '#FFFFFF', // white card bg
    deepNavy: '#E5E7EB', // light gray tab bar
    ivory: '#0D0D0D',    // dark text
    parchment: '#374151',// darker secondary text
    glassBg: 'rgba(0, 0, 0, 0.04)',
    glassStroke: 'rgba(0, 0, 0, 0.10)',
  },
  typography,
  spacing,
  radius,
  shadows: {
    gold: shadows.gold,
    dark: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 4,
    },
  },
};
