/**
 * Settings Screen - App configuration and debug panel
 * Includes restore purchases, wallet management, and debug info
 */

import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
} from "react-native";
import Slider from "@react-native-community/slider";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useCreditsStore } from "../state/creditsStore";
import { useTheme, useAccentHue } from "../theme/index";
import { buildThemeColorsFromHue } from "../theme/themeColorsFromHue";
import { LiquidBackground, GlassCard, NeonButton } from "../theme/components";
import {
  disconnectWallet,
  isWalletConnected,
  getWalletAddress,
  connectWallet,
} from "../services/solanaService";
import { getRecentLedgerEntries } from "../services/creditsService";
import { getAppConfig } from "../config/appConfig";
import { logger } from "../core/logger";
import type { CreditLedgerEntry } from "../types/credits";

export default function SettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { balance, refreshBalance } = useCreditsStore();
  const { accentHue, setAccentHue } = useAccentHue();
  const [debugVisible, setDebugVisible] = useState(false);
  const [ledgerEntries, setLedgerEntries] = useState<CreditLedgerEntry[]>([]);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const config = getAppConfig();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: theme.animations.timing.slow,
      easing: theme.animations.easing.smooth,
      useNativeDriver: true,
    }).start();

    // Pulse animation for balance
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: theme.animations.presets.neonPulse,
          easing: theme.animations.easing.smooth,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: theme.animations.presets.neonPulse,
          easing: theme.animations.easing.smooth,
          useNativeDriver: true,
        }),
      ])
    ).start();

    loadData();
    logger.info("ui.screen.view", { screenName: "Settings" });
  }, []);

  const loadData = async () => {
    await refreshBalance();
    const entries = await getRecentLedgerEntries(10);
    setLedgerEntries(entries);
    
    // Wallet should be restored on app start, but check anyway
    const address = getWalletAddress();
    if (address) {
      setWalletAddress(address);
    } else if (isWalletConnected()) {
      setWalletAddress(getWalletAddress());
    }
  };

  const handleDisconnectWallet = async () => {
    Alert.alert(
      "Disconnect Wallet",
      "Are you sure you want to disconnect your wallet? You'll need to reconnect to make Solana payments.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: async () => {
            await disconnectWallet();
            setWalletAddress(null);
            await refreshBalance(); // Refresh to show 0 balance after disconnect
            Alert.alert("Wallet Disconnected", "Your wallet has been disconnected");
          },
        },
      ]
    );
  };

  const handleLongPressTitle = () => {
    setDebugVisible(!debugVisible);
  };

  return (
    <LiquidBackground>
      <SafeAreaView style={styles.container}>
        <Animated.View style={[styles.contentWrapper, { opacity: fadeAnim }]}>
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
            <TouchableOpacity onLongPress={handleLongPressTitle} activeOpacity={0.7}>
              <Text style={[
                theme.typography.hero,
                {
                  textAlign: 'center',
                  lineHeight: theme.typography.sizes.hero * theme.typography.lineHeights.tight,
                  marginBottom: theme.spacing.lg,
                }
              ]}>
                Settings
              </Text>
            </TouchableOpacity>

            {/* Credits Section */}
            <View style={{ marginBottom: theme.spacing.xl }}>
              <Text style={[
                theme.typography.h2,
                {
                  marginBottom: theme.spacing.md,
                }
              ]}>
                Credits
              </Text>

              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <GlassCard style={{ marginBottom: theme.spacing.sm, alignItems: 'center' }}>
                  <Text style={[
                    theme.typography.bodySmall,
                    {
                      marginBottom: theme.spacing.sm,
                    }
                  ]}>
                    Current Balance:
                  </Text>
                  <Text style={[
                    theme.typography.h1,
                    {
                      ...theme.typography.shadows.jadeGlow,
                    }
                  ]}>
                    {balance === Infinity ? "∞ (Infinite)" : balance}
                  </Text>
                  {/* Clarify which wallet (if any) this balance belongs to */}
                  {walletAddress ? (
                    <Text
                      style={[
                        theme.typography.caption,
                        {
                          color: theme.colors.text.tertiary,
                          marginTop: theme.spacing.xs,
                          textAlign: "center",
                        },
                      ]}
                    >
                      For wallet: {walletAddress.substring(0, 6)}…{walletAddress.slice(-4)}
                    </Text>
                  ) : config.featureFlags.enableSolanaPaymentsAndroid ? (
                    <Text
                      style={[
                        theme.typography.caption,
                        {
                          color: theme.colors.text.tertiary,
                          marginTop: theme.spacing.xs,
                          textAlign: "center",
                        },
                      ]}
                    >
                      Device balance until you connect a wallet
                    </Text>
                  ) : null}
                </GlassCard>
              </Animated.View>

              {config.featureFlags.enableSolanaPaymentsAndroid && (
                <Text
                  style={[
                    theme.typography.caption,
                    {
                      color: theme.colors.text.tertiary,
                      marginBottom: theme.spacing.md,
                      fontStyle: "italic",
                    },
                  ]}
                >
                  {walletAddress
                    ? "Credits are stored for your connected wallet. Reconnect the same wallet to see this balance."
                    : "Connect a wallet in the section below to tie credits to that wallet."}
                </Text>
              )}

              <NeonButton
                title="Refresh Balance"
                onPress={refreshBalance}
              />

              <NeonButton
                title="View Credits"
                onPress={() => router.push("/paywall")}
                style={{ marginTop: theme.spacing.md }}
              />
            </View>

            {/* Accent color - changes app-wide jade/teal tint */}
            <View style={{ marginBottom: theme.spacing.xl }}>
              <Text
                style={[
                  theme.typography.h2,
                  { marginBottom: theme.spacing.md },
                ]}
              >
                Accent color
              </Text>
              <GlassCard style={{ marginBottom: theme.spacing.sm }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: theme.spacing.sm,
                  }}
                >
                  <View
                    style={[
                      styles.colorSwatch,
                      {
                        backgroundColor: buildThemeColorsFromHue(accentHue).jade
                          .primary,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      theme.typography.bodySmall,
                      { color: theme.colors.text.secondary, marginLeft: 12 },
                    ]}
                  >
                    Hue {Math.round(accentHue)}°
                  </Text>
                </View>
                <Slider
                  minimumValue={0}
                  maximumValue={360}
                  value={accentHue}
                  onValueChange={(v) => setAccentHue(typeof v === "number" ? v : Number(v))}
                  onSlidingComplete={(v) => setAccentHue(typeof v === "number" ? v : Number(v))}
                  minimumTrackTintColor={theme.colors.jade.primary}
                  maximumTrackTintColor={theme.colors.glass.border}
                  thumbTintColor={theme.colors.jade.primary}
                />
              </GlassCard>
            </View>

            {/* Wallet Section */}
            {config.featureFlags.enableSolanaPaymentsAndroid && (
              <View style={{ marginBottom: theme.spacing.xl }}>
                <Text style={[
                  theme.typography.h2,
                  {
                    marginBottom: theme.spacing.md,
                  }
                ]}>
                  Solana Wallet
                </Text>

                {walletAddress ? (
                  <>
                    <Text
                      style={[
                        theme.typography.caption,
                        {
                          color: theme.colors.text.tertiary,
                          marginBottom: theme.spacing.sm,
                          fontStyle: "italic",
                        },
                      ]}
                    >
                      Your credits balance above is stored for this wallet only.
                    </Text>
                    <GlassCard style={{ marginBottom: theme.spacing.md }}>
                      <Text style={[
                        theme.typography.bodySmall,
                        {
                          marginBottom: theme.spacing.sm,
                        }
                      ]}>
                        Connected Address:
                      </Text>
                      <Text style={[
                        theme.typography.body,
                        {
                          fontWeight: theme.typography.weights.semibold,
                          fontFamily: 'monospace',
                          marginBottom: theme.spacing.sm,
                        }
                      ]} numberOfLines={1}>
                        {walletAddress.substring(0, 12)}...{walletAddress.substring(walletAddress.length - 4)}
                      </Text>
                      <Text style={[
                        theme.typography.caption,
                        {
                          color: theme.colors.success,
                        }
                      ]}>
                        Wallet Connected
                      </Text>
                    </GlassCard>

                    <NeonButton
                      title="Disconnect Wallet"
                      onPress={handleDisconnectWallet}
                      style={{ backgroundColor: theme.colors.error }}
                    />
                  </>
                ) : (
                  <>
                    <GlassCard style={{ marginBottom: theme.spacing.md }}>
                      <Text style={[
                        theme.typography.body,
                        {
                          marginBottom: theme.spacing.xs,
                          textAlign: 'center',
                        }
                      ]}>
                        No wallet connected
                      </Text>
                      <Text style={[
                        theme.typography.caption,
                        {
                          textAlign: 'center',
                        }
                      ]}>
                        Connect a wallet to enable Solana payments
                      </Text>
                    </GlassCard>

                    <NeonButton
                      title="Connect Wallet"
                      onPress={async () => {
                        logger.info("wallet.connect.settings");
                        try {
                          const { address } = await connectWallet();
                          setWalletAddress(address);
                          await refreshBalance();
                          Alert.alert("Wallet Connected", address);
                        } catch (err) {
                          Alert.alert("Wallet Error", err instanceof Error ? err.message : String(err));
                        }
                      }}
                    />
                  </>
                )}
              </View>
            )}

            {/* Legal Disclaimer */}
            <View style={{ marginBottom: theme.spacing.xl }}>
              <Text style={[
                theme.typography.h2,
                {
                  marginBottom: theme.spacing.md,
                }
              ]}>
                Legal
              </Text>

              <GlassCard>
                <Text style={[
                  theme.typography.caption,
                  {
                    fontStyle: 'italic',
                    marginBottom: theme.spacing.md,
                  }
                ]}>
                  Tarot readings are provided for reflection and entertainment
                  purposes only. They are not intended as medical, legal, or
                  financial advice. Please use your own judgment and consult
                  professionals for important decisions.
                </Text>
                <Text style={[
                  theme.typography.caption,
                  {
                    fontStyle: 'italic',
                    color: theme.colors.text.tertiary,
                  }
                ]}>
                  Card imagery in this app is based on public-domain versions of the 1909 tarot illustrations by Pamela Colman Smith and Arthur Edward Waite.
                </Text>
              </GlassCard>
            </View>

            {/* Debug Panel (hidden behind long-press) */}
            {debugVisible && (
              <GlassCard style={{ marginBottom: theme.spacing.xl }}>
                <Text style={[
                  theme.typography.h3,
                  {
                    marginBottom: theme.spacing.md,
                  }
                ]}>
                  Debug Information
                </Text>
                  
                  <View style={styles.debugRow}>
                    <Text style={styles.debugLabel}>API Base URL:</Text>
                    <Text style={styles.debugValue}>{config.apiBaseUrl}</Text>
                  </View>

                  <View style={styles.debugRow}>
                    <Text style={styles.debugLabel}>Solana Enabled:</Text>
                    <Text style={styles.debugValue}>
                      {config.featureFlags.enableSolanaPaymentsAndroid ? "Yes" : "No"}
                    </Text>
                  </View>

                  <View style={styles.debugRow}>
                    <Text style={styles.debugLabel}>Recent Ledger Entries:</Text>
                  </View>
                  {ledgerEntries.map((entry) => (
                    <View key={entry.id} style={styles.ledgerEntry}>
                      <Text style={[
                        theme.typography.caption,
                        {
                          color: theme.colors.text.tertiary,
                        }
                      ]}>
                        {new Date(entry.createdAtIso).toLocaleString()}
                      </Text>
                      <Text style={[
                        theme.typography.caption,
                        {
                          color: theme.colors.text.secondary,
                        }
                      ]}>
                        {entry.source} {entry.delta > 0 ? "+" : ""}{entry.delta}
                      </Text>
                      {entry.reference && (
                        <Text style={[
                          theme.typography.tiny,
                          {
                            color: theme.colors.text.tertiary,
                          }
                        ]}>
                          {entry.reference.substring(0, 16)}...
                        </Text>
                      )}
                    </View>
                  ))}
              </GlassCard>
            )}

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Text style={[
                theme.typography.body,
                {
                  textAlign: 'center',
                }
              ]}>
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
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  balanceCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#6a4c93",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  balanceGradient: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(106, 76, 147, 0.3)",
    alignItems: "center",
  },
  balanceLabel: {
    fontSize: 16,
    color: "#d4c5e8",
    marginBottom: 8,
    fontWeight: "500",
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    textShadowColor: "rgba(255, 255, 255, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  walletCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(106, 76, 147, 0.3)",
    shadowColor: "#6a4c93",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  walletGradient: {
    padding: 20,
    borderRadius: 15,
  },
  walletLabel: {
    fontSize: 14,
    color: "#b8a9d9",
    marginBottom: 8,
    fontWeight: "600",
  },
  walletAddress: {
    fontSize: 16,
    color: "#fff",
    fontFamily: "monospace",
    fontWeight: "600",
    marginBottom: 8,
  },
  walletStatus: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "600",
  },
  infoCard: {
    backgroundColor: "rgba(106, 76, 147, 0.2)",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(106, 76, 147, 0.3)",
  },
  infoText: {
    fontSize: 16,
    color: "#d4c5e8",
    marginBottom: 8,
    textAlign: "center",
  },
  infoSubtext: {
    fontSize: 14,
    color: "#b8a9d9",
    textAlign: "center",
  },
  button: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#6a4c93",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonGradient: {
    padding: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDanger: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#d32f2f",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
  disclaimerCard: {
    backgroundColor: "rgba(106, 76, 147, 0.2)",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(106, 76, 147, 0.3)",
  },
  disclaimerText: {
    fontSize: 14,
    color: "#d4c5e8",
    lineHeight: 22,
    textAlign: "center",
  },
  debugSection: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(106, 76, 147, 0.5)",
  },
  debugGradient: {
    padding: 20,
    borderRadius: 15,
  },
  debugTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#4CAF50",
    marginBottom: 16,
  },
  debugRow: {
    marginBottom: 12,
  },
  debugLabel: {
    fontSize: 14,
    color: "#b8a9d9",
    marginBottom: 4,
    fontWeight: "600",
  },
  debugValue: {
    fontSize: 14,
    color: "#fff",
    fontFamily: "monospace",
  },
  ledgerEntry: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(106, 76, 147, 0.2)",
  },
  ledgerText: {
    fontSize: 12,
    color: "#d4c5e8",
    marginBottom: 4,
  },
  ledgerRef: {
    fontSize: 10,
    color: "#b8a9d9",
    fontFamily: "monospace",
  },
  backButton: {
    marginTop: 24,
    padding: 16,
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 18,
    color: "#b8a9d9",
    fontWeight: "500",
  },
});

