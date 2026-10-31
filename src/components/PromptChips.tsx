import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { SPRING } from '../cds/motion';
import { cds, font, gap, radius, text } from '../cds/tokens';

interface Props {
  items: string[];
  onPick: (text: string) => void;
  disabled: boolean;
}

function Chip({
  label,
  index,
  disabled,
  onPress,
}: {
  label: string;
  index: number;
  disabled: boolean;
  onPress: () => void;
}) {
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(enter, {
      toValue: 1,
      useNativeDriver: true,
      delay: index * 70,
      ...SPRING.snappy,
    }).start();
  }, [enter, index]);

  return (
    <Animated.View
      style={{
        opacity: enter,
        transform: [
          { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) },
        ],
      }}
    >
      <Pressable
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.chip,
          pressed ? styles.chipPressed : null,
          disabled ? styles.chipOff : null,
        ]}
      >
        <Text style={styles.text}>{label}</Text>
        <Text style={styles.arrow}>→</Text>
      </Pressable>
    </Animated.View>
  );
}

export function PromptChips({ items, onPick, disabled }: Props) {
  return (
    <View style={styles.wrap}>
      {items.map((item, index) => (
        <Chip
          key={item}
          label={item}
          index={index}
          disabled={disabled}
          onPress={() => onPick(item)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: gap.sm,
    marginTop: gap.xl,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.sm,
    backgroundColor: cds.alpha1,
    borderRadius: radius.pill,
    paddingHorizontal: gap.lg,
    paddingVertical: 11,
  },
  chipPressed: {
    backgroundColor: cds.alpha2,
  },
  chipOff: {
    opacity: 0.5,
  },
  text: {
    fontFamily: font.sans,
    ...text.bodySm,
    color: cds.textSecondary,
  },
  arrow: {
    fontFamily: font.sans,
    fontSize: 12,
    color: cds.textMuted,
  },
});
