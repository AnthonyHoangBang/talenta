# Talenta · Nén Bạc: tài liệu cho lập trình viên

Talenta là sổ tay đầu tư cá nhân cho thị trường chứng khoán Việt Nam. Một người dùng, dữ liệu của riêng họ, chạy trên web, máy tính (Windows, Mac) và điện thoại (Android, iPhone).

- Trang web: https://anthonyhoangbang.github.io/talenta/
- Kho mã: https://github.com/AnthonyHoangBang/talenta (nhánh `main` là bản đang chạy; GitHub Pages phục vụ thẳng từ gốc nhánh `main`)
- Bản cài: https://github.com/AnthonyHoangBang/talenta/releases

## 1. Kiến trúc tổng quát

```
Trình duyệt / cửa sổ app
 ├─ index.html        toàn bộ giao diện và logic (HTML + CSS + JS thuần, không framework, không bước build)
 ├─ data/market.js    giá đóng cửa, nến, khối lượng, chỉ số, lợi nhuận quý (tạo tự động mỗi ngày)
 ├─ sync.js           đồng bộ sổ qua Supabase (đăng nhập email)
 ├─ sw.js             service worker: mở được khi mất mạng, cài như app (PWA)
 └─ manifest.webmanifest, icons/   thông tin app và biểu tượng

Nguồn ngoài
 ├─ bgapidatafeed.vps.com.vn       giá trong phiên, gọi từ trình duyệt mỗi 3 giây trong giờ giao dịch
 ├─ api-finfo.vndirect.com.vn      giá lịch sử, chỉ số, báo cáo tài chính (gọi từ GitHub Actions)
 ├─ services.entrade.com.vn (DNSE) VN-Index lịch sử (gọi từ GitHub Actions)
 └─ Supabase                       lưu sổ để đồng bộ giữa các máy

Bản cài
 ├─ apps/desktop   Tauri 2: một cửa sổ mở trang web ở trên (Windows .exe, Mac .dmg)
 └─ apps/android   Capacitor 7: WebView mở trang web ở trên (.apk)
```

Mọi bản (web, máy tính, Android, iPhone) đều chạy **cùng một trang web**. Sửa `index.html` và đưa lên `main` là mọi nơi cùng được cập nhật, không cần phát hành lại bản cài.

## 2. Các file chính

| File | Nội dung |
|---|---|
| `index.html` | Giao diện và toàn bộ logic. Các phần được đánh dấu bằng chú thích `/* ============ Tên phần ============ */`. |
| `sync.js` | Module `TalentaSync`: đăng nhập, gửi sổ lên, kéo sổ về, xử lý xung đột. Cấu hình `SYNC_CFG` ở đầu file. |
| `sw.js` | Service worker. Tăng số trong `CACHE = 'talenta-vN'` khi đổi danh sách file lõi. |
| `scripts/build-data.mjs` | Lấy dữ liệu thị trường, ghi `data/market.js` và `data/market.json`. |
| `.github/workflows/data.yml` | Chạy `build-data.mjs` lúc 15:25 giờ Việt Nam các ngày làm việc. |
| `.github/workflows/apps.yml` | Dựng 3 file cài. Chạy tay (Run workflow, nhập số phiên bản như `v1.1.0`) để tạo trang Releases. |
| `.github/workflows/probe.yml`, `probe/probe.sh` | Thử nhanh một nguồn dữ liệu mới từ máy chủ GitHub. |
| `apps/desktop/src-tauri/tauri.conf.json` | Cấu hình app máy tính (URL, kích thước cửa sổ, biểu tượng). |
| `apps/android/capacitor.config.json` | Cấu hình app Android. `talenta.keystore` (mật khẩu `talenta-app`, alias `talenta`) giữ chữ ký cố định để bản sau cài đè được. |

## 3. Chạy thử trên máy

Không cần cài gì ngoài một máy chủ tĩnh:

