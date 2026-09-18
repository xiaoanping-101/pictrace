# 贡献指南 / Contributing

感谢你考虑为 PicTrace 贡献代码！

## 如何贡献

1. **Fork 并克隆**本仓库；
2. 创建特性分支：`git checkout -b feat/my-feature`；
3. 保持**零 npm 依赖**原则（服务器与前端均不引入第三方库，`node --check` 通过即可运行）；
4. 提交前自测：
   ```bash
   node --check server.js
   node server.js        # 手动过一遍核心流程
   ```
5. 提交 Pull Request，说明动机与测试方式。

## 我们特别欢迎的贡献方向

- 🌍 **新引擎/新深链**：在 `public/engines.js` 注册表添加引擎（含 `region`/`category`/`strength` 元数据），服务端可抓取的引擎在 `server.js` 增加提供器；
- 🏷️ **域名分类器增强**：扩展 `DOMAIN_TAGS`，让公众号/视频/社交/新闻分组更准；
- 🔍 **提供器修复**：各引擎反爬策略变化后，修复 `server.js` 中的解析器（请在 PR 中附上实测证据）；
- 🌐 **翻译**：新增语言（`public/app.js` 的 `I18N` 表）；
- 📖 **文档**：部署教程、案例、引用规范改进。

## 行为准则

- 尊重所有参与者；
- 不提交任何用于侵犯隐私、绕过版权保护或违反目标引擎服务条款的功能；
- 人脸相关功能讨论请附带合法使用场景说明。

## 提交信息规范

使用 Conventional Commits：`feat: ...`、`fix: ...`、`docs: ...`、`refactor: ...`。
