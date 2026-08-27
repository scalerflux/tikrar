import React from 'react';
import { Pressable, PressableProps, PressableStateCallbackType } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PressableScaleProps extends PressableProps {
  haptic?: boolean;
}

export const PressableScale: React.FC<PressableScaleProps> = ({ haptic = true, onPressIn, onPressOut, children, style, ...props }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      {...props}
      onPressIn={(e) => {
        scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
        if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
        onPressOut?.(e);
      }}
      style={(state: PressableStateCallbackType) => [
        typeof style === 'function' ? style(state) : style,
        animatedStyle,
      ]}
    >
      {children}
    </AnimatedPressable>
  );
};
