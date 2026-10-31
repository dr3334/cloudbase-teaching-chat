import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { cds, font, gap, radius, text } from '../cds/tokens';
import { MathFormula } from './MathFormula';
import { MediaCard, SvgBlock } from './MediaCard';
import { VideoCard } from './VideoCard';

type Segment =
  | { kind: 'media'; url: string; alt?: string }
  | { kind: 'paragraph'; lines: string[] }
  | { kind: 'heading'; level: number; text: string }
  | { kind: 'code'; lang: string; code: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'quote'; lines: string[] };

function tokenize(markdown: string): Segment[] {
  const lines = markdown.split('\n');
  const segments: Segment[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trimStart().startsWith('```')) {
      const lang = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].trimStart().startsWith('```')) {
        codeLines.push(lines[i]);
        i += 1;
      }
      i += 1;
      segments.push({ kind: 'code', lang, code: codeLines.join('\n') });
      continue;
    }

    // 独立成行的媒体：![alt](url) —— 支持 png/jpg/gif/webp、svg、mp4 等
    const imageMatch = /^!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)$/.exec(line.trim());
    if (imageMatch) {
      segments.push({ kind: 'media', alt: imageMatch[1], url: imageMatch[2] });
      i += 1;
      continue;
    }

    // 块级公式：$$ ... $$（单行或跨行）
    if (line.trim().startsWith('$$')) {
      const head = line.trim().slice(2);
      if (head.trim().endsWith('$$') && head.trim().length > 2) {
        segments.push({ kind: 'code', lang: 'latex', code: head.trim().slice(0, -2).trim() });
        i += 1;
        continue;
      }
      const mathLines: string[] = [];
      if (head.trim()) mathLines.push(head.trim());
      i += 1;
      while (i < lines.length && !lines[i].trim().endsWith('$$')) {
        mathLines.push(lines[i]);
        i += 1;
      }
      if (i < lines.length) {
        const tail = lines[i].trim().replace(/\$\$$/, '').trim();
        if (tail) mathLines.push(tail);
        i += 1;
      }
      segments.push({ kind: 'code', lang: 'latex', code: mathLines.join('\n') });
      continue;
    }

    const headingMatch = /^(#{1,4})\s+(.*)$/.exec(line);
    if (headingMatch) {
      segments.push({ kind: 'heading', level: headingMatch[1].length, text: headingMatch[2] });
      i += 1;
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ''));
        i += 1;
      }
      segments.push({ kind: 'list', items });
      continue;
    }

    if (line.trimStart().startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trimStart().startsWith('>')) {
        quoteLines.push(lines[i].replace(/^\s*>\s?/, ''));
        i += 1;
      }
      segments.push({ kind: 'quote', lines: quoteLines });
      continue;
    }

    if (line.trim() === '') {
      i += 1;
      continue;
    }

    const paragraphLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].trimStart().startsWith('```') &&
      !/^(#{1,4})\s+/.test(lines[i]) &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !lines[i].trimStart().startsWith('>')
    ) {
      paragraphLines.push(lines[i]);
      i += 1;
    }
    segments.push({ kind: 'paragraph', lines: paragraphLines });
  }

  return segments;
}

function renderInline(content: string, keyPrefix: string): ReactNode[] {
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\\\([^()]*\\\)|\\\[[^\]]*\\\]|\$[^$\n]+\$)/g;
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(content.slice(lastIndex, match.index));
    }
    const token = match[0];
    const key = `${keyPrefix}-i${index}`;

    if (token.startsWith('**')) {
      nodes.push(
        <Text key={key} style={styles.bold}>
          {token.slice(2, -2)}
        </Text>,
      );
    } else if (token.startsWith('\\(') || token.startsWith('\\[')) {
      // 模型常用 \( ... \) / \[ ... \] 作为行内公式，这里转成行内等宽样式
      nodes.push(
        <Text key={key} style={styles.inlineMath}>
          {token.slice(2, -2)}
        </Text>,
      );
    } else if (token.startsWith('$')) {
      nodes.push(
        <Text key={key} style={styles.inlineMath}>
          {token.slice(1, -1)}
        </Text>,
      );
    } else {
      nodes.push(
        <Text key={key} style={styles.inlineCode}>
          {token.slice(1, -1)}
        </Text>,
      );
    }
    lastIndex = match.index + token.length;
    index += 1;
  }

  if (lastIndex < content.length) {
    nodes.push(content.slice(lastIndex));
  }
  return nodes;
}

function renderJsonCode(code: string) {
  return code.split('\n').map((line, lineIndex, arr) => {
    const regex = /("[^"]*")(\s*:)?/g;
    const nodes: ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let index = 0;

    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        nodes.push(
          <Text key={`p${index}`} style={styles.jsonPunct}>
            {line.slice(lastIndex, match.index)}
          </Text>,
        );
      }
      const isKey = Boolean(match[2]);
      nodes.push(
        <Text key={`v${index}`} style={isKey ? styles.jsonKey : styles.jsonString}>
          {match[1]}
        </Text>,
      );
      if (match[2]) {
        nodes.push(
          <Text key={`c${index}`} style={styles.jsonPunct}>
            {match[2]}
          </Text>,
        );
      }
      lastIndex = match.index + match[0].length;
      index += 1;
    }

    if (lastIndex < line.length) {
      nodes.push(
        <Text key="tail" style={styles.jsonPunct}>
          {line.slice(lastIndex)}
        </Text>,
      );
    }

    return (
      <Text key={`json-${lineIndex}`} style={styles.codeText}>
        {nodes}
        {lineIndex < arr.length - 1 ? '\n' : ''}
      </Text>
    );
  });
}

