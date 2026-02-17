import { ThemeColors } from './types';

export const jadeEnigmaColors: ThemeColors = {
  // Background gradients - deep teals creating mystical depth
  background: {
    primary: ['#0d1f1f', '#1a3333', '#0f2828', '#1a3838'],
    overlay: 'rgba(13, 31, 31, 0.88)',
  },

  // Jade palette - bright, modern greens
  jade: {
    primary: '#3dd9b8',     // Main jade accent
    secondary: '#2ba894',   // Darker jade
    tertiary: '#1e7868',    // Deep jade
    mint: '#6effc9',        // Bright mint highlight
    seafoam: '#4dd4ac',     // Medium seafoam
    teal: '#1abc9c',        // Classic teal
  },

  // Text colors - ice white with jade tints
  text: {
    primary: '#f0fffe',     // Ice white (main text)
    secondary: '#b8e6df',   // Jade-tinted white (secondary)
    tertiary: '#7fb8af',    // Muted jade (tertiary, captions)
  },

  // Semantic colors
  success: '#3dd9b8',       // Jade primary (replaces green #4CAF50)
  error: '#ff6b6b',         // Soft red
  warning: '#ffd93d',       // Soft yellow

  // Glass morphism effects
  glass: {
    background: 'rgba(61, 217, 184, 0.08)',  // Semi-transparent jade tint
    border: 'rgba(61, 217, 184, 0.3)',       // Jade border with transparency
  },
};
