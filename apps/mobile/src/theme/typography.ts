import { Typography } from './types';
import { jadeEnigmaColors } from './jadeEnigma.theme';

export const typography: Typography = {
  // Font sizes - standardized scale
  sizes: {
    hero: 46,
    h1: 34,
    h2: 26,
    h3: 21,
    body: 17,
    bodySmall: 15,
    caption: 13,
    tiny: 11,
  },

  // Font weights
  weights: {
    black: '800',
    bold: '700',
    semibold: '600',
    medium: '500',
    regular: '400',
    light: '300',
  },

  // Line heights - multipliers for proper text alignment
  lineHeights: {
    tight: 1.1,      // For large titles
    normal: 1.4,     // For body text
    relaxed: 1.65,   // For long-form content
  },

  // Text shadows
  shadows: {
    // Jade glow for prominent text
    jadeGlow: {
      textShadowColor: 'rgba(61, 217, 184, 0.6)',
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 12,
    },

    // Subtle shadow for depth
    subtle: {
      textShadowColor: 'rgba(13, 31, 31, 0.5)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
    },

    // Neon glow for interactive elements
    neon: {
      textShadowColor: 'rgba(110, 255, 201, 0.8)',
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 16,
    },
  },

  // Preset text styles with proper lineHeight
  get hero() {
    return {
      fontSize: this.sizes.hero,
      fontWeight: this.weights.black,
      lineHeight: this.sizes.hero * this.lineHeights.tight,
      color: jadeEnigmaColors.text.primary,
      ...this.shadows.jadeGlow,
    };
  },

  get h1() {
    return {
      fontSize: this.sizes.h1,
      fontWeight: this.weights.bold,
      lineHeight: this.sizes.h1 * this.lineHeights.tight,
      color: jadeEnigmaColors.text.primary,
      ...this.shadows.subtle,
    };
  },

  get h2() {
    return {
      fontSize: this.sizes.h2,
      fontWeight: this.weights.semibold,
      lineHeight: this.sizes.h2 * this.lineHeights.tight,
      color: jadeEnigmaColors.text.primary,
    };
  },

  get h3() {
    return {
      fontSize: this.sizes.h3,
      fontWeight: this.weights.semibold,
      lineHeight: this.sizes.h3 * this.lineHeights.normal,
      color: jadeEnigmaColors.text.primary,
    };
  },

  get body() {
    return {
      fontSize: this.sizes.body,
      fontWeight: this.weights.regular,
      lineHeight: this.sizes.body * this.lineHeights.normal,
      color: jadeEnigmaColors.text.secondary,
    };
  },

  get bodySmall() {
    return {
      fontSize: this.sizes.bodySmall,
      fontWeight: this.weights.regular,
      lineHeight: this.sizes.bodySmall * this.lineHeights.normal,
      color: jadeEnigmaColors.text.secondary,
    };
  },

  get caption() {
    return {
      fontSize: this.sizes.caption,
      fontWeight: this.weights.medium,
      lineHeight: this.sizes.caption * this.lineHeights.normal,
      color: jadeEnigmaColors.text.tertiary,
    };
  },

  get tiny() {
    return {
      fontSize: this.sizes.tiny,
      fontWeight: this.weights.regular,
      lineHeight: this.sizes.tiny * this.lineHeights.normal,
      color: jadeEnigmaColors.text.tertiary,
    };
  },
};
