import { useVideoPlayer, VideoView } from 'expo-video';
import { StyleSheet, Text, View } from 'react-native';

import { cds, font, gap, radius, shadow } from '../cds/tokens';

interface Props {
  url: string;
}

export function VideoCard({ url }: Props) {
  const player = useVideoPlayer(url, (p) => {
    p.loop = false;
    // 之前默认静音，导致播放没有声音；显式打开音轨并走系统音频焦点
    p.muted = false;
    p.volume = 1;
    p.audioMixingMode = 'auto';
  });

  return (
    <View style={styles.card}>
      <VideoView
        player={player}
        style={styles.video}
        nativeControls
        contentFit="contain"
        fullscreenOptions={{ enable: true }}
      />
      <View style={styles.meta}>
        <Text style={styles.label}>MANIM · MP4</Text>
        <Text style={styles.title} numberOfLines={1}>
          渲染产物 · 原生解码播放
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: cds.codeBg,
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginVertical: gap.sm,
    ...shadow.sm,
  },
  video: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: cds.codeBg,
  },
  meta: {
    paddingHorizontal: gap.md,
    paddingVertical: gap.sm,
    gap: 2,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  label: {
    fontFamily: font.mono,
    fontSize: 8.5,
    letterSpacing: 1,
    color: cds.codeMuted,
  },
  title: {
    fontFamily: font.mono,
    fontSize: 11,
    lineHeight: 15,
    color: cds.codeText,
  },
});
