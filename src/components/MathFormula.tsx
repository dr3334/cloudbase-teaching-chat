import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { cds, gap, radius } from '../cds/tokens';

const KATEX_VERSION = '0.16.11';

function buildHtml(latex: string) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@${KATEX_VERSION}/dist/katex.min.css" />
<script src="https://cdn.jsdelivr.net/npm/katex@${KATEX_VERSION}/dist/katex.min.js"></script>
<style>
  html, body { margin: 0; padding: 0; background: ${cds.surface1}; }
  body {
    display: flex; align-items: center; justify-content: center;
    padding: 14px 10px; box-sizing: border-box;
    -webkit-text-size-adjust: 100%;
  }
  #math { width: 100%; text-align: center; overflow-x: auto; overflow-y: hidden; }
  .katex { color: ${cds.textPrimary}; font-size: 1.02em; }
  #fallback { font-family: monospace; font-size: 12px; color: ${cds.textMuted}; word-break: break-all; }
</style>
</head>
<body>
<div id="math"></div>
<script>
  (function () {
    var el = document.getElementById('math');
    var latex = ${JSON.stringify(latex)};
    function report() {
      var h = Math.ceil(document.body.getBoundingClientRect().height);
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'height', value: h }));
      }
    }
    function fallback(msg) {
      el.innerHTML = '<div id="fallback">' + msg + '</div>';
      report();
    }
    if (typeof katex === 'undefined') {
      fallback(latex);
      return;
    }
    try {
      katex.render(latex, el, { displayMode: true, throwOnError: false, strict: 'ignore' });
      setTimeout(report, 60);
      setTimeout(report, 320);
      setTimeout(report, 900);
    } catch (e) {
      fallback(latex);
    }
  })();
</script>
</body>
</html>`;
}

export function MathFormula({ latex }: { latex: string }) {
  const [height, setHeight] = useState(64);

  return (
    <View style={[styles.card, { height }]}>
      <WebView
        source={{ html: buildHtml(latex.trim()) }}
        style={styles.web}
        containerStyle={styles.web}
        originWhitelist={['*']}
        scrollEnabled={false}
        javaScriptEnabled
        domStorageEnabled={false}
        setSupportMultipleWindows={false}
        androidLayerType="software"
        onMessage={(event) => {
          try {
            const payload = JSON.parse(event.nativeEvent.data) as { type?: string; value?: number };
            if (payload.type === 'height' && payload.value && payload.value > 0) {
              setHeight(Math.min(360, Math.max(48, payload.value)));
            }
          } catch {
            // 忽略非 JSON 消息
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: cds.surface1,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: cds.border,
    overflow: 'hidden',
    marginVertical: gap.sm,
  },
  web: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
