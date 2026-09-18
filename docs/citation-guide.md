# PicTrace 引用规范详解（Citation Guide）

PicTrace 的定位是**溯源工具**：它帮你找到线索，而最终被引用的证据应当是命中页面本身。本文件说明如何在正式场合规范地引用 PicTrace 的检索结果与本软件。

## 1. 引用"命中页面"（最重要）

无论论文、新闻报道还是事实核查，引用对象都是**图片出现的原始网页**，而不是 PicTrace。PicTrace 导出报告中已按"序号. 标题. 站点. URL（检索日期，via 引擎）"预生成条目，请按目标出版物规范复核。

### GB/T 7714-2015（中文期刊/学位论文常用）

> [1] 作者. 题名[EB/OL]. (页面发布日期)[检索日期]. URL.

示例：

> [1] 某某. 某公众号文章题名[EB/OL]. (2025-03-12)[2026-09-18]. https://mp.weixin.qq.com/s/xxxx.

### APA 7th

> Author. (Year, Month Day). *Title*. Site Name. URL

### 示例：在论文方法部分说明检索过程

> 图片出处核查于 2026 年 9 月 18 日进行：使用 PicTrace v1.0.0 对目标图片执行多引擎反向检索（Google Lens、Yandex、Bing、百度识图、SauceNAO 等），命中页面经人工核验后按 GB/T 7714-2015 著录。

## 2. 引用 PicTrace 软件

### BibTeX（与仓库 CITATION.cff 生成结果一致，2026-09-18 经 cffconvert 核验）

```bibtex
@misc{xiaoanping-101_pictrace,
  author = {xiaoanping-101},
  month  = {9},
  title  = {PicTrace: Open-source Reverse Image Provenance Search Aggregator},
  url    = {https://github.com/xiaoanping-101/pictrace},
  year   = {2026}
}
```

### GB/T 7714 软件条目

> [1] xiaoanping-101. PicTrace: 开源以图溯源检索平台[CP/OL]. (2026-09-18)[引用日期]. https://github.com/xiaoanping-101/pictrace.

仓库根目录的 [CITATION.cff](../CITATION.cff) 会被 GitHub 自动识别，点击仓库首页 "Cite this repository" 即可导出 BibTeX / RIS / EndNote / APA 等格式。

## 2.5 致谢规范（Acknowledgement Norms）

在学术或公开作品中使用 PicTrace 时，除引用本软件外，请按[致谢规范与逐项清单](ACKNOWLEDGEMENTS.md)处理第三方归属：

1. **必须致谢**：对成果有实质贡献的算法/工具（清单第 1–8 项），措辞模板见该文件第三节；
2. **不得转引为自有**：感知哈希算法（imagehash/pHash/Krawetz）、CLIP 模型（OpenAI）、transformers.js 运行时（Apache-2.0）需按原署名提及；
3. **许可证敏感**：如你的衍生作品复制了 GPL-3.0 代码（如 dessant/search-by-image 源码），作品整体须转为 GPL-3.0，且不得再以 MIT 二次分发；
4. **时点数据**：引用 star 数、服务存活等时点数据时注明核验日期（见 [verification-log.md](verification-log.md)）。

## 3. 引用报告的构成（导出的 Markdown）

PicTrace 的"导出引用报告"包含以下要素，均带生成时间戳：

1. 目标图片信息（尺寸、格式、感知哈希 pHash/dHash/aHash）；
2. 各引擎检索链接（可复现）；
3. 服务端聚合命中列表（含来源域名与检索日期）；
4. 免责与复核提示。

报告示例（节选）：

```markdown
# 图片溯源检索报告 / PicTrace Report
> 生成时间 Generated: 2026-09-18T13:38:42Z
> 工具 Tool: PicTrace v1.0.0 — https://github.com/xiaoanping-101/pictrace
> 感知哈希 Perceptual hashes: pHash=4000000000000000 dHash=dc9e3632378ecccc aHash=fec38383c2e2e66e
## 2. 服务端聚合命中 / Server-side hits
1. Dog Loves You More Than He Loves Himself. deviantart.com. <https://deviantart.com/view/xxx> (retrieved 2026-09-18, via saucenao)
```

## 4. 使用边界（重要）

- **可复现性**：识图引擎的索引实时变化，他人重复检索可能得到不同结果；正式引用时请保存命中页面存档（如 Web Archive）；
- **证据强度**：聚合结果为机器解析，标题/链接可能存在解析误差，**正式引用前务必人工打开核验**；
- **隐私**：不要在公开报告中保留他人图片的 GPS EXIF 数据；PicTrace 界面对 GPS 字段有敏感提示；
- **版权**：检索到的图片版权归原权利人； PicTrace 的检索行为遵守各引擎服务条款，引用截图请遵循合理使用原则。
