/**
 * Reading Screen - Card drawing and reveal
 * Beautiful animations: shuffling, card flips, and dreamy transitions
 */

import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
  Modal,
  Dimensions,
  Easing,
  ScrollView,
  BackHandler,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import { useReadingStore } from "../state/readingStore";
import { useCreditsStore } from "../state/creditsStore";
import {
  consumeCredits,
  getCurrentAccountId,
} from "../services/creditsService";
import { saveLastReading } from "../services/lastReadingService";
import {
  createReadingDraft,
  drawCards,
  buildLocalResult,
} from "../core/tarotEngine";
import { getAllCards, getSpread, getCard } from "../data/tarot/loader";
import { logger } from "../core/logger";
import {
  getCardImagePath,
  getCardBackImagePath,
} from "../utils/cardImageMapper";
import { getCardImageSource } from "../utils/cardImageMap";
import { useTheme } from "../theme/index";
import { LiquidBackground, GlassCard, NeonButton } from "../theme/components";
import type { DrawnCard } from "../types/tarot";

/** Local easing functions to avoid passing frozen theme values to Animated */
const ENIGMA_EASING = Easing.bezier(0.33, 1.53, 0.69, 0.99);

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

/** Single-card reading: large card, centered in area below header/button */
const SINGLE_CARD_WIDTH = Math.min(
  Math.floor(SCREEN_WIDTH * 0.85),
  320,
);
const SINGLE_CARD_HEIGHT = Math.min(
  Math.floor(SINGLE_CARD_WIDTH * 1.5),
  Math.floor(SCREEN_HEIGHT * 0.72),
);
/** Height of header block (title + subtitle + button); card is centered in the area below this */
const SINGLE_CARD_HEADER_HEIGHT = 120;

