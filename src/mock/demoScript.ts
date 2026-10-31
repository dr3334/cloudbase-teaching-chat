import type { DemoEvent } from '../types';

export const suggestedPrompts = [
  '云开发数据库的权限怎么配？顺便看下 order 集合的结构',
  '解一道导数压轴题，最后一问要证不等式',
  '用公式讲讲余弦相似度，并放一段渲染动画',
  '怎么把当前项目部署到静态托管？',
  '云函数执行超时了该怎么排查？',
];

const permissionAnswer = [
  '## 结论：走「安全规则」，别停在基础权限',
  '',
  '**① 基础权限**（控制台预设，四种模式）',
  '- 所有用户可读，仅创建者可写',
  '- 仅创建者可读写',
  '- 所有用户可读，仅管理端可写',
  '- 所有用户不可读写',
  '',
  '**② 自定义安全规则**（推荐，粒度更细）',
  '',
  '路径：控制台 → 数据库 → 集合 → 权限设置 → 自定义安全规则。',
  '',
  '```json',
  '{',
  '  "read": "doc._openid == auth.openid",',
  '  "write": "doc._openid == auth.openid"',
  '}',
  '```',
  '',
  '刚读到的 `orders` 集合含 `_openid`、`status` 字段，建议把写入再收紧一档：',
  '',
  '```json',
  '{',
  '  "read": "doc._openid == auth.openid",',
  '  "write": "doc._openid == auth.openid && doc.status == \'pending\'"',
  '}',
  '```',
  '',
  '> 未登录时 `auth.openid` 为空，规则会拒绝全部读写，这是最常见的踩坑点。',
].join('\n');

const cosineAnswer = [
  '## 余弦相似度',
  '',
  '衡量两个向量方向的一致程度，取值 [-1, 1]：',
  '',
  '```latex',
  '\\cos(\\theta)=\\frac{A\\cdot B}{\\lVert A\\rVert\\,\\lVert B\\rVert}=\\frac{\\sum_{i=1}^{n}A_iB_i}{\\sqrt{\\sum_{i=1}^{n}A_i^2}\\,\\sqrt{\\sum_{i=1}^{n}B_i^2}}',
  '```',
  '',
  '检索场景里，query 与文档各自编码成向量后算这个值，越接近 1 越相似。它只看方向、不看长度，所以长文档不会因为词多而占便宜。',
  '',
  '**几何解释**：两个向量画在同一平面，夹角越小越相似。渲染好的版本：',
  '',
  '```video',
  'https://media.w3.org/2010/05/sintel/trailer.mp4',
  '```',
  '',
  '> 上面是两条不同的渲染链路：公式由 KaTeX 在 WebView 内排版，视频由 expo-video 原生解码播放。',
].join('\n');

const gaokaoAnswer = [
  '## 题目',
  '',
  '已知函数 `f(x) = eˣ − ax − 1`（a ∈ R）。',
  '',
  '1. 讨论 f(x) 的单调性；',
  '2. 若 `f(x) ≥ 0` 对任意 x ∈ R 恒成立，求 a 的值；',
  '3. 当 a = 1 时，证明：对任意 x > 0，`eˣ − x − 1 > x²/2 − x³/6`。',
  '',
  '## 第 (1) 问：单调性',
  '',
  '求导得 `f\'(x) = eˣ − a`，按 a 的符号分类：',
  '',
  '- **a ≤ 0**：`f\'(x) > 0` 恒成立，f(x) 在 R 上单调递增',
  '- **a > 0**：令 `f\'(x) = 0` 得 `x = ln a`，在 (−∞, ln a) 上递减，在 (ln a, +∞) 上递增',
  '',
  '## 第 (2) 问：恒成立求 a',
  '',
  'a > 0 时最小值在 `x = ln a` 处取得，代入得',
  '',
  '```latex',
  'f(\\ln a)=a-a\\ln a-1',
  '```',
  '',
  '记 `g(a) = a − a ln a − 1`，则 `g\'(a) = −ln a`，故 g 在 (0, 1) 递增、(1, +∞) 递减，最大值为 `g(1) = 0`。',
  '',
  '恒成立要求 `g(a) ≥ 0`，而 g 的最大值恰为 0，只能 `g(a) = 0`，即 **a = 1**。',
  '',
  'a ≤ 0 时 f 递增且 `f(0) = 0`，故 x < 0 时 `f(x) < 0`，不合题意。综上 a = 1。',
  '',
  '## 第 (3) 问：证明不等式',
  '',
  'a = 1 时结论即证 `eˣ − x − 1 − x²/2 + x³/6 > 0`。构造辅助函数',
  '',
  '```latex',
  'h(x)=e^{x}-x-1-\\frac{x^{2}}{2}+\\frac{x^{3}}{6}\\quad(x\\ge 0)',
  '```',
  '',
  '则 `h(0) = 0`，逐阶求导：',
  '',
  '- `h\'(x) = eˣ − 1 − x + x²/2`，`h\'(0) = 0`',
  '- `h\'\'(x) = eˣ − 1 + x`，`h\'\'(0) = 0`',
  '- `h\'\'\'(x) = eˣ + 1 > 0`',
  '',
  '由 `h\'\'\' > 0` 知 h″ 在 [0, +∞) 递增；x > 0 时 `h″(x) > h″(0) = 0`，于是 h′ 递增，`h\'(x) > 0`，于是 h 递增，`h(x) > h(0) = 0`。',
  '',
  '故原不等式对任意 x > 0 成立，等号只在 x = 0 处取得。',
  '',
  '> 评分要点：第 (1) 问必须写出 a ≤ 0 与 a > 0 两种情形；第 (2) 问要说明 g(a) 的最大值为 0 才能反推 a = 1；第 (3) 问三次求导缺一档会扣分。',
].join('\n');

