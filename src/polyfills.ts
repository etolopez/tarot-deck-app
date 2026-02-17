// Polyfills for React Native
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import { setAudioModeAsync } from 'expo-audio';

// Buffer - Must be set up before any modules that use it
import { Buffer } from 'buffer';
// @ts-ignore
if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer;
}
// Also set on global for compatibility
if (typeof global.Buffer === 'undefined') {
  // @ts-ignore
  global.Buffer = Buffer;
}

// Configure audio so cues play even in iOS silent mode and duck on Android
(async () => {
  try {
    await setAudioModeAsync({
      playsInSilentModeIOS: true,
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    } as any);
  } catch {}
})();

