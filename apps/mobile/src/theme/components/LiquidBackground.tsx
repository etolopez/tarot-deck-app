/**
 * LiquidBackground - Animated gradient background using Reanimated.
 * Uses Reanimated (not RN Animated) to avoid frozen object errors when used with dev client.
 */

import React, { useEffect } from "react";
import { StyleSheet, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../index";

interface LiquidBackgroundProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

const FLOW_DURATION = 8000;

export const LiquidBackground: React.FC<LiquidBackgroundProps> = ({
  children,
  style,
}) => {
  const theme = useTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: FLOW_DURATION }),
        withTiming(0, { duration: FLOW_DURATION })
      ),
      -1
    );
  }, [progress]);

  const animatedStyle1 = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5, 1], [1, 0.7, 1]),
  }));

  const animatedStyle2 = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5, 1], [0.7, 1, 0.7]),
  }));

  return (
    <Animated.View style={[styles.container, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle1]}>
        <LinearGradient
          colors={theme.colors.background.primary}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle2]}>
        <LinearGradient
          colors={[...theme.colors.background.primary].reverse()}
          style={StyleSheet.absoluteFill}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      </Animated.View>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
