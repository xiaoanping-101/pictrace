/**
 * PicTrace 引擎注册表（前后端共享数据源）
 * ------------------------------------------------------------
 * 借鉴并致谢 dessant/search-by-image 的搜索引擎 Wiki 清单（GPL-3.0 项目，
 * 本文件仅参考其公开的 URL 模板事实，代码为原创）：
 * https://github.com/dessant/search-by-image/wiki/Search-engines
 *
 * 字段说明：
 *  - id/name/nameZh ：标识与双语名称
 *  - region         ：global / cn / jp（主要覆盖区域）
 *  - category       ：general(通用) / face(人脸) / anime(二次元) / article(文章)
 *  - strength       ：该引擎最擅长的溯源场景（用于前端提示）
 *  - byUrl(url)     ：图片已有公开 URL 时的深链
 *  - byUpload       ：只有本地文件时的入口页（拖拽/选择上传）
 *  - byKeyword(kw)  ：关键词检索入口（用于以图分析出的关键词二次检索）
 *  - serverProvider ：server.js 中可代抓取的提供器名（可选）
 */
(function (global) {
  'use strict';

  const ENGINES = [
    {
      id: 'google-lens',
      name: 'Google Lens',
      nameZh: 'Google 智能镜头',
      region: 'global',
      category: 'general',
      strength: { zh: '全网通用、商品、地标、相似图', en: 'General web, products, landmarks' },
      byUrl: (u) => `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(u)}`,
      byUpload: 'https://lens.google.com/upload?ep=unifi&browser=CHROME',
      byKeyword: (k) => `https://www.google.com/search?q=${encodeURIComponent(k)}&udm=2`,
    },
    {
      id: 'yandex',
      name: 'Yandex Images',
      nameZh: 'Yandex 识图',
      region: 'global',
      category: 'general',
      strength: { zh: '人脸、人物、东欧来源图片最强', en: 'Faces & people, strongest coverage' },
      byUrl: (u) => `https://yandex.com/images/search?rpt=imageview&url=${encodeURIComponent(u)}`,
      byUpload: 'https://yandex.com/images/search?rpt=imageview&urg=1',
      byKeyword: (k) => `https://yandex.com/images/search?text=${encodeURIComponent(k)}`,
      serverProvider: 'yandex',
    },
    {
      id: 'bing',
      name: 'Bing Visual Search',
      nameZh: '必应可视化搜索',
      region: 'global',
      category: 'general',
      strength: { zh: '相似图、商品、国际网页', en: 'Similar images, products' },
      byUrl: (u) => `https://www.bing.com/images/search?view=detailv2&iss=sbi&q=imgurl:${encodeURIComponent(u)}`,
      byUpload: 'https://www.bing.com/images/search?form=HDRSC2&iss=sbi',
      byKeyword: (k) => `https://www.bing.com/images/search?q=${encodeURIComponent(k)}`,
      serverProvider: 'bing',
    },
    {
      id: 'tineye',
      name: 'TinEye',
      nameZh: 'TinEye',
      region: 'global',
      category: 'general',
      strength: { zh: '最早的反向搜图，擅长找"同一张图"的转载页', en: 'Finds exact copies & edits' },
      byUrl: (u) => `https://tineye.com/search?url=${encodeURIComponent(u)}`,
      byUpload: 'https://tineye.com/',
      byKeyword: (k) => `https://tineye.com/search?q=${encodeURIComponent(k)}`,
    },
    {
      id: 'baidu-graph',
      name: 'Baidu Graph',
      nameZh: '百度识图',
      region: 'cn',
      category: 'general',
      strength: { zh: '中文网页、公众号文章覆盖最好', en: 'Best for Chinese web & WeChat articles' },
      byUrl: (u) => `https://graph.baidu.com/s?sign=&f=all&url=${encodeURIComponent(u)}`,
      byUpload: 'https://graph.baidu.com/pcpage/index?drag=1&tpl_from=pc',
      byKeyword: (k) => `https://image.baidu.com/search/index?tn=baiduimage&word=${encodeURIComponent(k)}`,
      serverProvider: 'baidu',
    },
    {
      id: 'sogou',
      name: 'Sogou Image',
      nameZh: '搜狗识图',
      region: 'cn',
      category: 'general',
      strength: { zh: '微信生态图片、中文社交', en: 'WeChat ecosystem images' },
      byUrl: (u) => `https://pic.sogou.com/ris?query=${encodeURIComponent(u)}`,
      byUpload: 'https://pic.sogou.com/',
      byKeyword: (k) => `https://pic.sogou.com/pics?query=${encodeURIComponent(k)}`,
    },
    {
      id: 'so-image',
      name: '360 Image',
      nameZh: '360 识图',
      region: 'cn',
      category: 'general',
      strength: { zh: '中文网页补充源', en: 'Extra Chinese coverage' },
      byUrl: (u) => `https://st.so.com/stu?a=&imgUrl=${encodeURIComponent(u)}`,
      byUpload: 'https://image.so.com/',
      byKeyword: (k) => `https://image.so.com/i?q=${encodeURIComponent(k)}`,
    },
    {
      id: 'sogou-weixin',
      name: 'Sogou WeChat',
      nameZh: '搜狗微信（文章）',
      region: 'cn',
      category: 'article',
      strength: { zh: '按关键词检索公众号文章库', en: 'WeChat official-account articles by keyword' },
      keywordOnly: true,
      byKeyword: (k) => `https://weixin.sogou.com/weixin?type=2&query=${encodeURIComponent(k)}`,
    },
    {
      id: 'saucenao',
      name: 'SauceNAO',
      nameZh: 'SauceNAO',
      region: 'jp',
      category: 'anime',
      strength: { zh: '二次元插画/漫画出处（Pixiv 等）', en: 'Anime/illustration sources' },
      byUrl: (u) => `https://saucenao.com/search.php?url=${encodeURIComponent(u)}`,
      byUpload: 'https://saucenao.com/',
      byKeyword: (k) => `https://saucenao.com/search.php?q=${encodeURIComponent(k)}`,
      serverProvider: 'saucenao',
    },
    {
      id: 'iqdb',
      name: 'IQDB',
      nameZh: 'IQDB',
      region: 'jp',
      category: 'anime',
      strength: { zh: '动漫图库（danbooru 等）出处', en: 'Anime booru sources' },
      byUrl: (u) => `https://iqdb.org/?url=${encodeURIComponent(u)}`,
      byUpload: 'https://iqdb.org/',
      byKeyword: null,
      serverProvider: 'iqdb',
    },
    {
      id: 'ascii2d',
      name: 'Ascii2D',
      nameZh: 'Ascii2D',
      region: 'jp',
      category: 'anime',
      strength: { zh: '二次元图片出处（日本）', en: 'Anime sources (JP)' },
      byUrl: (u) => `https://ascii2d.net/search/url/${encodeURIComponent(u)}`,
      byUpload: 'https://ascii2d.net/',
      byKeyword: (k) => `https://ascii2d.net/search/keyword/${encodeURIComponent(k)}`,
    },
    {
      id: 'trace-moe',
      name: 'trace.moe',
      nameZh: 'trace.moe（动漫截图）',
      region: 'jp',
      category: 'anime',
      strength: { zh: '动画截图 → 出自哪部动画哪一集', en: 'Anime screenshot → episode' },
      byUrl: (u) => `https://trace.moe/?url=${encodeURIComponent(u)}`,
      byUpload: 'https://trace.moe/',
      byKeyword: null,
    },
    {
      id: 'openverse',
      name: 'Openverse',
      nameZh: 'Openverse（CC 授权）',
      region: 'global',
      category: 'article',
      strength: { zh: '按关键词查开放版权图库', en: 'Openly-licensed images by keyword' },
      keywordOnly: true,
      byKeyword: (k) => `https://openverse.org/search/?q=${encodeURIComponent(k)}`,
    },
    {
      id: 'karmadecay',
      name: 'KarmaDecay',
      nameZh: 'KarmaDecay（Reddit）',
      region: 'global',
      category: 'general',
      strength: { zh: '帖子在 Reddit 的出现记录', en: 'Reddit post appearances' },
      byUrl: (u) => `http://karmadecay.com/search?qt=${encodeURIComponent(u)}`,
      byUpload: null,
      byKeyword: null,
    },
  ];

  /**
   * 结果域名分类表：用于把聚合命中按"公众号 / 视频 / 社交帖子 / 新闻"分组。
   * 这是纯前端的启发式映射，可按需扩展。
   */
  const DOMAIN_TAGS = [
    { tag: 'wechat', zh: '公众号文章', en: 'WeChat article', hosts: ['mp.weixin.qq.com'] },
    {
      tag: 'video', zh: '视频', en: 'Video',
      hosts: ['bilibili.com', 'youtube.com', 'youtu.be', 'youku.com', 'iqiyi.com', 'v.qq.com', 'douyin.com', 'tiktok.com', 'douyu.com', 'hxysay.com', 'acfun.cn', 'mgtv.com'],
    },
    {
      tag: 'social', zh: '社交帖子', en: 'Social post',
      hosts: ['weibo.com', 'weibo.cn', 'twitter.com', 'x.com', 'zhihu.com', 'tieba.baidu.com', 'reddit.com', 'facebook.com', 'instagram.com', 'xiaohongshu.com', 'douban.com', 'tieba.com', 'juejin.cn', 'csdn.net', 'jianshu.com', 'cnblogs.com'],
    },
    {
      tag: 'news', zh: '新闻/媒体', en: 'News / media',
      hosts: ['news.sina.com.cn', 'people.com.cn', 'xinhuanet.com', 'cctv.com', 'thepaper.cn', '163.com', 'sohu.com', 'qq.com', 'sina.com.cn', 'guancha.cn', 'chinanews.com', 'bbc.com', 'cnn.com', 'reuters.com'],
    },
  ];

  function classifyUrl(u) {
    let host = '';
    try { host = new URL(u).hostname.toLowerCase(); } catch { return null; }
    for (const g of DOMAIN_TAGS) {
      if (g.hosts.some((h) => host === h || host.endsWith('.' + h))) return g.tag;
    }
    return 'web';
  }

  global.PicTraceEngines = { ENGINES, DOMAIN_TAGS, classifyUrl };
})(typeof window !== 'undefined' ? window : globalThis);
