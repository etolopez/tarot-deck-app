/**
 * Root layout component for the Tarot Deck app
 * Sets up navigation stack, global app configuration, and service initialization
 */

import "../polyfills"; // Must be first!
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider } from "../theme/index";
import { initializeTarotData } from "../data/tarot/loader";
import { initializeAiService, initializeSolanaService } from "../services";
import { initializeIap } from "../services/iapService";
import { getAppConfig } from "../config/appConfig";
import { logger } from "../core/logger";

/**
 * Initialize all services and data on app startup
 */
async function initializeApp() {
  try {
    logger.info("app.init.start");

    // Load tarot data
    await initializeTarotData();
    logger.info("app.init.tarot.loaded");

    // Load app configuration
    const config = getAppConfig();

    // Initialize services
    initializeAiService(config);
    await initializeSolanaService(config); // Now async to restore wallet

    // Initialize IAP (non-blocking)
    initializeIap().catch((error) => {
      logger.error("app.init.iap.error", {
        error: error instanceof Error ? error.message : String(error),
      });
    });

    logger.info("app.init.complete");
  } catch (error) {
    logger.error("app.init.error", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export default function RootLayout() {
  useEffect(() => {
    initializeApp();
  }, []);

  return (
    <ThemeProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="paywall" />
        <Stack.Screen name="reading" />
        <Stack.Screen name="result" />
        <Stack.Screen name="settings" />
      </Stack>
    </ThemeProvider>
  );
}
