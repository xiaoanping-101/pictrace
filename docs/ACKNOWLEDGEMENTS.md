# 致谢规范与逐项致谢清单（Acknowledgement Guidelines）

> 本文件是 PicTrace 的**致谢规范**：说明本项目"借鉴了什么、没借鉴什么、依据什么许可证"，并给出他人在衍生开发时应如何致谢的规范。
> 所有第三方许可证与 star 数均于 **2026-09-18** 经 GitHub API 核验（核验方法见 [verification-log.md](verification-log.md)）。

## 一、致谢规范（本项目的四条原则）

1. **逐项列明**：凡对项目的算法思想、数据结构、URL 模板或文档产生实质影响的第三方工作，逐一列出，不笼统打包；
2. **事实可核验**：许可证、star 数、仓库/文献 URL 等事实必须当场核验并在[自检报告](verification-log.md)中留痕，不凭记忆书写；
3. **区分"事实"与"代码"**：URL 模板、公开算法思想属于事实与思想，参考不构成代码复制；一旦复制代码，则须遵循该代码的许可证（见下方许可证兼容性）；
4. **声明原创边界**：明确写出哪些部分是本项目原创，避免让致谢清单反衬出模糊的挪用。

## 二、逐项致谢清单（已核验）

| # | 项目/文献 | 许可证（已核验） | 借鉴内容 | 边界声明 |
| --- | --- | --- | --- | --- |
| 1 | [dessant/search-by-image](https://github.com/dessant/search-by-image) ⭐3751 | **GPL-3.0** | 引擎注册表的数据结构思想（引擎 = 元数据 + URL/上传构造器）；其 Wiki 的引擎清单为 URL 模板事实来源 | **未复制任何代码**。若未来直接引入其代码，整个衍生作品须以 GPL-3.0 发布并停止使用 MIT |
| 2 | [JohannesBuchner/imagehash](https://github.com/JohannesBuchner/imagehash) ⭐3871 | **BSD-2-Clause** | aHash/dHash/pHash 的算法思想与参数约定（汉明距离阈值、DCT 低频取法） | 本项目以原生 JS 重写实现（`public/lib/imghash.js`），未复制其 Python 代码 |
| 3 | [pHash](https://www.phash.org/)（[设计文档](https://www.phash.org/docs/design.html)，GitHub: [aetilius/pHash](https://github.com/aetilius/pHash)） | 其站点与仓库随附许可 | pHash（DCT 感知哈希）的公开算法设计 | 同上；pHash 库创建者通常署名为 Evan Klinger 与 David Doherty（社区通行说法，官方现存文档未再显式署名） |
| 4 | Krawetz, N. [*Kind of Like That*](https://www.hackerfactor.com/blog/?/archives/529-Kind-of-Like-That.html), Hacker Factor Blog, 2013-01-21 | 博文（版权属作者） | dHash 差值哈希算法的公开论述 | 已在代码注释与本表中给出可核验的原文链接 |
| 5 | [xemle/home-gallery](https://github.com/xemle/home-gallery) ⭐1181 | **MIT** | "本地图片库 + 感知哈希匹配"的产品实践参考 | 本项目 IndexedDB 图库为独立实现 |
| 6 | Radford, A. et al. [*Learning Transferable Visual Models From Natural Language Supervision*](https://arxiv.org/abs/2103.00020). ICML 2021 | arXiv 预印本（作者保留权利） | CLIP 模型架构与对比学习思想 | 本项目仅**调用**经移植的预训练权重，不修改、不分发模型本身 |
| 7 | [transformers.js](https://github.com/huggingface/transformers.js) ⭐16301 | **Apache-2.0** | 浏览器端运行 transformers 模型的运行时（按需从 CDN 加载） | 本项目不含其源码；Apache-2.0 允许此类使用，启动时于界面标注 |
| 8 | `Xenova/clip-vit-base-patch32`（Hugging Face） | **权重页面未标注许可证**（2026-09-18 经 HF API 核验；原版 OpenAI CLIP 代码为 MIT） | CLIP ViT-B/32 的 ONNX q8 量化权重 | 首次启用时从镜像站下载至**用户浏览器**缓存，本项目仓库不含权重文件；商用前请自行核对模型页许可证 |
| 9 | 各识图引擎（Google Lens、Yandex、Bing、TinEye、百度、搜狗、360、SauceNAO、IQDB、Ascii2D、trace.moe、Openverse、搜狗微信） | 各自服务条款 | 公开检索服务（深链或表单提交） | 商标归各自所有者；本项目与它们无隶属、不破解其反爬措施 |

**原创部分声明**：服务端聚合提供器（含 Yandex/Bing/百度/SauceNAO/IQDB 的解析器）、域名分类器（公众号/视频/社交/新闻）、浏览器端 EXIF/PNG 解析器、IndexedDB 图库与语义匹配、引用报告导出、模型权重中转端点（`/api/hf/*`）及全部 UI/文档，为本项目原创（MIT）。

## 三、致谢措辞模板（供引用/衍生本项目时使用）

### 在论文或报告中致谢 PicTrace（中文示例）

> 感谢开源项目 PicTrace（MIT License, https://github.com/xiaoanping-101/pictrace）提供的多引擎反向检索能力；其感知哈希实现参考了 imagehash（BSD-2-Clause）与 pHash 的公开算法，语义模型基于 OpenAI CLIP（arXiv:2103.00020）经 transformers.js（Apache-2.0）的本地推理。

### 英文示例

> The authors thank the open-source project PicTrace (MIT License) for multi-engine reverse image search; its perceptual hashing follows the public algorithms of imagehash (BSD-2-Clause) and pHash, and its optional semantic model uses OpenAI's CLIP (arXiv:2103.00020) via transformers.js (Apache-2.0) for on-device inference.

### 衍生开发时

Fork 或借鉴本仓库时，请保留：本文件与 [verification-log.md](verification-log.md) 的链接、LICENSE（MIT）、以及对上表 1–8 项的同等致谢；若引入 GPL 代码（如 dessant/search-by-image 的源码），整体须转为 GPL-3.0 并更新本清单。

## 四、许可证兼容性速查（本项目视角）

| 情形 | 结论 |
| --- | --- |
| MIT 项目参考 GPL 项目的**思想/公开事实**（URL 模板、架构） | 允许，思想不受版权保护，但应致谢 |
| MIT 项目**复制** GPL-3.0 代码 | 不允许保持 MIT；衍生作品须 GPL-3.0 |
| MIT 项目使用 Apache-2.0 运行时（CDN 动态加载，不分发源码） | 允许；保留 NOTICE 即可 |
| MIT 项目调用未标注许可证的模型权重（运行时分发至用户端缓存） | 建议在文档明示"许可证未标注，用户自行核对"（本表第 8 项即此处理） |
