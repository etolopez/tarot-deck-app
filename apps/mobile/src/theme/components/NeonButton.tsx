import React, { useEffect, useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  Animated,
  Easing,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../index';

interface NeonButtonProps {
  onPress: () => void;
  title: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

/** Same curve as theme.animations.easing.smooth, created locally to avoid mutating frozen theme */
const SMOOTH_EASING = Easing.bezier(0.4, 0.0, 0.2, 1);

export const NeonButton: React.FC<NeonButtonProps> = ({
  onPress,
  title,
  style,
  textStyle,
  disabled = false,
}) => {
  const theme = useTheme();
  const pulseAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Extract duration as primitive to avoid passing frozen theme values
    const duration = 1800; // theme.animations.presets.neonPulse

    // Neon pulse animation
    const loopRef = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: duration,
          easing: SMOOTH_EASING,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 0,
          duration: duration,
          easing: SMOOTH_EASING,
          useNativeDriver: false,
        }),
      ])
    );
    loopRef.start();
    return () => loopRef.stop();
  }, [pulseAnimation]);

  const borderWidth = pulseAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 2, 1],
  });

  const shadowRadius = pulseAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [8, 16, 8],
  });

  // Determine if button is in a flex row (for equal sizing) or standalone
  const isInFlexRow = style?.height !== undefined;
  
  return (
    <TouchableOpacity 
      onPress={onPress} 
      disabled={disabled} 
      activeOpacity={0.7} 
      style={isInFlexRow ? { flex: 1, height: style.height } : undefined}
    >
      <Animated.View
        style={[
          styles.container,
          {
            borderWidth,
            borderColor: theme.colors.jade.primary,
            borderRadius: theme.spacing.borderRadius.md,
            shadowColor: theme.colors.jade.mint,
            shadowRadius,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            opacity: disabled ? 0.5 : 1,
            ...(isInFlexRow ? { flex: 1, height: style.height } : {}),
          },
          style,
        ]}
      >
        <LinearGradient
          colors={[theme.colors.jade.secondary, theme.colors.jade.tertiary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.gradient,
            {
              borderRadius: theme.spacing.borderRadius.md,
              ...(isInFlexRow ? { flex: 1, justifyContent: 'center', alignItems: 'center' } : { justifyContent: 'center', alignItems: 'center' }),
              paddingVertical: 16,
              paddingHorizontal: 12, // Reduced horizontal padding to give more room for text
            },
          ]}
        >
          <Text
            style={[
              theme.typography.h3,
              {
                // High-contrast text over darker gradient
                color: theme.colors.text.primary,
                textAlign: 'center',
                ...theme.typography.shadows.neon,
                flexShrink: 1, // Allow text to shrink if needed
              },
              textStyle,
            ]}
            numberOfLines={3} // Allow up to 3 lines for text wrapping
          >
            {title}
          </Text>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  gradient: {
    paddingVertical: 16,
    paddingHorizontal: 16, // Reduced from 32 to decrease side spacing around text
  },
});
