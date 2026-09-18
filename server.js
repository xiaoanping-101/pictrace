/**
 * PicTrace（溯图）— 零依赖 Node.js 服务器
 * ------------------------------------------------------------
 * 职责：
 *  1. 托管 public/ 下的前端静态文件（核心体验：本地分析 + 引擎深链）
 *  2. 可选的"服务端聚合"：代用户向各识图引擎上传图片并尽力解析结果
 *     （引擎反爬策略随时可能变化，所有提供器均为尽力而为，失败时优雅降级为深链）
 *  3. 临时图片存取：POST /api/img 上传 → GET /img/<id> 引用（仅存内存，30 分钟过期）
 *
 * 运行：node server.js   （需 Node >= 18，无任何第三方依赖）
 * 环境变量：PORT（默认 4173）、PICTRACE_FETCH=0 可关闭服务端抓取（纯静态模式）
 */

'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.PORT || 4173);
const FETCH_ENABLED = process.env.PICTRACE_FETCH !== '0';
const PUBLIC_DIR = path.join(__dirname, 'public');
const IMAGE_TTL_MS = 30 * 60 * 1000;   // 上传图片仅在内存中保留 30 分钟
const PROVIDER_TIMEOUT_MS = 15 * 1000; // 单个引擎提供器的抓取超时

// ---------------------------------------------------------------
// 临时图片仓库（内存）
// ---------------------------------------------------------------
const imageStore = new Map(); // id -> {buffer, mime, ts}
setInterval(() => {
  const now = Date.now();
  for (const [id, rec] of imageStore) {
    if (now - rec.ts > IMAGE_TTL_MS) imageStore.delete(id);
  }
}, 60 * 1000).unref();

// ---------------------------------------------------------------
// 小工具
// ---------------------------------------------------------------
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.md': 'text/markdown; charset=utf-8',
  '.woff2': 'font/woff2',
};

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function readBody(req, limitBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > limitBytes) {
        reject(new Error('payload too large'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

/** 构造 multipart/form-data 请求体（无需第三方库） */
function buildMultipart(fields, files) {
  const boundary = '----PicTraceFormBoundary' + crypto.randomBytes(8).toString('hex');
  const parts = [];
  for (const [name, value] of Object.entries(fields || {})) {
    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`
      )
    );
  }
  for (const [name, file] of Object.entries(files || {})) {
    const filename = file.filename || 'image';
    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${name}"; filename="${filename}"\r\nContent-Type: ${file.contentType || 'application/octet-stream'}\r\n\r\n`
      ),
      file.buffer,
      Buffer.from('\r\n')
    );
  }
  parts.push(Buffer.from(`--${boundary}--\r\n`));
  return { body: Buffer.concat(parts), contentType: `multipart/form-data; boundary=${boundary}` };
}

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

/** 带超时的 GET（返回文本） */
async function getText(url, headers) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), PROVIDER_TIMEOUT_MS);
  try {
    const resp = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8', ...(headers || {}) },
      signal: ctrl.signal,
      redirect: 'follow',
    });
    return await resp.text();
  } finally {
    clearTimeout(timer);
  }
}

/** 带超时的 multipart POST（返回文本） */
async function postMultipart(url, fields, files, headers) {
  const { body, contentType } = buildMultipart(fields, files);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), PROVIDER_TIMEOUT_MS);
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'User-Agent': UA,
        'Content-Type': contentType,
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        ...(headers || {}),
      },
      body,
      signal: ctrl.signal,
      redirect: 'follow',
    });
    return await resp.text();
  } finally {
    clearTimeout(timer);
  }
}

/** 结果项归一化：{title, url, thumb?, engine} */
function item(engine, url, title, thumb) {
  return { engine, url, title: (title || '').trim().slice(0, 200), thumb: thumb || null };
}

function isJunkLink(u) {
  if (!u) return true;
  try {
    const host = new URL(u).hostname;
    return /(^|\.)((yandex|bing|bing\.net|microsoft|baidu|baidujs|bdstatic|bdimg)\.[a-z.]+)$/i.test(host);
  } catch {
    return true;
  }
}

