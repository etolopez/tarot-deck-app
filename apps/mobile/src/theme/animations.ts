import { Easing } from 'react-native';
import { Animations } from './types';

export const animations: Animations = {
  // Timing constants (in milliseconds)
  timing: {
    instant: 120,     // Micro-interactions (button press start)
    fast: 250,        // Quick transitions (ripple, card shuffle)
    medium: 500,      // Standard transitions (screen changes)
    slow: 900,        // Deliberate animations (fade-ins)
    verySlow: 2000,   // Ambient animations (pulses)
  },

  // Easing functions
  easing: {
    // Smooth and natural (screen transitions, fades)
    smooth: Easing.bezier(0.4, 0.0, 0.2, 1),

    // Snappy and responsive (interactions, button presses)
    snappy: Easing.bezier(0.25, 0.46, 0.45, 0.94),

    // Playful bounce (card reveals)
    bounce: Easing.bezier(0.68, -0.55, 0.265, 1.55),

    // Custom enigmatic curve (unique to Jade theme)
    enigma: Easing.bezier(0.33, 1.53, 0.69, 0.99),
  },

  // Animation presets
  presets: {
    cardFlip: 650,            // Card flip animation
    cardShuffle: 250,         // Individual card shuffle movement
    cardShuffleStagger: 60,   // Delay between shuffling cards
    jadeRipple: 1200,         // Ripple effect duration
    neonPulse: 1800,          // Neon border pulse cycle
    liquidFlow: 8000,         // Background gradient flow
  },
};
