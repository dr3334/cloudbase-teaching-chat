import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { ENTER_BUBBLE, SPRING } from '../cds/motion';
import { cds, font, gap, radius, text } from '../cds/tokens';

export function MessageBubble({ text: content }: { text: string }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      useNativeDriver: true,
      ...SPRING.bubble,
    }).start();
  }, [anim]);

  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [ENTER_BUBBLE.fromScale, 1],
  });
  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [ENTER_BUBBLE.fromY, 0],
  });
  const opacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [ENTER_BUBBLE.fromOpacity, 1],
  });

  return (
    <View style={styles.row}>
      <Animated.View style={[styles.bubble, { opacity, transform: [{ translateY }, { scale }] }]}>
        <Text style={styles.text}>{content}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'flex-end',
    marginTop: gap.lg,
    marginBottom: gap.md,
  },
  bubble: {
    maxWidth: '85%',
    backgroundColor: cds.userBubble,
    borderRadius: radius.bubble,
    borderTopRightRadius: radius.md,
    paddingHorizontal: gap.lg,
    paddingVertical: gap.md,
  },
  text: {
    fontFamily: font.sans,
    ...text.body,
    color: cds.textPrimary,
  },
});
