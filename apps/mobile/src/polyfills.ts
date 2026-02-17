/**
 * Polyfills for React Native
 * Must be imported first before any modules that depend on them
 */

// Solana web3.js polyfill - MUST be imported before @solana/web3.js
import "react-native-get-random-values";

// URL polyfill for React Native
import "react-native-url-polyfill/auto";

// Audio configuration
import { setAudioModeAsync } from "expo-audio";

// Buffer polyfill - Must be set up before any modules that use it
import { Buffer } from "buffer";

// @ts-ignore
if (typeof globalThis.Buffer === "undefined") {
  globalThis.Buffer = Buffer;
}

// Also set on global for compatibility
if (typeof global.Buffer === "undefined") {
  // @ts-ignore
  global.Buffer = Buffer;
}

/**
 * Configure audio so cues play even in iOS silent mode and duck on Android
 * This is a non-blocking operation
 */
(async () => {
  try {
    await setAudioModeAsync({
      playsInSilentModeIOS: true,
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    } as any);
  } catch (error) {
    // Silently fail - audio mode is not critical for app functionality
  }
})();

