# DeepSeek Harness Markdown Code Style

**中文** | [English](./README.en.md)

[![npm version](https://img.shields.io/npm/v/dsh-markdown-code-style.svg)](https://www.npmjs.com/package/dsh-markdown-code-style)

为 DeepSeek Harness（dsh）会话消息中 markdown 围栏代码块重新设计样式的
**插件**。它不重写渲染组件，而是通过组件文档化的公共钩子整体换肤，因此除样式
之外的原有行为全部保留：

- **语法高亮** —— shiki 的词法配色与明暗主题原样不动。
- **复制与换行按钮** —— 剪贴板逻辑与「已复制」文案不变；按钮统一为胶囊
  样式：新头部用组件自带的 SVG 图标与 tooltip，旧头部的纯文本按钮注入
  复制图标。行号由伪元素生成，不进 `textContent`，复制出来的源码没有
  行号。
- **流式渲染** —— 围栏的增量高亮不受影响。
- **换行开关（0.1.7-alpha.2 新增）** —— 头部换行/保留列按钮的状态与行为
  完全交给组件（含 `aria-pressed` 与 tooltip），样式只给按下态反馈；关闭
  换行时横向滚动，行号列保持对齐。
- **两代头部都覆盖** —— 消息里是新 `CodeToolbar`（语言标签 + 换行 +
  复制）；工具卡等未提供 `toolbarLabels` 的路径仍是旧文本 banner。两套
  DOM 各有精确选择器，互不误伤。
- **吸顶头部** —— `position/sticky`、`top`、`z-index` 均不动（原版功能），
  压缩区与 turn-rail 的层叠关系保持正常。
- **滚动区消费方** —— 使用 `[data-code-block-content]` 的消费方（压缩区、
  系统提示词预览等）保持自己的布局，只共享滚动条外观。

## 改了什么

- 卡片外观：14px 圆角、1px 主题化描边、柔和阴影（compact markdown 变体
  不加阴影）；正文档面用更浅的 `bg-layer-2`（浅色模式纯白、深色模式抬高
  一档），描边与分隔线用最浅的 `border-l1`，整体更轻。
- 头部：独立底色 + 发丝分隔线、大写字距的语言标签、更紧凑的节奏，圆角
  嵌进描边内侧；吸顶行为保持原版不变。
- 正文：12px/20px 且跟随正文字号偏好的代码字体（原为固定 11px）、默认
  换行并以 `overflow-wrap: anywhere` 优雅断行（取代 `word-break:
  break-all`），关闭头部换行开关则横向滚动且列对齐不乱、`tab-size: 4`、
  代码区强调色选区、细滚动条（主题化配色）。
- 行号：CSS 计数器挂在高亮输出稳定的 `.line` 行结构上，采用与组件自带
  编号同构的「块级行 + 绝对定位行号槽」（流式与定格两臂一致；换行时
  续行悬挂缩进、与代码列对齐；组件自带的 `lineNumbers` 在 markdown 路径
  不开启，用 `data-line-numbers` 属性让位避免双层行号）。限制：纯文本
  围栏（无语言或不支持的语言）在组件内部是单个文本节点、没有行结构，
  无法计数，这类围栏不显示行号。

> **兼容性**：以上样式适配 dsh **0.1.7-alpha.2** —— 该版本将代码卡头部
> 改为 `CodeToolbar`（图标 + tooltip）并新增换行开关；消息路径与旧文本
> 头部路径各有独立选择器，两代结构互不误伤。

所有样式都取自主题 token，因此明暗主题均适配。

## 安装

需要先安装 dsh（已安装可跳过）：

```sh
npm install -g @deepseek-ai/dsh@latest
```

安装本插件（`web` 换成你的配置名，本机已有配置可用 `ls ~/.dsh/profiles`
查看；常见有 `web`、`tui`）：

```sh
dsh plugin --profile web add dsh-markdown-code-style
```

安装完成后**刷新 Harness 页面**即可生效。

## 更新

更新本插件到新版本：

```sh
dsh plugin --profile web update dsh-markdown-code-style
# 或强制拉取最新版本
dsh plugin --profile web add dsh-markdown-code-style@latest
```

更新 dsh 本体：

```sh
npm install -g @deepseek-ai/dsh@latest
```

更新完成后同样刷新页面。

## 发布到 npm（维护者）

1. 修改 `package.json` 的 `version`（遵循语义化版本）。
2. 执行发布（`prepublishOnly` 会自动运行 `scripts/check.js` 发布前校验，
   校验不通过将中止发布）：

```sh
npm run check        # 手动校验（可选）
npm publish          # 发布到 .npmrc 当前配置的 registry
# 如需发布到公共 npm：
npm publish --registry https://registry.npmjs.org
```

发布内容由 `package.json` 的 `files` 白名单控制（`scripts/` 等开发文件
不会进入发布包）。

## 实现原理

这是一个 dsh 插件包，由两部分组成：

- **Host 半部**（`index.js`）：空实现，真正的工作在浏览器侧。
- **Client 半部**（`client.js`）：声明浏览器模块，通过 `ctx.effect` 挂载
  一个 `<style>` 元素，插件卸载时自动移除。

`package.json` 中的 `dsh.bundle.patch`（指向 `cordis.patch.yml`）向 dsh 的
Loader 声明一行插件条目——这就是文档里 "bundle" 机制的全部含义，属于插件
包的声明方式，使用插件时无需关心。`dsh.client` 则声明浏览器侧模块的加载
时机与依赖。

### 显示文案的来源（维护者须知）

插件卡的标题与描述来自 `locale/<语言>.json` 里的 `meta.title` /
`meta.description`（dsh 实测只读这里，`locale/en.json` 兼作英文兜底与目录
定位）。**不要往 `package.json` 加 `meta` 块——dsh 不读取它**：顶层 `name` /
`description` 仅在 locale 缺字段时兜底，其中 `description` 另兼 npm 搜索
摘要。改动文案后运行 `npm run check`，会连同 locale 字段、exports/files
解析路径一起校验。
