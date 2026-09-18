/**
 * PicTrace 可选本地语义模型模块（默认关闭，按需加载）
 * ------------------------------------------------------------
 * 模型：CLIP ViT-B/32（Xenova/clip-vit-base-patch32，q8 量化）
 * 运行时：transformers.js v3（WebGPU / WASM，浏览器内推理，图片不离开本机）
 * 用途：弥补感知哈希只能匹配"近似同图"的盲区——CLIP 语义嵌入可以
 *       匹配"内容语义相关"的图片（余弦相似度）。
 *
 * 网络路由（大陆网络友好，2026-09 实测）：
 *  - 运行时 JS：jsdelivr 直链 → npmmirror → unpkg 依次回退（浏览器直连）
 *  - 模型权重：优先经本地服务器 /api/hf/* 中转 hf-mirror.com（服务端出口可达）；
 *    无服务器（纯静态托管）时回退浏览器直连 hf-mirror.com
 *  - 任何失败都不影响核心功能
 */
(function (global) {
  'use strict';

  const RUNTIME_VERSION = '3.8.1';
  const RUNTIME_CANDIDATES = [
    `https://cdn.jsdelivr.net/npm/@huggingface/transformers@${RUNTIME_VERSION}/dist/transformers.min.js`,
    `https://registry.npmmirror.com/@huggingface/transformers/${RUNTIME_VERSION}/files/dist/transformers.min.js`,
    `https://unpkg.com/@huggingface/transformers@${RUNTIME_VERSION}/dist/transformers.min.js`,
  ];
  const MODEL_ID = 'Xenova/clip-vit-base-patch32';

  const state = {
    status: 'idle', // idle | loading | ready | error
    progress: '',
    extractor: null,
    error: '',
    backend: '',
    viaServer: false,
  };

  function setStatus(patch) {
    Object.assign(state, patch);
    global.document && global.document.dispatchEvent(new CustomEvent('clip-status', { detail: { ...state } }));
  }

  /** 动态加载 transformers.js（依次尝试 CDN） */
  async function loadRuntime() {
    let lastErr;
    for (const url of RUNTIME_CANDIDATES) {
      try {
        const mod = await import(/* webpackIgnore: true */ url);
        if (mod && mod.pipeline) return mod;
      } catch (e) { lastErr = e; /* 尝试下一个 CDN */ }
    }
    throw new Error('transformers.js 加载失败: ' + String(lastErr && lastErr.message || lastErr).slice(0, 80));
  }

  /**
   * 启用模型（幂等）。resolve 后 state.status === 'ready'。
   * @param {(s: object) => void} [onStatus] 状态回调
   */
  async function enable(onStatus) {
    const handler = (ev) => onStatus && onStatus(ev.detail);
    global.document && global.document.addEventListener('clip-status', handler);
    try {
      if (state.status === 'ready') return state;
      setStatus({ status: 'loading', progress: '下载运行时…', error: '' });

      const tf = await loadRuntime();
      const { pipeline, env } = tf;

      const progress_callback = (p) => {
        if (p && p.status === 'progress' && p.file) {
          setStatus({ progress: `${p.file} ${Math.round(p.progress || 0)}%` });
        }
      };
      const make = async () => pipeline('image-feature-extraction', MODEL_ID, {
        dtype: 'q8',
        progress_callback,
      });

      // 首选：权重经本地服务器中转（服务端出口对 hf-mirror 可达性最好）
      try {
        env.remoteHost = global.location ? global.location.origin : '';
        env.remotePathTemplate = 'api/hf/{model}/resolve/{revision}/';
        state.extractor = await make();
        state.viaServer = true;
      } catch (e) {
        // 回退：纯静态托管或服务器中转失败 → 浏览器直连镜像站
        env.remoteHost = 'https://hf-mirror.com';
        env.remotePathTemplate = '{model}/resolve/{revision}/';
        state.extractor = await make();
        state.viaServer = false;
      }

      try {
        state.backend = (await tf.env.backends?.())?.join?.(',') || '';
      } catch { /* 版本差异时忽略 */ }

      setStatus({ status: 'ready', progress: '', backend: state.backend });
      return state;
    } catch (e) {
      setStatus({ status: 'error', error: String(e.message || e).slice(0, 160) });
      throw e;
    } finally {
      global.document && global.document.removeEventListener('clip-status', handler);
    }
  }

  /**
   * 计算图片的 CLIP 嵌入向量（须先 enable 成功）
   * 注：transformers.js 的 image-feature-extraction 不接受 HTMLImageElement，
   * 需先经 canvas 转 Blob（同时把最长边压到 1024，CLIP 内部还会再缩放）。
   * @param {HTMLImageElement} imgEl
   * @returns {Promise<Float32Array|null>} 归一化向量（512 维）
   */
  async function embed(imgEl) {
    if (state.status !== 'ready' || !state.extractor) return null;
    const blob = await new Promise((resolve) => {
      const MAX = 1024;
      const w0 = imgEl.naturalWidth || imgEl.width;
      const h0 = imgEl.naturalHeight || imgEl.height;
      const scale = Math.min(MAX / Math.max(w0, h0), 1);
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(w0 * scale));
      c.height = Math.max(1, Math.round(h0 * scale));
      c.getContext('2d').drawImage(imgEl, 0, 0, c.width, c.height);
      c.toBlob(resolve, 'image/png');
    });
    const out = await state.extractor(blob, { pooling: 'mean', normalize: true });
    return out.data || (out[0] && out[0].data) || null;
  }

  /** 两个向量的余弦相似度（自行归一化，不依赖上游是否已 normalize） */
  function cosine(a, b) {
    if (!a || !b || a.length !== b.length) return -1;
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      na += a[i] * a[i];
      nb += b[i] * b[i];
    }
    if (!na || !nb) return -1;
    return dot / Math.sqrt(na * nb);
  }

  function serialize(vec) { return vec ? Array.from(vec, (x) => Number(x.toFixed(5))) : null; }
  function deserialize(arr) { return arr ? Float32Array.from(arr) : null; }

  global.PicTraceCLIP = { enable, embed, cosine, serialize, deserialize, state, MODEL_ID };
})(typeof window !== 'undefined' ? window : globalThis);
