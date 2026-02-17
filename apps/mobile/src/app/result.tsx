/**
 * Result Screen - Display reading results
 * Shows per-card meanings and AI narrative
 */

import { useEffect, useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  BackHandler,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useReadingStore } from "../state/readingStore";
import { logger } from "../core/logger";
import { getCard, loadCards } from "../data/tarot/loader";
import { getCardImagePath } from "../utils/cardImageMapper";
import { getCardImageSource } from "../utils/cardImageMap";
import { useTheme } from "../theme/index";
import { LiquidBackground, GlassCard, NeonButton } from "../theme/components";

/** Local easing to avoid passing frozen theme values to Animated */
const SMOOTH_EASING = Easing.bezier(0.4, 0.0, 0.2, 1);

export default function ResultScreen() {
  const router = useRouter();
  const { currentReading, reset } = useReadingStore();
  const theme = useTheme();
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const [cardsReady, setCardsReady] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const ensureCapitalized = (s?: string) => {
    if (!s) return "";
    const t = s.trimStart();
    return t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
  };

  const renderText = (
    key: string,
    text?: string,
    limit: number = 220
  ) => {
    const value = ensureCapitalized(text || "");
    if (!value) return null;
    const isLong = value.length > limit;
    const isOpen = !!expanded[key];
    const display = isLong && !isOpen ? value.slice(0, limit).trimEnd() + "…" : value;
    return (
      <>
        <Text
          style={[
            theme.typography.bodySmall,
            styles.categoryBodyText,
            { color: theme.colors.text.secondary },
          ]}
        >
          {display}
        </Text>
        {isLong && (
          <Text
            onPress={() => toggle(key)}
            style={[
              theme.typography.bodySmall,
              {
                color: theme.colors.jade.secondary,
                marginTop: 6,
                fontWeight: theme.typography.weights.semibold,
              },
            ]}
          >
            {isOpen ? "See less" : "See more"}
          </Text>
        )}
      </>
    );
  };

  useEffect(() => {
    // Ensure card data is loaded before rendering anything that depends on it
    loadCards()
      .then(() => setCardsReady(true))
      .catch((error) => {
        logger.error("result.load.cards.error", {
          error: error instanceof Error ? error.message : String(error),
        });
      });

    if (!currentReading) {
      router.replace("/");
      return;
    }

    logger.info("ui.screen.view", { screenName: "Result" });

    // Entry fade animation
    const slowDuration = 900; // theme.animations.timing.slow
    Animated.timing(fadeAnimation, {
      toValue: 1,
      duration: slowDuration,
      easing: SMOOTH_EASING,
      useNativeDriver: true,
    }).start();
  }, [currentReading, router, fadeAnimation]);

  /**
   * Warn users that navigating back will lose the reading.
   */
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        Alert.alert(
          "Leave this reading?",
          "Going back will discard this reading. Do you want to leave?",
          [
            { text: "Stay", style: "cancel" },
            {
              text: "Leave",
              style: "destructive",
              onPress: () => {
                logger.warn("ui.reading.exit_without_save");
                reset();
                router.back();
              },
            },
          ],
        );
        return true;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );
      return () => subscription.remove();
    }, [reset, router]),
  );

  const handleNewReading = () => {
    reset();
    router.replace("/");
  };

  if (!currentReading || !cardsReady) {
    return null;
  }

  return (
    <LiquidBackground>
      <SafeAreaView style={styles.container}>
        <Animated.View style={{ flex: 1, opacity: fadeAnimation }}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.content}
          >
            <Text
              style={[
                theme.typography.h1,
                {
                  textAlign: "center",
                  marginBottom: theme.spacing.lg,
                },
              ]}
            >
              Your Reading
            </Text>

            {/* Per-Card Meanings */}
            <View
              style={{
                marginBottom: theme.spacing.xl,
                flexShrink: 0,
              }}
            >
              <Text
                style={[
                  theme.typography.h2,
                  {
                    marginBottom: theme.spacing.md,
                  },
                ]}
              >
                Card Meanings
              </Text>

              {currentReading.perCardText.map((cardText, index) => {
                const drawnCard = currentReading.drawnCards[index];
                const card = getCard(cardText.cardId);
                const isReversed = drawnCard?.isReversed || false;

                return (
                  <GlassCard
                    key={index}
                    style={{
                      marginBottom: theme.spacing.md,
                      flexShrink: 0,
                    }}
                  >
                    {/* Card Image at the top */}
                    <View
                      style={[
                        styles.cardImageContainer,
                        {
                          borderRadius: theme.spacing.borderRadius.sm,
                          marginBottom: theme.spacing.md,
                        },
                      ]}
                    >
                      <Image
                        source={getCardImageSource(getCardImagePath(card))}
                        style={[
                          styles.cardImage,
                          isReversed && styles.cardReversed,
                        ]}
                        resizeMode="contain"
                      />
                    </View>

                    {/* Card Information */}
                    <Text
                      style={[
                        theme.typography.h3,
                        {
                          color: theme.colors.success,
                          marginBottom: theme.spacing.sm,
                        },
                      ]}
                    >
                      {cardText.title}
                    </Text>

                    {renderText(`meaning-${index}`, cardText.meaning, 260)}

                    {renderText(`desc-${index}`, cardText.description, 320)}

                    {/* Category Meanings */}
                    {cardText.categoryMeanings && (
                      <View
                        style={[
                          styles.categoryMeaningsContainer,
                          {
                            marginTop: theme.spacing.md,
                            paddingTop: theme.spacing.md,
                            borderTopWidth: 1,
                            borderTopColor: theme.colors.glass.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            theme.typography.h3,
                            {
                              color: theme.colors.jade.secondary,
                              marginBottom: theme.spacing.md,
                              fontSize: theme.typography.sizes.body,
                            },
                          ]}
                        >
                          Category Meanings
                        </Text>

                        <View style={styles.categoryBlock}>
                          <Text
                            style={[
                              theme.typography.bodySmall,
                              {
                                color: theme.colors.jade.primary,
                                fontWeight: theme.typography.weights.semibold,
                                marginBottom: theme.spacing.xs,
                              },
                            ]}
                          >
                            💕 Love:
                          </Text>
                          {renderText(`love-${index}`, cardText.categoryMeanings.love)}
                        </View>

                        <View style={styles.categoryBlock}>
                          <Text
                            style={[
                              theme.typography.bodySmall,
                              {
                                color: theme.colors.jade.primary,
                                fontWeight: theme.typography.weights.semibold,
                                marginBottom: theme.spacing.xs,
                              },
                            ]}
                          >
                            💚 Health:
                          </Text>
                          {renderText(`health-${index}`, cardText.categoryMeanings.health)}
                        </View>

                        <View style={styles.categoryBlock}>
                          <Text
                            style={[
                              theme.typography.bodySmall,
                              {
                                color: theme.colors.jade.primary,
                                fontWeight: theme.typography.weights.semibold,
                                marginBottom: theme.spacing.xs,
                              },
                            ]}
                          >
                            💰 Money & Career:
                          </Text>
                          {renderText(`money-${index}`, cardText.categoryMeanings.moneyCareer)}
                        </View>

                        <View style={styles.categoryBlock}>
                          <Text
                            style={[
                              theme.typography.bodySmall,
                              {
                                color: theme.colors.jade.primary,
                                fontWeight: theme.typography.weights.semibold,
                                marginBottom: theme.spacing.xs,
                              },
                            ]}
                          >
                            Spirituality:
                          </Text>
                          {renderText(`spirit-${index}`, cardText.categoryMeanings.spirituality)}
                        </View>
                      </View>
                    )}
                  </GlassCard>
                );
              })}
            </View>

            {/* AI Narrative */}
            {currentReading.aiNarrative && (
              <View style={{ marginBottom: theme.spacing.xl }}>
                <Text
                  style={[
                    theme.typography.h2,
                    {
                      marginBottom: theme.spacing.md,
                    },
                  ]}
                >
                  AI Narrative
                </Text>
                <GlassCard>
                  <Text
                    style={[
                      theme.typography.body,
                      {
                        color: theme.colors.text.primary,
                      },
                    ]}
                  >
                    {currentReading.aiNarrative}
                  </Text>
                </GlassCard>
              </View>
            )}

            {/* Disclaimer */}
            <GlassCard style={{ marginBottom: theme.spacing.lg }}>
              <Text
                style={[
                  theme.typography.caption,
                  {
                    fontStyle: "italic",
                  },
                ]}
              >
                This reading is for reflection and entertainment purposes only.
                It is not intended as medical, legal, or financial advice.
              </Text>
            </GlassCard>

            {/* Actions */}
            <NeonButton
              title="New Reading"
              onPress={handleNewReading}
              style={{ marginBottom: theme.spacing.md }}
            />
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    /** Let content size to children so ScrollView never constrains card height */
    flexGrow: 0,
  },
  cardImageContainer: {
    width: "100%",
    height: 300,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(13, 31, 31, 0.4)",
    overflow: "hidden",
  },
  cardImage: {
    width: "90%",
    height: "90%",
  },
  cardReversed: {
    transform: [{ rotate: "180deg" }],
  },
  categoryMeaningsContainer: {
    alignSelf: "stretch",
    width: "100%",
    /** Prevent flex from compressing this block so all text can render */
    flexShrink: 0,
  },
  categoryBlock: {
    marginBottom: 16,
    alignSelf: "stretch",
    width: "100%",
    /** Prevent block from shrinking so category text is never clipped */
    flexShrink: 0,
  },
  /** Full-width wrapping text for category meanings; no line limit so nothing is cut off */
  categoryBodyText: {
    lineHeight: 22,
    /** Ensure Text never gets ellipsis from layout; show full content */
    flexShrink: 0,
  },
});
