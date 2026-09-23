window.__ModuleLoader__.load({
  id: 'dsh-markdown-code-style',
  factory(require) {
    const css = `
/* =====================================================================
   Markdown 代码块 —— 整体视觉换肤（适配 dsh 0.1.7-alpha.2）。
   只使用稳定的公共钩子：全局类名 .md-code-block、头部属性
   [data-code-block-banner]、滚动区属性 [data-code-block-content]、
   换行开关属性 data-code-wrap；并用 :has(svg) 与 :not(:has(span))
   判别两代头部 DOM：
   - 消息路径（chat 提供 toolbarLabels）= 新 CodeToolbar 图标工具栏
     （heading > span.language + 换行开关 + 复制，均带 tooltip）
   - 工具卡等未提供 toolbarLabels 的路径 = 旧文本 banner（infostring +
     纯文本复制按钮）
   两代头部并存，规则分别精确命中、互不误伤。这些锚点由 scripts/check.js
   第 8 节自检，防重构误删。
   ===================================================================== */

/* ---- 卡片根节点：显式声明 border-radius 与 background-color，压过
        alpha.2 新增 .card 的同特异性竞争规则（0,2,0 与样式表顺序无关）；
        正文底色 bg-layer-2（浅色纯白/深色抬高一档）、细描边 + 阴影；
        圆角/头部色/字号通过组件自带自定义属性重定义 ---- */
.md-code-block.md-code-block {
  --dsl-code-block-border-radius: 14px;
  --dsl-code-block-background: var(--dsw-alias-bg-layer-2);
  --dsl-code-block-banner-background-color: var(--dsw-alias-bg-module-platform);
  --dsl-code-block-content-font: 400 calc(12px + var(--dsh-content-font-delta, 0px)) / calc(20px + var(--dsh-content-font-delta, 0px)) var(--ds-font-family-code);
  border: 1px solid var(--dsw-alias-border-l1);
  box-shadow: var(--dsw-shadow-lv1);
  border-radius: var(--dsl-code-block-border-radius);
  background-color: var(--dsl-code-block-background);
}

/* 紧凑（compact）次要 markdown 保留卡片边缘，但去掉阴影
   （与上条同特异性；两者在同一张样式表内且本条在后，顺序确定） */
[data-markdown-variant="compact"] .md-code-block {
  box-shadow: none;
}

/* ---- 吸顶头部包裹层（两代头部共用同一个 bannerWrap）：底色与头部
        一致，圆角按「外圆角减边框宽」嵌进 1px 描边内侧；
        position/top/z-index 保持组件自带 sticky 不动（原版功能，
        压缩区与 turn-rail 的层叠依赖它）---- */
.md-code-block > :has(> [data-code-block-banner]) {
  background-color: var(--dsl-code-block-banner-background-color);
  border-top-left-radius: calc(var(--dsl-code-block-border-radius) - 1px);
  border-top-right-radius: calc(var(--dsl-code-block-border-radius) - 1px);
}

/* ---- 头部行（命中两代：旧 banner div 与新 CodeToolbar 的 header）：
        必须显式给底色——alpha.2 的新 header 默认读
        --dsl-code-block-background（即正文色），不覆盖会与正文同色、
        头部层次消失；再加发丝分隔线与嵌套顶部圆角。
        （0,2,0 压过两代 hashed 头部规则的 0,1,0）---- */
.md-code-block [data-code-block-banner] {
  background-color: var(--dsl-code-block-banner-background-color);
  padding: 5px 8px 5px 16px;
  gap: 10px;
  border-bottom: 1px solid var(--dsw-alias-border-l1);
  border-top-left-radius: calc(var(--dsl-code-block-border-radius) - 1px);
  border-top-right-radius: calc(var(--dsl-code-block-border-radius) - 1px);
}

/* compact 变体保留更紧的头部内边距（0,3,0 同时压过上一条与
   两代内置头部规则，与样式表顺序无关） */
[data-markdown-variant="compact"] .md-code-block [data-code-block-banner] {
  padding: 4px 8px 4px 12px;
}

/* ---- 语言标签（两代分别精确命中，均为纯文字样式：
        无背景无内边距，旧路径无语言时保持不可见，新路径显示
        组件自己的 codeLabel 兜底）----
   旧 banner：infostring 是纯文本 div（无元素子级），
   :not(:has(span)) 只命中它，不会误伤新版 heading；
   新 toolbar：heading 下第一个 span 才是语言标签，
   :first-child 只打语言 span，不影响其后的 title span。 */
.md-code-block [data-code-block-banner] > :first-child:not(:has(span)) {
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--dsw-alias-label-secondary);
}
.md-code-block [data-code-block-banner] > :first-child > span:first-child {
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--dsw-alias-label-secondary);
}

/* ---- 头部按钮：两代共用胶囊基线（0,2,1 压过旧 copyButton 与新
        cardCss.action 的 0,1,0）---- */
.md-code-block [data-code-block-banner] button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  gap: 6px;
  padding: 3px 10px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 8px;
  background-color: transparent;
  color: var(--dsw-alias-label-secondary);
  font: 600 11px/16px var(--dsw-font-family);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}
/* 新 toolbar 图标按钮（内含 svg，Tooltip 用 cloneElement 不包壳，
   按钮仍是 banner 的后代）：方形紧凑胶囊 */
.md-code-block [data-code-block-banner] button:has(svg) {
  padding: 4px 7px;
  gap: 0;
}
/* 旧 banner 纯文本按钮：注入复制图标。必须排除带 svg 的新按钮——
   否则换行开关也长出复制图标、复制按钮变成双图标 */
.md-code-block [data-code-block-banner] button:not(:has(svg))::before {
  content: "";
  flex: none;
  width: 13px;
  height: 13px;
  background-color: currentColor;
  -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='8.5' y='8.5' width='13' height='13' rx='2.5'/%3E%3Cpath d='M5.5 15.5h-1a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1'/%3E%3C/svg%3E") no-repeat center / contain;
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='8.5' y='8.5' width='13' height='13' rx='2.5'/%3E%3Cpath d='M5.5 15.5h-1a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1'/%3E%3C/svg%3E") no-repeat center / contain;
}
.md-code-block [data-code-block-banner] button:hover {
  background-color: var(--dsw-alias-interactive-bg-hover);
  border-color: var(--dsw-alias-border-l3);
  color: var(--dsw-alias-label-primary);
}
.md-code-block [data-code-block-banner] button:active {
  background-color: var(--dsw-alias-interactive-bg-active);
}
.md-code-block [data-code-block-banner] button:focus-visible {
  outline: 2px solid var(--dsw-alias-button-info-fill);
  outline-offset: 1px;
}
/* 换行开关按下态：aria-pressed 只出现在换行按钮上；置于 hover/active
   之后——同特异性（0,3,1）靠本表内顺序胜出，悬停+按下同时成立时生效。
   底色把 active token 的透明度降到 60%——原值在浅色模式下偏深；降
   透明度后仍是同色系、仍比无态实、浅色下与悬停态同 alpha（不出现
   「选中比悬停更浅」的倒挂），color-mix 不支持时回退原 token */
.md-code-block [data-code-block-banner] button[aria-pressed='true'] {
  background-color: var(--dsw-alias-interactive-bg-active);
  background-color: color-mix(in srgb, var(--dsw-alias-interactive-bg-active) 60%, transparent);
  border-color: var(--dsw-alias-border-l3);
  color: var(--dsw-alias-label-primary);
}
[data-markdown-variant="compact"] .md-code-block [data-code-block-banner] button {
  padding: 2px 8px;
}
@media (prefers-reduced-motion: reduce) {
  .md-code-block [data-code-block-banner] button {
    transition: none;
  }
}

/* ---- 代码正文：默认跟随组件换行开关的换行态（alpha.2 默认开启换行）：
        pre-wrap + overflow-wrap:anywhere 优雅断行，取代原 break-all；
        关闭开关（根上 data-code-wrap=false）则横向滚动、保留列。
        padding/断行 0,1,1 压过两代 hashed pre 规则
        （.block :where(pre) 与 .card :where(pre) 均为 0,1,0），
        且与 .markdown pre（0,1,1）无任何同名属性，顺序无关 ---- */
.md-code-block pre {
  padding: 14px 16px 16px;
  white-space: pre-wrap;
  word-break: normal;
  overflow-wrap: anywhere;
  tab-size: 4;
  border-bottom-left-radius: calc(var(--dsl-code-block-border-radius) - 1px);
  border-bottom-right-radius: calc(var(--dsl-code-block-border-radius) - 1px);
}
/* 关闭换行：横向滚动（0,2,1 压过上游 .card[data-code-wrap='false']
   :where(pre) 的 0,2,0，不依赖上游规则是否存在） */
.md-code-block[data-code-wrap='false'] pre {
  white-space: pre;
  overflow-wrap: normal;
}

/* ---- 行号：CSS 计数器挂在高亮输出稳定的 .line 行结构上（流式与定格
        两臂一致）。默认换行后改用与组件自带编号同构的「块级行 + 绝对
        定位行号槽」方案：
        - :has(> .line) 判别——只对含行结构的围栏折叠行间 \n 文本节点
          （纯文本围栏是单个文本节点，绝不能碰它的换行，否则塌成一行）；
        - .line 块级化后行号 ::before 绝对定位 + padding 悬挂缩进，
          换行续行与代码列对齐（内联方案续行会缩到 0 列）；
        - 组件自带编号时（根上有 data-line-numbers）整体让位，无双层行号；
        - ::before 不进 textContent，复制源码干净；user-select:none
          不进手动选区。
        限制：纯文本围栏（无语言或不支持的语言）没有行结构，无法计数，
        不显示行号。 ---- */
.md-code-block:not([data-line-numbers]) pre > code:has(> .line) {
  display: block;
  white-space: normal;
  counter-reset: mdcs-line;
}
.md-code-block:not([data-line-numbers]) pre code > .line {
  counter-increment: mdcs-line;
  display: block;
  position: relative;
  min-height: 1lh;
  padding-inline-start: calc(3ch + 10px);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: normal;
}
/* 关闭换行时 .line 保持列对齐（0,4,2 压过上条 0,2,2） */
.md-code-block[data-code-wrap='false']:not([data-line-numbers]) pre code > .line {
  white-space: pre;
  overflow-wrap: normal;
}
.md-code-block:not([data-line-numbers]) pre code > .line::before {
  content: counter(mdcs-line);
  position: absolute;
  inset-inline-start: 0;
  width: 3ch;
  text-align: right;
  color: var(--dsw-alias-label-tertiary);
  user-select: none;
  -webkit-user-select: none;
}

/* ---- 代码区强调色选区（color-mix 前先给 token 兜底）---- */
.md-code-block pre::selection,
.md-code-block pre *::selection {
  background-color: var(--dsw-alias-markdown-code-segment-selected);
  background-color: color-mix(in srgb, var(--dsw-alias-button-info-fill) 26%, transparent);
}

/* ---- 正文与「消费方把稳定 content 节点当滚动区」场景的
        细滚动条（主题化配色）---- */
.md-code-block pre::-webkit-scrollbar,
.md-code-block [data-code-block-content]::-webkit-scrollbar {
  height: 10px;
  width: 10px;
}
.md-code-block pre::-webkit-scrollbar-track,
.md-code-block [data-code-block-content]::-webkit-scrollbar-track {
  background: transparent;
}
.md-code-block pre::-webkit-scrollbar-thumb,
.md-code-block [data-code-block-content]::-webkit-scrollbar-thumb {
  background-color: var(--dsw-alias-scrollbar-bg-l1);
  background-clip: padding-box;
  border: 2.5px solid transparent;
  border-radius: 999px;
}
.md-code-block pre::-webkit-scrollbar-thumb:hover,
.md-code-block [data-code-block-content]::-webkit-scrollbar-thumb:hover {
  background-color: var(--dsw-alias-scrollbar-hover-l1);
}
.md-code-block pre::-webkit-scrollbar-corner,
.md-code-block [data-code-block-content]::-webkit-scrollbar-corner {
  background: transparent;
}
`;
    return {
      apply(ctx) {
        ctx.effect(() => {
          const style = document.createElement('style');
          style.id = 'dsh-markdown-code-style';
          style.textContent = css;
          document.head.appendChild(style);
          return () => {
            style.remove();
          };
        }, 'markdown-code-style: 代码块样式表');
      },
    };
  },
});
