# 事实自检报告（Verification Log / Anti-hallucination Log）

> 目的：PicTrace 文档中的每一条事实性声明都可追溯到**当次核验的方法与结果**，防止凭记忆书写造成的失实（幻觉）。
> 首轮自检：2026-09-18（v1.1.1）。本文件随每次复检更新。
> 核验环境：Windows + Node 24.20；对 github.com/api.github.com 的访问经本地代理 `http://127.0.0.1:7897`；GitHub API 携带仓库所有者令牌。

## 一、自检方法

1. **第三方仓库**：GitHub REST API `GET /repos/{owner}/{repo}`（许可证取 `license.spdx_id`，star 取 `stargazers_count`）；
2. **引擎存活**：HTTP 探测全部深链模板（200/301/302 记为存活）；对返回 403 的站点，再用真实浏览器导航验证页面标题；
3. **文献 URL**：HTTP 状态码 + 页面标题比对（arXiv）；无法直证的作者归属改用弱化表述；
4. **模型元数据**：Hugging Face API（经 hf.co / hf-mirror）；
5. **CITATION.cff**：本地 `cffconvert --validate`（PyPI 官方校验器）+ GitHub `/citation` 端点；
6. **内部一致性**：脚本核对引擎计数、版本号、文档相对链接与文件存在性。

## 二、核验结果总表

### A. 第三方仓库（GitHub API，2026-09-18）

| 声明 | 核验结果 | 结论 |
| --- | --- | --- |
| dessant/search-by-image 为 GPL-3.0、约 3.7k★ | `license: GPL-3.0`，`stars: 3751` | ✅ 准确（文档已更新为精确值） |
| Decimation/SmartImage 约 1.3k★ | `stars: 1335`，仓库无 LICENSE 文件 | ✅ 准确；补注"无许可证声明" |
| xemle/home-gallery 为 MIT、约 1.2k★ | `license: MIT`，`stars: 1181` | ✅ 准确（更新为精确值） |
| JohannesBuchner/imagehash 为 BSD-2 | `license: BSD-2-Clause`，`stars: 3871` | ✅ 准确 |
| 4evergr8/FlutterPicOrigin 存在 | `stars: 164`，存在 | ✅ 存在（文档未引用其 star 数） |
| transformers.js 仓库地址 | `huggingface/transformers.js` 存在（⭐16301，Apache-2.0）；`xenova/transformers.js` 为 301 重定向 | ✅ 文档链接正确；补 Apache-2.0 标注 |
| dessant/search-by-image Wiki 引擎清单存在 | Web 抓取确认页面存在 | ✅ |

### B. 引擎深链存活（HTTP 探测 + 浏览器复核，2026-09-18）

| 引擎 | HTTP 探测 | 浏览器复核 | 结论 |
| --- | --- | --- | --- |
| Google Lens / Yandex / Bing / TinEye / 百度识图 / 搜狗识图 / 360 / 搜狗微信 / IQDB / trace.moe | 200 | — | ✅ 存活 |
| SauceNAO | 403（WAF 拦自动化探测） | ✅ 页面标题 "SauceNAO Reverse Image Search"；且本会话服务端 POST 实测返回可解析结果 | ✅ 存活 |
| Ascii2D | 403（同上） | ✅ 页面标题 "二次元画像詳細検索" | ✅ 存活 |
| Openverse | 403（同上） | ✅ 页面标题 "Openly Licensed Images, Audio and More" | ✅ 存活 |
| KarmaDecay | 000（连接失败） | ❌ 导航超时 | ❌ **服务停止 → v1.1.1 已从引擎注册表移除** |

### C. 文献与算法出处（2026-09-18）

