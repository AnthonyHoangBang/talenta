# Talenta · Nén Bạc

Sổ tay đầu tư cá nhân: sổ giao dịch, danh mục, luận điểm cho từng lệnh mua, nhật ký, trang hồ sơ từng mã, tài sản khác, kết quả của tôi, mục tiêu và trang giới thiệu.

Trang web: https://anthonyhoangbang.github.io/talenta/

## Cài như app
- **Windows, Mac, Android**: tải file cài ở trang [Releases](https://github.com/AnthonyHoangBang/talenta/releases/latest).
  - Windows: mở `Talenta-Windows.exe`. Nếu hiện "Windows protected your PC", bấm **More info → Run anyway**.
  - Mac: mở `Talenta-Mac.dmg`, kéo Talenta vào Applications. Lần đầu: chuột phải vào Talenta → **Open → Open**.
  - Android: mở `Talenta-Android.apk` trên điện thoại và cho phép cài từ nguồn này.
- **iPhone**: mở trang web bằng Safari → nút Chia sẻ → **Thêm vào MH chính**.
- Trên Chrome hoặc Edge của máy tính cũng có nút **Cài đặt** ở thanh địa chỉ.

## Đồng bộ
Bấm nút đám mây ở thanh trên cùng, tạo tài khoản bằng email, rồi đăng nhập cùng tài khoản trên mọi máy. Sổ được cất trên Supabase; mỗi tài khoản chỉ đọc được sổ của chính mình.

## Số liệu
- **Giá đóng cửa 2 năm của 20 mã và VN-Index, cùng P/E, P/B, EPS, ROE là số thật**, lấy từ VNDirect và DNSE. Một tác vụ GitHub tự chạy lúc 15:25 các ngày làm việc và ghi vào `data/market.js`.
- **Giá trong phiên** lấy từ bảng giá VPS, trang hỏi lại khoảng 3 giây một lần trong giờ giao dịch. Đây là giá gần trực tiếp, có thể chậm vài giây, không phải từng lệnh khớp.
- Các nguồn trên là nguồn công khai nhưng không chính thức. Họ có thể đổi hoặc chặn bất cứ lúc nào. Chỉ dùng cho cá nhân.
- 20 mã: FPT, HPG, VCB, MWG, REE, TCB, DGC, VNM, VIC, VHM, MSN, MBB, ACB, BID, CTG, SSI, VND, GAS, PNJ, VPB.
- Sổ mẫu (các lệnh mua bán, nhật ký) là ví dụ minh họa, nhưng giá mua bán trong đó là giá đóng cửa thật của ngày tương ứng.

## Lưu ý
- Chưa đăng nhập thì dữ liệu chỉ nằm trên máy đang dùng. Nút "Sao lưu / khôi phục" ở cuối trang vẫn dùng được.
- Các mô hình (phễu giá, khả năng đạt mục tiêu, Kelly) là phép tính xác suất trên quá khứ, không phải dự báo.
- App ghi chép và phân tích dữ liệu của chính bạn, không đưa ra khuyến nghị mua bán.
