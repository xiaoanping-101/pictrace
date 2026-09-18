/**
 * PicTrace 溯图 — 前端主逻辑（无框架、无构建）
 * ------------------------------------------------------------
 * 模块：i18n（中/英）· 输入（文件/拖拽/粘贴/URL）· 本地取证（EXIF+感知哈希）
 *       引擎深链 · 服务端聚合 · 结果分类过滤（公众号/视频/社交/新闻）
 *       本地图库（IndexedDB）· 检索历史（localStorage）· 引用报告导出
 */
(function () {
  'use strict';

  const VERSION = '1.2.0';
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  // ------------------------------------------------------------
  // i18n
  // ------------------------------------------------------------
  const I18N = {
    zh: {
      tagline: '以图溯源 · 一次上传，多引擎检索出处',
      flow1: '上传 / 粘贴图片', flow2: '本地取证分析', flow3: '多引擎同步检索',
      flow4: '按公众号/视频/帖子过滤', flow5: '导出引用报告',
      dzMain: '拖拽图片到这里，或点击选择文件',
      dzSub: '支持 Ctrl+V 直接粘贴截图 · JPG / PNG / WebP / GIF，≤ 15MB',
      useUrl: '使用该 URL',
      preview: '图片预览', reselect: '换一张', addToLib: '加入本地图库',
      localForensics: '本地取证分析（不上传）',
      libMatches: '本地图库命中',
      engines: '检索引擎（点击直达）',
      urlModeTip: '已识别图片 URL：支持 URL 直搜引擎',
      fileModeTip: '本地文件模式：可用「聚合检索」或打开引擎上传页',
      aggregate: '聚合检索（服务端）',
      aggregateBusy: '聚合检索中…',
      openUrlEngines: '打开全部 URL 引擎',
      copyLinks: '复制全部链接',
      keywordSearch: '关键词二次检索',
      keywordHint: '识别出的实体 / EXIF 线索可在此补全关键词，检索公众号文章与版权图库：',
      kwGo: '检索',
      aggResults: '聚合检索结果',
      exportReport: '导出引用报告（Markdown）',
      exportJson: '导出 JSON',
      history: '检索历史（本地）',
      clear: '清空',
      searchByImg: 'URL 检索',
      openUpload: '上传页',
      copied: '已复制到剪贴板',
      noImage: '请先载入一张图片',
      serverDown: '聚合服务不可用：请先运行 node server.js（页面右上角应能访问）',
      aggDone: (ok, empty) => `完成：${ok} 个引擎返回数据${empty ? '，其中 0 条命中' : ''}`,
      libAdded: '已加入本地图库',
      libNoMatch: '图库中暂无近似图片',
      reportTitle: '图片溯源检索报告',
      tabs: { all: '全部', wechat: '公众号文章', video: '视频', social: '社交帖子', news: '新闻/媒体', web: '网页' },
      hintNoResults: '没有抓取到可展示的结果。各引擎反爬策略可能导致服务端抓取失败——请直接点上方引擎卡片人工核验，这同样可靠。',
      kwPlaceholder: '例如：城市名、事件、人物、作品名…',
      footerDisclaimer: '免责声明：PicTrace 仅提供公开搜索引擎的聚合入口与本地取证工具，请遵守各引擎服务条款与当地法律法规，尊重图片版权与个人隐私（尤其是人脸检索场景）。',
      footerCredits: '引擎清单思路致谢 dessant/search-by-image · 感知哈希算法致谢 imagehash / pHash · 语义模型 CLIP (OpenAI) 经 transformers.js 本地运行 · MIT License',
      clipTitle: '语义模型（可选）',
      clipHint: '启用后下载量化版 CLIP（约 60–90MB），在浏览器本地推理：本地图库可按"语义相似"匹配图片，弥补感知哈希只能找"近似同图"的盲区。默认关闭，不影响核心功能。',
      clipEnable: '启用语义模型',
      clipEmbed: '为当前图片生成语义向量',
      clipReady: '✅ 模型就绪，本地推理已开启',
      clipLoading: '模型下载中，请稍候…',
      clipFailed: (m) => `启用失败：${m}（核心功能不受影响）`,
      clipEmbedDone: '已生成并用于图库语义匹配',
      clipEmbedBusy: '推理中…',
      semSim: '语义相似度',
      recTitle: '内容识别与相似检索',
      recHint: '本地识别图片内容类型（人物/动物/地标/动漫/商品…），自动生成检索词，路由到最擅长"相似人物/物体/场景"的引擎，并直达文章/视频平台的同类内容检索。需先启用语义模型。',
      recGo: '识别图片内容并生成检索方案',
      recBusy: '识别中…',
      recLabels: '内容类型（本地零样本置信度）',
      recKeywords: '建议检索词（点击填入关键词框）',
      recNoKw: '（该类型暂无自动建议，可手动输入）',
      recPlatforms: '用建议检索词直达文章/视频平台',
      recPersonNote: '⚠️ 人物检索涉及肖像权与隐私法规：请仅用于事实核查、找回本人照片等合法目的，详见 PRIVACY.md。',
      kwFilled: '已填入关键词框，可点击引擎检索',
      platformCat: { video: '视频', article: '文章', qa: '问答' },
    },
    en: {
      tagline: 'Trace any image to its sources across engines',
      flow1: 'Upload / paste image', flow2: 'Local forensics', flow3: 'Multi-engine search',
      flow4: 'Filter by articles/videos/posts', flow5: 'Export citation report',
      dzMain: 'Drop an image here, or click to choose a file',
      dzSub: 'Ctrl+V paste supported · JPG / PNG / WebP / GIF, ≤ 15MB',
      useUrl: 'Use this URL',
      preview: 'Preview', reselect: 'Replace', addToLib: 'Add to library',
      localForensics: 'Local forensics (nothing uploaded)',
      libMatches: 'Library matches',
      engines: 'Search engines (click to open)',
      urlModeTip: 'Image URL detected: URL-based engines enabled',
      fileModeTip: 'Local file mode: use aggregation or open engine upload pages',
      aggregate: 'Aggregate search (server)',
      aggregateBusy: 'Searching…',
      openUrlEngines: 'Open all URL engines',
      copyLinks: 'Copy all links',
      keywordSearch: 'Keyword search',
      keywordHint: 'Refine keywords from entities / EXIF clues to search WeChat articles and stock libraries:',
      kwGo: 'Search',
      aggResults: 'Aggregated results',
      exportReport: 'Export citation report (Markdown)',
      exportJson: 'Export JSON',
      history: 'Search history (local)',
      clear: 'Clear',
      searchByImg: 'Search by URL',
      openUpload: 'Upload page',
      copied: 'Copied to clipboard',
      noImage: 'Load an image first',
      serverDown: 'Aggregation server unavailable: run "node server.js" first',
      aggDone: (ok, empty) => `Done: ${ok} engine(s) returned data${empty ? ' (0 hits)' : ''}`,
      libAdded: 'Added to local library',
      libNoMatch: 'No similar images in library yet',
      reportTitle: 'Image Provenance Search Report',
      tabs: { all: 'All', wechat: 'WeChat article', video: 'Video', social: 'Social post', news: 'News/media', web: 'Web' },
      hintNoResults: 'No scrapeable results. Engines may have blocked server-side fetching — verify manually via the engine cards above; that path always works.',
      kwPlaceholder: 'e.g. city name, event, person, artwork…',
      footerDisclaimer: 'Disclaimer: PicTrace is an aggregation front-end for public search engines plus local forensic tools. Follow each engine\u2019s terms of service and local law; respect copyright and privacy (especially for face search).',
      footerCredits: 'Engine registry inspired by dessant/search-by-image · perceptual hashes after imagehash / pHash · semantic model: CLIP (OpenAI) via transformers.js, on-device · MIT License',
      clipTitle: 'semantic model (optional)',
      clipHint: 'Downloads a quantized CLIP (~60–90 MB) on first enable and runs fully on-device: the local library can match images by semantic similarity, covering the blind spot of perceptual hashing. Off by default; core features are unaffected.',
      clipEnable: 'Enable semantic model',
      clipEmbed: 'Embed current image',
      clipReady: '✅ Model ready — on-device inference active',
      clipLoading: 'Downloading model…',
      clipFailed: (m) => `Failed to enable: ${m} (core features unaffected)`,
      clipEmbedDone: 'Embedding stored and used for library matching',
      clipEmbedBusy: 'Inferring…',
      semSim: 'Semantic similarity',
      recTitle: 'Content recognition & similar search',
      recHint: 'Recognizes the image content type (person/animal/landmark/anime/product…) on-device, generates query terms, routes to the best engines for similar people/objects/scenes, and deep-links to article/video platform searches. Requires the semantic model.',
      recGo: 'Recognize content & build search plan',
      recBusy: 'Recognizing…',
      recLabels: 'Content types (on-device zero-shot confidence)',
      recKeywords: 'Suggested queries (click to fill the keyword box)',
      recNoKw: '(no auto suggestion for this type — type manually)',
      recPlatforms: 'Open article/video platform searches with the suggested query',
      recPersonNote: '⚠️ Person search implicates portrait & privacy law: use only for lawful purposes such as fact-checking or finding your own photos. See PRIVACY.md.',
      kwFilled: 'Filled into the keyword box — click an engine to search',
      platformCat: { video: 'video', article: 'article', qa: 'Q&A' },
    },
  };
  let lang = localStorage.getItem('pt-lang') || 'zh';
  const t = (k) => {
    const v = I18N[lang][k];
    return typeof v === 'function' ? v : v;
  };

  // ------------------------------------------------------------
  // 状态
  // ------------------------------------------------------------
  const state = {
    file: null,        // File | Blob
    fileName: '',
    objectUrl: null,
    remoteUrl: null,   // 用户提供的图片 URL
    buffer: null,      // ArrayBuffer（EXIF 用）
    imgEl: null,
    analysis: null,    // {w,h,container,sizeMime,hashes,exif}
    uploadedId: null,  // /api/img 返回的 id
    agg: null,         // /api/search 聚合结果
    health: null,      // /api/health
    activeTab: 'all',
  };
  const { ENGINES, classifyUrl, DOMAIN_TAGS } = window.PicTraceEngines;

  // ------------------------------------------------------------
  // 工具
  // ------------------------------------------------------------
  let toastTimer = null;
  function toast(msg) {
    let el = $('#toast');
    if (!el) { el = document.createElement('div'); el.id = 'toast'; document.body.appendChild(el); }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  }

  function fmtSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  }

  function download(name, text, mime) {
    const blob = new Blob([text], { type: mime || 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); toast(t('copied')); }
    catch {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); ta.remove(); toast(t('copied'));
    }
  }

  // ------------------------------------------------------------
  // 语言切换
  // ------------------------------------------------------------
  function applyLang() {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    document.documentElement.dataset.lang = lang;
    $$('[data-i18n]').forEach((el) => {
      const k = el.dataset.i18n;
      const v = I18N[lang][k];
      if (typeof v === 'string') el.textContent = v;
    });
    $('#lang-toggle').textContent = lang === 'zh' ? 'EN' : '中文';
    $('#keyword-input').placeholder = t('kwPlaceholder');
    $('#mode-note').textContent = state.remoteUrl ? t('urlModeTip') : t('fileModeTip');
    renderEngineGrid();
    renderKeywordGrid();
    if (state.analysis) renderAnalysis();
    if (state.agg) renderResults();
    if (state.lastRec) renderRecognize(state.lastRec);
  }

  // ------------------------------------------------------------
  // 图片载入
  // ------------------------------------------------------------
  async function loadBlob(blob, name, remoteUrl) {
    resetWorkbench();
    state.file = blob;
    state.fileName = name || 'pasted-image';
    state.remoteUrl = remoteUrl || null;
    state.buffer = await blob.arrayBuffer();
    state.objectUrl = URL.createObjectURL(blob);

    const img = new Image();
    img.src = state.objectUrl;
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
    state.imgEl = img;

    $('#sec-workbench').hidden = false;
    $('#preview-img').src = state.objectUrl;

    // 本地分析（纯浏览器端）
    const hashes = await window.PicTraceHash.computeAll(img);
    const meta = window.PicTraceExif.parse(new DataView(state.buffer));
    state.analysis = {
      w: img.naturalWidth, h: img.naturalHeight,
      size: blob.size, mime: blob.type || 'image/*',
      container: meta.container, exif: meta.exif || (meta.texts && Object.keys(meta.texts).length ? meta.texts : null),
      hasXmp: !!meta.hasXmp, hashes,
    };
    renderAnalysis();
    renderEngineGrid();
    $('#mode-note').textContent = state.remoteUrl ? t('urlModeTip') : t('fileModeTip');
    checkLibraryMatch();
    $('#sec-workbench').scrollIntoView({ behavior: 'smooth', block: 'start' });
    saveHistory();
  }

  function resetWorkbench() {
    if (state.objectUrl) URL.revokeObjectURL(state.objectUrl);
    state.uploadedId = null;
    state.agg = null;
    state.clipVec = null;
    state.lastRec = null;
    $('#sec-results').hidden = true;
    $('#lib-match-card').hidden = true;
    $('#recognize-result').hidden = true;
  }

  // ------------------------------------------------------------
  // 本地取证渲染
  // ------------------------------------------------------------
  function kv(k, vHtml, cls) {
    return `<div class="kv"><span class="k">${k}</span><span class="v ${cls || ''}">${vHtml}</span></div>`;
  }

  function renderAnalysis() {
    const a = state.analysis;
    if (!a) return;
    const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    let html = '';
    html += kv(lang === 'zh' ? '尺寸' : 'Dimensions', `${a.w} × ${a.h} px`);
    html += kv(lang === 'zh' ? '格式 / 大小' : 'Format / size', `${a.container} · ${a.mime.replace('image/', '')} · ${fmtSize(a.size)}`);

    const { aHash, dHash, pHash } = a.hashes;
    const hashRow = (label, val) => `
      <div class="kv"><span class="k">${label}</span>
      <span class="v mono" title="click to copy" onclick="navigator.clipboard && navigator.clipboard.writeText('${val}')">${val}<span class="copy-tip">⧉</span></span></div>`;
    html += hashRow('aHash', aHash) + hashRow('dHash', dHash) + hashRow('pHash (DCT)', pHash);

    if (a.exif) {
      const priority = ['Make', 'Model', 'LensModel', 'DateTimeOriginal', 'DateTime', 'Software', 'Artist', 'Copyright', 'ImageDescription'];
      const seen = new Set();
      for (const key of [...priority, ...Object.keys(a.exif)]) {
        if (seen.has(key)) continue;
        seen.add(key);
        const v = a.exif[key];
        if (v === undefined || v === '' || Array.isArray(v)) continue;
        if (key === 'GPSDecimal') {
          const link = a.exif.GPSMapLink ? `<a href="${esc(a.exif.GPSMapLink)}" target="_blank" rel="noopener">${esc(v)} ↗</a>` : esc(v);
          html += kv('📍 GPS', link + `<div style="color:var(--warn)">${lang === 'zh' ? '（敏感隐私数据，注意脱敏）' : '(sensitive — strip before sharing)'}</div>`, 'warn');
          continue;
        }
        if (priority.includes(key) || ['Title', 'Author', 'Description'].includes(key)) {
          html += kv(esc(key), esc(v));
        }
      }
    } else {
      html += kv(lang === 'zh' ? '元数据' : 'Metadata', lang === 'zh' ? '未发现 EXIF（常见于网络转载图/截图）' : 'No EXIF found (typical for re-uploaded/web images)');
    }
    if (a.hasXmp) html += kv('XMP', lang === 'zh' ? '检测到 XMP 数据块' : 'XMP block detected');
    $('#analysis-body').innerHTML = html;

    $('#file-meta').textContent =
      `${state.fileName} · ${fmtSize(a.size)} · ${a.w}×${a.h}` + (state.remoteUrl ? ` · URL: ${state.remoteUrl}` : '');
  }

  // ------------------------------------------------------------
  // 引擎网格
  // ------------------------------------------------------------
  function renderEngineGrid() {
    const grid = $('#engine-grid');
    const hasUrl = !!state.remoteUrl;
    grid.innerHTML = ENGINES.filter((e) => !e.keywordOnly).map((e) => {
      const badges = [
        e.region === 'cn' ? '<span class="badge cn">中文</span>' : '',
        e.region === 'jp' ? '<span class="badge jp">ACG</span>' : '',
        e.category === 'article' ? '<span class="badge article">文章</span>' : '',
        e.category === 'anime' ? '<span class="badge anime">二次元</span>' : '',
        e.serverProvider ? `<span class="badge server">${lang === 'zh' ? '聚合' : 'agg'}</span>` : '',
      ].join('');
      const urlBtn = hasUrl && e.byUrl
        ? `<button data-act="url" data-id="${e.id}">🔗 ${t('searchByImg')}</button>` : '';
      const upBtn = e.byUpload
        ? `<button data-act="upload" data-id="${e.id}">⬆ ${t('openUpload')}</button>` : '';
      return `
        <div class="engine-card">
          <div class="e-head"><span class="e-name">${e.nameZh || e.name}</span><span class="e-badges">${badges}</span></div>
          <div class="e-strength">${lang === 'zh' ? e.strength.zh : e.strength.en}</div>
          <div class="e-actions">${urlBtn}${upBtn}</div>
        </div>`;
    }).join('');
  }

  function renderKeywordGrid() {
    const grid = $('#keyword-engines');
    grid.innerHTML = ENGINES.filter((e) => e.byKeyword).map((e) => `
      <div class="engine-card">
        <div class="e-head"><span class="e-name">${e.nameZh || e.name}</span></div>
        <div class="e-actions"><button data-act="kw" data-id="${e.id}">${t('kwGo')}</button></div>
      </div>`).join('');
  }

  $('#engine-grid').addEventListener('click', onEngineAction);
  $('#keyword-engines').addEventListener('click', onEngineAction);

  function onEngineAction(ev) {
    const btn = ev.target.closest('button[data-act]');
    if (!btn) return;
    const engine = ENGINES.find((e) => e.id === btn.dataset.id);
    if (!engine) return;
    if (btn.dataset.act === 'url' && state.remoteUrl) {
      window.open(engine.byUrl(state.remoteUrl), '_blank', 'noopener');
    } else if (btn.dataset.act === 'upload' && engine.byUpload) {
      window.open(engine.byUpload, '_blank', 'noopener');
    } else if (btn.dataset.act === 'kw') {
      const kw = $('#keyword-input').value.trim();
      if (!kw) { $('#keyword-input').focus(); return; }
      window.open(engine.byKeyword(kw), '_blank', 'noopener');
    }
  }

  $('#btn-open-url-engines').addEventListener('click', () => {
    if (!state.remoteUrl) { toast(t('noImage')); return; }
    const urls = ENGINES.filter((e) => !e.keywordOnly && e.byUrl).map((e) => e.byUrl(state.remoteUrl));
    urls.forEach((u, i) => setTimeout(() => window.open(u, '_blank', 'noopener'), i * 350));
  });

  $('#btn-copy-links').addEventListener('click', () => {
    const lines = [];
    if (state.remoteUrl) {
      for (const e of ENGINES.filter((x) => !x.keywordOnly && x.byUrl)) {
        lines.push(`${e.name}: ${e.byUrl(state.remoteUrl)}`);
      }
    }
    for (const e of ENGINES.filter((x) => x.byUpload)) {
      lines.push(`${e.name} (upload): ${e.byUpload}`);
    }
    if (state.agg) {
      for (const [name, r] of Object.entries(state.agg.results)) {
        lines.push(`${name} (server): ${r.link}`);
      }
    }
    copyText(lines.join('\n'));
  });

  // ------------------------------------------------------------
  // 服务端聚合
  // ------------------------------------------------------------
  async function ensureUploaded() {
    if (state.uploadedId || !state.file || state.remoteUrl) return state.uploadedId;
    const resp = await fetch('/api/img', {
      method: 'POST',
      headers: { 'Content-Type': state.file.type || 'image/jpeg' },
      body: state.file,
    });
    const j = await resp.json();
    if (!j.id) throw new Error(j.error || 'upload failed');
    state.uploadedId = j.id;
    return j.id;
  }

  $('#btn-aggregate').addEventListener('click', async () => {
    if (!state.file && !state.remoteUrl) { toast(t('noImage')); return; }
    if (state.health && !state.health.ok) { toast(t('serverDown')); return; }
    const btn = $('#btn-aggregate');
    btn.disabled = true;
    btn.textContent = t('aggregateBusy');
    $('#agg-status').textContent = '';
    try {
      let body;
      if (state.remoteUrl && !state.file) {
        body = { url: state.remoteUrl };
      } else {
        const id = await ensureUploaded();
        body = { id, url: state.remoteUrl || undefined };
      }
      const resp = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!resp.ok) throw new Error(await resp.text());
      state.agg = await resp.json();
      state.activeTab = 'all';
      renderResults();
      $('#sec-results').hidden = false;
      $('#sec-results').scrollIntoView({ behavior: 'smooth', block: 'start' });
      const okCount = Object.values(state.agg.results).filter((r) => r.items.length).length;
      $('#agg-status').textContent = t('aggDone')(okCount, !okCount) + ` · ${new Date(state.agg.ts).toLocaleString()}`;
      saveHistory();
    } catch (e) {
      toast((state.health && state.health.ok ? '' : t('serverDown') + ' ') + String(e.message || e).slice(0, 90));
    } finally {
      btn.disabled = false;
      btn.textContent = t('aggregate');
    }
  });

  function mergedItems() {
    if (!state.agg) return [];
    const all = [];
    for (const [name, r] of Object.entries(state.agg.results)) {
      for (const it of r.items) all.push({ ...it, engine: name });
    }
    const seen = new Set();
    return all.filter((it) => (seen.has(it.url) ? false : (seen.add(it.url), true)));
  }

  function renderResults() {
    const items = mergedItems().map((it) => ({ ...it, tag: classifyUrl(it.url) || 'web' }));
    const counts = { all: items.length };
    for (const g of DOMAIN_TAGS) counts[g.tag] = 0;
    for (const it of items) counts[it.tag] = (counts[it.tag] || 0) + 1;

    $('#result-tabs').innerHTML = ['all', ...DOMAIN_TAGS.map((g) => g.tag)]
      .filter((tag) => tag === 'all' || counts[tag] > 0)
      .map((tag) => `<button class="tab ${state.activeTab === tag ? 'active' : ''}" data-tab="${tag}">${t('tabs')[tag]}<span class="cnt">${counts[tag]}</span></button>`)
      .join('');

    const shown = items.filter((it) => state.activeTab === 'all' || it.tag === state.activeTab);
    if (!shown.length) {
      $('#result-list').innerHTML = `<div class="empty-tip">${t('hintNoResults')}</div>`;
    } else {
      const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
      $('#result-list').innerHTML = shown.map((it, idx) => {
        const host = (() => { try { return new URL(it.url).hostname; } catch { return ''; } })();
        const tagLabel = t('tabs')[it.tag] || it.tag;
        const thumb = it.thumb
          ? `<img class="r-thumb" src="${esc(it.thumb)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">`
          : `<div class="r-thumb placeholder">🖼</div>`;
        return `
        <div class="result-item">
          ${thumb}
          <div class="r-main">
            <div class="r-title"><a href="${esc(it.url)}" target="_blank" rel="noopener">${esc(it.title || host || it.url)}</a></div>
            <div class="r-url">${esc(it.url)}</div>
            <div class="r-badges"><span class="badge">${tagLabel}</span><span class="badge">${it.engine}</span><span class="badge">${esc(host)}</span></div>
          </div>
        </div>`;
      }).join('');
    }
  }

  $('#result-tabs').addEventListener('click', (ev) => {
    const tab = ev.target.closest('.tab');
    if (!tab) return;
    state.activeTab = tab.dataset.tab;
    renderResults();
  });

  // ------------------------------------------------------------
  // 报告导出
  // ------------------------------------------------------------
  function buildReport() {
    const a = state.analysis;
    const now = new Date();
    const lines = [];
    lines.push(`# ${t('reportTitle')} / PicTrace Report`);
    lines.push('');
    lines.push(`> 生成时间 Generated: ${now.toISOString()}  `);
    lines.push(`> 工具 Tool: PicTrace v${VERSION} — https://github.com/xiaoanping-101/pictrace  `);
    lines.push(`> 目标图片 Image: ${state.fileName}${state.remoteUrl ? ` (${state.remoteUrl})` : ' (local file)'} ${a ? `${a.w}×${a.h}, ${a.container}, ${fmtSize(a.size)}` : ''}`);
    if (a) {
      lines.push(`> 感知哈希 Perceptual hashes: pHash=${a.hashes.pHash} dHash=${a.hashes.dHash} aHash=${a.hashes.aHash}`);
      const ex = a.exif && a.exif.Make ? `; EXIF: ${a.exif.Make} ${a.exif.Model || ''} ${a.exif.DateTimeOriginal || a.exif.DateTime || ''}` : '';
      if (ex) lines.push(`> 元数据 Metadata:${ex}`);
    }
    lines.push('');
    lines.push('## 1. 检索引擎链接 / Engine links');
    lines.push('');
    if (state.remoteUrl) {
      for (const e of ENGINES.filter((x) => !x.keywordOnly && x.byUrl)) {
        lines.push(`- [${e.name}](${e.byUrl(state.remoteUrl)}) — ${e.nameZh}`);
      }
    }
    for (const e of ENGINES.filter((x) => x.byUpload)) {
      lines.push(`- [${e.name} · 上传页](${e.byUpload}) — ${e.nameZh}`);
    }
    if (state.agg) {
      lines.push('');
      lines.push('## 2. 服务端聚合命中 / Server-side hits');
      lines.push('');
      const items = mergedItems();
      if (!items.length) {
        lines.push('_（无服务端命中，请通过上方引擎链接人工核验）_');
      } else {
        const groups = {};
        for (const it of items) {
          const tag = classifyUrl(it.url) || 'web';
          (groups[tag] = groups[tag] || []).push(it);
        }
        let n = 0;
        for (const tag of [...DOMAIN_TAGS.map((g) => g.tag), 'web']) {
          if (!groups[tag]) continue;
          const label = (t('tabs')[tag] || tag);
          lines.push(`### ${label}`);
          lines.push('');
          for (const it of groups[tag]) {
            n++;
            let host = '';
            try { host = new URL(it.url).hostname; } catch { /* ignore */ }
            // 引用条目格式：序号. 标题. 站点. URL (检索于 …, via 引擎)
            lines.push(`${n}. ${it.title || host}. ${host}. <${it.url}> (retrieved ${now.toISOString().slice(0, 10)}, via ${it.engine})`);
          }
          lines.push('');
        }
      }
    }
    lines.push('---');
    lines.push('');
    lines.push('引用说明 Citation note: 以上条目按 GB/T 7714 顺序编码格式要点生成（作者/题名/出处/引用日期），发布引用时请按目标出版物规范复核。This report was generated by PicTrace (MIT). Verify links before formal citation.');
    lines.push('');
    return lines.join('\n');
  }

  $('#btn-export-report').addEventListener('click', () => {
    if (!state.analysis) { toast(t('noImage')); return; }
    download(`pictrace-report-${Date.now()}.md`, buildReport(), 'text/markdown;charset=utf-8');
  });

  $('#btn-export-json').addEventListener('click', () => {
    if (!state.analysis) { toast(t('noImage')); return; }
    const payload = {
      tool: `PicTrace v${VERSION}`, generated: new Date().toISOString(),
      image: { name: state.fileName, url: state.remoteUrl, ...state.analysis },
      agg: state.agg,
    };
    download(`pictrace-data-${Date.now()}.json`, JSON.stringify(payload, null, 2), 'application/json');
  });

  // ------------------------------------------------------------
  // 本地图库（IndexedDB）
  // ------------------------------------------------------------
  function idb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('pictrace', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('images', { keyPath: 'id', autoIncrement: true });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  function thumbDataUrl(img, max = 112) {
    const c = document.createElement('canvas');
    const scale = Math.min(max / img.naturalWidth, max / img.naturalHeight, 1);
    c.width = Math.max(1, Math.round(img.naturalWidth * scale));
    c.height = Math.max(1, Math.round(img.naturalHeight * scale));
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.72);
  }

  $('#btn-library-add').addEventListener('click', async () => {
    if (!state.analysis) { toast(t('noImage')); return; }
    const db = await idb();
    const rec = {
      name: state.fileName, url: state.remoteUrl || null,
      hashes: state.analysis.hashes, thumb: thumbDataUrl(state.imgEl), ts: Date.now(),
    };
    // 语义模型就绪时顺带保存 CLIP 嵌入（旧记录没有向量属正常，重新加入即可）
    if (clipReady() && state.imgEl) {
      try { rec.clip = window.PicTraceCLIP.serialize(await window.PicTraceCLIP.embed(state.imgEl)); } catch { /* 忽略 */ }
    }
    db.transaction('images', 'readwrite').objectStore('images').add(rec);
    toast(t('libAdded'));
    checkLibraryMatch();
  });

  async function checkLibraryMatch() {
    if (!state.analysis) return;
    let recs = [];
    try {
      const db = await idb();
      recs = await new Promise((res) => {
        const rq = db.transaction('images').objectStore('images').getAll();
        rq.onsuccess = () => res(rq.result || []);
        rq.onerror = () => res([]);
      });
    } catch { return; }
    const cur = state.analysis.hashes;
    const curVec = state.clipVec || null;
    const CLIP = window.PicTraceCLIP;
    const hits = recs
      .map((r) => {
        const dist = Math.min(
          window.PicTraceHash.hamming(cur.pHash, r.hashes.pHash),
          window.PicTraceHash.hamming(cur.dHash, r.hashes.dHash),
        );
        const sem = curVec && r.clip ? CLIP.cosine(curVec, CLIP.deserialize(r.clip)) : null;
        return { ...r, dist, sem };
      })
      .filter((r) => r.dist <= 10 || (r.sem !== null && r.sem >= 0.75))
      .sort((a, b) => (b.sem ?? -1) - (a.sem ?? -1) || a.dist - b.dist)
      .slice(0, 8);
    const card = $('#lib-match-card');
    if (!hits.length) { card.hidden = true; return; }
    card.hidden = false;
    $('#lib-matches').innerHTML = hits.map((r) => {
      const metrics = [];
      if (r.sem !== null) metrics.push(`${t('semSim')} ${(r.sem * 100).toFixed(1)}%`);
      if (r.dist <= 10) metrics.push(`hamming ≈ ${r.dist}`);
      return `
      <div class="lib-hit">
        <img src="${r.thumb}" alt="">
        <div>${r.name}<br><span class="dist">${metrics.join(' · ') || '—'}${r.url ? ` · <a href="${r.url}" target="_blank" rel="noopener">来源</a>` : ''}</span></div>
      </div>`;
    }).join('');
  }

  // ------------------------------------------------------------
  // AI 语义模型（CLIP ViT-B/32，可选、本地推理）
  // ------------------------------------------------------------
  const clip = window.PicTraceCLIP;
  const clipReady = () => clip && clip.state.status === 'ready';

  function renderClipStatus() {
    const el = $('#clip-status');
    const s = clip.state;
    if (s.status === 'loading') el.textContent = `${t('clipLoading')} ${s.progress || ''}`.trim();
    else if (s.status === 'ready') el.textContent = t('clipReady') + (s.backend ? ` · ${s.backend}` : '');
    else if (s.status === 'error') el.textContent = t('clipFailed')(s.error);
    else el.textContent = '';
    $('#btn-clip-embed').hidden = !clipReady();
    $('#btn-clip-enable').disabled = s.status === 'loading';
    $('#btn-clip-enable').textContent = s.status === 'loading' ? t('clipLoading') : t('clipEnable');
  }

  $('#btn-clip-enable').addEventListener('click', async () => {
    renderClipStatus();
    try {
      await clip.enable(renderClipStatus);
      renderClipStatus();
    } catch { renderClipStatus(); }
  });

  $('#btn-clip-embed').addEventListener('click', async () => {
    if (!state.imgEl || !clipReady()) { toast(t('noImage')); return; }
    const btn = $('#btn-clip-embed');
    btn.disabled = true;
    const old = btn.textContent;
    btn.textContent = t('clipEmbedBusy');
    try {
      state.clipVec = await clip.embed(state.imgEl);
      toast(t('clipEmbedDone'));
      checkLibraryMatch();
    } catch (e) {
      toast(String(e.message || e).slice(0, 80));
    } finally {
      btn.disabled = false;
      btn.textContent = old;
    }
  });

  // ------------------------------------------------------------
  // 内容识别与相似检索（CLIP 零样本分类 + 实体路由）
  // ------------------------------------------------------------
  function updatePlatformLinks(kw) {
    const P = window.PicTraceRecognize.PLATFORMS;
    $('#rec-platforms').innerHTML = P.map((p) => {
      const href = kw ? p.url(kw) : null;
      const inner = `${p.name}<span class="cat">${t('platformCat')[p.category] || p.category}</span>`;
      return href
        ? `<a class="cat-${p.category}" href="${href}" target="_blank" rel="noopener">${inner}</a>`
        : `<a class="cat-${p.category}" aria-disabled="true" title="${t('kwFilled')}">${inner}</a>`;
    }).join('');
  }

  function renderRecognize(res) {
    const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    $('#recognize-result').hidden = false;

    // 置信度条
    $('#rec-labels').innerHTML = res.top.map((l) => {
      const name = lang === 'zh' ? l.zh : l.en.replace(/^(a|an)\s+/, '');
      return `
      <div class="label-bar">
        <span class="lb-name" title="${esc(l.en)}">${esc(name)}</span>
        <span class="lb-track"><span class="lb-fill" style="width:${Math.max(2, Math.round(l.score * 100))}%"></span></span>
        <span class="lb-score">${(l.score * 100).toFixed(1)}%</span>
      </div>`;
    }).join('');

    // 建议检索词 chips
    const chips = [];
    const seen = new Set();
    for (const l of res.top) {
      for (const q of [l.qzh, l.qen]) {
        if (q && !seen.has(q)) { seen.add(q); chips.push(q); }
      }
    }
    $('#rec-chips').innerHTML = chips.length
      ? chips.map((c) => `<button class="chip" data-q="${esc(c)}">${esc(c)}</button>`).join('')
      : `<span class="hint">${t('recNoKw')}</span>`;

    // 实体路由引擎
    if (res.route) {
      $('#rec-route-wrap').hidden = false;
      $('#rec-route-title').textContent = res.route.zh;
      $('#rec-route-engines').innerHTML = res.route.engines.map((id) => {
        const e = ENGINES.find((x) => x.id === id);
        if (!e) return '';
        const href = state.remoteUrl && e.byUrl ? e.byUrl(state.remoteUrl) : e.byUpload || '';
        if (!href) return '';
        return `<a class="chip" href="${esc(href)}" target="_blank" rel="noopener">🔍 ${esc(e.nameZh || e.name)} ↗</a>`;
      }).join('');
      $('#rec-privacy-note').hidden = !res.route.privacyNote;
      if (res.route.privacyNote) $('#rec-privacy-note').textContent = t('recPersonNote');
    } else {
      $('#rec-route-wrap').hidden = true;
    }

    // 平台直达（默认用第一个建议词）
    updatePlatformLinks(chips[0] || $('#keyword-input').value.trim());
    state.recQueries = chips;
  }

  $('#rec-chips').addEventListener('click', (ev) => {
    const c = ev.target.closest('.chip[data-q]');
    if (!c) return;
    $('#keyword-input').value = c.dataset.q;
    updatePlatformLinks(c.dataset.q);
    toast(t('kwFilled'));
  });

  $('#btn-recognize').addEventListener('click', async () => {
    if (!state.imgEl) { toast(t('noImage')); return; }
    const btn = $('#btn-recognize');
    btn.disabled = true;
    const old = btn.textContent;
    try {
      if (!clipReady()) {
        btn.textContent = t('clipLoading');
        await clip.enable(renderClipStatus);
        renderClipStatus();
      }
      btn.textContent = t('recBusy');
      const res = await window.PicTraceRecognize.recognize(state.imgEl);
      state.lastRec = res;
      renderRecognize(res);
    } catch (e) {
      toast(String(e.message || e).slice(0, 90));
    } finally {
      btn.disabled = false;
      btn.textContent = t('recGo');
    }
  });

  // ------------------------------------------------------------
  // 历史（localStorage）
  // ------------------------------------------------------------
  function saveHistory() {
    if (!state.analysis) return;
    try {
      const list = JSON.parse(localStorage.getItem('pt-history') || '[]');
      list.unshift({
        ts: Date.now(),
        name: state.fileName,
        url: state.remoteUrl,
        phash: state.analysis.hashes.pHash,
        thumb: thumbDataUrl(state.imgEl, 84),
        hits: state.agg ? mergedItems().length : null,
      });
      localStorage.setItem('pt-history', JSON.stringify(list.slice(0, 16)));
      renderHistory();
    } catch { /* 存储满时静默失败 */ }
  }

  function renderHistory() {
    let list = [];
    try { list = JSON.parse(localStorage.getItem('pt-history') || '[]'); } catch { /* ignore */ }
    $('#sec-history').hidden = !list.length;
    $('#history-list').innerHTML = list.map((h, i) => `
      <div class="history-item" data-i="${i}" title="${h.name}">
        <img src="${h.thumb}" alt="">
        <div class="h-meta">${h.name.slice(0, 14)}<br>${new Date(h.ts).toLocaleDateString()} ${h.hits !== null ? `· ${h.hits} hits` : ''}</div>
      </div>`).join('');
  }

  $('#history-list').addEventListener('click', (ev) => {
    const item = ev.target.closest('.history-item');
    if (!item) return;
    let list = [];
    try { list = JSON.parse(localStorage.getItem('pt-history') || '[]'); } catch { return; }
    const h = list[Number(item.dataset.i)];
    if (!h) return;
    if (h.url) $('#url-input').value = h.url;
    if (h.url) loadFromUrl(h.url);
  });

  $('#btn-clear-history').addEventListener('click', () => {
    localStorage.removeItem('pt-history');
    renderHistory();
  });

  // ------------------------------------------------------------
  // 输入事件：拖拽 / 点击 / 粘贴 / URL
  // ------------------------------------------------------------
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.style.display = 'none';
  document.body.appendChild(fileInput);

  const dz = $('#dropzone');
  dz.addEventListener('click', () => fileInput.click());
  dz.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') fileInput.click(); });
  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) loadBlob(fileInput.files[0], fileInput.files[0].name);
    fileInput.value = '';
  });
  ['dragenter', 'dragover'].forEach((evName) => dz.addEventListener(evName, (e) => { e.preventDefault(); dz.classList.add('dragover'); }));
  ['dragleave', 'drop'].forEach((evName) => dz.addEventListener(evName, (e) => { e.preventDefault(); dz.classList.remove('dragover'); }));
  dz.addEventListener('drop', (e) => {
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f && f.type.startsWith('image/')) loadBlob(f, f.name);
    else {
      const url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
      if (url && /^https?:\/\//.test(url)) loadFromUrl(url.trim());
    }
  });
  document.addEventListener('paste', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    const items = e.clipboardData && e.clipboardData.items;
    if (!items) return;
    for (const it of items) {
      if (it.type.startsWith('image/')) {
        const f = it.getAsFile();
        if (f) loadBlob(f, `pasted-${Date.now()}.${(f.type.split('/')[1] || 'png')}`);
        return;
      }
    }
  });

  async function loadFromUrl(url) {
    try {
      // 通过服务端代理取图，绕过跨域限制（本地取证仍全部在浏览器完成）
      let blob;
      if (state.health && state.health.ok) {
        const r = await fetch(`/api/proxy?url=${encodeURIComponent(url)}`);
        if (!r.ok) throw new Error(`proxy ${r.status}`);
        blob = await r.blob();
      } else {
        const r = await fetch(url, { mode: 'cors' });
        blob = await r.blob();
      }
      let name = 'image';
      try { name = new URL(url).pathname.split('/').pop() || 'image'; } catch { /* ignore */ }
      await loadBlob(blob, name, url);
    } catch {
      toast(lang === 'zh' ? '无法读取该 URL 的图片（跨域或失效）' : 'Cannot fetch this URL (CORS or dead link)');
    }
  }

  $('#url-load').addEventListener('click', () => {
    const u = $('#url-input').value.trim();
    if (/^https?:\/\//i.test(u)) loadFromUrl(u);
  });
  $('#url-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#url-load').click(); });

  $('#btn-reselect').addEventListener('click', () => {
    $('#sec-workbench').hidden = true;
    $('#sec-input').scrollIntoView({ behavior: 'smooth' });
    dz.click();
  });

  $('#lang-toggle').addEventListener('click', () => {
    lang = lang === 'zh' ? 'en' : 'zh';
    localStorage.setItem('pt-lang', lang);
    applyLang();
  });

  // ------------------------------------------------------------
  // 初始化
  // ------------------------------------------------------------
  async function init() {
    applyLang();
    renderKeywordGrid();
    renderHistory();
    renderClipStatus();
    try {
      const r = await fetch('/api/health');
      state.health = await r.json();
    } catch {
      state.health = { ok: false };
    }
    if (state.health && state.health.ok) {
      $('#mode-note').textContent = state.remoteUrl ? t('urlModeTip') : t('fileModeTip');
    } else {
      $('#btn-aggregate').disabled = true;
      $('#btn-aggregate').title = t('serverDown');
    }
  }
  init();
})();
