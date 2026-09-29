import { test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * 截图基线生成器（每轮必留，AGENTS.md 4.8）。
 *
 * 画面：主界面全景 / 参数区全展开 / 支付弹窗 / 关于页
 * 尺寸：1080×600 与 1360×900 各一套
 * 位置：docs/ui-baselines/轮次N/
 */

const ROUND = process.env.BASELINE_ROUND ?? '1';
const OUT = resolve(process.cwd(), 'docs', 'ui-baselines', `轮次${ROUND}`);

const SIZES: Array<[number, number]> = [
  [1080, 600],
  [1360, 900],
];

for (const [w, h] of SIZES) {
  test(`主界面全景 ${w}x${h}`, async ({ page }) => {
    mkdirSync(OUT, { recursive: true });
    await page.setViewportSize({ width: w, height: h });
    await page.goto('/');
    await page.getByRole('heading', { name: '篆刻印章生成器' }).first().waitFor();
    // 等待预览合成完成（做旧位图）
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${OUT}/主界面-${w}x${h}.png`, fullPage: false });
  });

  test(`参数区全展开 ${w}x${h}`, async ({ page }) => {
    mkdirSync(OUT, { recursive: true });
    await page.setViewportSize({ width: w, height: h });
    await page.goto('/');
    await page.getByRole('heading', { name: '篆刻印章生成器' }).first().waitFor();
    // 展开全部手风琴分组（默认全开，滚动到底确保渲染）
    await page.locator('.panel__scroll').evaluate((el: HTMLElement) => {
      el.scrollTop = el.scrollHeight;
    });
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${OUT}/参数区-${w}x${h}.png`, fullPage: false });
  });

  test(`支付弹窗 ${w}x${h}`, async ({ page }) => {
    mkdirSync(OUT, { recursive: true });
    await page.setViewportSize({ width: w, height: h });
    await page.goto('/');
    await page.getByRole('heading', { name: '篆刻印章生成器' }).first().waitFor();
    await page.getByRole('button', { name: '导出 PNG' }).click();
    await page.getByRole('heading', { name: '开通导出功能' }).waitFor();
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT}/支付弹窗-${w}x${h}.png`, fullPage: false });
    await page.getByRole('button', { name: '关闭' }).last().click();
  });

  test(`关于页 ${w}x${h}`, async ({ page }) => {
    mkdirSync(OUT, { recursive: true });
    await page.setViewportSize({ width: w, height: h });
    await page.goto('/');
    await page.getByRole('heading', { name: '篆刻印章生成器' }).first().waitFor();
    await page.getByRole('link', { name: '关于' }).click();
    await page.getByRole('heading', { name: '关于 篆刻印章生成器' }).waitFor();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${OUT}/关于页-${w}x${h}.png`, fullPage: false });
  });
}
