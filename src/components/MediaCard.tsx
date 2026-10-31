import { useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { SvgUri, SvgXml } from 'react-native-svg';

import { cds, font, gap, radius, shadow } from '../cds/tokens';
import { VideoCard } from './VideoCard';

const VIDEO_EXT = ['mp4', 'webm', 'mov', 'm4v', 'm3u8'];

const extOf = (url: string) => {
  const clean = url.split('?')[0].split('#')[0];
  const dot = clean.lastIndexOf('.');
  return dot >= 0 ? clean.slice(dot + 1).toLowerCase() : '';
};

interface Props {
  url: string;
  alt?: string;
}

/** 富文本媒体：按扩展名分派到视频 / SVG / 位图 */
export function MediaCard({ url, alt }: Props) {
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const ext = extOf(url);

  if (VIDEO_EXT.includes(ext)) return <VideoCard url={url} />;

  if (ext === 'svg') {
    return (
      <View style={styles.card}>
        <View style={styles.svgBox}>
          <SvgUri
            uri={url}
            width="100%"
            height="100%"
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setFailed(true);
            }}
          />
        </View>
        <Caption text={alt || url} failed={failed} />
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Image
        source={{ uri: url }}
        style={styles.image}
        resizeMode="contain"
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setFailed(true);
        }}
      />
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="small" color={cds.textMuted} />
        </View>
      ) : null}
      <Caption text={alt || url} failed={failed} />
    </View>
  );
}

/** ```svg 代码块：直接内联渲染源码 */
export function SvgBlock({ xml }: { xml: string }) {
  return (
    <View style={styles.card}>
      <View style={styles.svgBox}>
        <SvgXml xml={xml} width="100%" height="100%" />
      </View>
    </View>
  );
}

function Caption({ text, failed }: { text: string; failed: boolean }) {
  return (
    <Text style={[styles.caption, failed ? styles.captionError : null]} numberOfLines={2}>
      {failed ? `⚠ 加载失败 · ${text}` : text}
    </Text>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: cds.surface2,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: cds.border,
    overflow: 'hidden',
    marginVertical: gap.sm,
    ...shadow.sm,
  },
  image: {
    width: '100%',
    aspectRatio: 16 / 10,
    backgroundColor: cds.surface0,
  },
  svgBox: {
    width: '100%',
    height: 200,
    backgroundColor: cds.surface2,
  },
  loading: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    aspectRatio: 16 / 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cds.surface0,
  },
  caption: {
    fontFamily: font.mono,
    fontSize: 10.5,
    lineHeight: 15,
    color: cds.textMuted,
    paddingHorizontal: gap.md,
    paddingVertical: gap.sm,
  },
  captionError: {
    color: cds.error,
  },
});
