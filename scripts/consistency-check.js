'use strict';
// 内部一致性自检脚本（零依赖）：核对引擎计数、版本号、文档相对链接、服务器端点
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, "..");

let fails = 0;
const ok = (name, cond, detail) => {
  console.log((cond ? 'PASS' : 'FAIL') + '  ' + name + (detail ? '  -> ' + detail : ''));
  if (!cond) fails++;
};

// 1. 引擎计数：engines.js 实际数量 vs 文档宣称
const enginesSrc = fs.readFileSync(path.join(root, 'public/engines.js'), 'utf8');
const engineIds = [...enginesSrc.matchAll(/id: '([a-z0-9-]+)'/g)].map((m) => m[1]);
ok('引擎数量 = 13（engines.js 实际 ' + engineIds.length + '）', engineIds.length === 13, engineIds.join(','));
ok('engines.js 不含 KarmaDecay', !enginesSrc.includes("id: 'karmadecay'"));
const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
const readmeEn = fs.readFileSync(path.join(root, 'README.en.md'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
ok('README.md 宣称 13 个引擎', readme.includes('13 个识图引擎') && !readme.includes('14 个识图引擎'));
ok('README.en.md 宣称 13 engines', readmeEn.includes('13 engines') && !readmeEn.includes('14 engines'));
ok('README 引擎枚举行无 KarmaDecay 残留（自检章节的记录性提及除外）', !/一次载入[^\n]*KarmaDecay/.test(readme) && !/engines, one upload[^\n]*KarmaDecay/.test(readmeEn) && !readmeEn.includes('KarmaDecay'));

// 2. 版本一致性
const app = fs.readFileSync(path.join(root, 'public/app.js'), 'utf8');
const cff = fs.readFileSync(path.join(root, 'CITATION.cff'), 'utf8');
const changelog = fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8');
const ver = pkg.version;
ok('package.json = ' + ver, true);
ok('app.js VERSION = ' + ver, app.includes(`const VERSION = '${ver}'`));
ok('CITATION.cff version = ' + ver, cff.includes(`version: ${ver}`));
ok('CHANGELOG 含 [' + ver + ']', changelog.includes(`## [${ver}]`));

// 3. 文档相对链接目标存在
const docFiles = ['README.md', 'README.en.md', 'docs/research.md', 'docs/citation-guide.md', 'docs/ACKNOWLEDGEMENTS.md', 'docs/verification-log.md', 'CONTRIBUTING.md', 'PRIVACY.md'];
for (const f of docFiles) {
  const src = fs.readFileSync(path.join(root, f), 'utf8');
  const baseDir = path.dirname(path.join(root, f));
  const links = [...src.matchAll(/\]\(([^)#?]+?)(?:#[^)]*)?\)/g)].map((m) => m[1]).filter((l) => !/^https?:|^mailto:/.test(l));
  for (const l of links) {
    ok(`${f} -> ${l} 存在`, fs.existsSync(path.join(baseDir, l.replace(/\\/g, '/'))));
  }
}

// 4. 服务器端点与 README API 表一致
const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
for (const ep of ['/api/health', '/api/img', '/api/search', '/api/proxy', '/api/hf/', "'/img/'"]) {
  ok('server.js 含端点 ' + ep, server.includes(ep));
}
ok('README API 表含 /api/hf', readme.includes('/api/hf'));

// 5b. server.js 无硬编码版本号（应由 package.json 派生）
ok('server.js 健康检查不硬编码版本', !/version: '1.d+.d+'/m.test(server));

// 5. 截图文件存在
for (const shot of ['home.png', 'workbench-results.png', 'semantic-model.png', 'direct-results.png', 'content-recognition.png']) {
  ok('截图存在 docs/screenshots/' + shot, fs.existsSync(path.join(root, 'docs/screenshots', shot)));
}

// 6. 关键致谢链接在 ACKNOWLEDGEMENTS 中出现
const ack = fs.readFileSync(path.join(root, 'docs/ACKNOWLEDGEMENTS.md'), 'utf8');
for (const u of ['github.com/dessant/search-by-image', 'github.com/JohannesBuchner/imagehash', 'phash.org/docs/design.html', 'hackerfactor.com/blog/?/archives/529-Kind-of-Like-That.html', 'arxiv.org/abs/2103.00020', 'github.com/huggingface/transformers.js']) {
  ok('ACKNOWLEDGEMENTS 含 ' + u, ack.includes(u));
}

console.log(fails ? `\n${fails} 项未通过` : '\n全部通过');
process.exit(fails ? 1 : 0);
