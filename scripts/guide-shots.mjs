// Chụp lại ảnh cho trang Hướng dẫn (thư mục guide/).
// Cách chạy: mở máy chủ tĩnh ở thư mục gốc (python3 -m http.server 8765), rồi: node scripts/guide-shots.mjs
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const URL = process.env.TALENTA_URL || 'http://localhost:8765/';
const OUT = 'guide/';
const b = await chromium.launch({ args: ['--lang=vi-VN'] });
const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.5, locale: 'vi-VN' });
const p = await ctx.newPage();
p.on('pageerror', e => console.log('Lỗi trang:', e.message));
const go = async h => { await p.evaluate(x => { location.hash = x; }, h); await p.waitForTimeout(700); };
const shot = async (name, el) => { const o = { path: OUT + name + '.jpg', type: 'jpeg', quality: 80 }; if (el) await (await p.$(el)).screenshot(o); else await p.screenshot(o); console.log('Đã chụp', name); };
const dlg = async (name, fn) => { await p.evaluate(fn); await p.waitForTimeout(400); await p.evaluate(() => document.activeElement && document.activeElement.blur()); await shot(name, '#dlg'); await p.keyboard.press('Escape'); await p.waitForTimeout(250); };

await p.goto(URL + '#tong-quan'); await p.waitForTimeout(1200);
// Ảnh dùng sổ mẫu; riêng bước 1 chụp sổ trống.
await p.evaluate(() => { const ss = S; S = { ...seed(), tx: [], assets: [], journal: [], theses: [], watch: [], priceAlerts: [], plans: [], demo: false }; ensureState(); route(); window._keep = ss; });
await p.waitForTimeout(500); await shot('01-bat-dau', '.welcome');
await p.evaluate(() => { S = window._keep; ensureState(); S.demo = false; route(); });
await go('tong-quan');
await dlg('02-nap-tien', () => { openTx('deposit'); const i = document.getElementById('f_amount'); i.value = '300tr'; i.dispatchEvent(new Event('input', { bubbles: true })); });
await dlg('03-lenh-mua', () => { openTx('buy', 'FPT'); });
await dlg('04-sao-ke', () => { openImport(); });
await go('ma'); await shot('05-ma');
await go('ma-FPT'); const c = await p.$('[data-chart=price]'); await c.scrollIntoViewIfNeeded(); const bx = await c.boundingBox();
await p.mouse.move(bx.x + bx.width * .62, bx.y + bx.height * .4); await p.waitForTimeout(300);
await shot('06-bieu-do', 'section.card.c8');
await go('danh-muc'); await p.waitForTimeout(300); await shot('07-co-tuc', '#divCard');
await go('tai-san');
await dlg('08-tai-san', () => { openAsset(); const r = [...document.querySelectorAll('input[name=akind]')].find(x => x.value === 'Vàng'); r.click(); const s = document.getElementById('f_src'); s.value = 'N24K'; s.dispatchEvent(new Event('change', { bubbles: true })); const q = document.getElementById('f_aqty'); q.value = '6'; q.dispatchEvent(new Event('input', { bubbles: true })); });
await go('tong-quan'); await p.evaluate(() => scrollTo(0, 0)); await shot('09-tong-quan');
await go('tong-ket'); await p.evaluate(() => scrollTo(0, 0)); await shot('10-ket-qua');
await go('tong-quan'); await p.evaluate(() => openCmdk()); await p.waitForTimeout(200); await p.keyboard.type('vin'); await p.waitForTimeout(300); await shot('11-tim-nhanh');
await b.close();