| 声明 | 核验结果 | 结论 |
| --- | --- | --- |
| dHash 出处 Krawetz "Kind of Like That"（imghash.js 注释 URL） | ❌ 原注释 URL 为编造路径；检索确认正确 URL 为 `hackerfactor.com/blog/?/archives/529-Kind-of-Like-That.html`，发表日期 **2013-01-21**（原注释误写 01-13） | ❌→✅ **已修正** |
| pHash 设计文档 `phash.org/docs/design.html` | HTTP 200 | ✅ |
| CLIP 论文 = arXiv:2103.00020 "Learning Transferable Visual Models From Natural Language Supervision" | HTTP 200，页面标题逐字匹配；ICML 2021 | ✅ |
| pHash 创建者署名 Klinger & Doherty | 官方现存文档未显式署名，社区通行此说 | ⚠️ 已改为弱化表述（"通常署名为"） |
| `Xenova/clip-vit-base-patch32` 存在 | HF API 返回模型记录（32 个文件）；权重页**未标注许可证** | ✅ 存在；⚠️ 许可证表述已改为"未标注，请自行核对" |
| transformers.js 版本 | jsdelivr package.json：`3.8.1`；npmmirror 最新为 4.3.0（未采用） | ✅ 文档与代码一致（锁定 3.8.1） |

### D. 服务端聚合实测（首轮开发会话内完成，2026-09-18）

| 引擎提供器 | 实测证据 | 结论 |
| --- | --- | --- |
| SauceNAO | 测试图（Windows 11 默认壁纸）返回 8 条命中，含 DeviantArt 出处与 94.8% 相似度 | ✅ 可用 |
| IQDB | 返回 9 条命中（sankakucomplex/zerochan，含相似度） | ✅ 可用 |
| Yandex | 上传接口返回 1778 字节验证码页 | ⚠️ 反爬（代码保留尽力而为 + 深链兜底） |
| Bing | SBI 上传返回 400 空 body（需浏览器 Cookie） | ⚠️ 同上 |
| 百度 | `{"status":1,"msg":"Reject"}` | ⚠️ 同上 |
| SauceNAO "限流约 4 次/30 秒" 表述 | 未找到官方页面直证 | ⚠️ **已弱化**为"有短时限流（以其站点说明为准）" |

### E. 引用文件（CITATION.cff）

| 声明/项 | 核验结果 | 结论 |
| --- | --- | --- |
| 原版 `authors: [{alias: …}]` 写法 | `cffconvert --validate` 报作者字段不合规 → GitHub `/citation` 端点 404 | ❌→✅ **已修正**为 entity 写法（`name: xiaoanping-101`）；修正后 cffconvert 报 "Citation metadata are valid according to schema version 1.2.0"，BibTeX 生成正常 |
| README 手写 BibTeX 与 CFF 一致性 | 已替换为 cffconvert 生成格式（`@misc`，含 month 字段） | ✅ |
| GitHub 引用按钮（用户可见功能） | 2026-09-18 真实浏览器点击仓库页 "Cite this repository"：弹出 BibTeX `@misc{xiaoanping-101_pictrace, …`，与 CFF 一致。（注：REST `/citation` 端点经本机代理返回 404，属代理访问 API 的边缘现象，不影响页面功能） | ✅ 实测可用 |

### F. 内部一致性（脚本核对，2026-09-18；2026-09-19 复跑通过）

| 项 | 结果 |
| --- | --- |
| 引擎计数（engines.js 实际 vs 文档宣称） | 移除 KarmaDecay后为 **13**；README/README.en/package.json/仓库描述已同步 |
| 版本号（package.json / CITATION.cff / app.js VERSION / CHANGELOG） | 统一为当前发版号（2026-09-19 起为 **1.3.0**） |
| README 相对链接目标文件均存在 | 脚本核对通过（CHANGELOG/ACKNOWLEDGEMENTS/verification-log/citation-guide/research/PRIVACY/CONTRIBUTING/LICENSE/截图） |
| 服务器端点与 README API 表一致 | health/img/search/**discover**/proxy/hf/img 七个端点一致（v1.3 增补 discover 检查项） |

### G. 相似内容直达数据源（v1.3，2026-09-19 实测）

