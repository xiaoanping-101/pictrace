/**
 * PicTrace 感知哈希库（纯浏览器端，无依赖）
 * ------------------------------------------------------------
 * 实现 aHash / dHash / pHash(DCT) 三种经典感知哈希，用于：
 *  - 判断两张图是否"看起来相同"（汉明距离 ≤ 10 通常视为近似同图）
 *  - 本地图库查重与历史比对
 *
 * 算法思想来源（公开算法，特此致谢）：
 *  - aHash / dHash: Neal Krawetz, "Kind of Like That" (The Hacker Factor Blog, 2013)
 *    https://hackerfactor.com/blog/index.php%3F/archives/2013/01/13/25.html
 *  - pHash (DCT): Evan Klinger & David Doherty, pHash.org
 *    https://www.phash.org/docs/design.html
 *  - Python imagehash 库的参考实现（BSD-2）
 *    https://github.com/JohannesBuchner/imagehash
 */
(function (global) {
  'use strict';

  /** 把图片绘制到 NxN 灰度矩阵（通过 canvas，浏览器端） */
  function toGrayMatrix(img, n) {
    const canvas = document.createElement('canvas');
    canvas.width = n; canvas.height = n;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, n, n);
    const { data } = ctx.getImageData(0, 0, n, n);
    const gray = new Float64Array(n * n);
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      // ITU-R BT.601 加权灰度
      gray[p] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }
    return gray;
  }

  /** 平均哈希 aHash：与平均值比较 → 64bit */
  function aHash(img) {
    const n = 8;
    const g = toGrayMatrix(img, n);
    const mean = g.reduce((a, b) => a + b, 0) / g.length;
    let hex = '';
    for (let i = 0; i < 64; i += 4) {
      let nib = 0;
      for (let j = 0; j < 4; j++) nib = (nib << 1) | (g[i + j] > mean ? 1 : 0);
      hex += nib.toString(16);
    }
    return hex;
  }

  /** 差值哈希 dHash：相邻像素梯度 → 64bit */
  function dHash(img) {
    const n = 9; // 9 列取 8 个梯度
    const g = toGrayMatrix(img, n);
    let hex = '';
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 2; col++) {
        let nib = 0;
        for (let k = 0; k < 4; k++) {
          const c = col * 4 + k;
          nib = (nib << 1) | (g[row * n + c] < g[row * n + c + 1] ? 1 : 0);
        }
        hex += nib.toString(16);
      }
    }
    return hex;
  }

  /** 感知哈希 pHash：32x32 灰度 → 二维 DCT-II → 取左上低频 8x8（去 DC）→ 63bit 补齐 64bit */
  function pHash(img) {
    const N = 32, LOW = 8;
    const g = toGrayMatrix(img, N);

    // 一维 DCT-II 基函数查表，避免重复计算 cos
    const cosT = new Float64Array(N * N);
    for (let k = 0; k < N; k++) {
      for (let x = 0; x < N; x++) cosT[k * N + x] = Math.cos((Math.PI / N) * (x + 0.5) * k);
    }

    // 第一步：对每一行做 DCT → rowsDCT[y][k]
    const rowsDCT = [];
    for (let y = 0; y < N; y++) {
      const out = new Float64Array(N);
      for (let k = 0; k < N; k++) {
        let s = 0;
        for (let x = 0; x < N; x++) s += g[y * N + x] * cosT[k * N + x];
        out[k] = s;
      }
      rowsDCT.push(out);
    }

    // 第二步：对每一列（仅前 LOW 个频率）做 DCT → dct[k][t] 即频率 (x=k, y=t)
    const dct = [];
    for (let k = 0; k < LOW; k++) {
      const col = new Float64Array(LOW);
      for (let t = 0; t < LOW; t++) {
        let s = 0;
        for (let y = 0; y < N; y++) s += rowsDCT[y][k] * cosT[t * N + y];
        col[t] = s;
      }
      dct.push(col);
    }

    // 取低频块（跳过 DC 分量 [0][0]），与中位数比较生成位串
    const flat = [];
    for (let t = 0; t < LOW; t++) {
      for (let k = 0; k < LOW; k++) {
        if (k === 0 && t === 0) continue;
        flat.push(dct[k][t]);
      }
    }
    const sorted = [...flat].sort((a, b) => a - b);
    const median = (sorted[sorted.length - 1] + sorted[sorted.length - 2]) / 2; // 63 个值取中位偏大
    let bits = '';
    for (const v of flat) bits += v > median ? '1' : '0';
    bits = bits.padEnd(64, '0'); // 63bit 补齐到 64bit
    let hex = '';
    for (let i = 0; i < 64; i += 4) hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
    return hex;
  }

  /** 十六进制哈希的汉明距离 */
  function hamming(hexA, hexB) {
    if (!hexA || !hexB || hexA.length !== hexB.length) return Infinity;
    let d = 0;
    for (let i = 0; i < hexA.length; i++) {
      let x = parseInt(hexA[i], 16) ^ parseInt(hexB[i], 16);
      while (x) { d += x & 1; x >>= 1; }
    }
    return d;
  }

  async function computeAll(imgEl) {
    return { aHash: aHash(imgEl), dHash: dHash(imgEl), pHash: pHash(imgEl) };
  }

  global.PicTraceHash = { aHash, dHash, pHash, hamming, computeAll };
})(typeof window !== 'undefined' ? window : globalThis);
