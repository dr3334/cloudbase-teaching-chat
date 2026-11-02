# CloudBase 教学助手 · 移动端

把云开发讲明白的 AI 聊天 App，基于 React Native + Expo 构建。两种入口：

- **演示模式**：脚本驱动的完整推理链，包含思考过程、工具调用卡片和 token 计量，不联网、不消耗额度，用于讲解产品形态。
- **真实对话**：直连任意 OpenAI 兼容的 `/chat/completions` 接口，流式返回，支持 Markdown、代码块与 LaTeX 渲染。

## 功能

- 流式输出 + 呼吸光标，首字等待有跳动动效与实时计时
- 回答底部显示「首字 x.xs · 平均 xx tok/s」，速率由消息增量估算
- 顶栏实时 token 计量（输入 / 输出分色）与请求阶段（思考 / 调用工具 / 生成中）
- 多会话：右滑拉出会话抽屉（消息区任意位置都可以），新建、切换、删除历史对话，记录存在设备本地，重启不丢
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
    useDrawerGesture.ts  抽屉手势（内容区右滑 / 抽屉内左滑）
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

| 依赖 | 要求 | 说明 |
| --- | --- | --- |
| Node.js | 20+ | |
| JDK | **17** | 21 会让 Expo 的 Gradle 插件找不到 `languageVersion=17` 的 toolchain，并尝试联网下载（国内通常超时） |
| Android SDK | platform 37 / build-tools 37 | 工程为 compileSdk 37、minSdk 24 |
| adb | 随 SDK | 真机调试与安装 |

构建前把路径配好（Windows PowerShell 示例）：

```powershell
$env:JAVA_HOME    = "D:\jdk17\jdk-17.0.20.1+1"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:Path         = "$env:JAVA_HOME\bin;$env:Path"
```

> `android/` 是 `expo prebuild` 的生成产物，没有纳入版本库；克隆仓库后第一次构建会自动生成再编译。

## 快速开始（开发调试）

项目包含原生模块（AsyncStorage、WebView、Video、Clipboard），**不能用 Expo Go 打开**，需要 dev client，也就是 `expo run:android` 打出来的 debug 包。

```bash
# 1. 安装依赖
npm install

# 2. 首次：生成 android/ 并编译安装（详见下一节的「Debug 包」）
npx expo run:android

# 3. 日常：只改了 JS 时
npx expo start                  # 启动 Metro（8081）
adb reverse tcp:8081 tcp:8081   # 真机走 USB 时必须，让设备能连到本机 Metro
```

装好 App 后打开即可，改 JS 会热更新；改动原生依赖（新增 native module、改 AndroidManifest）才需要重新执行 `npx expo run:android`。

> Windows 上如果 `npm install` 报 `[safe-delete] ... trash operation`，是 Metro 正占用 `node_modules`：先结束监听 8081 的进程再装。

## 构建安装包

### Debug 包（带 Metro，开发用）

```bash
npx expo run:android
```

这一步会依次完成：生成 `android/` → Gradle 编译 → 安装到已连接的设备 → 启动 Metro。

- 产物：`android/app/build/outputs/apk/debug/app-debug.apk`
- 使用默认 debug keystore 签名，可直接 `adb install -r` 给其它设备装
- 装到新设备后仍需 `adb reverse tcp:8081 tcp:8081`（或改连同一局域网的 Metro）才能加载 JS

只想要 APK 不安装，可以走 Gradle：

```bash
npx expo prebuild --platform android      # 首次或改了 app.json 配置后
cd android
./gradlew assembleDebug                   # Windows: gradlew.bat assembleDebug
```

### Release 包（独立运行，可分发）

Release 会把 JS bundle 打进 APK，不依赖 Metro。

**第一步，生成签名文件**（keystore 不要提交到仓库）：

```bash
keytool -genkeypair -v -storetype PKCS12 \
  -keystore release.keystore -alias mobile \
  -keyalg RSA -keysize 2048 -validity 10000
```

**第二步，在 `android/app/build.gradle` 里挂上签名**（`android/` 是生成的，`prebuild --clean` 后需要重加，建议用 `expo-build-properties` 或 EAS 管理）：

```gradle
android {
    signingConfigs {
        release {
            storeFile file("../../release.keystore")
            storePassword System.getenv("MOBILE_STORE_PASSWORD")
            keyAlias "mobile"
            keyPassword System.getenv("MOBILE_KEY_PASSWORD")
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

**第三步，打包**：

```bash
cd android
./gradlew assembleRelease     # Windows: gradlew.bat assembleRelease
```

- 产物：`android/app/build/outputs/apk/release/app-release.apk`
- 安装：`adb install -r android/app/build/outputs/apk/release/app-release.apk`

### EAS 云端构建（可选，不想本地装 SDK 时）

```bash
npm i -g eas-cli
eas login
eas build -p android --profile preview
```

需要先在 `eas.json` 里定义 build profile；EAS 会托管签名并直接产出可安装的 APK/AAB。

## 常见构建问题

| 现象 | 原因与处理 |
| --- | --- |
| `Cannot find a Java installation ... languageVersion=17` | `JAVA_HOME` 指向了 JDK 21，改成 JDK 17 后重跑 |
| `[safe-delete] ... trash operation` 装依赖失败 | Metro 占用了 `node_modules`，先停掉 8081 上的 node 进程 |
| `:app:compressDebugAssets` 临时文件被占用 | Windows 文件锁，直接重跑一次通常就好 |
| 设备上白屏、一直 `Loading from localhost:8081` | Metro 没起或没做 `adb reverse`，见「快速开始」第 3 步 |
| 改完原生依赖 App 起不来 | 需要重建原生包：`npx expo run:android` |

## 配置真实模型

进入「真实对话」后右上角「设置」，填写：

- **Base URL**：如 `https://api-inference.modelscope.cn/v1`（末尾不带斜杠）
- **API Key**
- **Model**：如 `Qwen/Qwen3.8-Flash-Next`

保存即生效。密钥只保存在本机，不写入仓库。

## 说明

- 演示模式完全离线，回答由 `src/mock/demoScript.ts` 驱动。
- 真实对话的 token 数为本地按字符估算（中文 1 字 ≈ 0.7，英文 4 字符 ≈ 1），非服务端返回的精确值。
- 「首字 / 平均速率」是运行期统计，不随会话持久化，重启后旧消息不再显示该行。
- 抽屉手势：在消息区**任意位置**横向右滑即可拉出，不要求贴边。最左侧 16~20dp 归 Android 手势导航的「返回」，从那里起滑会被系统截走，所以左缘另有一条 10~90dp 的热区做兜底。抽屉打开后可左滑关闭，右上角菜单按钮同样能打开。

## License

MIT