```bash
git clone https://github.com/AnthonyHoangBang/talenta
cd talenta
python -m http.server 8000      # hoặc: npx serve .
# mở http://localhost:8000
```

Lưu ý: giá trong phiên (VPS) và đồng bộ (Supabase) cần mạng thật. Service worker chỉ bật trên `https`, nên khi chạy `localhost` sẽ không có bộ nhớ đệm.

Muốn dựng lại dữ liệu: `node scripts/build-data.mjs` (Node 20+, cần mạng tới VNDirect và DNSE; một số mạng ở nước ngoài bị chặn, khi đó chạy qua GitHub Actions).

## 4. Dữ liệu trong `data/market.js`

```js
window.TALENTA_DATA = {
  updated, source,
  days: ['2024-11-01', ...],                // các phiên giao dịch
  px:   { FPT: [giá đóng cửa đã điều chỉnh, đồng], ..., VNINDEX: [...] },
  ohlcv:{ FPT: { o:[], h:[], l:[], v:[] } },  // nến và khối lượng, cùng độ dài với days
  f:    { FPT: { pe, pb, roe, eps, bvps, date } },
  qp:   { FPT: { item: 'Lợi nhuận sau thuế của Công ty mẹ', q: [['2026-09-30', 2723.1], ...] } }, // tỷ đồng, 12 quý
  via:  { FPT: 'VNDirect' }
}
```

Danh sách 20 mã nằm ở hai chỗ, cần sửa cùng lúc khi thêm mã: hằng `T` trong `scripts/build-data.mjs` và đối tượng `META` (tên, ngành) trong `index.html`.

## 5. Mô hình dữ liệu của người dùng (`S`)

Lưu ở `localStorage['talenta-v3']`, và trên Supabase nếu đã đăng nhập.

```js
S = {
  v: 3, updatedAt,                        // mốc thời gian sửa cuối (dùng cho đồng bộ)
  tx: [ { id, date, acct:'SSI'|'VNDIRECT', type:'buy'|'sell'|'deposit'|'withdraw'|'cashdiv'|'stockdiv',
          ticker, qty, price, amount, mood, thesisId, note, review, tags } ],
  theses:  [ { id, ticker, date, reason, wrongIf, target, stop, horizon, weight, letter, reviews:[{date,valid,note}] } ],
  journal: [ { id, date, tickers:[], mood, tags:[], text } ],
  watch:   [ { ticker, buyBelow, note } ],
  assets:  [ { id, kind:'Vàng'|'Tiết kiệm'|'Quỹ mở'|'Crypto'|'Khác', name, date, cost, rate, vals:[{date,value}], note } ],
  plans:   [ kế hoạch mua chờ 24 giờ ],
  priceAlerts: [ { id, ticker, op:'above'|'below', price, note, notified } ],
  goal: { target, years, monthly },
  settings: { fee, sellTax, divTax, maxTicker, maxSector, riskPct, reviewDays, band,
              target: { 'Cổ phiếu':.45, 'Tiền mặt':.05, 'Vàng':.10, ... } }   // phân bổ mục tiêu
}
```

`ensureState()` bổ sung trường còn thiếu cho sổ cũ, nên thêm trường mới thì khai báo mặc định ở `DEF_SETTINGS` hoặc trong `ensureState()`.

## 6. Luồng tính toán

`route()` gọi `compute()` mỗi lần vẽ trang. `compute()` chạy qua sổ giao dịch theo ngày và tạo `M`:

- vị thế theo mã và theo tài khoản, giá vốn bình quân (đã gồm phí mua), lãi/lỗ đã chốt (trừ phí bán và thuế bán);
- chuỗi `M.series` mỗi phiên: tài sản chứng khoán `nav`, tiền nạp ròng `dep`, lợi suất theo thời gian `cum` (TWR, đã loại trừ tiền nạp, rút), VN-Index `vni`;
- `M.alerts` từ `buildAlerts()`: cắt lỗ, mục tiêu, tỷ trọng, ngành, luận điểm cũ, cảnh báo giá, lệch phân bổ mục tiêu, danh sách theo dõi.