function dedupeBy(items, keyFn) {
  const seen = new Set();
  return items.filter((it) => {
    const k = keyFn(it);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// ---------------------------------------------------------------
// 引擎提供器（尽力而为，允许失败）
// 借鉴并致谢：dessant/search-by-image 的引擎清单（URL 模板为公开事实）
// 以及社区已有的 Bing iusc / Baidu graph 抓取实践
// ---------------------------------------------------------------

/** Yandex：上传图片 → 解析 CBIR 站点列表；或按 URL 检索 */
async function providerYandex({ buffer, mime, url }) {
  let html;
  if (url) {
    html = await getText(
      `https://yandex.com/images/search?rpt=imageview&url=${encodeURIComponent(url)}`
    );
  } else {
    html = await postMultipart(
      'https://yandex.com/images/search?rpt=imageview&urg=1',
      {},
      { upfile: { buffer, contentType: mime || 'image/jpeg', filename: 'image.jpg' } }
    );
  }
  const items = [];
  // Yandex CBIR 结果页中，外部站点条目形如
  // <a class="serp-item__link" href="https://example.com/page" ...>标题</a>
  const re = /<a[^>]+class="serp-item__link"[^>]+href="(https?:\/\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const title = m[2].replace(/<[^>]+>/g, ' ');
    if (!isJunkLink(m[1])) items.push(item('yandex', m[1], title));
  }
  return dedupeBy(items, (it) => it.url).slice(0, 30);
}

/** Bing：SBI 上传（SBIFfile 字段）或 imgurl: 检索，解析 .iusc 中的 JSON */
async function providerBing({ buffer, mime, url }) {
  let html;
  if (url) {
    html = await getText(
      `https://www.bing.com/images/search?view=detailv2&iss=sbi&q=imgurl:${encodeURIComponent(url)}`
    );
  } else {
    html = await postMultipart(
      'https://www.bing.com/images/search?form=IRFLTR&iss=sbi&q=',
      {},
      { SBIFfile: { buffer, contentType: mime || 'image/jpeg', filename: 'image.jpg' } }
    );
  }
  const items = [];
  // .iusc 元素的 m 属性内嵌 JSON：murl=原图、purl=出处页、t=标题
  const re = /"murl":"(https?:\/\/[^"]+)","purl":"(https?:\/\/[^"]+)","t":"((?:[^"\\]|\\.)*)"/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const purl = m[2].replace(/\\u0026/g, '&').replace(/\\\//g, '/');
    const title = m[3].replace(/\\u0026/g, '&');
    if (!isJunkLink(purl)) items.push(item('bing', purl, title, m[1]));
  }
  return dedupeBy(items, (it) => it.url).slice(0, 30);
}

/** 百度识图：graph.baidu.com 上传 → sign → pcsimi 接口取相似图与来源页 */
async function providerBaidu({ buffer, mime, url }) {
  if (!buffer) return []; // URL 模式下百度 sign 流程不稳定，仅支持上传模式
  const uploadResp = await postMultipart(
    'https://graph.baidu.com/upload',
    { tn: 'pc', from: 'pc', image_source: 'PC_UPLOAD_FILE', range: '{"page_from": "searchIndex"}' },
    { image: { buffer, contentType: mime || 'image/jpeg', filename: 'image.jpg' } },
    { Referer: 'https://graph.baidu.com/pcpage/index?tpl_from=pc', Origin: 'https://graph.baidu.com' }
  );
  let sign = '';
  try {
    const j = JSON.parse(uploadResp);
    sign = j.data && j.data.sign;
  } catch { /* 忽略，交给上层降级 */ }
  if (!sign) return [];
  const simiText = await getText(
    `https://graph.baidu.com/ajax/pcsimi?sign=${encodeURIComponent(sign)}&f=all`,
    { Referer: `https://graph.baidu.com/pcpage/index?tpl_from=pc&sign=${encodeURIComponent(sign)}` }
  );
  const items = [];
  try {
    const j = JSON.parse(simiText);
    const list = (j.data && j.data.list) || [];
    for (const rec of list) {
      const u = rec.sourceUrl || rec.fromUrl || '';
      if (!isJunkLink(u)) {
        items.push(item('baidu', u, rec.title || rec.dispName || '', rec.thumbUrl || null));
      }
    }
  } catch { /* 忽略 */ }
  return dedupeBy(items, (it) => it.url).slice(0, 30);
}

