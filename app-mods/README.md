# App mods — chỉnh sửa vào bản cài OpenBlock Desktop (C:\OpenBlockDesktop)

Thư mục này lưu các file được đưa vào `app.asar` của bản cài (không thuộc repo external-resources).

## Hiện trạng trên máy (đã áp dụng)

- `C:\OpenBlockDesktop\resources\app.asar` — bản ĐÃ MOD (chatbot + guard), đóng gói ngày 22/07/2026
- `C:\OpenBlockDesktop\resources\app.asar.bak` — bản GỐC nguyên vẹn (14/01/2025). Khôi phục: xóa app.asar + app.asar.unpacked, đổi tên 2 file .bak về tên cũ
- `C:\OpenBlockDesktop\resources\app-src\` — cây nguồn đã giải nén để chỉnh sửa & đóng gói lại
  (LƯU Ý: app KHÔNG chạy được trực tiếp từ thư mục `resources\app` giải nén — bắt buộc phải pack lại thành asar)

## Các file mod

### 1. ai-assistant.js — Trợ lý AI chatbot hai lớp
Nút 🤖 góc dưới phải, panel chat tiếng Việt: hướng dẫn cảm biến/motor/servo,
gợi ý ý tưởng dự án, xử lý lỗi kết nối. Được nạp bằng thẻ `<script src="ai-assistant.js">`
thêm vào cuối `index.html` (sau renderer.js).

Lớp 1 dùng kiến thức offline. Lớp 2 thử nghiệm dùng Gemini 3.6 Flash: mở Chú Dế,
bấm ⚙ và dán API key. Key được Electron `safeStorage` mã hóa theo tài khoản Windows,
app tự kết nối ở lần mở sau. Có thể truyền key bằng biến môi trường `GEMINI_API_KEY`.
Khi API lỗi/mất mạng, Chú Dế tự rơi về lớp offline. Chat nhớ cục bộ 8 lượt gần nhất
theo tài khoản demo và có nút xóa trí nhớ.

Không nhúng key vào bản phát cho học sinh. Trước khi phát hành phải dựng server proxy giữ key.

### 2. userdata-guard.js — Vá bug treo "OpenBlock is loading..."
**Bug gốc của bản build ThingEdu 1.0.2** (không liên quan chatbot): network service của
Chromium ghi state HSTS đè LÊN CHÍNH thư mục dữ liệu `%APPDATA%\OpenBlockDesktop (ThingEdu)`,
biến nó thành 1 file ~370 byte. Lần khởi động kế tiếp, ElectronStore gọi mkdir → EEXIST →
exception bị nuốt → app treo vĩnh viễn ở splash không hiện cửa sổ.

Guard chạy ở dòng đầu `main.js` (`require("./userdata-guard.js");`): nếu thấy đường dẫn
userData là file thì xóa và tạo lại thư mục trước khi app khởi động. Bug vẫn ghi file rác
mỗi phiên chạy nhưng giờ vô hại.

## Quy trình đóng gói lại (khi sửa tiếp)

```
# 1. Sửa file trong C:\OpenBlockDesktop\resources\app-src\
# 2. Tắt app, rồi:
cd C:\OpenBlockDesktop\resources
del app.asar & rmdir /s /q app.asar.unpacked
npx -y @electron/asar pack app-src app.asar --unpack-dir "node_modules/ansi-string"
# 3. Mở app kiểm tra
```

Cần Node.js (đã cài v24 LTS trên máy này, 22/07/2026).
