/**
 * 发布前校验：`npm publish` 经 prepublishOnly 自动执行，也可手动 `npm run check`。
 * 校验项：JSON 清单合法、JS 语法、包名在 client 模块 id 与 Loader 补丁行中
 * 一致、exports/icon/dsh.client 关键字段齐全、未误加 private、license 字段与
 * LICENSE 文件、展示文案读取链（locale meta → exports/files 解析路径，
 * 无 package.json.meta 死字段）以及 CSS 钩子/两代头部判别器自检。
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const errors = [];
const read = (p) => readFileSync(join(root, p), 'utf8');
const ok = (msg) => console.log(`✓ ${msg}`);
const bad = (msg) => errors.push(msg);

// 1. JSON 清单合法
let pkg = {};
for (const file of ['package.json', 'locale/en.json', 'locale/zh.json']) {
  try {
    JSON.parse(read(file));
    ok(`${file} JSON 合法`);
  } catch (e) {
    bad(`${file} JSON 解析失败：${e.message}`);
  }
}
try {
  pkg = JSON.parse(read('package.json'));
} catch {
  /* 上面已报错 */
}

// 2. private 会直接阻止 npm publish
if (pkg.private) bad('package.json 仍为 "private": true，无法发布到 npm');
else ok('未设置 private，可发布');

// 3. JS 语法
for (const file of ['index.js', 'client.js']) {
  const r = spawnSync(process.execPath, ['--check', join(root, file)], { encoding: 'utf8' });
  if (r.status === 0) ok(`${file} 语法合法`);
  else bad(`${file} 语法错误：${(r.stderr || '').trim()}`);
}

