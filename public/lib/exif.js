/**
 * PicTrace 精简 EXIF / 元数据解析器（纯浏览器端，无依赖）
 * ------------------------------------------------------------
 * 支持：
 *  - JPEG：APP1(Exif TIFF) 中的相机/时间/软件/GPS，以及 XMP 存在性检测
 *  - PNG：tEXt / iTXt 文本块（Title、Author、Software、Description）
 *  - WebP/GIF 等其它容器：仅返回容器类型
 *
 * 隐私提示：GPS 与拍摄时间属于敏感取证信息，界面上会显式标注。
 * 实现参考 EXIF 2.3 规范（CIPA DC-008）与 PNG（ISO/IEC 15948）规范。
 */
(function (global) {
  'use strict';

  function parse(dataView) {
    const len = dataView.byteLength;
    if (len < 8) return { container: 'unknown' };

    // ---- PNG ----
    if (dataView.getUint32(0) === 0x89504e47) {
      const meta = parsePngText(dataView);
      return { container: 'png', ...meta };
    }
    // ---- GIF ----
    if (dataView.getUint32(0) === 0x47494638) return { container: 'gif' };
    // ---- WebP ----
    if (dataView.getUint32(0) === 0x52494646 && dataView.getUint32(8) === 0x57454250) {
      return { container: 'webp' };
    }
    // ---- JPEG ----
    if (dataView.getUint16(0) === 0xffd8) return parseJpeg(dataView);
    return { container: 'unknown' };
  }

  function parsePngText(dv) {
    const out = { texts: {}, hasXmp: false };
    let off = 8;
    while (off + 8 <= dv.byteLength) {
      const size = dv.getUint32(off);
      const type = String.fromCharCode(dv.getUint8(off + 4), dv.getUint8(off + 5), dv.getUint8(off + 6), dv.getUint8(off + 7));
      if (type === 'tEXt' && off + 8 + size <= dv.byteLength) {
        let p = off + 8, keyEnd = p;
        while (keyEnd < off + 8 + size && dv.getUint8(keyEnd) !== 0) keyEnd++;
        const key = utf8(dv, p, keyEnd - p);
        const val = utf8(dv, keyEnd + 1, size - (keyEnd - p) - 1);
        if (key) out.texts[key] = val;
      }
      if (type === 'iTXt') out.hasXmp = out.hasXmp || utf8(dv, off + 8, Math.min(size, 28)).includes('XML:com.adobe.xmp');
      off += 12 + size;
      if (type === 'IEND') break;
    }
    return out;
  }

  function utf8(dv, start, len) {
    try { return new TextDecoder('utf-8').decode(new Uint8Array(dv.buffer, dv.byteOffset + start, Math.max(0, len))); }
    catch { return ''; }
  }

  function parseJpeg(dv) {
    const out = { container: 'jpeg', exif: null, hasXmp: false, hasIcc: false };
    let off = 2;
    while (off + 4 < dv.byteLength) {
      if (dv.getUint8(off) !== 0xff) { off++; continue; }
      const marker = dv.getUint8(off + 1);
      if (marker === 0xd9 || marker === 0xda) break; // EOI / SOS 之后即图像数据
      const size = dv.getUint16(off + 2);
      const segStart = off + 4, segLen = size - 2;

      if (marker === 0xe1) { // APP1
        const tag = utf8(dv, segStart, 6);
        if (tag.startsWith('Exif')) {
          out.exif = parseTiff(dv, segStart + 6);
        } else if (tag.startsWith('http') || utf8(dv, segStart, 29).includes('ns.adobe.com/xap')) {
          out.hasXmp = true;
        }
      } else if (marker === 0xe2) {
        out.hasIcc = out.hasIcc || utf8(dv, segStart, 11) === 'ICC_PROFILE';
      }

      off += 2 + size;
    }
    return out;
  }

  const TAGS_IFD0 = {
    0x010f: 'Make', 0x0110: 'Model', 0x0112: 'Orientation', 0x0131: 'Software',
    0x0132: 'DateTime', 0x013b: 'Artist', 0x8298: 'Copyright', 0x010e: 'ImageDescription',
    0x8825: '__gpsIFD', 0x8769: '__exifIFD',
  };
  const TAGS_EXIF = { 0x9003: 'DateTimeOriginal', 0x9004: 'CreateDate', 0xa434: 'LensModel', 0x829a: 'ExposureTime', 0x920a: 'FocalLength', 0x8769: '__exifIFD' };
  const TAGS_GPS = { 0x0001: 'GPSLatitudeRef', 0x0002: 'GPSLatitude', 0x0003: 'GPSLongitudeRef', 0x0004: 'GPSLongitude', 0x0006: 'GPSAltitude' };

  function parseTiff(dv, t0) {
    const byteOrder = utf8(dv, t0, 2);
    if (byteOrder !== 'II' && byteOrder !== 'MM') return null;
    const le = byteOrder === 'II';
    const u16 = (p) => dv.getUint16(p, le);
    const u32 = (p) => dv.getUint32(p, le);

    const exif = {};
    const readIFD = (ifdOffset, tagTable) => {
      if (ifdOffset <= 0 || t0 + ifdOffset + 2 > dv.byteLength) return;
      const count = u16(t0 + ifdOffset);
      for (let i = 0; i < count; i++) {
        const e = t0 + ifdOffset + 2 + i * 12;
        if (e + 12 > dv.byteLength) return;
        const tag = u16(e);
        const type = u16(e + 2);
        const num = u32(e + 4);
        const name = tagTable[tag];
        if (!name) continue;

        const valSize = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 }[type] || 1;
        const total = valSize * num;
        const vOff = total <= 4 ? e + 8 : t0 + u32(e + 8);

        if (type === 2) { // ASCII
          exif[name] = utf8(dv, vOff, num).replace(/\0+$/, '').trim();
        } else if (type === 3) {
          exif[name] = u16(vOff);
        } else if (type === 5 || type === 10) { // RATIONAL
          const vals = [];
          for (let k = 0; k < Math.min(num, 3); k++) {
            const n = type === 5 ? u32(vOff + k * 8) : dv.getInt32(vOff + k * 8, le);
            const d = type === 5 ? u32(vOff + k * 8 + 4) : dv.getInt32(vOff + k * 8 + 4, le);
            vals.push(d ? n / d : 0);
          }
          exif[name] = vals;
        } else if (type === 4) {
          exif[name] = u32(vOff);
        }
      }
    };

    const ifd0 = u32(t0 + 4);
    readIFD(ifd0, TAGS_IFD0);
    if (exif.__exifIFD) readIFD(exif.__exifIFD, TAGS_EXIF);
    if (exif.__gpsIFD) readIFD(exif.__gpsIFD, TAGS_GPS);

    // GPS 度分秒 → 十进制
    if (Array.isArray(exif.GPSLatitude) && Array.isArray(exif.GPSLongitude)) {
      const dms = (a) => a[0] + a[1] / 60 + (a[2] || 0) / 3600;
      const lat = dms(exif.GPSLatitude) * (exif.GPSLatitudeRef === 'S' ? -1 : 1);
      const lon = dms(exif.GPSLongitude) * (exif.GPSLongitudeRef === 'W' ? -1 : 1);
      if (lat || lon) {
        exif.GPSDecimal = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
        exif.GPSMapLink = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=14/${lat}/${lon}`;
      }
    }
    delete exif.__gpsIFD; delete exif.__exifIFD;
    return Object.keys(exif).length ? exif : null;
  }

  global.PicTraceExif = { parse };
})(typeof window !== 'undefined' ? window : globalThis);