Các hàm phân tích: `perfStats()` (lợi suất năm, độ biến động, Sharpe, sụt giảm tối đa), `edge()` (tỷ lệ thắng, Kelly), `portStats()` (rủi ro theo loại tài sản), `simulateGoal()` (Monte Carlo cho trang Mục tiêu), `rebalance()` (phân bổ mục tiêu), `quarterPnl()`, `monthlyFlows()`.

## 7. Biểu đồ

Tự vẽ bằng SVG, không thư viện:

- `drawLine` đường có vùng tô, nhiều chuỗi, chú giải khi rê chuột hoặc chạm;
- `drawPrice` nến hoặc đường, khối lượng, điểm mua bán, đường cắt lỗ, mục tiêu, giá vốn, cảnh báo;
- `drawBars` cột có số trên đầu, nhiều chuỗi, số âm, % tăng trưởng (`growth:'qoq'|'yoy'`);
- `drawFan` hình phễu xác suất; `hbars`, `hpair` thanh ngang xếp hạng (thay cho biểu đồ tròn).

Mỗi trang gán hàm vẽ vào `charts[key]`, và phần tử `<div class="chart" data-chart="key" data-h="chiều cao">` được vẽ bởi `drawAll()`.

## 8. Nhập sao kê

`openImport()` → `readImportFile()` đọc CSV (tự nhận dấu phân cách `, ; tab`) hoặc Excel (tải SheetJS từ cdnjs khi cần), tìm dòng tiêu đề, đoán cột bằng `IMP_RX`, cho người dùng sửa ghép cột, bỏ lệnh trùng và mã ngoài danh sách. Khi có mẫu sao kê thật của SSI hoặc VNDirect, nên thêm vài file mẫu (đã xóa thông tin cá nhân) và kiểm tra `IMP_RX`, `pDate`, `pNum`, `pSide`.

## 9. Đồng bộ (Supabase)

- Bảng `public.notebooks(user_id uuid primary key, data jsonb, updated_at timestamptz)` bật Row Level Security, chính sách chỉ cho mỗi tài khoản đọc ghi dòng của mình.
- `sync.js` dùng khóa publishable (được phép nằm trong mã). **Không bao giờ** đưa khóa `service_role` hoặc `sb_secret_...` vào mã.
- Mỗi thay đổi gửi lên sau 1,5 giây; kéo về khi mở app, khi quay lại cửa sổ, khi có mạng lại và mỗi phút. Hai máy cùng sửa thì bản mới hơn thắng, bản còn lại cất ở `localStorage['talenta-ban-truoc-dong-bo']`.

## 10. Bản cài

- Windows chưa ký số nên bị Smart App Control chặn. Cách thay thế không tốn phí: cài từ Edge hoặc Chrome (nút Cài đặt app). Muốn có .exe chạy được, cần chứng chỉ ký mã (OV/EV hoặc Azure Trusted Signing) và thêm bước ký vào `apps.yml`.
- Mac chưa công chứng (notarize), lần đầu phải chuột phải → Mở. Cần tài khoản Apple Developer để ký.
- iPhone dùng PWA (Safari → Thêm vào MH chính). Lên App Store cần tài khoản Apple Developer và vỏ Capacitor iOS.

## 11. Việc nên làm tiếp

1. Thêm nhiều mã hơn 20 (cân nhắc chuyển `market.js` sang tải theo mã khi cần để file không quá lớn).
2. Thu file sao kê thật của SSI và VNDirect để tinh chỉnh bộ nhập; nhập cả lệnh nạp, rút tiền và cổ tức.
3. Tách `index.html` thành module (ES modules) và thêm kiểm thử cho `compute()`, `rebalance()`, bộ đọc sao kê.
4. Ký số bản Windows và Mac.
5. Sự kiện doanh nghiệp tự động (chia tách, cổ tức cổ phiếu) từ nguồn dữ liệu, thay vì nhập tay.
