import React, { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { Theme } from '../../constants/theme';

export const Toast: React.FC<{ message: string; visible: boolean; onHide: () => void }> = ({ message, visible, onHide }) => {
  useEffect(() => {
    if (visible) {
      const t = setTimeout(onHide, 2200);
      return () => clearTimeout(t);
    }
  }, [visible, onHide]);

  if (!visible) return null;
  return (
    <Animated.View entering={FadeInUp.springify()} exiting={FadeOutUp} style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90,
    alignSelf: 'center',
    backgroundColor: Theme.colors.surface2,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  text: { color: Theme.colors.textPrimary, fontSize: 12, fontWeight: '600' },
});