// 4. 包名一致性：client 模块 id、Loader 补丁行必须与 package.json name 相同
if (pkg.name) {
  if (read('client.js').includes(`id: '${pkg.name}'`)) ok(`client.js 模块 id = ${pkg.name}`);
  else bad(`client.js 模块 id 与包名 ${pkg.name} 不一致`);

  const patchRel = pkg.dsh?.bundle?.patch;
  if (!patchRel) {
    bad('package.json 缺少 dsh.bundle.patch');
  } else if (!existsSync(join(root, patchRel))) {
    bad(`补丁文件 ${patchRel} 不存在`);
  } else if (read(patchRel.replace(/^\.\//, '')).includes(`name: '${pkg.name}'`)) {
    ok(`补丁行 name = ${pkg.name}`);
  } else {
    bad(`cordis.patch.yml 补丁行 name 与包名 ${pkg.name} 不一致`);
  }
}

// 5. 清单关键字段
if (!pkg.exports || pkg.exports['.'] !== './index.js' || pkg.exports['./client'] !== './client.js') {
  bad('exports 必须包含 . -> ./index.js 与 ./client -> ./client.js');
} else {
  ok('exports 指向 Host/Client 两个入口');
}
if (!pkg.icon || !existsSync(join(root, pkg.icon))) bad('icon 缺失或文件不存在');
else ok(`icon ${pkg.icon} 存在`);
if (!pkg.dsh?.client || pkg.dsh.client.platform !== 'web') bad('dsh.client.platform 必须为 web');
else ok('dsh.client 配置正确');
if (!pkg.files || !pkg.files.includes('cordis.patch.yml')) bad('files 白名单缺少 cordis.patch.yml');
else ok('files 白名单包含补丁文件');
if (!pkg.files || !pkg.files.includes('README.md') || !pkg.files.includes('README.en.md')) {
  bad('files 白名单缺少 README.md / README.en.md（对应语言的 README 将不进发布包）');
} else {
  ok('files 白名单包含中英 README');
}

// 6. 展示文案读取链（对应 dsh 的 readPluginMeta，已实测 0.1.7-alpha.1）：
//    文案唯一来源 = locale/<lang>.json 的 meta.title / meta.description；
//    package.json 顶层 name/description 仅兜底（description 另兼 npm 摘要）；
//    package.json 的 meta 块不被任何 dsh 代码读取，勿双处维护。
const before6 = errors.length;
const LANGUAGE_ID = /^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{1,8})*$/u;
try {
  const jsons = readdirSync(join(root, 'locale')).filter((n) => n.endsWith('.json'));
  if (!jsons.includes('en.json')) {
    bad('locale/en.json 缺失——dsh 以它定位文案目录，缺失将丢失全部本地化文案');
  }
  for (const name of jsons) {
    if (!LANGUAGE_ID.test(name.slice(0, -5))) {
      bad(`locale/${name} 文件名不是合法语言 id（dsh 会整体读取失败）`);
      continue;
    }
    const meta = JSON.parse(readFileSync(join(root, 'locale', name), 'utf8')).meta;
    if (typeof meta !== 'object' || meta === null || Array.isArray(meta)) {
      bad(`locale/${name} 缺少 meta 对象`);
      continue;
    }
    for (const field of ['title', 'description']) {
      const v = meta[field];
      if (v === undefined) bad(`locale/${name} 缺少 meta.${field}（缺失会回退为裸包名/空描述）`);
      else if (typeof v !== 'string' || v.trim() === '') {
        bad(`locale/${name}: meta.${field} 必须是非空字符串（dsh 遇空串会整体读取失败并只报错）`);
      }
    }
  }
} catch (e) {
  bad(`locale 目录校验失败：${e.message}`);
}
// exports：readPluginMeta 用 Node ESM 解析器取这两个子路径，缺了会静默降级
if (!pkg.exports || pkg.exports['./locale/*.json'] !== './locale/*.json') {
  bad('exports 缺少 ./locale/*.json（dsh 解析 locale 文案的路径）');
}
if (!pkg.exports || pkg.exports['./package.json'] !== './package.json') {
  bad('exports 缺少 ./package.json（dsh 读取 icon 与兜底文案的路径）');
}
// files：发布包必须带上文案与图标，用户装上后 dsh 才读得到
if (!pkg.files || !pkg.files.includes('locale/*.json')) bad('files 白名单缺少 locale/*.json');
if (!pkg.files || !pkg.files.includes('icon.svg')) bad('files 白名单缺少 icon.svg');
// 顶层 description：npm 搜索摘要 + 无 locale 字段时的兜底
if (typeof pkg.description !== 'string' || pkg.description.trim() === '') {
  bad('缺少顶层 description（npm 摘要 + locale 缺失时的兜底）');
}
// 死字段守卫：package.json.meta 不被 dsh 读取，双处维护必然漂移
if (pkg.meta !== undefined) {
  bad('package.json 存在 meta 块——dsh 不读取它（实测 readPluginMeta 只读 locale 与顶层 name/description/icon），文案请只写在 locale/*.json');
}
if (errors.length === before6) {
  ok('展示文案读取链完整（locale meta 非空、exports/files 解析路径齐全、无 meta 死字段）');
}

// 7. 发布就绪：license 字段 + 随包 LICENSE 文件（npm 对 LICENSE 恒定入包，无需写进 files）
const before7 = errors.length;
if (typeof pkg.license !== 'string' || pkg.license.trim() === '') {
  bad('缺少 license 字段（npm publish 会警告）');
}
if (!existsSync(join(root, 'LICENSE'))) bad('缺少 LICENSE 文件（随包分发的授权文本）');
if (errors.length === before7) {
  ok(`license 就绪（字段 ${pkg.license} + LICENSE 文件）`);
}

// 8. CSS 钩子/两代头部判别器自检：dsh 结构升级（如 0.1.7-alpha.2 的
//    CodeToolbar 与 data-code-wrap）时，这些锚点是适配的抓手，防重构误删
const clientSrc = read('client.js');
const before8 = errors.length;
for (const anchor of [
  '.md-code-block',
  '[data-code-block-banner]',
  '[data-code-block-content]',
  "data-code-wrap='false'",
  ':has(svg)',
  ':first-child:not(:has(span))',
  'counter-reset: mdcs-line',
]) {
  if (!clientSrc.includes(anchor)) bad(`client.js 缺少钩子/判别器：${anchor}`);
}
if (errors.length === before8) {
  ok('CSS 钩子自检通过（7 个稳定锚点 + 两代头部判别器）');
}

if (errors.length > 0) {
  console.error('\n校验未通过：');
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log('\n全部校验通过，可以发布。');
