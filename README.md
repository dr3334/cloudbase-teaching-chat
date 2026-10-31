# CloudBase 教学助手 · 移动端

把云开发讲明白的 AI 聊天 App，基于 React Native + Expo 构建。两种入口：

- **演示模式**：脚本驱动的完整推理链，包含思考过程、工具调用卡片和 token 计量，不联网、不消耗额度，用于讲解产品形态。
- **真实对话**：直连任意 OpenAI 兼容的 `/chat/completions` 接口，流式返回，支持 Markdown、代码块与 LaTeX 渲染。

## 功能

- 流式输出 + 呼吸光标，首字等待有跳动动效与实时计时
- 回答底部显示「首字 x.xs · 平均 xx tok/s」，速率由消息增量估算
- 顶栏实时 token 计量（输入 / 输出分色）与请求阶段（思考 / 调用工具 / 生成中）
- 多会话：左侧抽屉新建、切换、删除历史对话，记录存在设备本地，重启不丢
- 消息支持复制、编辑重发（形成分支）、重新生成、分支切换
- 设计 token 统一在 `src/cds`，配色与排版集中在 `tokens.ts` / `motion.ts`

## 技术栈

| 领域 | 选型 |
| --- | --- |
| 框架 | Expo SDK 58 · React Native 0.88 · React 19 |
| 语言 | TypeScript |
| 聊天状态 | `@assistant-ui/react-native`（线程、分支、编辑、重试） |
| 本地存储 | `@react-native-async-storage/async-storage` |
| 富文本 | `react-native-webview`（LaTeX）· `react-native-svg` |
| 其他 | `expo-clipboard` · `expo-video` |

## 目录结构

```
App.tsx                  入口与三种模式（entry / demo / live）切换
index.ts                 RN 注册入口
src/
  cds/                   设计 token（tokens / motion）
  chat/                  真实对话运行时
    modelAdapter.ts      OpenAI 兼容接口的流式适配器（XHR + SSE）
    useLiveRuntime.ts    多会话运行时装配
    threadStorage.ts     会话持久化（AsyncStorage）
    titleFromMessages.ts 用首句生成会话标题
    ThreadDrawer.tsx     左侧会话抽屉
    ChatParts.tsx        消息 / 操作栏 / 首字等待动效
    ComposerBar.tsx      输入区
    useThreadStats.ts    顶栏 token 计量
    useTurnMetrics.ts    首字延迟与平均速率
  components/            演示模式的展示组件与通用 UI
  screens/               入口页、演示对话页、真实对话页、模型设置页
  mock/                  演示脚本数据
  services/              接口调用与 token 估算
  config/                模型配置读写
  hooks/                 演示会话状态机
```

## 环境要求

- Node.js 20+
- Android SDK + adb（本项目只在 Android 上验证过）
- **JDK 17**：如果 `JAVA_HOME` 指向 JDK 21，Gradle 会因为找不到 17 的 toolchain 而失败（并尝试联网下载，国内通常超时）。构建前先指定：

```powershell
$env:JAVA_HOME = "C:\path\to\jdk-17"
```

## 启动方式

项目包含原生模块（AsyncStorage、WebView、Video、Clipboard），**不能用 Expo Go 直接打开**，需要 dev client（即 `expo run:android` 打出来的 debug 包）。

### 1. 安装依赖

```bash
npm install
```

> Windows 上如果 `npm install` 报 `[safe-delete] ... trash operation` 失败，是因为 Metro 正在占用 `node_modules`：先结束监听 8081 的进程再装。

### 2. 首次运行 / 改动了原生依赖后：构建并安装

```bash
npx expo run:android
```

首次编译较慢。如果卡在 `:app:compressDebugAssets` 报临时文件被占用，直接重跑一次即可。

> `android/` 属于 `expo prebuild` 的生成产物，没有纳入版本库；克隆后第一次执行上面的命令会自动生成再编译。

### 3. 日常开发

```bash
npx expo start          # 启动 Metro（8081）
adb reverse tcp:8081 tcp:8081   # 真机走 USB 时必须，让设备能连到本机 Metro
```

然后在已安装的 App 里打开即可，改 JS 会热更新。

想重新出包（如只改了 JS 却想换设备安装），也可以直接 `npm run android`。

### 4. 配置真实模型

进入「真实对话」后右上角「设置」，填写：

- **Base URL**：如 `https://api-inference.modelscope.cn/v1`（末尾不带斜杠）
- **API Key**
- **Model**：如 `Qwen/Qwen3.8-Flash-Next`

保存即生效。密钥只保存在本机，不写入仓库。

## 说明

- 展示模式完全离线，回答由 `src/mock/demoScript.ts` 驱动。
- 真实对话的 token 数为本地按字符估算（中文 1 字 ≈ 0.7，英文 4 字符 ≈ 1），非服务端返回的精确值。
- 「首字 / 平均速率」是运行期统计，不随会话持久化，重启后旧消息不再显示该行。

## License

MIT
