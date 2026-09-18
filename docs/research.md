# 同类开源项目调研报告

> 调研日期：2026-09-18 · 调研人：PicTrace 项目作者（在 AI 辅助下完成）
> 调研方式：GitHub `reverse-image-search` / `google-lens` 主题页（按 star 排序）、Web 检索、各项目 README/Wiki 阅读
> **事实复核**：文中全部许可证与 star 数已于 2026-09-18 经 GitHub API 复核（方法与证据见 [verification-log.md](verification-log.md)），star 数为该时点快照。
> 目的：确认"以图溯源聚合检索网站"是否已有成熟开源实现；如有，借鉴其思想并在其基础上继续优化开发。

## 一、调研结论（TL;DR）

1. **多引擎反向搜图的"引擎注册表"模式已非常成熟**，代表作是 [dessant/search-by-image](https://github.com/dessant/search-by-image)（3.7k★），但它与主要同类均为**浏览器扩展**形态；
2. **网页版聚合器 imgops.com 是闭源商业网站**，开源界没有对应物；
3. **没有任何开源项目同时具备**：网页版开箱即用 + 中文引擎（百度/搜狗/360）+ 公众号文章与视频结果自动分组 + EXIF/感知哈希取证 + 引用报告导出；
4. 因此 PicTrace 选择：**借用** search-by-image 的引擎清单思想与 imagehash 的感知哈希算法（均为公开事实/算法，且已致谢），**原创**网页产品形态、服务端聚合提供器、域名分类器与引用报告，填补上述空白。

## 二、重点调研对象

### 1. dessant/search-by-image ⭐ 3751 · GPL-3.0 · 浏览器扩展

- **形态**：Chrome/Edge/Safari/Firefox 扩展；右键任意图片即可发送到所选引擎。
- **能力**：30+ 引擎，每个引擎有 URL 模式和上传模式；高度可配置。
- **Wiki 提供完整引擎清单**（URL 模板为公开事实）。
- **借鉴点**：引擎注册表的数据结构思想（每个引擎 = 元数据 + byUrl/byUpload 构造器）→ PicTrace 的 `public/engines.js` 采用同构设计，并扩展了 `region/category/strength/serverProvider` 字段与域名分类器。
- **许可注意**：项目为 GPL-3.0。PicTrace **未复制其任何代码**，仅参考了引擎 URL 模板等公开事实（URL 模板不受版权保护），故 PicTrace 可保持 MIT。若未来直接复制其代码，需遵循 GPL 传染条款。

### 2. Decimation/SmartImage ⭐ 1335 · 浏览器扩展（仓库未附许可证文件）

- 类似的多引擎搜图扩展（C#/.NET 系）。**借鉴点**：确认"聚合多引擎"是用户真实需求；其不足（需安装、无取证、无报告）成为 PicTrace 的差异化方向。

### 3. xemle/home-gallery ⭐ 1181 · MIT · 自托管照片库

- **能力**：本地照片库 + AI 语义检索 + 感知哈希去重。
- **借鉴点**：**本地感知哈希匹配**思想 → PicTrace 的 IndexedDB 图库 + 汉明距离查重（阈值 ≤ 10）。

### 4. imgops.com（闭源网页聚合器）

- 老牌"多引擎以图搜图"网页入口，传入图片 URL 后给出各引擎链接。
- **借鉴点**：网页形态的交互范式。**PicTrace 即其开源替代**，并额外支持本地上传、粘贴截图、服务端聚合与取证。

### 5. 4evergr8/FlutterPicOrigin · Flutter 跨平台 App

- 中文社区的"图片出处查找"App，聚合多个识图引擎。**借鉴点**：中文用户对"出处/溯源"（而非仅"相似图"）的诉求表述。

### 6. google-reverse-image / goris / lens 类抓取项目

- 多个用 cheerio/bs4 刮取 Google Lens / Google Images 的小型库。
- **借鉴点与教训**：刮取式方案脆弱、随时因引擎改版失效 → PicTrace 的提供器全部**尽力而为 + 深链兜底**，且实测验证了哪些引擎仍可服务端调用（SauceNAO、IQDB 可用；Yandex 返回验证码页；Bing SBI 返回 400；百度返回 Reject）。

### 7. 感知哈希算法文献

- aHash/dHash：Neal Krawetz, *Kind of Like That*, Hacker Factor Blog (2013)
- pHash：Evan Klinger & David Doherty, [pHash.org](https://www.phash.org/)（设计文档）
- 参考实现：[JohannesBuchner/imagehash](https://github.com/JohannesBuchner/imagehash)（BSD-2）
- **借鉴点**：PicTrace 在 `public/lib/imghash.js` 中以原生 JS 重新实现（32×32 灰度 → DCT-II → 低频 8×8 → 64bit），算法思想属于公开发表的技术。

## 三、差异化定位矩阵

| 能力 | search-by-image | SmartImage | imgops.com | home-gallery | **PicTrace** |
| --- | --- | --- | --- | --- | --- |
| 网页版开箱即用 | ✗（扩展） | ✗（扩展） | ✓（闭源） | ✓（重） | **✓（零依赖）** |
| 本地文件 / 粘贴截图 | 部分 | 部分 | ✗（仅 URL） | ✓ | **✓** |
| 中文引擎（百度/搜狗/360） | ✓ | 部分 | ✗ | ✗ | **✓ + 域名分类** |
| 公众号文章结果分组 | ✗ | ✗ | ✗ | ✗ | **✓** |
| EXIF / 感知哈希取证 | ✗ | ✗ | ✗ | ✓（库内） | **✓（浏览器本地）** |
| 服务端聚合解析 | ✗ | ✗ | ✗ | ✗ | **✓（尽力而为）** |
| 引用报告导出 | ✗ | ✗ | ✗ | ✗ | **✓（MD/JSON）** |
| 开源许可 | GPL-3.0 | — | ✗ | MIT | **MIT** |

## 四、服务端聚合的实测记录（2026-09-18，中国大陆网络 + 本地代理）

| 引擎 | 结果 | 说明 |
| --- | --- | --- |
| SauceNAO | ✅ 可用 | 表单 POST 可服务端调用；返回含标题、相似度、源站链接的 HTML；测试图片（Windows 11 默认壁纸）正确命中 DeviantArt 出处（94.8%）。注意其短时限流（以其站点说明为准） |
| IQDB | ✅ 可用 | 同上；返回相似度与图库链接 |
| Yandex | ⚠️ 反爬 | 上传接口返回机器人验证页（1778 字节 captcha 页） |
| Bing | ⚠️ 反爬 | SBI 上传接口返回 400 空 body（需要浏览器 Cookie） |
| 百度识图 | ⚠️ 反爬 | `graph.baidu.com/upload` 返回 `{"status":1,"msg":"Reject"}` |

→ 结论：**提供器必须优雅降级**。PicTrace 的 UI 在引擎被拦时展示"在引擎中打开"深链，用户仍可人工核验；SauceNAO/IQDB 的真实命中证明聚合管线本身可用。

## 五、许可与引用合规

- 引擎 URL 模板：公开事实，不构成代码复制；
- 感知哈希算法：公开发表的算法思想，PicTrace 为原创实现；
- 本项目代码：MIT，见 [LICENSE](../LICENSE)；
- 对借鉴对象在 README「致谢」与本报告中显式署名。
