# Changelog

本项目遵循 [Semantic Versioning](https://semver.org/)。

## [1.1.1] — 2026-09-18（引用/致谢规范化 + 反幻觉自检）

### 新增

- **[docs/ACKNOWLEDGEMENTS.md]**：致谢规范（四条原则）、逐项致谢清单（9 项，许可证/star 数逐条经 GitHub API 核验）、致谢措辞模板（中/英）、许可证兼容性速查；
- **[docs/verification-log.md]**：事实自检报告——全部事实性声明的核验方法、证据与结论，含复检计划；
- README 新增「事实自检（Anti-hallucination）」章节，引用规范补齐 GB/T 7714 软件条目与 CFF 导出说明。

### 修复（自检发现的三处失实）

- **文献 URL 幻觉**：`imghash.js` 注释中 Krawetz dHash 文章链接为臆造路径且日期有误 → 已替换为核验后的正确 URL（`hackerfactor.com/blog/?/archives/529-Kind-of-Like-That.html`，2013-01-21）；
- **CITATION.cff 作者字段不合规**（alias-only，未通过 CFF 1.2.0 校验，GitHub 引用按钮失效）→ 改为 entity 写法，`cffconvert --validate` 通过；
- **引擎清单含已停服引擎**：KarmaDecay 深链连接失败且浏览器导航超时 → 移除，引擎计数 14 → 13（含 package.json、双语 README 与仓库描述同步）。

### 变更

- 第三方 star 数更新为 GitHub API 精确快照（3751 / 1335 / 1181 / 3871 / 16301），并统一标注核验日期；
- SauceNAO 限流表述弱化为"以其站点说明为准"（未获官方页面直证）；
- transformers.js 补注 Apache-2.0；CLIP 权重页许可证状态如实标注为"未标注"；
- README 手写 BibTeX 替换为与 CITATION.cff 生成结果一致的 `@misc` 格式。

## [1.1.0] — 2026-09-18

### 新增

- **可选本地语义模型：CLIP ViT-B/32**（`Xenova/clip-vit-base-patch32`，q8 量化）
  - 经 transformers.js v3 在浏览器内推理（WebGPU/WASM），图片不离开本机；
  - 首次启用时从 CDN 懒加载运行时与权重（jsdelivr → unpkg → hf-mirror.com 三级回退）；
  - 本地图库记录可携带 512 维嵌入，检索时以余弦相似度（≥ 0.75）与感知哈希命中并列展示；
  - 默认关闭，不启用时核心功能与体积完全不受影响（保持零依赖）。
- README 新增「运用的模型」专章（三层模型架构说明 + CLIP 推理流程图）。

## [1.0.0] — 2026-09-18

### 首个发布

- 14 引擎聚合检索（Google Lens / Yandex / Bing / TinEye / 百度识图 / 搜狗识图 / 360 识图 / SauceNAO / IQDB / Ascii2D / trace.moe / 搜狗微信 / Openverse / KarmaDecay）；
- 浏览器本地取证：EXIF（含 GPS 敏感警示）、aHash / dHash / pHash(DCT)；
- 服务端聚合提供器：SauceNAO / IQDB 实测可用，Yandex / Bing / 百度尽力而为 + 深链兜底；
- 结果域名自动分类：公众号文章 / 视频 / 社交帖子 / 新闻媒体；
- 本地图库（IndexedDB 汉明距离查重）、检索历史、引用报告导出（Markdown / JSON）；
- 中英双语界面、零 npm 依赖、无构建；MIT License。
