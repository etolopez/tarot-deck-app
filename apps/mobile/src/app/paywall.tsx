/**
 * Paywall Screen - Credit purchase options
 * Shows IAP products and Solana payment option (Android only)
 */

import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Animated,
  Easing,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useCreditsStore } from "../state/creditsStore";
import { getBalance } from "../services/creditsService";
import { useTheme } from "../theme/index";
import { LiquidBackground, GlassCard, NeonButton } from "../theme/components";

/** Local easing to avoid passing frozen theme values to Animated */
const SMOOTH_EASING = Easing.bezier(0.4, 0.0, 0.2, 1);
// IAP imports remain for future use but are unused in Solana-first mode
import {
  requestPurchase,
  fetchProducts,
  initializeIap,
  isIapAvailable,
} from "../services/iapService";
import {
  connectWallet,
  sendSolPayment,
  isSolanaEnabled,
  isWalletConnected,
  getWalletAddress,
} from "../services/solanaService";
import { getAppConfig } from "../config/appConfig";
import { logger } from "../core/logger";
import type { IapSku } from "../types/iap";
import { SKU_TO_CREDITS } from "../types/iap";

interface IapProduct {
  sku: IapSku;
  credits: number;
}

/**
 * Solana credit packs
 * Predefined packs for Solana payments
 */
const SOLANA_PACKS = [
  { credits: 5, lamports: 10000000, label: "5 Credits - 0.01 SOL" },
  { credits: 15, lamports: 25000000, label: "15 Credits - 0.025 SOL" },
];

