export interface ThemeColors {
  // Background gradients
  background: {
    primary: string[];
    overlay: string;
  };

  // Jade palette
  jade: {
    primary: string;
    secondary: string;
    tertiary: string;
    mint: string;
    seafoam: string;
    teal: string;
  };

  // Text colors
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
  };

  // Semantic colors
  success: string;
  error: string;
  warning: string;

  // Glass morphism
  glass: {
    background: string;
    border: string;
  };
}

export interface Typography {
  sizes: {
    hero: number;
    h1: number;
    h2: number;
    h3: number;
    body: number;
    bodySmall: number;
    caption: number;
    tiny: number;
  };

  weights: {
    black: '800';
    bold: '700';
    semibold: '600';
    medium: '500';
    regular: '400';
    light: '300';
  };

  lineHeights: {
    tight: number;
    normal: number;
    relaxed: number;
  };

  shadows: {
    jadeGlow: {
      textShadowColor: string;
      textShadowOffset: { width: number; height: number };
      textShadowRadius: number;
    };
    subtle: {
      textShadowColor: string;
      textShadowOffset: { width: number; height: number };
      textShadowRadius: number;
    };
    neon: {
      textShadowColor: string;
      textShadowOffset: { width: number; height: number };
      textShadowRadius: number;
    };
  };

  // Preset text styles
  hero: object;
  h1: object;
  h2: object;
  h3: object;
  body: object;
  bodySmall: object;
  caption: object;
  tiny: object;
}

export interface Animations {
  timing: {
    instant: number;
    fast: number;
    medium: number;
    slow: number;
    verySlow: number;
  };

  // Easing functions
  easing: {
    smooth: (t: number) => number;
    snappy: (t: number) => number;
    bounce: (t: number) => number;
    enigma: (t: number) => number;
  };

  // Presets
  presets: {
    cardFlip: number;
    cardShuffle: number;
    cardShuffleStagger: number;
    jadeRipple: number;
    neonPulse: number;
    liquidFlow: number;
  };
}

export interface Spacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;

  // Layout constants
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    full: number;
  };

  containerPadding: number;
  cardPadding: number;
}

export interface Theme {
  colors: ThemeColors;
  typography: Typography;
  animations: Animations;
  spacing: Spacing;
}
