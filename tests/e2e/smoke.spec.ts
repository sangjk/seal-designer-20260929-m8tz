import { expect, test } from '@playwright/test';

/**
 * 篆刻印章生成器 · 前端冒烟（非 Tauri 环境只验证 UI 可达性与渲染）。
 *
 * 覆盖：启动渲染 / 新品牌名 / 参数抽屉折叠 / 手风琴分组 / 实时预览（做旧位图 +
 * 矢量 SVG 双链路）/ 导出弹窗含「审核测试码」入口 / 关于页。
 */

test('启动后渲染设计器主界面（新品牌名）', async ({ page }) => {
  await page.goto('/');
  // 启动屏消失、顶栏品牌名出现（booted 后渲染）
  const title = page.getByRole('heading', { name: '篆刻印章生成器' }).first();
  await expect(title).toBeVisible();
  // 导航：设计器 / 关于
  await expect(page.getByRole('link', { name: '设计器' })).toBeVisible();
  await expect(page.getByRole('link', { name: '关于' })).toBeVisible();
});

test('参数抽屉：默认展开、手风琴分组与控件可达', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '篆刻印章生成器' })).toBeVisible();

  // 参数面板标题
  await expect(page.getByText('参数设置')).toBeVisible();

  // 手风琴分组标题（4 组）
  for (const g of ['版式与形状', '文字内容', '印色与字体', '精细与做旧']) {
    await expect(page.getByRole('button', { name: g })).toBeVisible();
  }

  // 快速预设卡片标题
  await expect(page.getByText('快速预设')).toBeVisible();
});

test('参数抽屉可折叠（顶栏开关）', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '篆刻印章生成器' })).toBeVisible();

  const drawer = page.locator('aside.designer__drawer');
  const before = await drawer.boundingBox();
  expect(before?.width ?? 0).toBeGreaterThan(50);

  const toggle = page.getByRole('button', { name: /参数面板/ });
  await toggle.click();
  // 等待 240ms 宽度过渡完成
  await page.waitForTimeout(400);
  const after = await drawer.boundingBox();
  expect(after?.width ?? 999).toBeLessThan(8);

  // 再次点击恢复
  await toggle.click();
  await page.waitForTimeout(400);
  const restored = await drawer.boundingBox();
  expect(restored?.width ?? 0).toBeGreaterThan(50);
});

test('实时预览：做旧位图与矢量 SVG 双链路真实渲染', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '篆刻印章生成器' })).toBeVisible();

  // 默认预设开启做旧 → 做旧位图 canvas 真实渲染（aging 链路）
  await expect(page.locator('.stage__canvas')).toBeVisible();
  const canvas = await page.locator('.stage__canvas').boundingBox();
  expect((canvas?.width ?? 0) * (canvas?.height ?? 0)).toBeGreaterThan(100);

  // 关闭做旧 → 切回矢量 SVG 预览（buildSvg 链路），非空
  const wearSwitch = page.getByRole('switch', { name: '做旧效果' });
  await wearSwitch.click();
  const svg = page.locator('.stage__svg svg').first();
  await expect(svg).toBeVisible();
  const box = await svg.boundingBox();
  expect((box?.width ?? 0) * (box?.height ?? 0)).toBeGreaterThan(100);
});

test('点击导出 PNG 弹出支付弹窗，含「审核测试码」入口', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '篆刻印章生成器' })).toBeVisible();

  await page.getByRole('button', { name: '导出 PNG' }).click();

  // 支付弹窗标题（用 heading 角色定位，避免与同名按钮歧义）
  await expect(page.getByRole('heading', { name: '开通导出功能' })).toBeVisible();
  // 支付方式切换（微信 / 支付宝）与关闭按钮
  await expect(page.getByRole('radio', { name: '微信支付' }).or(page.getByText('微信支付'))).toBeVisible();
  await expect(page.getByRole('button', { name: '关闭' }).first()).toBeVisible();
  // 审核测试码入口：标签 + 输入框 + 兑换按钮（输入后按钮可用）
  await expect(page.getByText('审核测试码')).toBeVisible();
  const codeInput = page.locator('#review-code-input');
  await expect(codeInput).toBeVisible();
  await codeInput.fill('TEST-CODE');
  expect(await codeInput.inputValue()).toBe('TEST-CODE');
  await expect(page.getByRole('button', { name: '兑换开通' })).toBeEnabled();

  // 说明：金额 / 订单号 / 二维码仅在建单成功（Tauri 运行时）的 waiting 阶段渲染，
  // 浏览器冒烟只验证 UI 可达性；waiting 阶段元素在打包后实机验证中核对。

  // 关闭弹窗（底部文字按钮）
  await page.getByRole('button', { name: '关闭' }).last().click();
});

test('关于页可达，展示新软件名称与免责声明', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '篆刻印章生成器' })).toBeVisible();

  await page.getByRole('link', { name: '关于' }).click();
  await expect(page.getByRole('heading', { name: '关于 篆刻印章生成器' })).toBeVisible();
  await expect(page.getByText('篆刻印章生成器是一款完全本地运行的印章设计工具')).toBeVisible();
  await expect(page.getByText('免责声明')).toBeVisible();
});