export default function PaywallScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { balance, refreshBalance } = useCreditsStore();
  const [iapProducts, setIapProducts] = useState<IapProduct[]>([]);
  const [iapAvailable, setIapAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [solanaEnabled, setSolanaEnabled] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Extract durations as primitives to avoid passing frozen theme values
    const slowDuration = 900; // theme.animations.timing.slow
    const pulseDuration = 1800; // theme.animations.presets.neonPulse

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: slowDuration,
      easing: SMOOTH_EASING,
      useNativeDriver: true,
    }).start();

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

    const loadData = async () => {
      try {
        // Skip IAP in Solana-first mode
        setIapAvailable(false);
        setIapProducts([]);

        // Check Solana availability
        const config = getAppConfig();
        setSolanaEnabled(isSolanaEnabled());

        // Check wallet connection - it should be restored on app start
        const address = getWalletAddress();
        if (address) {
          setWalletAddress(address);
          await refreshBalance();
          logger.info("paywall.wallet.restored", {
            address: address.substring(0, 8) + "...",
          });
        } else {
          // Try to restore wallet address from storage as fallback
          const { getCurrentAccountId } =
            await import("../services/creditsService");
          const savedAddress = await getCurrentAccountId();
          if (savedAddress) {
            setWalletAddress(savedAddress);
            await refreshBalance();
            logger.info("paywall.wallet.restored.from.storage", {
              address: savedAddress.substring(0, 8) + "...",
            });
          }
        }

        logger.info("ui.screen.view", { screenName: "Paywall" });
      } catch (error) {
        logger.error("paywall.load.error", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    };

    loadData();
  }, [refreshBalance]);

  const handleIapPurchase = async (sku: IapSku) => {
    setLoading(true);
    try {
      const result = await requestPurchase(sku);
      logger.info("paywall.iap.purchase.complete", {
        sku,
        creditsGranted: result.creditsGranted,
        transactionId: result.transactionId,
      });

      // Refresh balance to update UI - wait a bit for AsyncStorage to sync
      await new Promise((resolve) => setTimeout(resolve, 100));
      await refreshBalance();

      // Double-check balance was updated
      const newBalance = await getBalance();
      logger.info("paywall.iap.balance.updated", {
        newBalance,
        expectedCredits: result.creditsGranted,
        previousBalance: balance,
      });

      // Force UI update if balance didn't change
      if (newBalance === balance) {
        logger.warn("paywall.iap.balance.not.updated", {
          expected: balance + (result.creditsGranted || 0),
          actual: newBalance,
        });
        // Try refreshing again
        await refreshBalance();
      }

      logger.info("paywall.iap.success", {
        sku,
        creditsGranted: result.creditsGranted,
      });
    } catch (error) {
      logger.error("paywall.iap.error", {
        sku,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConnectWallet = async () => {
    // If already connected, skip
    if (walletAddress) {
      return;
    }
    setLoading(true);
    try {
      const result = await connectWallet();
      setWalletAddress(result.address);
      await refreshBalance();
      logger.info("paywall.wallet.connected", { address: result.address });
    } catch (error) {
      logger.error("paywall.wallet.error", {
        error: error instanceof Error ? error.message : String(error),
      });
      Alert.alert(
        "Connection Failed",
        error instanceof Error
          ? error.message
          : "Failed to connect wallet. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSolanaPayment = async (pack: (typeof SOLANA_PACKS)[0]) => {
    // If no wallet connected, connect first
    if (!walletAddress) {
      await handleConnectWallet();
      // After connecting, check if we have a wallet now
      const currentAddress = getWalletAddress();
      if (!currentAddress) {
        // Connection was cancelled or failed
        return;
      }
      setWalletAddress(currentAddress);
    }

    setLoading(true);
    try {
      const result = await sendSolPayment(pack);
      logger.info("paywall.solana.payment.complete", {
        txSignature: result.txSignature,
        creditsGranted: result.creditsGranted,
      });

      // Refresh balance to update UI - wait a bit for AsyncStorage to sync
      await new Promise((resolve) => setTimeout(resolve, 100));
      await refreshBalance();

      // Double-check balance was updated
      const newBalance = await getBalance();
      logger.info("paywall.solana.balance.updated", {
        newBalance,
        expectedCredits: result.creditsGranted,
        previousBalance: balance,
      });

      // Force UI update if balance didn't change
      if (newBalance === balance) {
        logger.warn("paywall.solana.balance.not.updated", {
          expected: balance + result.creditsGranted,
          actual: newBalance,
        });
        // Try refreshing again
        await refreshBalance();
      }

      logger.info("paywall.solana.success", { credits: pack.credits });
      Alert.alert(
        "Payment Successful",
        `You've received ${result.creditsGranted} credits!`,
      );
    } catch (error) {
      logger.error("paywall.solana.error", {
        error: error instanceof Error ? error.message : String(error),
      });
      const errorMsg =
        error instanceof Error
          ? error.message
          : "Payment failed. Please try again.";
      // Don't show alert for user cancellation
      if (!errorMsg.toLowerCase().includes("cancel")) {
        Alert.alert("Payment Failed", errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <LiquidBackground>
      <SafeAreaView style={styles.container}>
        <Animated.View style={[styles.contentWrapper, { opacity: fadeAnim }]}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.content}
          >
            <Text
              style={[
                theme.typography.hero,
                {
                  textAlign: "center",
                  lineHeight:
                    theme.typography.sizes.hero *
                    theme.typography.lineHeights.tight,
                  marginBottom: theme.spacing.lg,
                },
              ]}
            >
              Purchase Credits
            </Text>

            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <GlassCard
                style={{
                  marginBottom: theme.spacing.xl,
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <Text
                  style={[
                    theme.typography.body,
                    {
                      marginBottom: theme.spacing.sm,
                    },
                  ]}
                >
                  Current Balance:
                </Text>
                <Text
                  style={[
                    theme.typography.h1,
                    {
                      ...theme.typography.shadows.jadeGlow,
                    },
                  ]}
                >
                  {balance === Infinity ? "∞" : balance} credits
                </Text>
              </GlassCard>
            </Animated.View>

            {/* IAP Products hidden in Solana-first mode */}

            {/* Solana Payments (Android only) */}
            {solanaEnabled && (
              <View style={{ marginBottom: theme.spacing.lg }}>
                <Text
                  style={[
                    theme.typography.h2,
                    {
                      marginBottom: theme.spacing.md,
                    },
                  ]}
                >
                  Solana Payment
                </Text>
                {!walletAddress ? (
                  <NeonButton
                    title="Connect Wallet"
                    onPress={handleConnectWallet}
                    disabled={loading}
                  />
                ) : (
                  <>
                    <GlassCard style={{ marginBottom: theme.spacing.md }}>
                      <Text
                        style={[
                          theme.typography.bodySmall,
                          {
                            marginBottom: theme.spacing.xs,
                          },
                        ]}
                      >
                        🔗 Connected Wallet:
                      </Text>
                      <Text
                        style={[
                          theme.typography.body,
                          {
                            fontWeight: theme.typography.weights.semibold,
                          },
                        ]}
                      >
                        {walletAddress.substring(0, 12)}...
                        {walletAddress.substring(walletAddress.length - 4)}
                      </Text>
                    </GlassCard>

                    {SOLANA_PACKS.map((pack) => (
                      <TouchableOpacity
                        key={pack.credits}
                        onPress={() => handleSolanaPayment(pack)}
                        disabled={loading}
                        activeOpacity={0.7}
                      >
                        <GlassCard style={{ marginBottom: theme.spacing.md }}>
                          <View
                            style={{
                              flexDirection: "row",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <View>
                              <Text
                                style={[
                                  theme.typography.h3,
                                  {
                                    marginBottom: theme.spacing.xs,
                                  },
                                ]}
                              >
                                {pack.label}
                              </Text>
                              <Text style={theme.typography.bodySmall}>
                                {pack.credits} credits
                              </Text>
                            </View>
                            <Text
                              style={[
                                theme.typography.body,
                                {
                                  color: theme.colors.jade.primary,
                                  fontWeight: theme.typography.weights.semibold,
                                },
                              ]}
                            >
                              Pay with SOL
                            </Text>
                          </View>
                        </GlassCard>
                      </TouchableOpacity>
                    ))}
                  </>
                )}
              </View>
            )}

            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator
                  size="large"
                  color={theme.colors.jade.primary}
                />
                <Text
                  style={[
                    theme.typography.body,
                    {
                      marginTop: theme.spacing.md,
                    },
                  ]}
                >
                  Processing...
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  theme.typography.body,
                  {
                    textAlign: "center",
                  },
                ]}
              >
                ← Back
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
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(13, 31, 31, 0.9)", // Jade dark overlay
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  backButton: {
    marginTop: 24,
    padding: 16,
    alignItems: "center",
  },
});
