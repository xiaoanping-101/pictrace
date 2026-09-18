/**
 * PicTrace 内容识别与相似检索路由（纯浏览器端）
 * ------------------------------------------------------------
 * 原理：用 CLIP 对图片做零样本分类（zero-shot classification，本地推理，
 * 无需训练与外部 API）——把图片与一组"内容类型"文本提示比较，取相似度
 * 最高的若干类型；再按类型路由到最擅长检索"相似人物/物体/场景"的公开
 * 引擎，并自动生成文章/视频平台的关键词检索直达链接。
 *
 * 设计说明：
 *  - 标签库为人工策划的 22 类内容提示（可扩展），英文提示供 CLIP 打分，
 *    中文显示与检索词供用户复制使用；
 *  - 路由表只引用 engines.js 中已注册的引擎 id；
 *  - 平台直达表 PLATFORMS 为公开站点搜索 URL（逐条可核验），不涉及爬虫。
 */
(function (global) {
  'use strict';

  /** 内容标签库：en=CLIP 提示词；zh=界面显示；qzh/qen=建议检索词；route=实体路由 */
  const LABELS = [
    { en: 'a portrait photo of a person face', zh: '人物/人像', qzh: '人物 肖像', qen: 'portrait person', route: 'person' },
    { en: 'a selfie photo of a person', zh: '自拍人像', qzh: '自拍 人物', qen: 'selfie', route: 'person' },
    { en: 'a group photo of several people', zh: '多人合影', qzh: '合影', qen: 'group photo', route: 'person' },
    { en: 'a photo of a dog', zh: '狗', qzh: '狗 品种 宠物', qen: 'dog breed', route: 'animal' },
    { en: 'a photo of a cat', zh: '猫', qzh: '猫 品种 宠物', qen: 'cat breed', route: 'animal' },
    { en: 'a photo of a bird', zh: '鸟类', qzh: '鸟类', qen: 'bird', route: 'animal' },
    { en: 'a wild animal in nature', zh: '野生动物', qzh: '野生动物', qen: 'wild animal', route: 'animal' },
    { en: 'a photo of a car or vehicle', zh: '汽车/车辆', qzh: '汽车 车型', qen: 'car model', route: 'object' },
    { en: 'an airplane or aircraft', zh: '飞机', qzh: '飞机 机型', qen: 'aircraft', route: 'object' },
    { en: 'a famous landmark or tourist attraction', zh: '地标建筑', qzh: '地标 建筑 景点', qen: 'landmark building', route: 'landmark' },
    { en: 'a natural landscape with mountains or water', zh: '自然风景', qzh: '风景 山水', qen: 'landscape', route: 'scene' },
    { en: 'a city view or street scene at night', zh: '城市夜景', qzh: '城市 夜景', qen: 'city night view', route: 'scene' },
    { en: 'a photo of food or a dish', zh: '食物', qzh: '美食 菜品', qen: 'food dish', route: 'food' },
    { en: 'anime or manga style illustration artwork', zh: '动漫插画', qzh: '动漫 插画 原作', qen: 'anime illustration', route: 'anime' },
    { en: 'a screenshot from a movie or tv show', zh: '影视截图', qzh: '剧照 影视', qen: 'movie still', route: 'anime' },
    { en: 'a painting or classic artwork', zh: '绘画/艺术作品', qzh: '画作', qen: 'artwork painting', route: 'art' },
    { en: 'a product photo on white background', zh: '商品图', qzh: '商品 同款', qen: 'product', route: 'product' },
    { en: 'a company brand logo', zh: '品牌 Logo', qzh: 'logo 品牌', qen: 'brand logo', route: 'logo' },
    { en: 'a screenshot of a document or text page', zh: '文字/文档截图', qzh: '文档 原文', qen: '', route: 'text' },
    { en: 'an internet meme with caption text', zh: '表情包/梗图', qzh: '表情包 梗图', qen: 'meme', route: 'meme' },
    { en: 'a sports event or athlete in action', zh: '运动场景', qzh: '体育 比赛', qen: 'sports event', route: 'scene' },
    { en: 'a screenshot of a video game scene', zh: '游戏截图', qzh: '游戏 画面', qen: 'game screenshot', route: 'game' },
  ];

  /**
   * 实体路由表：route → 推荐引擎（id 必须存在于 engines.js ENGINES）+ 说明
   * （人物检索默认只提供通用视觉引擎；人脸专用站点涉隐私争议，不内置，
   *  在 PRIVACY.md / 界面提示中说明合规边界）
   */
  const ROUTES = {
    person:   { zh: '相似人物 · 其他公开照片', engines: ['yandex', 'google-lens', 'bing', 'baidu-graph'], privacyNote: true },
    animal:   { zh: '相似动物 · 其他照片', engines: ['google-lens', 'yandex', 'bing', 'baidu-graph'] },
    landmark: { zh: '相似地标 · 其他照片与介绍', engines: ['google-lens', 'yandex', 'baidu-graph', 'tineye'] },
    scene:    { zh: '相似场景 · 其他照片', engines: ['google-lens', 'yandex', 'bing'] },
    food:     { zh: '相似美食 · 其他照片与文章', engines: ['google-lens', 'baidu-graph', 'yandex'] },
    object:   { zh: '相似物品 · 其他图片', engines: ['google-lens', 'bing', 'yandex', 'baidu-graph'] },
    product:  { zh: '相似商品 · 其他图片', engines: ['google-lens', 'bing', 'baidu-graph', 'so-image'] },
    anime:    { zh: '相似动漫图 · 出处与同作图', engines: ['saucenao', 'iqdb', 'ascii2d', 'trace-moe'] },
    art:      { zh: '相似画作 · 收藏与介绍页', engines: ['google-lens', 'tineye', 'yandex'] },
    logo:     { zh: '相似 Logo · 品牌信息', engines: ['google-lens', 'yandex', 'tineye'] },
    text:     { zh: '文档截图 · 原文检索', engines: ['google-lens', 'baidu-graph'] },
    meme:     { zh: '相似梗图 · 来源与演变', engines: ['yandex', 'google-lens', 'tineye'] },
    game:     { zh: '相似游戏画面 · 出处', engines: ['google-lens', 'yandex', 'ascii2d'] },
  };

  /**
   * 文章/视频平台直达表：按建议检索词做站内关键词检索（公开搜索 URL）
   * category: video | article | qa
   */
  const PLATFORMS = [
    { id: 'bilibili', name: 'B站（bilibili）', category: 'video', url: (k) => `https://search.bilibili.com/all?keyword=${encodeURIComponent(k)}` },
    { id: 'youtube', name: 'YouTube', category: 'video', url: (k) => `https://www.youtube.com/results?search_query=${encodeURIComponent(k)}` },
    { id: 'douyin', name: '抖音', category: 'video', url: (k) => `https://www.douyin.com/search/${encodeURIComponent(k)}` },
    { id: 'youku', name: '优酷', category: 'video', url: (k) => `https://so.youku.com/search_video/q_${encodeURIComponent(k)}` },
    { id: 'sogou-weixin', name: '搜狗微信文章', category: 'article', url: (k) => `https://weixin.sogou.com/weixin?type=2&query=${encodeURIComponent(k)}` },
    { id: 'weibo', name: '微博', category: 'article', url: (k) => `https://s.weibo.com/we?q=${encodeURIComponent(k)}` },
    { id: 'zhihu', name: '知乎', category: 'qa', url: (k) => `https://www.zhihu.com/search?type=content&q=${encodeURIComponent(k)}` },
    { id: 'baidu-news', name: '百度新闻', category: 'article', url: (k) => `https://www.baidu.com/s?tn=news&word=${encodeURIComponent(k)}` },
    { id: 'google-news', name: 'Google News', category: 'article', url: (k) => `https://news.google.com/search?q=${encodeURIComponent(k)}` },
  ];

  /**
   * 识别图片内容（零样本分类，本地推理）
   * @param {HTMLImageElement} imgEl
   * @returns {Promise<{top: Array<{zh,en,score,query,qzh,qen,route}>, route: object|null, primary: object|null}>}
   */
  async function recognize(imgEl) {
    const CLIP = global.PicTraceCLIP;
    const labels = LABELS.map((l) => l.en);
    const scores = await CLIP.classify(imgEl, labels);
    const byEn = Object.fromEntries(LABELS.map((l) => [l.en, l]));
    const ranked = scores
      .map((s) => ({ ...(byEn[s.label] || { zh: s.label, en: s.label, qzh: '', qen: '', route: null }), score: s.score }))
      .sort((a, b) => b.score - a.score);
    const top = ranked.slice(0, 5).filter((r) => r.score > 0.02);
    const primary = top[0] || null;
    return { top: ranked.slice(0, 5), route: primary ? ROUTES[primary.route] || null : null, primary };
  }

  global.PicTraceRecognize = { recognize, LABELS, ROUTES, PLATFORMS };
})(typeof window !== 'undefined' ? window : globalThis);