/** SauceNAO：网页表单可直接服务端 POST，返回可解析的结果 HTML（实测可用，注意其短时限流策略） */
async function providerSauceNao({ buffer, mime, url }) {
  let html;
  if (buffer) {
    html = await postMultipart('https://saucenao.com/search.php', {}, { file: { buffer, contentType: mime || 'image/jpeg', filename: 'image.jpg' } });
  } else {
    html = await getText(`https://saucenao.com/search.php?url=${encodeURIComponent(url)}`);
  }
  const items = [];
  // 结果块以 <div class="result"> 分隔；标题、相似度、首个"非 saucenao 内部"的 linkify 外链
  const chunks = html.split('<div class="result"');
  for (let i = 1; i < chunks.length; i++) {
    const c = chunks[i];
    const titleM = c.match(/<div class="resulttitle"><strong>([\s\S]*?)<\/strong>/);
    const hrefs = [...c.matchAll(/<a\b[^>]*\bclass="linkify"[^>]*>/g)]
      .map((m) => (m[0].match(/href="(https?:\/\/[^"]+)"/) || [])[1])
      .filter(Boolean);
    const href = hrefs.find((h) => !/^https?:\/\/[^\/]*saucenao\.com\//i.test(h)) || hrefs[0];
    const simM = c.match(/resultsimilarityinfo">\s*(\d+(?:\.\d+)?%)/);
    if (href) {
      const title = (titleM ? titleM[1] : '').replace(/<[^>]+>/g, ' ').trim();
      const sim = simM ? simM[1] : '';
      items.push(item('saucenao', href, sim ? `${title} (${sim})` : title));
    }
  }
  return items.slice(0, 30);
}

/** IQDB：动漫图库聚合检索，网页表单可直接服务端 POST（实测可用） */
async function providerIqdb({ buffer, mime, url }) {
  let html;
  if (buffer) {
    html = await postMultipart('https://iqdb.org/', {}, { file: { buffer, contentType: mime || 'image/jpeg', filename: 'image.jpg' } });
  } else {
    html = await getText(`https://iqdb.org/?url=${encodeURIComponent(url)}`);
  }
  const items = [];
  // 每个命中是一个 <table>…NN% similar…</table>，内部含指向源图库的外链
  const tables = html.split('<table');
  for (const tb of tables) {
    const simM = tb.match(/(\d+)% similar/);
    if (!simM) continue;
    const links = [...tb.matchAll(/<a href="(https?:\/\/(?!iqdb\.org)[^"]+)"/g)].map((m) => m[1]);
    const external = links.find((l) => !/\/thu\//.test(l));
    if (external) {
      let host = '';
      try { host = new URL(external).hostname; } catch { /* ignore */ }
      items.push(item('iqdb', external, `${host} (${simM[1]}% similar)`));
    }
  }
  return items.slice(0, 20);
}

const PROVIDERS = {
  yandex: { fn: providerYandex, fallback: (p) => p.url || 'https://yandex.com/images/search?rpt=imageview&urg=1' },
  bing: { fn: providerBing, fallback: (p) => p.url ? `https://www.bing.com/images/search?view=detailv2&iss=sbi&q=imgurl:${encodeURIComponent(p.url)}` : 'https://www.bing.com/images' },
  baidu: { fn: providerBaidu, fallback: (p) => p.url || 'https://graph.baidu.com/pcpage/index?drag=1&tpl_from=pc' },
  saucenao: { fn: providerSauceNao, fallback: (p) => p.url ? `https://saucenao.com/search.php?url=${encodeURIComponent(p.url)}` : 'https://saucenao.com/' },
  iqdb: { fn: providerIqdb, fallback: (p) => p.url ? `https://iqdb.org/?url=${encodeURIComponent(p.url)}` : 'https://iqdb.org/' },
};

// ---------------------------------------------------------------
// HTTP 服务
// ---------------------------------------------------------------
const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const pathname = decodeURIComponent(u.pathname);

  // CORS 预检（便于前端本地调试跨端口）
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  // ---- API：健康检查 ----
  if (pathname === '/api/health') {
    const { version } = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
    return sendJson(res, 200, { ok: true, fetch: FETCH_ENABLED, version });
  }

  // ---- API：HF 模型权重中转（供 CLIP 语义模块；服务端出口对 hf-mirror 可达性最好）----
  if (pathname.startsWith('/api/hf/') && req.method === 'GET') {
    const rest = pathname.slice('/api/hf/'.length).replace(/^\/+/, '');
    if (!/^[\w.\-\/%]+$/i.test(rest) || rest.includes('..')) {
      return sendJson(res, 400, { error: 'invalid path' });
    }
    const target = `https://hf-mirror.com/${rest}${u.search || ''}`;
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 10 * 60 * 1000); // 大文件允许长传输
      const range = req.headers.range;
      const resp = await fetch(target, {
        headers: {
          'User-Agent': UA,
          ...(range ? { Range: range } : {}),
        },
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges, ETag, Location',
        'Cache-Control': 'public, max-age=86400',
      };
      for (const h of ['content-type', 'content-length', 'content-range', 'accept-ranges', 'etag', 'location']) {
        const v = resp.headers.get(h);
        if (v) headers[h] = v;
      }
      res.writeHead(resp.status, headers);
      const buf = Buffer.from(await resp.arrayBuffer());
      return res.end(buf);
    } catch (e) {
      return sendJson(res, 502, { error: String(e.message || e).slice(0, 120) });
    }
  }

  // ---- API：图片代理（让前端能对跨域图片做本地取证/载入）----
  if (pathname === '/api/proxy' && req.method === 'GET') {
    const target = u.searchParams.get('url');
    if (!target || !/^https?:\/\//i.test(target)) return sendJson(res, 400, { error: 'invalid url' });
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), PROVIDER_TIMEOUT_MS);
      const resp = await fetch(target, { headers: { 'User-Agent': UA, Referer: new URL(target).origin }, signal: ctrl.signal });
      clearTimeout(timer);
      const mime = resp.headers.get('content-type') || 'image/jpeg';
      if (!/^image\//i.test(mime)) return sendJson(res, 415, { error: 'not an image: ' + mime });
      const buf = Buffer.from(await resp.arrayBuffer());
      res.writeHead(resp.status, {
        'Content-Type': mime,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      });
      return res.end(buf);
    } catch (e) {
      return sendJson(res, 502, { error: String(e.message || e).slice(0, 120) });
    }
  }

  // ---- API：上传图片（原始字节体）----
  if (pathname === '/api/img' && req.method === 'POST') {
    try {
      const mime = (req.headers['content-type'] || 'image/jpeg').split(';')[0];
      if (!/^image\//i.test(mime)) return sendJson(res, 400, { error: 'content-type must be image/*' });
      const buffer = await readBody(req, 15 * 1024 * 1024);
      if (!buffer.length) return sendJson(res, 400, { error: 'empty body' });
      const id = crypto.randomBytes(10).toString('hex');
      imageStore.set(id, { buffer, mime, ts: Date.now() });
      return sendJson(res, 200, { id, url: `/img/${id}`, size: buffer.length });
    } catch (e) {
      return sendJson(res, 413, { error: e.message });
    }
  }

  // ---- 临时图片引用 ----
  if (pathname.startsWith('/img/') && req.method === 'GET') {
    const rec = imageStore.get(pathname.slice(5));
    if (!rec) return sendJson(res, 404, { error: 'expired or not found' });
    res.writeHead(200, {
      'Content-Type': rec.mime,
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
    });
    return res.end(rec.buffer);
  }

  // ---- API：服务端聚合检索 ----
  if (pathname === '/api/search' && req.method === 'POST') {
    let payload;
    try {
      payload = JSON.parse((await readBody(req, 1024 * 64)).toString('utf8') || '{}');
    } catch {
      return sendJson(res, 400, { error: 'invalid json' });
    }
    const wanted = Array.isArray(payload.engines) && payload.engines.length
      ? payload.engines.filter((e) => PROVIDERS[e])
      : Object.keys(PROVIDERS);

    const ctx = { url: payload.url || null };
    if (payload.id && imageStore.has(payload.id)) {
      const rec = imageStore.get(payload.id);
      ctx.buffer = rec.buffer;
      ctx.mime = rec.mime;
    } else if (payload.id) {
      return sendJson(res, 404, { error: 'image id expired, please re-upload' });
    }
    if (!ctx.buffer && !ctx.url) {
      return sendJson(res, 400, { error: 'need "id"(upload) or "url"' });
    }
    // 纯 URL 模式：服务端顺手下载一份字节，供"仅支持上传"的引擎（如百度）使用
    if (!ctx.buffer && ctx.url) {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), PROVIDER_TIMEOUT_MS);
        const resp = await fetch(ctx.url, { headers: { 'User-Agent': UA }, signal: ctrl.signal });
        clearTimeout(timer);
        ctx.mime = resp.headers.get('content-type') || 'image/jpeg';
        ctx.buffer = Buffer.from(await resp.arrayBuffer());
      } catch { /* 下载失败不影响 URL 型引擎 */ }
    }

    const jobs = wanted.map(async (name) => {
      const prov = PROVIDERS[name];
      if (!FETCH_ENABLED) {
        return { engine: name, status: 'disabled', link: prov.fallback(ctx), items: [] };
      }
      try {
        const items = await prov.fn(ctx);
        return {
          engine: name,
          status: items.length ? 'ok' : 'no_results',
          link: prov.fallback(ctx),
          items,
        };
      } catch (e) {
        // 引擎反爬/网络变化是常态：降级为深链，不打断其它引擎
        return { engine: name, status: 'error', link: prov.fallback(ctx), items: [], message: String(e.message || e).slice(0, 120) };
      }
    });

    const results = {};
    for (const r of await Promise.all(jobs)) {
      results[r.engine] = { status: r.status, link: r.link, message: r.message || null, items: r.items };
    }
    return sendJson(res, 200, { ts: new Date().toISOString(), results });
  }

  // ---- 静态文件 ----
  if (req.method === 'GET') {
    let rel = pathname === '/' ? '/index.html' : pathname;
    const filePath = path.normalize(path.join(PUBLIC_DIR, rel));
    if (!filePath.startsWith(PUBLIC_DIR)) {
      res.writeHead(403); return res.end('Forbidden');
    }
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('404 Not Found');
      }
      res.writeHead(200, {
        'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-cache',
      });
      res.end(data);
    });
    return;
  }

  res.writeHead(405);
  res.end('Method Not Allowed');
});

server.listen(PORT, () => {
  console.log('');
  console.log('  溯图 PicTrace 已启动 / PicTrace is running');
  console.log(`  ➜  http://127.0.0.1:${PORT}`);
  console.log(`  ➜  服务端聚合抓取: ${FETCH_ENABLED ? '已开启 (PICTRACE_FETCH=0 可关闭)' : '已关闭 (纯静态模式)'}`);
  if (process.env.NODE_USE_ENV_PROXY === '1') {
    console.log(`  ➜  出站代理: HTTPS_PROXY=${process.env.HTTPS_PROXY || process.env.https_proxy || '(未设置)'}`);
  } else {
    console.log('  ➜  提示：如需经代理访问国际引擎，可加环境变量 NODE_USE_ENV_PROXY=1 HTTPS_PROXY=http://127.0.0.1:7897');
  }
  console.log('');
});