function buildGaokaoDemo(): DemoEvent[] {
  return [
    {
      type: 'thinking',
      text:
        '这是一道三问结构的导数压轴：先讨论单调性，再用极值点效应求参数，最后一问要证含 eˣ 与三次多项式的不等式。第三问的关键是构造辅助函数之后逐阶求导，注意等号只在端点取得。',
      tokens: 58,
    },
    {
      type: 'tool',
      tool: {
        name: 'searchKnowledgeBase',
        server: 'cloudbase',
        args: { query: '高考 导数 压轴 恒成立 构造法 评分标准' },
        summary: '检索压轴题评分标准',
      },
      durationMs: 900,
      result:
        '命中 2 条：\n1. 导数压轴题分步给分细则（单调性 4 分 / 参数 5 分 / 证明 5 分）\n2. 恒成立问题：极值点效应与端点效应辨析',
      tokens: 96,
    },
    {
      type: 'thinking',
      text:
        '评分细则要求分类讨论写全，漏掉 a ≤ 0 会直接扣分。第三问把不等式移项构造成 h(x)，h(0) = 0，连续求导三次即可定号，比引用泰勒展开的余项更严密，也更好写。',
      tokens: 52,
    },
    {
      type: 'answer',
      text: gaokaoAnswer,
      tokens: 560,
    },
  ];
}

function buildPermissionDemo(): DemoEvent[] {
  return [
    {
      type: 'thinking',
      text:
        '用户问的是数据库权限配置，还要求查看实际集合结构。先确认登录态与环境 ID，再检索知识库拿到权威说明，最后读一下集合的真实结构，这样给出的规则才能直接可用。',
      tokens: 52,
    },
    {
      type: 'tool',
      tool: {
        name: 'auth',
        server: 'cloudbase',
        args: { action: 'status' },
        summary: '确认登录态与环境',
      },
      durationMs: 420,
      result: '已登录 · envId: demo-3g8k2x · 地域: ap-shanghai · 环境状态: 正常',
      tokens: 41,
    },
    {
      type: 'tool',
      tool: {
        name: 'searchKnowledgeBase',
        server: 'cloudbase',
        args: { query: '数据库权限 安全规则 read write' },
        summary: '检索权限相关文档',
      },
      durationMs: 1180,
      result:
        '命中 3 篇文档：\n1. 数据库权限模式（基础权限 / 安全规则）\n2. 安全规则语法与表达式参考\n3. 常见权限配置错误排查',
      tokens: 163,
    },
    {
      type: 'thinking',
      text:
        '文档确认了基础权限只有四种预设，更细的控制必须写安全规则。教学场景下先讲清两种方式的差别，再给出可直接粘贴的规则。接下来读集合结构，确认字段名与索引情况。',
      tokens: 68,
    },
    {
      type: 'tool',
      tool: {
        name: 'readNoSqlDatabaseStructure',
        server: 'cloudbase',
        args: { collection: 'orders' },
        summary: '读取集合字段与索引',
      },
      durationMs: 390,
      result: '字段: _id, _openid, amount, status, createdAt\n索引: _openid + createdAt（复合）\n文档数: 1,284',
      tokens: 92,
    },
    {
      type: 'thinking',
      text:
        '集合里有 _openid，说明是用户维度的数据，规则可以用 doc._openid == auth.openid 限定为「只能读写自己的订单」；再加上 status 条件，避免用户篡改已完成订单。',
      tokens: 47,
    },
    {
      type: 'answer',
      text: permissionAnswer,
      tokens: 438,
    },
  ];
}

function buildMultimodalDemo(): DemoEvent[] {
  return [
    {
      type: 'thinking',
      text:
        '这个问题适合先给定义式，再补几何直觉。公式用块级排版让分式完整展开，动画部分直接挂一段渲染产物，验证视频解码链路。',
      tokens: 41,
    },
    {
      type: 'tool',
      tool: {
        name: 'searchKnowledgeBase',
        server: 'cloudbase',
        args: { query: '余弦相似度 向量检索 归一化' },
        summary: '检索向量检索说明',
      },
      durationMs: 860,
      result: '命中 2 篇文档：\n1. 向量检索与相似度度量\n2. 归一化对排序结果的影响',
      tokens: 88,
    },
    {
      type: 'thinking',
      text:
        '文档里强调「只看方向不看长度」，这一点需要在正文里点出来，否则学生容易把点积和余弦混为一谈。',
      tokens: 36,
    },
    {
      type: 'answer',
      text: cosineAnswer,
      tokens: 316,
    },
  ];
}

export function buildDemo(prompt: string): DemoEvent[] {
  if (/压轴|高考|导数|不等式/.test(prompt)) {
    return buildGaokaoDemo();
  }
  if (/余弦|公式|视频|相似度|动画/.test(prompt)) {
    return buildMultimodalDemo();
  }
  return buildPermissionDemo();
}