/** 流式输出会把 `**` 截成半个，渲染前先摘掉落单的标记，避免露出原始星号 */
function stripDanglingMarkup(md: string): string {
  let out = md;
  const bold = out.match(/\*\*/g);
  if (bold && bold.length % 2 === 1) {
    const i = out.lastIndexOf('**');
    out = out.slice(0, i) + out.slice(i + 2);
  }
  const tick = out.match(/`/g);
  if (tick && tick.length % 2 === 1) {
    const i = out.lastIndexOf('`');
    out = out.slice(0, i) + out.slice(i + 1);
  }
  return out;
}

export function RichText({ content }: { content: string }) {
  const segments = tokenize(stripDanglingMarkup(content));

  return (
    <View>
      {segments.map((segment, index) => {
        const key = `seg-${index}`;

        if (segment.kind === 'heading') {
          return (
            <Text
              key={key}
              style={[styles.heading, segment.level <= 2 ? styles.headingLg : styles.headingSm]}
            >
              {renderInline(segment.text, key)}
            </Text>
          );
        }

        if (segment.kind === 'media') {
          return <MediaCard key={key} url={segment.url} alt={segment.alt} />;
        }

        if (segment.kind === 'code') {
          if (segment.lang === 'svg') {
            return <SvgBlock key={key} xml={segment.code} />;
          }
          if (segment.lang === 'latex' || segment.lang === 'math') {
            return <MathFormula key={key} latex={segment.code} />;
          }
          if (segment.lang === 'video') {
            return <VideoCard key={key} url={segment.code.trim()} />;
          }
          return (
            <View key={key} style={styles.codeCard}>
              <Text style={styles.codeLang}>{segment.lang || 'text'}</Text>
              <Text style={styles.codeText}>
                {segment.lang === 'json' ? renderJsonCode(segment.code) : segment.code}
              </Text>
            </View>
          );
        }

        if (segment.kind === 'list') {
          return (
            <View key={key} style={styles.list}>
              {segment.items.map((item, itemIndex) => (
                <View key={`${key}-li${itemIndex}`} style={styles.listItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.body}>{renderInline(item, `${key}-${itemIndex}`)}</Text>
                </View>
              ))}
            </View>
          );
        }

        if (segment.kind === 'quote') {
          return (
            <View key={key} style={styles.quote}>
              <Text style={styles.quoteText}>
                {segment.lines.map((line, lineIndex) => (
                  <Text key={`${key}-q${lineIndex}`}>
                    {renderInline(line, `${key}-${lineIndex}`)}
                    {lineIndex < segment.lines.length - 1 ? '\n' : ''}
                  </Text>
                ))}
              </Text>
            </View>
          );
        }

        return (
          <Text key={key} style={styles.body}>
            {segment.lines.map((line, lineIndex) => (
              <Text key={`${key}-l${lineIndex}`}>
                {renderInline(line, `${key}-p${lineIndex}`)}
                {lineIndex < segment.lines.length - 1 ? '\n' : ''}
              </Text>
            ))}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    fontFamily: font.sans,
    ...text.body,
    color: cds.textPrimary,
    marginBottom: gap.sm,
  },
  bold: {
    fontWeight: '700',
    color: cds.textPrimary,
  },
  inlineCode: {
    fontFamily: font.mono,
    fontSize: 12.5,
    color: cds.textPrimary,
    backgroundColor: cds.alpha1,
  },
  /** 行内公式：等宽 + 陶土色，避免裸反斜杠出现在正文里 */
  inlineMath: {
    fontFamily: font.mono,
    fontSize: 12.5,
    color: cds.brand,
  },
  heading: {
    fontFamily: font.serif,
    color: cds.textPrimary,
    letterSpacing: -0.2,
  },
  headingLg: {
    fontSize: 19,
    lineHeight: 26,
    fontWeight: '600',
    marginTop: gap.lg,
    marginBottom: gap.sm,
  },
  headingSm: {
    fontSize: 15,
    lineHeight: 21,
    marginTop: gap.sm,
    marginBottom: gap.xxs,
  },
  codeCard: {
    backgroundColor: cds.codeBg,
    borderRadius: radius.xl,
    paddingHorizontal: gap.md,
    paddingVertical: gap.sm,
    marginVertical: gap.sm,
  },
  codeLang: {
    fontFamily: font.mono,
    fontSize: 9,
    letterSpacing: 0.8,
    color: cds.codeMuted,
    marginBottom: gap.xs,
  },
  codeText: {
    fontFamily: font.mono,
    fontSize: 12,
    lineHeight: 20,
    color: cds.codeText,
  },
  jsonKey: {
    color: '#e0996f',
  },
  jsonString: {
    color: '#7fc4a8',
  },
  jsonPunct: {
    color: '#6f6f6a',
  },
  list: {
    marginBottom: gap.sm,
    gap: 6,
    paddingLeft: gap.xs,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: gap.sm,
  },
  bullet: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: cds.alpha4,
    marginTop: 9.5,
  },
  quote: {
    borderLeftWidth: 2,
    borderLeftColor: cds.clay,
    paddingLeft: gap.sm,
    marginVertical: gap.xs,
  },
  quoteText: {
    fontFamily: font.sans,
    ...text.bodySm,
    color: cds.textSecondary,
  },
});
