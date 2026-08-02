import type { SealDesign } from './types';
import { computeArcChars, escXml, roundedRectPath, starPoints } from './geometry';
import { YINWEN_INK } from './palette';

/**
 * 由设计态构建完整 SVG 字符串。
 *
 * ★ 本函数是**预览与导出的唯一渲染源**（架构设计 D1 / F-41 / AC-20）：
 *   - 预览：注入 DOM 后由浏览器绘制；
 *   - 导出 SVG：直接落盘；
 *   - 导出 PNG：转 Blob → Image → Canvas 3× 栅格化。
 *   任何视觉改动都必须改这里，不得在任一侧另写渲染分支。
 *
 * 算法自网页版 `buildSVG()` 1:1 移植。
 *
 * @param d 设计态。
 * @returns 完整的、可独立打开的 SVG 文档字符串。
 */
export function buildSvg(d: SealDesign): string {
  const size = d.sealSize;
  const bw = d.borderWidth;
  const color = d.sealColor;
  const ff = d.fontFamily;
  const isYinwen = d.sealType === 'yinwen';
  const ink = isYinwen ? YINWEN_INK : color;
  const isCircle = d.shape === 'circle';
  const isEllipse = d.shape === 'ellipse';
  const isRound = isCircle || isEllipse;
  const cx = size / 2;
  const cy = size / 2;
  const fontWeight = d.bold ? 'bold' : 'normal';

  // ── 边框内缩量 ──
  let borderInset = bw;
  if (d.borderStyle === 'double') {
    borderInset = bw + d.borderGap + bw * 0.6;
  } else if (d.borderStyle === 'none') {
    borderInset = 0;
  }

  // 内容留白
  const pad = borderInset + 22;

  const parts: string[] = [];

  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">`,
  );

  // ── defs：内容裁剪路径 ──
  parts.push('<defs>');
  parts.push('<clipPath id="innerClip">');
  if (isCircle) {
    parts.push(`<circle cx="${cx}" cy="${cy}" r="${size / 2 - borderInset}"/>`);
  } else if (isEllipse) {
    const crx = size / 2 - borderInset;
    parts.push(`<ellipse cx="${cx}" cy="${cy}" rx="${crx}" ry="${crx * 0.75}"/>`);
  } else {
    parts.push(
      `<path d="${roundedRectPath(
        borderInset,
        borderInset,
        size - borderInset * 2,
        size - borderInset * 2,
        Math.max(0, bw),
      )}"/>`,
    );
  }
  parts.push('</clipPath>');
  parts.push('</defs>');

  // ── 白文（阴文）底色 ──
  if (isYinwen) {
    if (isCircle) {
      parts.push(`<circle cx="${cx}" cy="${cy}" r="${size / 2 - borderInset}" fill="${color}"/>`);
    } else if (isEllipse) {
      const bgRx = size / 2 - borderInset;
      parts.push(`<ellipse cx="${cx}" cy="${cy}" rx="${bgRx}" ry="${bgRx * 0.75}" fill="${color}"/>`);
    } else {
      parts.push(
        `<path d="${roundedRectPath(
          borderInset,
          borderInset,
          size - borderInset * 2,
          size - borderInset * 2,
          Math.max(0, bw),
        )}" fill="${color}"/>`,
      );
    }
  }

  parts.push('<g>');

  // ── 边框 ──
  if (d.borderStyle !== 'none') {
    if (isCircle) {
      parts.push(
        `<circle cx="${cx}" cy="${cy}" r="${size / 2 - bw / 2}" fill="none" stroke="${color}" stroke-width="${bw}"/>`,
      );
      if (d.borderStyle === 'double') {
        const innerR = size / 2 - bw - d.borderGap - bw * 0.3;
        parts.push(
          `<circle cx="${cx}" cy="${cy}" r="${innerR}" fill="none" stroke="${color}" stroke-width="${bw * 0.65}"/>`,
        );
      }
    } else if (isEllipse) {
      const eRx = size / 2 - bw / 2;
      const eRy = eRx * 0.75;
      parts.push(
        `<ellipse cx="${cx}" cy="${cy}" rx="${eRx}" ry="${eRy}" fill="none" stroke="${color}" stroke-width="${bw}"/>`,
      );
      if (d.borderStyle === 'double') {
        const iRx = size / 2 - bw - d.borderGap - bw * 0.3;
        const iRy = iRx * 0.75;
        parts.push(
          `<ellipse cx="${cx}" cy="${cy}" rx="${iRx}" ry="${iRy}" fill="none" stroke="${color}" stroke-width="${bw * 0.65}"/>`,
        );
      }
    } else {
      const cr = Math.max(0, bw * 2);
      parts.push(
        `<path d="${roundedRectPath(bw / 2, bw / 2, size - bw, size - bw, cr)}" fill="none" stroke="${color}" stroke-width="${bw}"/>`,
      );
      if (d.borderStyle === 'double') {
        const inset = bw + d.borderGap;
        const cr2 = Math.max(0, cr - d.borderGap);
        parts.push(
          `<path d="${roundedRectPath(inset, inset, size - inset * 2, size - inset * 2, cr2)}" fill="none" stroke="${color}" stroke-width="${bw * 0.65}"/>`,
        );
      }
    }
  }

  // ── 被裁剪的内容层 ──
  parts.push('<g clip-path="url(#innerClip)">');

  if (d.layoutStyle === 'gongzhang' && isRound) {
    // ═══ 公章版式 ═══
    const innerR = size / 2 - borderInset;

    let topR = innerR - d.topMargin;
    let botR = innerR - d.bottomMargin;
    topR = Math.max(topR, innerR * 0.35);
    botR = Math.max(botR, innerR * 0.35);

    // 上弧文字
    if (d.arcTopText.length > 0) {
      const topChars = computeArcChars(d.arcTopText, cx, cy, topR, d.topArcDeg, 'top', isEllipse, 0, d.topCharGap);
      for (const c of topChars) {
        parts.push(
          `<text x="${c.x.toFixed(2)}" y="${c.y.toFixed(2)}" transform="rotate(${c.rotDeg.toFixed(2)},${c.x.toFixed(2)},${c.y.toFixed(2)})" fill="${ink}" font-family="${escXml(ff)}" font-size="${d.fontSize}" font-weight="${fontWeight}" text-anchor="middle" dominant-baseline="central">${escXml(c.char)}</text>`,
        );
      }
    }

    // 下弧文字
    if (d.arcBottomText.length > 0) {
      const botChars = computeArcChars(
        d.arcBottomText,
        cx,
        cy,
        botR,
        d.bottomArcDeg,
        'bottom',
        isEllipse,
        0,
        d.bottomCharGap,
      );
      for (const c of botChars) {
        parts.push(
          `<text x="${c.x.toFixed(2)}" y="${c.y.toFixed(2)}" transform="rotate(${c.rotDeg.toFixed(2)},${c.x.toFixed(2)},${c.y.toFixed(2)})" fill="${ink}" font-family="${escXml(ff)}" font-size="${d.bottomFontSize}" font-weight="${fontWeight}" text-anchor="middle" dominant-baseline="central">${escXml(c.char)}</text>`,
        );
      }
    }

    // ── 中心元素 ──
    const centerY = cy;
    let starBot: number;
    if (d.centerStyle === 'star' && d.starSize > 0) {
      const starR = d.starSize;
      parts.push(`<polygon points="${starPoints(cx, centerY, starR, starR * 0.38)}" fill="${ink}"/>`);
      starBot = centerY + starR;
    } else if (d.centerStyle === 'text' && d.centerSymbol.length > 0) {
      parts.push(
        `<text x="${cx}" y="${centerY}" fill="${ink}" font-family="${escXml(ff)}" font-size="${d.centerFontSize * 1.5}" font-weight="${fontWeight}" text-anchor="middle" dominant-baseline="central">${escXml(d.centerSymbol)}</text>`,
      );
      starBot = centerY + d.centerFontSize * 0.8;
    } else {
      starBot = centerY - 4;
    }

    // ── 中心文字（含与下弧的碰撞上推） ──
    let textStartY = starBot + d.centerOffset;
    const maxW = isEllipse ? innerR * 0.75 * 2 : innerR * 2.1;

    if (d.centerText1 || d.centerText2) {
      const gap = d.centerLineGap;
      let totalCenterH = 0;
      if (d.centerText1) {
        totalCenterH += d.centerFontSize * 1.2;
      }
      if (d.centerText2) {
        totalCenterH += d.centerFontSize * 1.2;
      }
      if (d.centerText1 && d.centerText2) {
        totalCenterH += gap;
      }

      if (d.arcBottomText.length > 0) {
        const aspect = isEllipse ? 0.75 : 1;
        const endA = Math.PI / 2 - (d.bottomArcDeg * Math.PI) / 360;
        const nearA = Math.PI / 2 - (20 * Math.PI) / 180;
        const sampA = Math.max(endA, nearA);
        let botArcTextTopY = cy + botR * aspect * Math.sin(sampA) - d.bottomFontSize * 0.75;
        botArcTextTopY -= d.centerBottomGap;
        if (textStartY + totalCenterH > botArcTextTopY) {
          textStartY = Math.max(cy - d.starSize + d.centerFontSize * 0.25, botArcTextTopY - totalCenterH);
        }
      }
    }

    if (d.centerText1) {
      const twEstimate = d.centerText1.length * d.centerFontSize;
      if (twEstimate > maxW) {
        const sc = maxW / twEstimate;
        parts.push(
          `<text x="${cx}" y="${textStartY.toFixed(1)}" fill="${ink}" font-family="${escXml(ff)}" font-size="${d.centerFontSize}" font-weight="${fontWeight}" text-anchor="middle" dominant-baseline="hanging" transform="matrix(${sc.toFixed(3)},0,0,1,${(cx - cx * sc).toFixed(1)},0)">${escXml(d.centerText1)}</text>`,
        );
      } else {
        parts.push(
          `<text x="${cx}" y="${textStartY.toFixed(1)}" fill="${ink}" font-family="${escXml(ff)}" font-size="${d.centerFontSize}" font-weight="${fontWeight}" text-anchor="middle" dominant-baseline="hanging">${escXml(d.centerText1)}</text>`,
        );
      }
      textStartY += d.centerFontSize * 1.2 + d.centerLineGap;
    }
    if (d.centerText2) {
      parts.push(
        `<text x="${cx}" y="${textStartY.toFixed(1)}" fill="${ink}" font-family="${escXml(ff)}" font-size="${d.centerFontSize * 0.85}" font-weight="${fontWeight}" text-anchor="middle" dominant-baseline="hanging">${escXml(d.centerText2)}</text>`,
      );
      textStartY += d.centerFontSize * 1.2;
    }

    // ── 编号 ──
    if (d.serialNumber.length > 0) {
      const snY = size - pad - d.centerFontSize * 0.9;
      parts.push(
        `<text x="${cx}" y="${snY.toFixed(1)}" fill="${ink}" font-family="${escXml(ff)}" font-size="${d.centerFontSize * 0.5}" font-weight="${fontWeight}" text-anchor="middle" dominant-baseline="auto">${escXml(d.serialNumber)}</text>`,
      );
    }

    // ── 附文 ──
    if (d.gongzhangSubText.length > 0) {
      let subY = size - pad - 4;
      if (d.serialNumber.length > 0) {
        subY -= d.centerFontSize * 0.7;
      }
      parts.push(
        `<text x="${cx}" y="${subY.toFixed(1)}" fill="${ink}" font-family="${escXml(ff)}" font-size="${d.centerFontSize * 0.5}" font-weight="${fontWeight}" text-anchor="middle" dominant-baseline="auto">${escXml(d.gongzhangSubText)}</text>`,
      );
    }
  } else if (d.layoutStyle === 'fangzhang') {
    // ═══ 方章版式 ═══
    const fx = pad;
    const fy = pad;
    const fw = size - pad * 2;
    const fh = size - pad * 2;
    const texts = d.fangTexts.filter((t) => t.length > 0);
    const rows = texts.length > 0 ? texts : ['印章'];
    const fFZ = d.fontSize;

    if (d.arrangement === 'vertical') {
      const colCount = rows.length;
      const colW = fFZ * 1.2;
      const totalW = colCount * colW + (colCount - 1) * 4;
      const sx = fx + (fw - totalW) / 2;
      for (let col = colCount - 1; col >= 0; col--) {
        const t = rows[colCount - 1 - col];
        const colX = sx + col * (colW + 4) + colW / 2;
        const charH = fFZ * 1.22;
        const totalH = t.length * charH;
        let tcy = fy + (fh - totalH) / 2;
        for (let ci = 0; ci < t.length; ci++) {
          parts.push(
            `<text x="${colX.toFixed(1)}" y="${tcy.toFixed(1)}" fill="${ink}" font-family="${escXml(ff)}" font-size="${fFZ}" font-weight="${fontWeight}" text-anchor="middle" dominant-baseline="hanging">${escXml(t[ci])}</text>`,
          );
          tcy += charH;
        }
      }
    } else {
      const lineH = fFZ * 1.35;
      const totalH = rows.length * lineH + (rows.length - 1) * d.fangLineGap;
      const subH = d.fangzhangSubText ? fFZ * 0.55 * 1.4 + 10 : 0;
      let sy = fy + (fh - totalH - subH) / 2;
      for (let i = 0; i < rows.length; i++) {
        parts.push(
          `<text x="${(fx + fw / 2).toFixed(1)}" y="${sy.toFixed(1)}" fill="${ink}" font-family="${escXml(ff)}" font-size="${fFZ}" font-weight="${fontWeight}" text-anchor="middle" dominant-baseline="hanging">${escXml(rows[i])}</text>`,
        );
        sy += lineH + d.fangLineGap;
      }
      if (d.fangzhangSubText) {
        sy += 10;
        parts.push(
          `<text x="${(fx + fw / 2).toFixed(1)}" y="${sy.toFixed(1)}" fill="${ink}" font-family="${escXml(ff)}" font-size="${fFZ * 0.55}" font-weight="${fontWeight}" text-anchor="middle" dominant-baseline="hanging">${escXml(d.fangzhangSubText)}</text>`,
        );
      }
    }
  } else {
    // ═══ 自由排版 ═══
    const ffx = pad;
    const ffy = pad;
    const ffw = size - pad * 2;
    const ffh = size - pad * 2;
    const filtered = d.freeTexts.filter((t) => t.length > 0);
    const ftexts = filtered.length > 0 ? filtered : ['印章'];
    const fFZ2 = d.fontSize;
    const lineH2 = fFZ2 * 1.35;
    const totalMain = ftexts.length * lineH2 + (ftexts.length - 1) * d.freeSpacing;
    const subH2 = d.freeSubText ? fFZ2 * 0.55 * 1.4 + d.freeSpacing : 0;
    const totalH2 = totalMain + subH2;
    let fsy = ffy + (ffh - totalH2) / 2;
    for (let j = 0; j < ftexts.length; j++) {
      parts.push(
        `<text x="${(ffx + ffw / 2).toFixed(1)}" y="${fsy.toFixed(1)}" fill="${ink}" font-family="${escXml(ff)}" font-size="${fFZ2}" font-weight="${fontWeight}" text-anchor="middle" dominant-baseline="hanging">${escXml(ftexts[j])}</text>`,
      );
      fsy += lineH2 + d.freeSpacing;
    }
    if (d.freeSubText) {
      fsy += d.freeSpacing;
      parts.push(
        `<text x="${(ffx + ffw / 2).toFixed(1)}" y="${fsy.toFixed(1)}" fill="${ink}" font-family="${escXml(ff)}" font-size="${fFZ2 * 0.55}" font-weight="${fontWeight}" text-anchor="middle" dominant-baseline="hanging">${escXml(d.freeSubText)}</text>`,
      );
    }
  }

  parts.push('</g>'); // 内容层
  parts.push('</g>'); // 主图层
  parts.push('</svg>');

  return parts.join('\n');
}
