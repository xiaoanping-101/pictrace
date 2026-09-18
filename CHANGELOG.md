# Changelog

本项目遵循 [Semantic Versioning](https://semver.org/)。

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