| 数据源 | 接口性质 | 核验方法与证据 | 结论 |
| --- | --- | --- | --- |
| DuckDuckGo 图片 `i.js` | **非官方未文档化接口**（两步取 vqd） | 服务端请求返回 JSON：字段 `title/url/image/thumbnail/source`，实测 24 条 | ✅ 可用；随时可能变动，已按"单源失败自动降级"设计 |
| DuckDuckGo 视频 `v.js` | **非官方未文档化接口**（vqd 须与查询词一致） | 实测返回真实视频 URL（YouTube 等，含时长/发布者）；E2E 实测中文检索词返回 B站/抖音链接 20 条 | ✅ 可用；同上风险提示 |
| Openverse API `api.openverse.org/v1/images` | 官方公开 API（免密钥，限流） | 实测 `result_count: 240`，字段含 `url`（图址）与 `foreign_landing_url`（托管页，如 Flickr） | ✅ |
| 百度图片 `acjson` | **非官方接口**；返回体为非法 JSON | 实测响应含未转义字符导致 JSON.parse 失败 → 改用正则逐字段提取 `thumbURL/hoverURL/fromPageTitleEnc`，实测 24 条 | ✅（解析方式已按实测修正） |
| 必应网页搜索 HTML | 网页解析（结果为 `u=a1` base64 重定向） | 实测解码得到真实文章 URL（如 en.wikipedia.org/wiki/Dog），过滤 bing/microsoft 域后 8 条 | ✅ |
| 维基百科 REST `w/rest.php/v1/search/page` | 官方公开 API | 中/英均 200；中文"埃菲尔铁塔"返回 3 词条 | ✅ |
| Bing 图片 `images/async` | 网页解析 | 2026-09-18 与 09-19 两次实测均 210KB 但无数据字段（`iusc` 仅存在于 CSS） | ❌ 已放弃（不采用） |

E2E 证据（2026-09-19）：壁纸图片 → CLIP 识别"商品图"→ 自动 `/api/discover` → 页内展示 **92 条直达网址**（相似图片 48 / 相关视频 20 / 文章网页 16 / 百科词条 8，5 源命中），截图 `docs/screenshots/direct-results.png`。

## 三、本轮自检发现并已修复的失实（3 处）

1. **编造的文献 URL**：`imghash.js` 注释中 Krawetz dHash 文章链接为臆造路径（且日期有误）→ 已替换为检索核验的正确 URL 与日期 2013-01-21；
2. **不合规的 CITATION.cff**：作者仅写 `alias` 不通过 CFF 1.2.0 校验（GitHub 引用按钮失效）→ 改为 entity 写法并通过 cffconvert 校验；
3. **已停服引擎**：KarmaDecay 深链无法连接且浏览器导航超时 → 从引擎注册表移除，所有计数 14→13。

## 四、复检计划（制度化）

- **内部一致性自检已脚本化**：`node scripts/consistency-check.js`（零依赖），核对引擎计数、版本号一致性、文档相对链接、服务器端点、截图与致谢链接；任何提交前先跑一遍（已写入 [CONTRIBUTING.md](../CONTRIBUTING.md)）；
- 每次发版前重跑本文件第二节的核验（第三方仓库事实 / 引擎存活用 HTTP 探测复核）；
- star 数与"存活"均为时点数据，正文引用时一律附"核验日期"；
- 发现任何失实：先修正文档，再在本文件"三、失实与修复"追加记录，保持可审计链。

## 五、自检脚本最新运行记录

- 2026-09-18（v1.1.1）：62 项检查全部通过（引擎计数 13、版本 1.1.1 四处一致、文档链接 39 个目标存在、服务器端点 6 个一致、致谢关键链接 6 个在册）。
- 2026-09-19（v1.3.0）：75 项检查全部通过（新增 `/api/discover` 端点、`sec-discover` 直达结果区、`direct-results.png` 截图与 README 提及共 13 项检查；CITATION.cff 经 cffconvert 复验通过）。
