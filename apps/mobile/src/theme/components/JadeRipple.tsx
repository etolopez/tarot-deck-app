import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '../index';

interface JadeRippleProps {
  x: number;
  y: number;
  onComplete?: () => void;
}

export const JadeRipple: React.FC<JadeRippleProps> = ({ x, y, onComplete }) => {
  const theme = useTheme();
  const scaleAnimation = useRef(new Animated.Value(0)).current;
  const opacityAnimation = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnimation, {
        toValue: 1.5,
        duration: theme.animations.presets.jadeRipple,
        easing: theme.animations.easing.snappy,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnimation, {
        toValue: 0,
        duration: theme.animations.presets.jadeRipple,
        easing: theme.animations.easing.smooth,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onComplete) {
        onComplete();
      }
    });
  }, [scaleAnimation, opacityAnimation, theme, onComplete]);

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        {
          overflow: 'hidden',
        },
      ]}
      pointerEvents="none"
    >
      <Animated.View
        style={[
          styles.ripple,
          {
            left: x - 50,
            top: y - 50,
            backgroundColor: theme.colors.jade.primary,
            transform: [{ scale: scaleAnimation }],
            opacity: opacityAnimation,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  ripple: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
  },
});