export default function ReadingScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { selectedSpreadId, question, setReadingState, setCurrentReading } =
    useReadingStore();

  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([]);
  const [revealedCards, setRevealedCards] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [shuffling, setShuffling] = useState(true);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(
    null,
  );
  const [creditsConsumed, setCreditsConsumed] = useState(false);
  const [showCreditWarningModal, setShowCreditWarningModal] = useState(false);
  const [pendingCreditConsumption, setPendingCreditConsumption] = useState<{
    readingId: string;
    creditCost: number;
  } | null>(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const shuffleCards = useRef<Animated.Value[]>([]).current;
  const cardFlipAnims = useRef<Map<number, Animated.Value>>(new Map()).current;
  const cardScaleAnims = useRef<Map<number, Animated.Value>>(new Map()).current;
  const cardPositionAnims = useRef<Map<number, Animated.ValueXY>>(
    new Map(),
  ).current;
  const hasDealtCards = useRef(false);

  useEffect(() => {
    if (!selectedSpreadId) {
      router.replace("/");
      return;
    }

    const performReading = async () => {
      try {
        setLoading(true);
        setShuffling(true);

        const spread = getSpread(selectedSpreadId);
        const cards = getAllCards();

        // Create reading draft
        const draft = createReadingDraft(
          {
            spreadId: selectedSpreadId,
            question,
            allowReversals: true, // Allow reversed cards
          },
          spread,
        );

        // Store reading info for credit consumption when first card is revealed
        // Credits are NOT consumed yet - will be consumed when first card is revealed
        setPendingCreditConsumption({
          readingId: draft.readingId,
          creditCost: spread.creditCost,
        });

        // Draw cards (allow reversals)
        const drawn = drawCards(spread, cards, true);
        setDrawnCards(drawn);

        // Initialize animation values for drawn cards
        drawn.forEach((_, index) => {
          if (!cardFlipAnims.has(index)) {
            cardFlipAnims.set(index, new Animated.Value(0));
          }
          if (!cardScaleAnims.has(index)) {
            cardScaleAnims.set(index, new Animated.Value(0));
          }
          if (!cardPositionAnims.has(index)) {
            cardPositionAnims.set(
              index,
              new Animated.ValueXY({
                x: SCREEN_WIDTH / 2 - 60,
                y: SCREEN_HEIGHT / 2 - 90,
              }),
            );
          }
        });

        // Create shuffling cards animation
        const shuffleCardCount = 20;
        for (let i = 0; i < shuffleCardCount; i++) {
          shuffleCards[i] = new Animated.Value(0);
        }

        // Start shuffling animation
        startShufflingAnimation(shuffleCardCount);

        // Wait for shuffle animation
        await new Promise((resolve) => setTimeout(resolve, 3000));
        setShuffling(false);

        // Build result
        const cardIndex = new Map(cards.map((c) => [c.id, c]));
        const result = buildLocalResult(
          draft.readingId,
          spread,
          question,
          drawn,
          cardIndex,
        );

        // Set reading result (AI narrative removed for simplicity)
        setCurrentReading(result);
        setReadingState("RESULT");

        // Persist as last reading for this wallet so user can view it again from home
        const accountId = await getCurrentAccountId();
        if (accountId) {
          saveLastReading(accountId, result).catch(() => {});
        }

        // Animate cards into position
        animateCardsIntoPosition(drawn.length);
        hasDealtCards.current = true;

        // Fade in content
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();

        logger.info("ui.reading.complete", { readingId: result.readingId });
      } catch (error) {
        logger.error("reading.perform.error", {
          error: error instanceof Error ? error.message : String(error),
        });
        router.replace("/");
      } finally {
        setLoading(false);
      }
    };

    performReading();
  }, []);

  /**
   * Handle back navigation - show modal if first card has been revealed
   * If no cards revealed, show "no credits will be discounted" message
   */
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // Show modal when trying to navigate back
        setShowCreditWarningModal(true);
        return true; // Prevent default back navigation until modal is handled
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );
      return () => subscription.remove();
    }, [selectedSpreadId]),
  );

  /**
   * Create shuffling animation with cards moving around
   */
  const startShufflingAnimation = (cardCount: number) => {
    const animations = shuffleCards.slice(0, cardCount).map((anim, index) => {
      const startX = Math.random() * SCREEN_WIDTH;
      const startY = Math.random() * SCREEN_HEIGHT;
      const endX = Math.random() * SCREEN_WIDTH;
      const endY = Math.random() * SCREEN_HEIGHT;
      const rotation = Math.random() * 360;

      return Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(anim, {
              toValue: 1,
              duration: 1000 + Math.random() * 500,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(new Animated.Value(startX), {
              toValue: endX,
              duration: 1000 + Math.random() * 500,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(anim, {
            toValue: 0,
            duration: 1000 + Math.random() * 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
    });

    Animated.parallel(animations).start();
  };

  /**
   * Animate cards flying into their positions
   */
  const animateCardsIntoPosition = (cardCount: number) => {
    const positions = calculateCardPositions(cardCount, selectedSpreadId);

    positions.forEach((pos, index) => {
      const scaleAnim = cardScaleAnims.get(index);
      const posAnim = cardPositionAnims.get(index);

      if (scaleAnim && posAnim) {
        // For Celtic Cross, stagger the animations slightly for a more dramatic effect
        const delay = selectedSpreadId === "celtic_cross" ? index * 100 : 0;

        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
            delay,
          }),
          Animated.spring(posAnim, {
            toValue: { x: pos.x, y: pos.y },
            tension: 50,
            friction: 7,
            useNativeDriver: true,
            delay,
          }),
        ]).start();
      }
    });
  };

  /**
   * Celtic Cross: card size (increased for better visibility)
   * Larger cards make it easier to see the card images without names taking too much space
   */
  const CELTIC_CARD_WIDTH = 110;
  const CELTIC_CARD_HEIGHT = 165;

  /**
   * Celtic Cross layout: Present + Challenge side-by-side on top (readable, no overlap), then staff grid.
   * - Cross: Present (0) left, Challenge (1) right, each with own label above
   * - Staff: 8 cards in 3 columns (3+3+2)
   */
  const calculateCelticCrossPositions = () => {
    // Account for content padding when centering
    // content has padding: 16, and cardsContainer has marginLeft: -8, so net offset is 8px
    // Adjust slightly left for better visual centering
    const netOffset = 4; // Reduced offset to shift cards slightly left
    const centerX = SCREEN_WIDTH / 2 + netOffset;
    const crossCardW = CELTIC_CARD_WIDTH;
    const crossCardH = CELTIC_CARD_HEIGHT;
    const crossGap = 14;
    const crossTotalW = crossCardW * 2 + crossGap;
    const crossLeft = centerX - crossTotalW / 2;
    const crossY = 58;

    // Staff: 3 columns × 3 rows; gapV must fit label above next row (no overlap)
    const gridCols = 3;
    const gapH = 14;
    const gapV = LABEL_HEIGHT + LABEL_GAP + 8;
    const gridTotalW = gridCols * CELTIC_CARD_WIDTH + (gridCols - 1) * gapH;
    const gridLeft = centerX - gridTotalW / 2;
    // Space for staff row 0 label above its cards so it doesn't overlap cross cards
    const crossToGridGap = LABEL_HEIGHT + LABEL_GAP + 12;
    const gridTop = crossY + crossCardH + crossToGridGap;

    // Order: 2=Past, 3=Future, 4=Above, 5=Below, 6=Advice, 7=External, 8=Hopes, 9=Outcome
    const staffOrder = [
      { col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 },
      { col: 0, row: 1 }, { col: 1, row: 1 }, { col: 2, row: 1 },
      { col: 0, row: 2 }, { col: 1, row: 2 },
    ];
    const staffPositions = staffOrder.map(({ col, row }) => ({
      x: gridLeft + col * (CELTIC_CARD_WIDTH + gapH),
      y: gridTop + row * (CELTIC_CARD_HEIGHT + gapV),
    }));

    return [
      { x: crossLeft, y: crossY },
      { x: crossLeft + crossCardW + crossGap, y: crossY },
      ...staffPositions,
    ];
  };

  /**
   * Calculate the content height needed for Celtic Cross layout
   * Returns the maximum Y position plus card height plus padding
   */
  const calculateCelticCrossContentHeight = (): number => {
    const positions = calculateCelticCrossPositions();
    const maxY = Math.max(...positions.map((pos) => pos.y));
    // Add card height, label height, and bottom padding
    return maxY + CELTIC_CARD_HEIGHT + LABEL_HEIGHT + LABEL_GAP + 40;
  };

  /**
   * Calculate accordion/fan style positions for 3-card spread
   * Cards are arranged side by side with slight vertical offset (fan/accordion effect)
   * SIMPLIFIED: Everything centered in available space
   */
  /** Label above each card: height and gap so label never overlaps card; room for two lines */
  const LABEL_HEIGHT = 48;
  const LABEL_GAP = 10;

  /**
   * Calculate triangular 3-card spread positions (Past top, Present left, Future right).
   * Labels sit above each card; no overflow, everything aligned.
   */
  const calculateThreeCardTrianglePositions = () => {
    const headerHeight = 48;
    const cardWidth = 120;
    const cardHeight = 180;
    const blockHeight = LABEL_HEIGHT + LABEL_GAP + cardHeight;
    const startY = headerHeight + LABEL_HEIGHT + LABEL_GAP;

    const topCenterX = (SCREEN_WIDTH - cardWidth) / 2;
    const bottomY = startY + blockHeight + 16;
    const horizontalGap = 24;
    const leftX = Math.max(16, (SCREEN_WIDTH - cardWidth * 2 - horizontalGap) / 2);
    const rightX = leftX + cardWidth + horizontalGap;

    return [
      { x: topCenterX, y: startY },                    // Past (top)
      { x: leftX, y: bottomY },                       // Present (bottom left)
      { x: rightX, y: bottomY },                      // Future (bottom right)
    ];
  };

  /**
   * Calculate vertical 3-card spread positions (stacked).
   * Labels sit above each card with reserved space so they never overlap.
   */
  const calculateThreeCardAccordionPositions = () => {
    const headerHeight = 48;
    const cardWidth = 120;
    const cardHeight = 180;
    const verticalSpacing = LABEL_HEIGHT + LABEL_GAP + 12;
    const startY = headerHeight + LABEL_HEIGHT + LABEL_GAP;
    const centerX = (SCREEN_WIDTH - cardWidth) / 2;

    return [
      { x: centerX, y: startY },
      { x: centerX, y: startY + cardHeight + verticalSpacing },
      { x: centerX, y: startY + (cardHeight + verticalSpacing) * 2 },
    ];
  };

  /**
   * Calculate card positions in a grid
   * Single card is larger and centered
   * Celtic Cross uses special traditional layout
   * 3-card spread uses accordion/fan style layout
   * Cards are positioned relative to the cardsContainer (which is flex: 1)
   */
  const calculateCardPositions = (count: number, spreadId?: string) => {
    // Celtic Cross: use traditional cross layout
    if (spreadId === "celtic_cross" && count === 10) {
      return calculateCelticCrossPositions();
    }

    // 3-card spread: triangular layout (Past top, Present/Future bottom)
    if (spreadId === "three_card" && count === 3) {
      return calculateThreeCardTrianglePositions();
    }

    // Single card: centered in the area below the button (no extra gap)
    if (count === 1) {
      const areaHeight = SCREEN_HEIGHT - SINGLE_CARD_HEADER_HEIGHT;
      const centerY = (areaHeight - SINGLE_CARD_HEIGHT) / 2;
      return [
        {
          x: (SCREEN_WIDTH - SINGLE_CARD_WIDTH) / 2,
          y: centerY,
        },
      ];
    }

    // Multiple cards: use grid layout, ensure cards fit on screen
    const headerHeight = 100;
    const availableHeight = SCREEN_HEIGHT - headerHeight;
    const cardsPerRow = Math.ceil(Math.sqrt(count));
    const totalRows = Math.ceil(count / cardsPerRow);

    // Calculate card size to fit screen
    const maxTotalWidth = SCREEN_WIDTH * 0.9;
    const spacing = 12;
    const maxCardWidth =
      (maxTotalWidth - spacing * (cardsPerRow - 1)) / cardsPerRow;
    const aspectRatio = 2 / 3;

    let cardWidth = Math.min(110, maxCardWidth);
    let cardHeight = cardWidth / aspectRatio;

    // Ensure cards fit vertically
    const maxTotalHeight = availableHeight * 0.85;
    const calculatedHeight = totalRows * cardHeight + spacing * (totalRows - 1);
    if (calculatedHeight > maxTotalHeight) {
      cardHeight = (maxTotalHeight - spacing * (totalRows - 1)) / totalRows;
      cardWidth = cardHeight * aspectRatio;
    }

    // Calculate total dimensions
    const totalWidth = cardsPerRow * cardWidth + (cardsPerRow - 1) * spacing;
    const totalHeight = totalRows * cardHeight + (totalRows - 1) * spacing;

    // Center everything: horizontally and vertically in available space
    const startX = (SCREEN_WIDTH - totalWidth) / 2;
    const startY = headerHeight + (availableHeight - totalHeight) / 2;

    const positions = [];

    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / cardsPerRow);
      const col = i % cardsPerRow;
      positions.push({
        x: startX + col * (cardWidth + spacing),
        y: startY + row * (cardHeight + spacing),
      });
    }

    return positions;
  };

  /**
   * Consume credits when first card is revealed
   * This is called after user acknowledges the warning modal
   */
  const consumeCreditsForReading = async () => {
    if (!pendingCreditConsumption || creditsConsumed) {
      logger.warn("reading.credits.consume.skipped", {
        hasPending: !!pendingCreditConsumption,
        alreadyConsumed: creditsConsumed,
      });
      return;
    }

    try {
      const accountId = await getCurrentAccountId();
      logger.info("reading.credits.consume.starting", {
        readingId: pendingCreditConsumption.readingId,
        cost: pendingCreditConsumption.creditCost,
        accountId: accountId ? `${accountId.substring(0, 8)}...` : "none",
      });
      
      const result = await consumeCredits(
        pendingCreditConsumption.creditCost,
        pendingCreditConsumption.readingId,
        accountId || undefined,
      );
      
      setCreditsConsumed(true);
      logger.info("reading.credits.consumed", {
        readingId: pendingCreditConsumption.readingId,
        cost: pendingCreditConsumption.creditCost,
        newBalance: result.newBalance,
        accountId: accountId ? `${accountId.substring(0, 8)}...` : "none",
      });
    } catch (error) {
      logger.error("reading.credits.consume.error", {
        error: error instanceof Error ? error.message : String(error),
        readingId: pendingCreditConsumption.readingId,
        cost: pendingCreditConsumption.creditCost,
      });
      // Re-throw error so we can see what went wrong
      throw error;
    }
  };

  /**
   * Handle card reveal with flip animation
   * Card reveals in the direction it will appear in the reading (reversed if needed)
   * If this is the first card (index === 0), consume credits immediately
   */
  const handleRevealCard = async (index: number) => {
    const scaleAnim = cardScaleAnims.get(index);
    const flipAnim = cardFlipAnims.get(index);

    if (!scaleAnim || !flipAnim) return;

    const drawnCard = drawnCards[index];
    const isReversed = drawnCard?.isReversed || false;

    // If this is the first card and credits haven't been consumed yet, consume them now
    if (index === 0 && !creditsConsumed && pendingCreditConsumption) {
      try {
        await consumeCreditsForReading();
      } catch (error) {
        // Log error but continue with card reveal
        logger.error("reading.card.reveal.credits.error", {
          error: error instanceof Error ? error.message : String(error),
          index,
        });
      }
    }

    // Create flip animation sequence
    Animated.sequence([
      // Scale up and start flip
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1.15,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(flipAnim, {
          toValue: 1,
          duration: 650, // theme.animations.presets.cardFlip
          easing: ENIGMA_EASING,
          useNativeDriver: true,
        }),
      ]),
      // Scale back down
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Update revealed state after animation
      const newRevealed = new Set([...revealedCards, index]);
      setRevealedCards(newRevealed);
      setSelectedCardIndex(index);

      // Don't auto-navigate - let user click button
    });
  };

  /**
   * Handle shuffle again - resets the reading and performs a new shuffle
   */
  const handleShuffleAgain = async () => {
    setShowCreditWarningModal(false);
    // Reset state
    setRevealedCards(new Set());
    setCreditsConsumed(false);
    setSelectedCardIndex(null);
    setShuffling(true);
    setLoading(true);
    hasDealtCards.current = false;
    
    // Clear pending credit consumption since we're reshuffling
    setPendingCreditConsumption(null);
    
    // Reset animation values
    cardFlipAnims.clear();
    cardScaleAnims.clear();
    cardPositionAnims.clear();
    
    // Reset fade animation
    fadeAnim.setValue(0);
    
    // Perform new reading
    try {
      const spread = getSpread(selectedSpreadId!);
      const cards = getAllCards();

      // Create new reading draft
      const draft = createReadingDraft(
        {
          spreadId: selectedSpreadId!,
          question,
          allowReversals: true,
        },
        spread,
      );

      // Store reading info for credit consumption when first card is revealed
      setPendingCreditConsumption({
        readingId: draft.readingId,
        creditCost: spread.creditCost,
      });

      // Draw new cards (allow reversals)
      const drawn = drawCards(spread, cards, true);
      setDrawnCards(drawn);

      // Initialize animation values for drawn cards
      drawn.forEach((_, index) => {
        cardFlipAnims.set(index, new Animated.Value(0));
        cardScaleAnims.set(index, new Animated.Value(0));
        cardPositionAnims.set(
          index,
          new Animated.ValueXY({
            x: SCREEN_WIDTH / 2 - 60,
            y: SCREEN_HEIGHT / 2 - 90,
          }),
        );
      });

      // Create shuffling cards animation
      const shuffleCardCount = 20;
      for (let i = 0; i < shuffleCardCount; i++) {
        shuffleCards[i] = new Animated.Value(0);
      }

      // Start shuffling animation
      startShufflingAnimation(shuffleCardCount);

      // Wait for shuffle animation
      await new Promise((resolve) => setTimeout(resolve, 3000));
      setShuffling(false);

      // Build result
      const cardIndex = new Map(cards.map((c) => [c.id, c]));
      const result = buildLocalResult(
        draft.readingId,
        spread,
        question,
        drawn,
        cardIndex,
      );

      // Set reading result
      setCurrentReading(result);
      setReadingState("RESULT");

      // Persist as last reading for this wallet
      const accountId = await getCurrentAccountId();
      if (accountId) {
        saveLastReading(accountId, result).catch(() => {});
      }

      // Animate cards into position
      animateCardsIntoPosition(drawn.length);

      // Fade in content
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();

      logger.info("ui.reading.reshuffle.complete", { readingId: result.readingId });
    } catch (error) {
      logger.error("reading.reshuffle.error", {
        error: error instanceof Error ? error.message : String(error),
      });
      router.replace("/");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle credit warning modal acknowledgment
   * Navigates back if user confirms
   */
  const handleCreditWarningAcknowledge = async () => {
    setShowCreditWarningModal(false);
    // Refresh credits before navigating back to ensure balance is updated
    try {
      await useCreditsStore.getState().refreshBalance();
      logger.info("reading.credits.refreshed.before.navigation");
    } catch (error) {
      logger.error("reading.credits.refresh.error", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
    router.back();
  };

  /**
   * Handle credit warning modal cancellation
   * Stays on the page
   */
  const handleCreditWarningCancel = () => {
    setShowCreditWarningModal(false);
  };

  /**
   * Animate cards dropping into background before navigating
   */
  const animateCardsToResults = () => {
    const animations = drawnCards
      .map((_, index) => {
        const posAnim = cardPositionAnims.get(index);
        const scaleAnim = cardScaleAnims.get(index);

        if (!posAnim || !scaleAnim) return null;

        return Animated.parallel([
          Animated.timing(posAnim, {
            toValue: {
              x: SCREEN_WIDTH / 2 - 60,
              y: SCREEN_HEIGHT + 100,
            },
            duration: 800,
            easing: Easing.in(Easing.back(1.2)),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.3,
            duration: 800,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ]);
      })
      .filter(Boolean);

    Animated.parallel(animations as Animated.CompositeAnimation[]).start(() => {
      router.replace("/result");
    });
  };

  const handleCloseFullScreen = () => {
    setSelectedCardIndex(null);
  };

  const handleViewResults = () => {
    animateCardsToResults();
  };

  /**
   * Render shuffling animation
   */
  const renderShufflingAnimation = () => {
    return (
      <View style={styles.shufflingContainer}>
        {shuffleCards.slice(0, 20).map((anim, index) => {
          const rotate = anim.interpolate({
            inputRange: [0, 1],
            outputRange: ["0deg", "360deg"],
          });

          const translateX = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [
              Math.random() * SCREEN_WIDTH,
              Math.random() * SCREEN_WIDTH,
            ],
          });

          const translateY = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [
              Math.random() * SCREEN_HEIGHT,
              Math.random() * SCREEN_HEIGHT,
            ],
          });

          const opacity = anim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0.3, 0.8, 0.3],
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.shufflingCard,
                {
                  transform: [{ translateX }, { translateY }, { rotate }],
                  opacity,
                },
              ]}
            >
              <Image
                source={getCardImageSource(getCardBackImagePath())}
                style={styles.shufflingCardImage}
                resizeMode="contain"
              />
            </Animated.View>
          );
        })}
        <View style={styles.shufflingTextContainer}>
          <Text style={styles.shufflingText}>Shuffling the cards...</Text>
          <Text style={styles.shufflingSubtext}>The universe is aligning</Text>
        </View>
      </View>
    );
  };

  if (shuffling || loading) {
    return (
      <LiquidBackground>
        <SafeAreaView style={styles.container}>
          {renderShufflingAnimation()}
        </SafeAreaView>
      </LiquidBackground>
    );
  }

  return (
    <LiquidBackground>
      <SafeAreaView style={styles.container}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <Text
            style={[
              theme.typography.h1,
              {
                textAlign: "center",
                marginBottom: theme.spacing.xs,
              },
            ]}
          >
            Your Cards
          </Text>
          {drawnCards.length > 1 && (
            <Text
              style={[
                theme.typography.body,
                {
                  textAlign: "center",
                  marginBottom: theme.spacing.xs,
                  fontStyle: "italic",
                },
              ]}
            >
              {revealedCards.size === drawnCards.length
                ? "All cards revealed"
                : `Reveal in order (${revealedCards.size}/${drawnCards.length})`}
            </Text>
          )}

          {/* Reveal button */}
          {drawnCards.length > 0 && (
            <View
              style={{
                marginTop: theme.spacing.sm,
                marginBottom: theme.spacing.sm,
              }}
            >
              <NeonButton
                title={
                  revealedCards.size === 0
                    ? drawnCards.length === 1
                      ? "Reveal your card"
                      : "Reveal first card"
                    : revealedCards.size < drawnCards.length
                      ? "Reveal next"
                      : "Open Your Reading"
                }
                onPress={() => {
                  const nextIndex = revealedCards.size;
                  if (nextIndex < drawnCards.length) {
                    handleRevealCard(nextIndex);
                  } else {
                    handleViewResults();
                  }
                }}
              />
            </View>
          )}

          {/* Cards container - scrollable for Celtic Cross */}
          {selectedSpreadId === "celtic_cross" ? (
            <ScrollView
              style={styles.cardsContainerScroll}
              contentContainerStyle={[
                styles.cardsContainerContent,
                { minHeight: calculateCelticCrossContentHeight() },
              ]}
              showsVerticalScrollIndicator={true}
            >
              <View style={styles.cardsContainer}>
                {drawnCards.map((drawnCard, index) => {
                  const isRevealed = revealedCards.has(index);
                  const card = getCard(drawnCard.cardId);

                  const scaleAnim =
                    cardScaleAnims.get(index) || new Animated.Value(1);
                  // SIMPLIFIED: Initialize all cards to center of available space
                  const isSingleCard = drawnCards.length === 1;
                  const isThreeCard =
                    selectedSpreadId === "three_card" && drawnCards.length === 3;
                  const isCelticCross = selectedSpreadId === "celtic_cross";
                  const initialCardWidth = isSingleCard
                    ? SINGLE_CARD_WIDTH
                    : isThreeCard
                      ? 120
                      : isCelticCross
                        ? CELTIC_CARD_WIDTH
                        : 120;
                  const initialCardHeight = isSingleCard
                    ? SINGLE_CARD_HEIGHT
                    : isThreeCard
                      ? 180
                      : isCelticCross
                        ? CELTIC_CARD_HEIGHT
                        : 180;

                  // Single card: center in area below button; others: center in area below header
                  const headerHeight = 100;
                  const availableHeight = SCREEN_HEIGHT - headerHeight;
                  const centerX = (SCREEN_WIDTH - initialCardWidth) / 2;
                  const centerY = isSingleCard
                    ? (SCREEN_HEIGHT - SINGLE_CARD_HEADER_HEIGHT - initialCardHeight) / 2
                    : headerHeight + (availableHeight - initialCardHeight) / 2;

                  const posAnim =
                    cardPositionAnims.get(index) ||
                    new Animated.ValueXY({
                      x: centerX,
                      y: centerY,
                    });
                  const flipAnim =
                    cardFlipAnims.get(index) || new Animated.Value(0);

                  const backOpacity = flipAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [1, 0, 0],
                  });

                  const frontOpacity = flipAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 0, 1],
                  });

                  const isReversed = drawnCard.isReversed || false;
                  // Cross cards are side-by-side; no rotation so both are readable
                  const isChallengeCard = false;

                  // Flip animation for card back: rotates from 0deg to 180deg
                  const backFlipRotate = flipAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0deg", "180deg"],
                  });

                  // Flip animation for card front: rotates from 180deg to final position
                  // If reversed, final position is 180deg (upside down)
                  // If not reversed, final position is 0deg (upright)
                  // Front starts at 180deg (backface) and flips to final position
                  const frontFlipRotate = flipAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: isReversed
                      ? ["180deg", "180deg"] // Reversed: stays at 180deg (upside down)
                      : ["180deg", "0deg"], // Upright: flips from 180deg to 0deg
                  });

                  // For Challenge card in Celtic Cross, add 90deg rotation to cross horizontally
                  const challengeRotation = isChallengeCard ? "90deg" : "0deg";

                  const imageSource = isRevealed
                    ? getCardImageSource(getCardImagePath(card))
                    : getCardImageSource(getCardBackImagePath());

                  return (
                    <Animated.View
                      key={`card-${index}`}
                      style={[
                        styles.cardWrapper,
                        isSingleCard && styles.cardWrapperSingle,
                        isCelticCross && styles.cardWrapperCeltic,
                        isThreeCard && styles.cardWrapperThree,
                        {
                          transform: [
                            { translateX: posAnim.x },
                            { translateY: posAnim.y },
                            { scale: scaleAnim },
                          ],
                        },
                      ]}
                    >
                      <TouchableOpacity
                        style={[
                          styles.cardPlaceholder,
                          isSingleCard && styles.cardPlaceholderSingle,
                          isCelticCross && styles.cardPlaceholderCeltic,
                          isThreeCard && styles.cardPlaceholderThree,
                        ]}
                        onPress={() => {
                          // Allow revealing cards by tapping them
                          // Only reveal if this is the next card to reveal (in order)
                          const nextIndex = revealedCards.size;
                          if (!isRevealed && index === nextIndex) {
                            handleRevealCard(index);
                          }
                        }}
                        disabled={isRevealed || index !== revealedCards.size}
                        activeOpacity={0.9}
                      >
                        {/* Card Back */}
                        <Animated.View
                          style={[
                            styles.cardFace,
                            styles.cardBack,
                            {
                              opacity: backOpacity,
                              transform: [
                                { rotate: backFlipRotate },
                                { rotate: challengeRotation },
                              ],
                            },
                          ]}
                        >
                          <Image
                            source={getCardImageSource(getCardBackImagePath())}
                            style={styles.cardImage}
                            resizeMode="contain"
                          />
                        </Animated.View>

                        {/* Card Front - shows in correct orientation (reversed if needed) */}
                        <Animated.View
                          style={[
                            styles.cardFace,
                            styles.cardFront,
                            {
                              opacity: frontOpacity,
                              transform: [
                                { rotate: frontFlipRotate },
                                { rotate: challengeRotation },
                              ],
                            },
                          ]}
                        >
                          <Image
                            source={getCardImageSource(getCardImagePath(card))}
                            style={styles.cardImage}
                            resizeMode="contain"
                          />
                          {isRevealed && (
                            <View style={styles.cardLabel}>
                              <Text style={styles.cardName}>{card.name}</Text>
                              {drawnCard.isReversed && (
                                <Text style={styles.reversedLabel}>(Reversed)</Text>
                              )}
                            </View>
                          )}
                        </Animated.View>
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}

            {/* Position labels above each card - rendered on top, no overflow */}
            {(selectedSpreadId === "three_card" ||
              selectedSpreadId === "celtic_cross") &&
              drawnCards.length > 0 &&
              (() => {
                const spread = getSpread(selectedSpreadId!);
                const positions =
                  selectedSpreadId === "celtic_cross"
                    ? calculateCelticCrossPositions()
                    : selectedSpreadId === "three_card"
                      ? calculateThreeCardTrianglePositions()
                      : [];
                const isCelticCross = selectedSpreadId === "celtic_cross";
                const cardWidth = isCelticCross ? CELTIC_CARD_WIDTH : 120;
                return (
                  <>
                    {drawnCards.map((_, index) => {
                      const position = spread.positions[index];
                      if (!position) return null;
                      const cardPos = positions[index];
                      if (!cardPos) return null;
                      const labelTop = cardPos.y - LABEL_HEIGHT - LABEL_GAP;
                      return (
                        <View
                          key={`label-${index}`}
                          style={[
                            styles.positionLabelContainer,
                            {
                              left: cardPos.x,
                              top: labelTop,
                              width: cardWidth,
                              height: LABEL_HEIGHT,
                            },
                          ]}
                          pointerEvents="none"
                        >
                          <View
                            style={[
                              styles.positionLabelPill,
                              {
                                backgroundColor: theme.colors.background.overlay,
                                borderColor: theme.colors.glass.border,
                                paddingHorizontal: isCelticCross ? 6 : 12,
                                paddingVertical: isCelticCross ? 3 : 5,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                theme.typography.caption,
                                styles.positionLabelText,
                                {
                                  fontWeight: theme.typography.weights.bold,
                                  textTransform: "uppercase",
                                  letterSpacing: isCelticCross ? 0.3 : 0.6,
                                  color: theme.colors.text.primary,
                                  fontSize: isCelticCross ? 9 : 13,
                                  lineHeight: isCelticCross ? 12 : 18,
                                },
                              ]}
                              numberOfLines={2}
                            >
                              {position.label}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </>
                );
              })()}
              </View>
            </ScrollView>
          ) : (
            <View style={styles.cardsContainer}>
              {/* Cards are rendered in the ScrollView branch above for Celtic Cross */}
              {/* For other spreads, cards are rendered normally without ScrollView */}
              {drawnCards.map((drawnCard, index) => {
                const isRevealed = revealedCards.has(index);
                const card = getCard(drawnCard.cardId);

                const scaleAnim =
                  cardScaleAnims.get(index) || new Animated.Value(1);
                const isSingleCard = drawnCards.length === 1;
                const isThreeCard =
                  selectedSpreadId === "three_card" && drawnCards.length === 3;
                const isCelticCross = selectedSpreadId === "celtic_cross";
                const initialCardWidth = isSingleCard
                  ? SINGLE_CARD_WIDTH
                  : isThreeCard
                    ? 120
                    : isCelticCross
                      ? CELTIC_CARD_WIDTH
                      : 120;
                const initialCardHeight = isSingleCard
                  ? SINGLE_CARD_HEIGHT
                  : isThreeCard
                    ? 180
                    : isCelticCross
                      ? CELTIC_CARD_HEIGHT
                      : 180;

                const headerHeight = 100;
                const availableHeight = SCREEN_HEIGHT - headerHeight;
                const centerX = (SCREEN_WIDTH - initialCardWidth) / 2;
                const centerY = isSingleCard
                  ? (SCREEN_HEIGHT - SINGLE_CARD_HEADER_HEIGHT - initialCardHeight) / 2
                  : headerHeight + (availableHeight - initialCardHeight) / 2;

                const posAnim =
                  cardPositionAnims.get(index) ||
                  new Animated.ValueXY({
                    x: centerX,
                    y: centerY,
                  });
                const flipAnim =
                  cardFlipAnims.get(index) || new Animated.Value(0);

                const backOpacity = flipAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [1, 0, 0],
                });

                const frontOpacity = flipAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 0, 1],
                });

                const isReversed = drawnCard.isReversed || false;
                const isChallengeCard = false;

                const backFlipRotate = flipAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0deg", "180deg"],
                });

                const frontFlipRotate = flipAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: isReversed
                    ? ["180deg", "180deg"]
                    : ["180deg", "0deg"],
                });

                const challengeRotation = isChallengeCard ? "90deg" : "0deg";

                return (
                  <Animated.View
                    key={`card-${index}`}
                    style={[
                      styles.cardWrapper,
                      isSingleCard && styles.cardWrapperSingle,
                      isCelticCross && styles.cardWrapperCeltic,
                      isThreeCard && styles.cardWrapperThree,
                      {
                        transform: [
                          { translateX: posAnim.x },
                          { translateY: posAnim.y },
                          { scale: scaleAnim },
                        ],
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={[
                        styles.cardPlaceholder,
                        isSingleCard && styles.cardPlaceholderSingle,
                        isCelticCross && styles.cardPlaceholderCeltic,
                        isThreeCard && styles.cardPlaceholderThree,
                      ]}
                      onPress={() => {
                        // Allow revealing cards by tapping them
                        // Only reveal if this is the next card to reveal (in order)
                        const nextIndex = revealedCards.size;
                        if (!isRevealed && index === nextIndex) {
                          handleRevealCard(index);
                        }
                      }}
                      disabled={isRevealed || index !== revealedCards.size}
                      activeOpacity={0.9}
                    >
                      <Animated.View
                        style={[
                          styles.cardFace,
                          styles.cardBack,
                          {
                            opacity: backOpacity,
                            transform: [
                              { rotate: backFlipRotate },
                              { rotate: challengeRotation },
                            ],
                          },
                        ]}
                      >
                        <Image
                          source={getCardImageSource(getCardBackImagePath())}
                          style={styles.cardImage}
                          resizeMode="contain"
                        />
                      </Animated.View>

                      <Animated.View
                        style={[
                          styles.cardFace,
                          styles.cardFront,
                          {
                            opacity: frontOpacity,
                            transform: [
                              { rotate: frontFlipRotate },
                              { rotate: challengeRotation },
                            ],
                          },
                        ]}
                      >
                        <Image
                          source={getCardImageSource(getCardImagePath(card))}
                          style={styles.cardImage}
                          resizeMode="contain"
                        />
                        {isRevealed && (
                          <View style={styles.cardLabel}>
                            <Text style={styles.cardName}>{card.name}</Text>
                            {drawnCard.isReversed && (
                              <Text style={styles.reversedLabel}>(Reversed)</Text>
                            )}
                          </View>
                        )}
                      </Animated.View>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}

              {(selectedSpreadId === "three_card" ||
                selectedSpreadId === "celtic_cross") &&
                drawnCards.length > 0 &&
                (() => {
                  const spread = getSpread(selectedSpreadId!);
                  const positions =
                    selectedSpreadId === "celtic_cross"
                      ? calculateCelticCrossPositions()
                      : selectedSpreadId === "three_card"
                        ? calculateThreeCardTrianglePositions()
                        : [];
                  const isCelticCross = selectedSpreadId === "celtic_cross";
                  const cardWidth = isCelticCross ? CELTIC_CARD_WIDTH : 120;
                  return (
                    <>
                      {drawnCards.map((_, index) => {
                        const position = spread.positions[index];
                        if (!position) return null;
                        const cardPos = positions[index];
                        if (!cardPos) return null;
                        const labelTop = cardPos.y - LABEL_HEIGHT - LABEL_GAP;
                        return (
                          <View
                            key={`label-${index}`}
                            style={[
                              styles.positionLabelContainer,
                              {
                                left: cardPos.x,
                                top: labelTop,
                                width: cardWidth,
                                height: LABEL_HEIGHT,
                              },
                            ]}
                            pointerEvents="none"
                          >
                            <View
                              style={[
                                styles.positionLabelPill,
                                {
                                  backgroundColor: theme.colors.background.overlay,
                                  borderColor: theme.colors.glass.border,
                                  paddingHorizontal: isCelticCross ? 6 : 12,
                                  paddingVertical: isCelticCross ? 3 : 5,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  theme.typography.caption,
                                  styles.positionLabelText,
                                  {
                                    fontWeight: theme.typography.weights.bold,
                                    textTransform: "uppercase",
                                    letterSpacing: isCelticCross ? 0.3 : 0.6,
                                    color: theme.colors.text.primary,
                                    fontSize: isCelticCross ? 9 : 13,
                                    lineHeight: isCelticCross ? 12 : 18,
                                  },
                                ]}
                                numberOfLines={2}
                              >
                                {position.label}
                              </Text>
                            </View>
                          </View>
                        );
                      })}
                    </>
                  );
                })()}
            </View>
          )}
        </Animated.View>

        {/* Credit consumption warning modal / Shuffle again modal - shown when trying to navigate back */}
        {showCreditWarningModal && (
          <Modal
            visible={showCreditWarningModal}
            transparent={true}
            animationType="fade"
            onRequestClose={handleCreditWarningCancel}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                justifyContent: "center",
                alignItems: "center",
                padding: 20,
              }}
            >
              <GlassCard
                style={{
                  width: "90%",
                  maxWidth: 400,
                  alignItems: "center",
                }}
              >
                <Text
                  style={[
                    theme.typography.h2,
                    {
                      marginBottom: theme.spacing.md,
                      textAlign: "center",
                    },
                  ]}
                >
                  {revealedCards.size === 0 ? "Shuffle again?" : "Credit Consumption"}
                </Text>
                <Text
                  style={[
                    theme.typography.body,
                    {
                      marginBottom: theme.spacing.sm, // Further reduced spacing
                      textAlign: "center",
                      fontSize: theme.typography.sizes.bodySmall, // Use bodySmall instead of reduced body
                      lineHeight:
                        theme.typography.sizes.bodySmall *
                        theme.typography.lineHeights.normal, // Use normal line height
                    },
                  ]}
                >
                  {revealedCards.size === 0 ? (
                    "You can shuffle your cards again or go home. As no cards were revealed, no credits will be discounted on either action."
                  ) : pendingCreditConsumption ? (
                    <>
                      Once a card is revealed, if you go back,{" "}
                      {pendingCreditConsumption.creditCost} credit
                      {pendingCreditConsumption.creditCost !== 1 ? "s" : ""} will be
                      deducted. This is how the app works.
                    </>
                  ) : (
                    "If you go back, credits will be deducted."
                  )}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    width: "100%",
                    alignItems: "stretch",
                    marginTop: theme.spacing.sm,
                    marginHorizontal: -theme.spacing.cardPadding,
                    paddingHorizontal: theme.spacing.cardPadding,
                    gap: theme.spacing.xs,
                  }}
                >
                  {revealedCards.size === 0 ? (
                    <>
                      <View
                        style={{
                          flex: 1,
                          height: 70, // Fixed height to ensure both buttons are same size
                          minWidth: 0, // Allow text to wrap properly
                        }}
                      >
                        <TouchableOpacity
                          onPress={handleShuffleAgain}
                          activeOpacity={0.7}
                          style={{ flex: 1, height: 70 }}
                        >
                          <View
                            style={{
                              flex: 1,
                              height: 70,
                              borderRadius: theme.spacing.borderRadius.md,
                              backgroundColor: "#0a1515", // Darker version of background (#0d1f1f)
                              borderWidth: 2,
                              borderColor: "#1a3333", // Darker border matching background gradient
                              justifyContent: "center",
                              alignItems: "center",
                              paddingVertical: 16,
                              paddingHorizontal: 12,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: theme.typography.sizes.caption,
                                lineHeight: theme.typography.sizes.caption * 1.3,
                                color: theme.colors.text.primary,
                                textAlign: "center",
                                fontWeight: theme.typography.weights.semibold,
                              }}
                            >
                              Yes, Shuffle again
                            </Text>
                          </View>
                        </TouchableOpacity>
                      </View>
                      <View
                        style={{
                          flex: 1,
                          height: 70, // Fixed height to ensure both buttons are same size
                          minWidth: 0, // Allow text to wrap properly
                        }}
                      >
                        <NeonButton
                          title="Go back home"
                          onPress={async () => {
                            setShowCreditWarningModal(false);
                            // Refresh credits before navigating back
                            try {
                              await useCreditsStore.getState().refreshBalance();
                            } catch (error) {
                              logger.error("reading.credits.refresh.error", {
                                error: error instanceof Error ? error.message : String(error),
                              });
                            }
                            router.back();
                          }}
                          textStyle={{ 
                            fontSize: theme.typography.sizes.caption, // Smaller font to fit text
                            lineHeight: theme.typography.sizes.caption * 1.3,
                          }}
                          style={{ height: 70 }}
                        />
                      </View>
                    </>
                  ) : (
                    <>
                      <View
                        style={{
                          flex: 1,
                          height: 70, // Fixed height to ensure both buttons are same size
                          minWidth: 0, // Allow text to wrap properly
                        }}
                      >
                        <TouchableOpacity
                          onPress={handleCreditWarningAcknowledge}
                          activeOpacity={0.7}
                          style={{ flex: 1, height: 70 }}
                        >
                          <View
                            style={{
                              flex: 1,
                              height: 70,
                              borderRadius: theme.spacing.borderRadius.md,
                              backgroundColor: "#8B2E2E", // Red-ish background
                              borderWidth: 2,
                              borderColor: "#C94A4A", // Lighter red border
                              justifyContent: "center",
                              alignItems: "center",
                              paddingVertical: 16,
                              paddingHorizontal: 12,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: theme.typography.sizes.caption,
                                lineHeight: theme.typography.sizes.caption * 1.3,
                                color: theme.colors.text.primary,
                                textAlign: "center",
                                fontWeight: theme.typography.weights.semibold,
                              }}
                            >
                              Go Home
                            </Text>
                          </View>
                        </TouchableOpacity>
                      </View>
                      <View
                        style={{
                          flex: 1,
                          height: 70, // Fixed height to ensure both buttons are same size
                          minWidth: 0, // Allow text to wrap properly
                        }}
                      >
                        <NeonButton
                          title="Stay revealing"
                          onPress={handleCreditWarningCancel}
                          textStyle={{ 
                            fontSize: theme.typography.sizes.caption, // Smaller font to fit text
                            lineHeight: theme.typography.sizes.caption * 1.3,
                          }}
                          style={{ height: 70 }}
                        />
                      </View>
                    </>
                  )}
                </View>
              </GlassCard>
            </View>
          </Modal>
        )}

        {/* Full-screen card modal */}
        {selectedCardIndex !== null && (
          <Modal
            visible={selectedCardIndex !== null}
            transparent={false}
            animationType="fade"
            onRequestClose={handleCloseFullScreen}
            statusBarTranslucent={true}
          >
            <LiquidBackground>
              <SafeAreaView style={styles.modalContainer}>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={handleCloseFullScreen}
                >
                  <Text
                    style={[
                      theme.typography.body,
                      {
                        fontWeight: theme.typography.weights.semibold,
                      },
                    ]}
                  >
                    ✕ Close
                  </Text>
                </TouchableOpacity>

                {drawnCards[selectedCardIndex] && (
                  <>
                    <View style={styles.fullScreenCardContainer}>
                      <Image
                        source={getCardImageSource(
                          getCardImagePath(
                            getCard(drawnCards[selectedCardIndex].cardId),
                          ),
                        )}
                        style={[
                          styles.fullScreenCardImage,
                          drawnCards[selectedCardIndex].isReversed &&
                            styles.cardReversed,
                        ]}
                        resizeMode="contain"
                      />
                    </View>

                    <View style={styles.fullScreenCardInfo}>
                      <Text
                        style={[
                          theme.typography.h1,
                          {
                            textAlign: "center",
                          },
                        ]}
                      >
                        {getCard(drawnCards[selectedCardIndex].cardId).name}
                        {drawnCards[selectedCardIndex].isReversed &&
                          " (Reversed)"}
                      </Text>
                    </View>
                  </>
                )}
              </SafeAreaView>
            </LiquidBackground>
          </Modal>
        )}
      </SafeAreaView>
    </LiquidBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  shufflingContainer: {
    flex: 1,
    position: "relative",
  },
  shufflingCard: {
    position: "absolute",
    width: 100,
    height: 150,
  },
  shufflingCardImage: {
    width: "100%",
    height: "100%",
  },
  shufflingTextContainer: {
    position: "absolute",
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  shufflingText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#f0fffe", // Jade ice white
    textShadowColor: "rgba(61, 217, 184, 0.8)", // Jade primary glow
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    marginBottom: 8,
  },
  shufflingSubtext: {
    fontSize: 16,
    color: "#b8e6df", // Jade-tinted white
    fontStyle: "italic",
  },
  content: {
    flex: 1,
    padding: 16,
    paddingTop: 0,
  },
  cardsContainer: {
    flex: 1,
    position: "relative",
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    zIndex: 1,
    // Partial offset to help center cards - adjust based on visual balance
    marginLeft: -8,
    marginRight: -8,
  },
  cardsContainerScroll: {
    flex: 1,
    width: SCREEN_WIDTH,
    // Partial offset to help center cards
    marginLeft: -8,
    marginRight: -8,
  },
  cardsContainerContent: {
    position: "relative",
    width: SCREEN_WIDTH,
    paddingBottom: 40,
  },
  positionLabelContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
    overflow: "visible",
  },
  positionLabelPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    width: "100%",
    height: "100%",
    maxWidth: "100%",
    maxHeight: "100%",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  positionLabelText: {
    textAlign: "center",
    width: "100%",
    flexShrink: 0,
  },
  positionLabel: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    width: "100%",
    height: "100%",
    maxHeight: "100%",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  cardWrapper: {
    position: "absolute",
    width: 120,
    height: 180,
  },
  cardWrapperSingle: {
    width: SINGLE_CARD_WIDTH,
    height: SINGLE_CARD_HEIGHT,
  },
  cardWrapperCeltic: {
    position: "absolute",
    width: 110,
    height: 165,
  },
  cardWrapperThree: {
    position: "absolute",
    width: 120,
    height: 180,
  },
  cardPlaceholder: {
    width: 120,
    height: 180,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#3dd9b8", // Jade primary
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  cardPlaceholderCeltic: {
    width: 110,
    height: 165,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#3dd9b8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(61, 217, 184, 0.3)",
  },
  cardPlaceholderThree: {
    width: 120,
    height: 180,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#3dd9b8",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
    borderWidth: 1,
    borderColor: "rgba(61, 217, 184, 0.3)",
  },
  cardPlaceholderSingle: {
    width: SINGLE_CARD_WIDTH,
    height: SINGLE_CARD_HEIGHT,
    borderRadius: 20,
    shadowRadius: 25,
    elevation: 15,
    borderWidth: 2,
    borderColor: "rgba(61, 217, 184, 0.4)",
  },
  cardFace: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backfaceVisibility: "hidden",
  },
  cardBack: {
    backgroundColor: "#0f2828", // Jade dark background
  },
  cardFront: {
    backgroundColor: "rgba(13, 31, 31, 0.4)", // Jade transparent dark
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  cardReversed: {
    transform: [{ rotate: "180deg" }],
  },
  cardLabel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(13, 31, 31, 0.95)",
    padding: 8,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(61, 217, 184, 0.3)",
  },
  cardName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#f0fffe",
    textAlign: "center",
  },
  reversedLabel: {
    fontSize: 10,
    color: "#b8e6df",
    marginTop: 2,
  },
  modalContainer: {
    flex: 1,
  },
  modalCloseButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: "rgba(13, 31, 31, 0.9)",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(61, 217, 184, 0.3)",
  },
  fullScreenCardContainer: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 100,
  },
  fullScreenCardImage: {
    width: "95%",
    height: "75%",
    shadowColor: "#3dd9b8",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 12,
  },
  fullScreenCardInfo: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
    backgroundColor: "rgba(13, 31, 31, 0.95)",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(61, 217, 184, 0.3)",
  },
});
