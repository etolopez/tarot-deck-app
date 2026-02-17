/**
 * Home Screen - Main entry point
 * Allows user to select spread, enter question, and start reading
 */

import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  Dimensions,
  Modal,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import { useReadingStore } from "../state/readingStore";
import { useCreditsStore } from "../state/creditsStore";
import { getAllSpreads, getSpread, loadSpreads, getAllCards } from "../data/tarot/loader";
import { getCardImagePath } from "../utils/cardImageMapper";
import { getCardImageSource } from "../utils/cardImageMap";
import { getCardOfTheDay } from "../utils/cardOfTheDay";
import { getBalance, getCurrentAccountId } from "../services/creditsService";
import { isWalletConnected, isSolanaEnabled } from "../services/solanaService";
import { getLastReading } from "../services/lastReadingService";
import { logger } from "../core/logger";
import { useTheme } from "../theme/index";
import { LiquidBackground, GlassCard, NeonButton } from "../theme/components";
import type { TarotSpread, ReadingResultLocal, TarotCard } from "../types/tarot";

/** Local easing to avoid passing frozen theme values to Animated */
const SMOOTH_EASING = Easing.bezier(0.4, 0.0, 0.2, 1);

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [spreads, setSpreads] = useState<TarotSpread[]>([]);
  const [loading, setLoading] = useState(true);
  const [showIntentModal, setShowIntentModal] = useState(false);

  const { selectedSpreadId, selectSpread, setReadingState, setCurrentReading } =
    useReadingStore();

  const { balance, refreshBalance } = useCreditsStore();

  /** Last reading for the connected wallet; loaded when screen is focused */
  const [lastReading, setLastReading] = useState<ReadingResultLocal | null>(
    null,
  );

  /** Card of the Day - always upright, changes daily */
  const [cardOfTheDay, setCardOfTheDay] = useState<TarotCard | null>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Jade particles (simplified - only 4 strategic lights)
  const particleAnims = useRef<
    {
      opacity: Animated.Value;
      scale: Animated.Value;
    }[]
  >([]).current;

  useEffect(() => {
    // Extract durations as primitives to avoid passing frozen theme values
    const slowDuration = 900; // theme.animations.timing.slow
    const pulseDuration = 1800; // theme.animations.presets.neonPulse

    // Fade in on mount
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: slowDuration,
      easing: SMOOTH_EASING,
      useNativeDriver: true,
    }).start();

    // Floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3000,
          easing: SMOOTH_EASING,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          easing: SMOOTH_EASING,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: pulseDuration,
          easing: SMOOTH_EASING,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: pulseDuration,
          easing: SMOOTH_EASING,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Simple jade particles (4 total - cleaner look)
    for (let i = 0; i < 4; i++) {
      const opacity = new Animated.Value(0.3);
      const scale = new Animated.Value(0.8);

      particleAnims[i] = { opacity, scale };

      // Opacity pulse
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 600),
          Animated.timing(opacity, {
            toValue: 0.8,
            duration: 2000,
            easing: SMOOTH_EASING,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.3,
            duration: 2000,
            easing: SMOOTH_EASING,
            useNativeDriver: true,
          }),
        ]),
      ).start();

      // Scale pulse
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 600),
          Animated.timing(scale, {
            toValue: 1.2,
            duration: 1800,
            easing: SMOOTH_EASING,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.8,
            duration: 1800,
            easing: SMOOTH_EASING,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }
  }, []);

  // Load spreads, balance, and card of the day on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await loadSpreads();
        const allSpreads = getAllSpreads();
        setSpreads(allSpreads);
        
        // Load Card of the Day (always upright)
        // Cards should already be loaded by initializeTarotData() in _layout.tsx
        try {
          const allCards = getAllCards();
          const todaysCard = getCardOfTheDay(allCards);
          setCardOfTheDay(todaysCard);
          logger.info("home.cardOfTheDay.loaded", { cardId: todaysCard.id });
        } catch (cardError) {
          // If cards aren't loaded yet, log but don't fail the whole screen
          logger.warn("home.cardOfTheDay.notLoaded", {
            error: cardError instanceof Error ? cardError.message : String(cardError),
          });
        }
        
        await refreshBalance();
        logger.info("ui.screen.view", { screenName: "Home" });
      } catch (error) {
        logger.error("home.load.error", {
          error: error instanceof Error ? error.message : String(error),
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [refreshBalance]);

  const proceedStartReading = async () => {
    if (!selectedSpreadId) {
      return;
    }

    const spread = getSpread(selectedSpreadId);
    const currentBalance = await getBalance();

    logger.info("ui.reading.start", {
      readingId: "pending",
      spreadId: selectedSpreadId,
    });

    // Check credits (skip check for infinite credits)
    if (currentBalance !== Infinity && currentBalance < spread.creditCost) {
      setReadingState("PAYWALL");
      router.push("/paywall");
      return;
    }

    // Proceed to reading
    setReadingState("CREDIT_CHECK");
    router.push("/reading");
  };

  const handleStartPress = () => {
    if (!selectedSpreadId) return;
    if (isSolanaEnabled() && !isWalletConnected()) {
      Alert.alert(
        "Wallet not connected",
        "Please connect and add credits in order to make your reading.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Connect wallet",
            onPress: () => router.push("/settings"),
          },
        ],
      );
      return;
    }
    setShowIntentModal(true);
    logger.info("ui.reading.intent_modal.open", { spreadId: selectedSpreadId });
  };

  const handleIntentConfirm = () => {
    setShowIntentModal(false);
    logger.info("ui.reading.intent_modal.confirm", {
      spreadId: selectedSpreadId,
    });
    proceedStartReading();
  };

  const handleIntentDismiss = () => {
    setShowIntentModal(false);
    logger.info("ui.reading.intent_modal.dismiss", {
      spreadId: selectedSpreadId,
    });
  };

  /** Load last reading for connected wallet when home is focused */
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        // Refresh credits balance automatically when returning home
        await refreshBalance();
        if (!cancelled) {
          logger.info("home.credits.refreshed");
        }
        
        // Load last reading for the connected wallet
        const accountId = await getCurrentAccountId();
        const reading = await getLastReading(accountId);
        if (!cancelled) setLastReading(reading);
      })();
      return () => {
        cancelled = true;
      };
    }, [refreshBalance]),
  );

  const floatY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  if (loading) {
    return (
      <LiquidBackground>
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <Animated.Text
              style={[theme.typography.h2, { opacity: pulseAnim }]}
            >
              Loading Magic...
            </Animated.Text>
          </View>
        </SafeAreaView>
      </LiquidBackground>
    );
  }

  return (
    <LiquidBackground>
      {/* Jade particles - simplified to 4 strategic positions */}
      {particleAnims.map((particle, index) => {
        const positions = [
          { left: SCREEN_WIDTH * 0.2, top: SCREEN_HEIGHT * 0.25 },
          { left: SCREEN_WIDTH * 0.8, top: SCREEN_HEIGHT * 0.3 },
          { left: SCREEN_WIDTH * 0.3, top: SCREEN_HEIGHT * 0.45 },
          { left: SCREEN_WIDTH * 0.75, top: SCREEN_HEIGHT * 0.5 },
        ];

        return (
          <Animated.View
            key={index}
            style={[
              styles.jadeParticle,
              {
                left: positions[index].left,
                top: positions[index].top,
                opacity: particle.opacity,
                transform: [{ scale: particle.scale }],
                backgroundColor: theme.colors.jade.primary,
                shadowColor: theme.colors.jade.mint,
              },
            ]}
          />
        );
      })}

      <SafeAreaView style={styles.container}>
        <Animated.View style={[styles.contentWrapper, { opacity: fadeAnim }]}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.content}
          >
            <Animated.View style={{ transform: [{ translateY: floatY }] }}>
              <View style={styles.titleContainer}>
                <Text
                  style={[
                    theme.typography.hero,
                    {
                      textAlign: "center",
                      lineHeight:
                        theme.typography.sizes.hero *
                        theme.typography.lineHeights.tight,
                    },
                  ]}
                >
                  Tarot Reading
                </Text>
              </View>
              <Text
                style={[
                  theme.typography.body,
                  {
                    marginBottom: theme.spacing.xl,
                    textAlign: "center",
                    fontStyle: "italic",
                    color: theme.colors.text.secondary,
                  },
                ]}
              >
                Select a spread to begin your journey
              </Text>
            </Animated.View>

            {/* Card of the Day */}
            {cardOfTheDay && (
              <GlassCard
                style={{
                  marginBottom: theme.spacing.xl,
                  alignItems: "center",
                  padding: theme.spacing.lg,
                  backgroundColor: "rgba(61, 217, 184, 0.15)", // Lighter background for Card of the Day
                }}
              >
                <Text
                  style={[
                    theme.typography.h3,
                    {
                      marginBottom: theme.spacing.md,
                      textAlign: "center",
                    },
                  ]}
                >
                  Card of the Day
                </Text>
                <Image
                  source={getCardImageSource(getCardImagePath(cardOfTheDay))}
                  style={{
                    width: 200,
                    height: 300,
                    marginBottom: theme.spacing.md,
                    borderRadius: theme.spacing.borderRadius.md,
                  }}
                  resizeMode="contain"
                />
                <Text
                  style={[
                    theme.typography.h2,
                    {
                      marginBottom: theme.spacing.sm,
                      textAlign: "center",
                    },
                  ]}
                >
                  {cardOfTheDay.name}
                </Text>
                <Text
                  style={[
                    theme.typography.body,
                    {
                      textAlign: "center",
                      color: theme.colors.text.secondary,
                      lineHeight: theme.typography.sizes.body * theme.typography.lineHeights.relaxed,
                    },
                  ]}
                >
                  {cardOfTheDay.description}
                </Text>
              </GlassCard>
            )}

            {/* Credit Balance */}
            <TouchableOpacity
              onPress={() => {
                setReadingState("PAYWALL");
                router.push("/paywall");
              }}
              activeOpacity={0.8}
            >
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <GlassCard
                  style={{
                    marginBottom: theme.spacing.xl,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={[
                      theme.typography.body,
                      {
                        marginRight: theme.spacing.md,
                        fontWeight: theme.typography.weights.semibold,
                      },
                    ]}
                  >
                    Credits:
                  </Text>
                  <Text
                    style={[
                      theme.typography.h1,
                      {
                        fontSize: theme.typography.sizes.h1,
                        ...theme.typography.shadows.jadeGlow,
                      },
                    ]}
                  >
                    {balance === Infinity ? "∞" : balance}
                  </Text>
                </GlassCard>
              </Animated.View>
            </TouchableOpacity>

            {/* View last reading - per connected wallet */}
            {lastReading ? (
              <TouchableOpacity
                onPress={() => {
                  setCurrentReading(lastReading);
                  router.push("/result");
                }}
                activeOpacity={0.8}
                style={{ marginBottom: theme.spacing.lg }}
              >
                <Text
                  style={[
                    theme.typography.bodySmall,
                    {
                      color: theme.colors.jade.primary,
                      textDecorationLine: "underline",
                      textAlign: "center",
                    },
                  ]}
                >
                  View last reading
                </Text>
              </TouchableOpacity>
            ) : null}

            {/* Spread Selection */}
            <View style={{ marginBottom: theme.spacing.lg }}>
              <Text
                style={[
                  theme.typography.h2,
                  {
                    marginBottom: theme.spacing.md,
                  },
                ]}
              >
                Choose Your Spread
              </Text>

              {spreads.map((spread, index) => (
                <Animated.View
                  key={spread.id}
                  style={{
                    opacity: fadeAnim,
                    transform: [
                      {
                        translateY: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [30, 0],
                        }),
                      },
                    ],
                  }}
                >
                  <TouchableOpacity
                    onPress={() => selectSpread(spread.id)}
                    activeOpacity={0.7}
                  >
                    <GlassCard
                      style={[
                        {
                          marginBottom: theme.spacing.md,
                          borderWidth: 2,
                          borderColor:
                            selectedSpreadId === spread.id
                              ? theme.colors.jade.primary
                              : theme.colors.glass.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          theme.typography.h3,
                          {
                            marginBottom: theme.spacing.xs,
                          },
                        ]}
                      >
                        {spread.displayName}
                      </Text>
                      <Text style={theme.typography.bodySmall}>
                        {spread.cardCount} card{spread.cardCount !== 1 ? "s" : ""} • {spread.creditCost} credit
                        {spread.creditCost !== 1 ? "s" : ""}
                      </Text>
                      {selectedSpreadId === spread.id && spread.description ? (
                        <Text
                          style={[
                            theme.typography.caption,
                            {
                              marginTop: theme.spacing.sm,
                              color: theme.colors.text.secondary,
                            },
                          ]}
                        >
                          {spread.description}
                        </Text>
                      ) : null}
                    </GlassCard>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>

            {/* Start Reading Button */}
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <NeonButton
                title="Start Reading"
                onPress={handleStartPress}
                disabled={!selectedSpreadId}
                style={{ marginBottom: theme.spacing.lg }}
              />
            </Animated.View>

            {/* Intent / readiness modal */}
            <Modal
              transparent
              visible={showIntentModal}
              animationType="fade"
              onRequestClose={handleIntentDismiss}
            >
              <View style={styles.modalOverlay}>
                <GlassCard style={{ width: "90%", maxWidth: 400 }}>
                  <Text
                    style={[
                      theme.typography.h2,
                      {
                        textAlign: "center",
                        marginBottom: theme.spacing.md,
                      },
                    ]}
                  >
                    Set Your Intention
                  </Text>

                  <Text
                    style={[
                      theme.typography.body,
                      {
                        textAlign: "center",
                        marginBottom: theme.spacing.lg,
                      },
                    ]}
                  >
                    We'll shuffle the cards soon. Be intentional about what you
                    want to ask and hold it in mind before continuing. If you
                    don't have a question yet, start the reading when you do.
                  </Text>

                  <NeonButton
                    title="I'm ready"
                    onPress={handleIntentConfirm}
                    style={{ marginBottom: theme.spacing.sm }}
                  />

                  <TouchableOpacity
                    style={styles.modalSecondaryButton}
                    onPress={handleIntentDismiss}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        theme.typography.body,
                        {
                          textAlign: "center",
                          color: theme.colors.text.tertiary,
                        },
                      ]}
                    >
                      Maybe later
                    </Text>
                  </TouchableOpacity>
                </GlassCard>
              </View>
            </Modal>

            {/* Settings Link */}
            <TouchableOpacity
              style={styles.settingsLink}
              onPress={() => router.push("/settings")}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  theme.typography.body,
                  {
                    textAlign: "center",
                    fontWeight: theme.typography.weights.medium,
                  },
                ]}
              >
                ⚙️ Settings
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </LiquidBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  jadeParticle: {
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 5,
  },
  titleContainer: {
    marginBottom: 8,
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalSecondaryButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  settingsLink: {
    alignItems: "center",
    padding: 16,
    marginTop: 8,
  },
});
