# BÀN GIAO — OpenBlockSTEMKIT / Dế Base KIT "Khu vườn thông minh"

Cập nhật: 07/08/2026. Đọc hết file này trước khi sửa bất cứ dòng nào.

- Bài 1 và 2 luôn có thẻ video riêng: chưa có MP4 thì hiện rõ “Video hướng dẫn đang cập nhật”; khi có `bai-1-quan-sat-vuon.mp4` hoặc `bai-2-mo-hinh-vuon-mini.mp4` trong `app-mods/media/` thì tự thay bằng trình phát. Trình cài đặt chép mọi MP4 từ thư mục này vào app. Chat Chú Dế của hai bài là bảng nổi cố định ở góc phải (trên điện thoại trở về khung trong trang), không đóng bài và không nhảy vào workspace.
- Bài 1 có Sổ tay quan sát tự lưu: cây/nơi quan sát, điều thấy, điều đoán và một ảnh nén lưu cục bộ. Nút “Nhờ Chú Dế cùng xem ghi chép” gửi kèm ảnh khi AI online; offline vẫn lưu sổ tay và Chú Dế chỉ dùng được phần chữ.
- App là local-first: phần ⚙ Phụ huynh / giáo viên yêu cầu mã tự tạo lần đầu, mở hộp thoại Windows thật để xuất/nạp file `.dehoc`. File gồm tiến độ, sổ tay/ảnh và lịch sử chat; mã phụ huynh không nằm trong file sao lưu.
- Khi học sinh pass Bài 3, app giữ trạng thái hoàn thành nhưng tự xóa snapshot khối lệnh và dọn workspace để không mang code cũ sang bài sau.
- Lượt ổn định 08/08: chặn chạy nhiều phiên desktop, chỉ gửi một lệnh nạp workspace khi đổi bài và GUI bỏ qua cấu hình bài học trùng lặp để tránh nạp extension/workspace nhiều lần.

### Cập nhật lát cắt Bài 3 (07/08/2026)

- Chú Dế có thêm nấc **“Bí quá — chú làm mẫu 10 giây”** sau gợi ý lập trình. App chỉ bày luồng
  mẫu tạm thời, khóa kéo-thả trong lúc xem, rồi khôi phục nguyên workspace trước đó để học sinh tự ghép lại.
- Bộ kiểm tra Bài 3 nhận đúng block `control_if` của OpenBlock; khi vào lớp học muộn, GUI tự đọc lại ngữ cảnh
  Học KIT để vẫn nạp ThingBot/extension chính xác.
- Workspace của từng bài được tự lưu sau mỗi thay đổi. Mở lại bài sẽ phục hồi đúng khối lệnh đã làm;
  lần đầu vào một bài mới thì workspace trống, không mang code bài cũ theo.
- Trang bài học có thẻ tiến độ dựa trên block thật: đang ở bước nào, việc tiếp theo và xác nhận đã lưu.
  Đã bỏ hoàn toàn bảng giả lập “Vườn thử nghiệm”.
- Trong workspace Bài 3 có bảng tiến độ trực tiếp (✓/→/○). Nút **“Chú chỉ từng bước”** mở tutorial
  ngay từ bước code còn thiếu; chỉ nấc **“Bí quá”** mới bày mẫu block tạm 10 giây rồi xóa.
- Khối còi thật của ThingBot là `thingBotC3_buzzer` (không phải `passiveBuzzer_*`); bộ kiểm tra đã nhận cả hai.
  Snapshot rỗng không được phép ghi đè một chương trình đã lưu.
- Khi ✓ hết phần code, bảng chuyển sang **“Phần code đã xong”** và hướng dẫn nạp/thử thật; nút trợ giúp
  đổi thành **“Nạp không được / còi không kêu”** để Chú Dế hướng dẫn kiểm tra dây, nguồn, kết nối rồi nạp.
- Học sinh xác nhận **“Em đã nạp và thử xong”** thì hiện màn chúc mừng pass Bài 3, có lựa chọn sang Bài 4,
  xem lại hoặc hỏi Chú Dế để tìm hiểu thêm. Khi đang xem mẫu code 10 giây có nút **“Tắt mẫu ngay”**.
- Bài 1 và 2 có khung **“Đi cùng Chú Dế”** ngay trong màn bài: tutorial từng bước theo hoạt động thực tế,
  lưu bước đang xem và nút hỏi AI bằng đúng câu hỏi gợi ý của mỗi bài. Không mở workspace vì hai bài này chưa lập trình.

- `gui/src/containers/blocks.jsx` đọc block thật và phát `de:lesson-workspace-state`: đã có cảm biến,
  điều kiện nằm trong `nếu–thì`, ngưỡng và khối cảnh báo.
- Đã compile `desktop/dist/renderer/3.bundle.js`, cài bằng `cai-dat-mod.ps1 -KemGuiBuild` và kiểm chứng
  DOM thật: phần giả lập không còn, thẻ tiến độ hiển thị và app nhận được API bài học.

## 1. Dự án là gì

Biến app OpenBlock (fork Scratch, kéo–thả khối lệnh) thành **môi trường tự học cho học sinh
THCS lớp 6–9 ở Việt Nam**, đi kèm bộ phần cứng "Dế Base KIT — Khu vườn thông minh".
Học sinh tự học ở nhà, không có giáo viên: xem video DIY, lập trình trong app, có AI ("chú Dế")
gợi mở kiểu Socratic — **hỏi ngược để em tự nghĩ ra, không viết code hộ**.

Giáo trình 7 bài, tất cả cùng xây trên MỘT khu vườn. Toàn bộ giao diện phải tiếng Việt,
giọng xưng "em", câu ngắn. Mọi thứ cốt lõi phải chạy được khi **không có mạng**.

Tài liệu nguồn (bản Word của ThingEdu, đã đọc và rút gọn vào `docs/`):
- Hồ sơ giáo trình v0.3 (24/07/2026) — 7 bài, 13 linh kiện
- Mẫu giáo trình tự học Bài 1 — khuôn viết bài và giọng văn

## 2. Bảng trạng thái

| Phần | Trạng thái | Lý do |
|---|---|---|
| **A. Khối lệnh cho kit** (external-resources) | **ĐANG DỞ** | Mới có 1 extension mới (`soilMoisture`, 5 khối, tiếng Việt). Đã lọc kho khối lệnh từ 37 → 6 module đúng linh kiện kit. Còn thiếu 4 extension: ánh sáng, chất lượng không khí, âm thanh, relay. 4 module gốc (dht/ultrasonic/oled/passiveBuzzer) vẫn nguyên tiếng Anh. |
| **B. Vườn ảo mô phỏng** (gui/vm) | **CHƯA CÓ** | Chưa viết một dòng nào. `git status` của gui chỉ có `package-lock.json` đổi do cài thư viện — **chưa đụng vào mã nguồn gui/vm**. Không có state `soilMoisture/temp/light/...`, không có actuator ảo. |
| **C. Chú Dế — AI Socratic 2 lớp** | **ĐANG DỞ** | Có lớp 1 offline và nút **“Chỉ em chỗ lập trình”**. Lớp 2 thử nghiệm dùng Gemini 3.6 Flash nhưng UI chỉ hiện “Chú Dế online”. Key demo được Electron `safeStorage` mã hóa theo tài khoản Windows và tự nạp lần sau; không nằm trong source/localStorage. Chat nhớ cục bộ 8 lượt gần nhất, có nút xóa trí nhớ. Thinking dùng mức `medium`, UI hiện trạng thái thân thiện và vẫn lọc `part.thought`. **Bản phát cho học sinh vẫn cần proxy server để giấu key**. |
| **D. Hành trình 7 bài + màn Home** | **ĐANG DỞ** | Màn Home 2 lối đã chạy. Chế độ Học KIT ẩn nút chọn bo/thêm extension, tự chọn ThingBot và chỉ nạp extension của bài; Dự án riêng hiện lại hai nút. Cầu nối thật nằm trong `gui/src/containers/blocks.jsx`, không giả lập click. Đã bỏ video khỏi từng bài. Bấm bộ KIT luôn mở introduction và bắt buộc xem hết mới vào 7 bài; chưa có MP4 thì dùng bản giới thiệu tích hợp 10 giây, có `app-mods/media/gioi-thieu-khoa-hoc.mp4` thì tự dùng video thật. **Chưa có cơ chế khoá/mở tuần tự giữa 7 bài**. |

## 3. Điểm kiến trúc quan trọng nhất

Màn Home và nội dung bài vẫn là overlay tiêm ngoài. Riêng tích hợp workspace đã có một cầu nối nhỏ trong mã nguồn GUI.

`ai-assistant.js` và `lesson-mode.js` là JavaScript thuần, được nạp bằng thẻ `<script>`
thêm vào cuối `index.html` của app đã build. Chúng vẽ overlay đè lên giao diện React của
OpenBlock, không tham gia vào vòng đời React/Redux.

Ưu điểm: sửa nhanh, không phải build lại (build mất ~10 phút và hay hết RAM).
Overlay không đọc/ghi Redux trực tiếp. `lesson-mode.js` phát sự kiện `de:workspace-mode`;
`gui/src/containers/blocks.jsx` nhận sự kiện rồi gọi API thật của VM để chọn ThingBot,
gỡ extension thừa và nạp extension của bài. Cầu nối này đã giải quyết phần cấu hình bài học,
nhưng **bày sẵn khối lệnh và vườn ảo** vẫn phải làm trong `gui`/`vm` thật.

→ **Quyết định cần chốt sớm**: giữ overlay cho phần nội dung bài học (rẻ, đủ dùng),
nhưng phần vườn ảo và tích hợp workspace thì phải làm trong `gui/src`.

## 4. Bản đồ file

```
D:\OpenBlockSTEMKIT\
├── HANDOFF.md              ← file này
├── tools\node16\           Node 16.20.2 portable — BẮT BUỘC dùng để build (xem §5)
├── gui\                    fork thingblock/thingedublock-gui — đã thêm cầu nối chế độ học tại `src\containers\blocks.jsx`
├── desktop\                fork thingblock/thingedublock-desktop v1.0.2
│                           (chỉ sửa package.json: trỏ gui local + thêm thư viện build)
├── external-resources\     fork lgthevinh/thingedublock-external-resources — 8 file đã sửa
│   ├── devices\thingBotC3\index.js        gắn nhãn lọc 'deBaseKit'
│   └── extensions\
│       ├── soilMoisture\                  MỚI VIẾT — 5 khối tiếng Việt
│       ├── dht|ultrasonic|oled|passiveBuzzer\index.js   thêm nhãn 'deBaseKit'
│       └── meo-block|ps2\index.js         bỏ thingBot khỏi supportDevice
├── app-mods\               Bản gốc các file tiêm vào app (nguồn thật để sửa)
│   ├── ai-assistant.js         chú Dế lớp 1 (offline)
│   ├── lesson-mode.js          màn Home + 7 bài + tiến độ
│   ├── lessons-debasekit.js    dữ liệu 7 bài rút từ giáo trình Word
│   ├── media\                   đặt `gioi-thieu-khoa-hoc.mp4` chính thức tại đây
│   ├── userdata-guard.js       vá bug treo splash (xem §6)
│   └── README.md
└── docs\
    ├── build-setup.md      quy trình build + mọi cái bẫy đã gặp
    ├── thingbot-pinout.md  sơ đồ chân đọc từ ảnh PCB + đối chiếu code
    └── lesson-schema.md    khuôn một bài học

C:\OpenBlockDesktop\        BẢN CÀI — nơi đang chạy thử
└── resources\
    ├── app\                app đang chạy (thư mục, đã giải nén)
    ├── app.asar.tam-tat    file gói gốc ĐÃ TẮT (đổi tên lại là quay về bản chưa mod)
    ├── app.asar.bak        bản gốc nguyên vẹn từ nhà sản xuất
    └── external-resources → junction trỏ về D:\OpenBlockSTEMKIT\external-resources
```

## 5. Cách chạy — có 2 đường, đừng nhầm

### Đường A: bản cài đã tiêm (đang dùng để thử — NHẸ, khuyên dùng)

Sửa file trong `C:\OpenBlockDesktop\resources\app\`, khởi động lại app là thấy ngay.
Nhớ **copy ngược về `D:\OpenBlockSTEMKIT\app-mods\`** để không mất khi cài lại app.

Khi có sửa `gui/src`, compile xong rồi cài cả bundle bằng:
```powershell
powershell -ExecutionPolicy Bypass -File D:\OpenBlockSTEMKIT\app-mods\cai-dat-mod.ps1 -KemGuiBuild
```

```powershell
Start-Process 'C:\OpenBlockDesktop\OpenBlockDesktop.exe' -ArgumentList '--remote-debugging-port=9222'
```
Cổng 9222 cho phép đọc DOM để kiểm chứng bằng máy (xem §7).

**Bẫy chí mạng:** Electron ưu tiên `app.asar` HƠN thư mục `app`. Nếu `app.asar` tồn tại thì
mọi sửa đổi trong thư mục `app` **không có tác dụng gì cả** — đây là lỗi đã làm mất mấy lượt
tưởng đã sửa xong mà app không đổi. Hiện `app.asar` đã đổi tên thành `app.asar.tam-tat`.
Đừng đổi tên nó về nếu vẫn muốn dùng thư mục.

### Đường B: build từ mã nguồn (bắt buộc khi sửa gui/vm — NẶNG)

```powershell
$env:Path = 'D:\OpenBlockSTEMKIT\tools\node16;' + $env:Path   # PHẢI là Node 16
$env:NODE_OPTIONS = '--max-old-space-size=8192'                # PHẢI có, nếu không hết RAM
cd D:\OpenBlockSTEMKIT\desktop
npm start
```

Bốn điều bắt buộc, thiếu một là hỏng (chi tiết trong `docs/build-setup.md`):
1. **Node 16** — gui dùng webpack 4, không chạy trên Node 17+.
2. **`--max-old-space-size=8192`** — máy 15 GB RAM vẫn hết heap khi đóng gói. Đóng bớt app trước.
3. **Junction `openblock-blocks` và `openblock-vm`** trong `desktop\node_modules` phải trỏ về
   `gui\node_modules`. **`npm install` xoá mất chúng** — phải tạo lại sau MỖI lần install.
4. **Module native `usb`, `noble`, `bluetooth-hci-socket`** copy từ bản cài sang
   (máy chưa có Visual Studio C++ nên không biên dịch được).

Chế độ này rất nặng, người dùng đã phản ánh lag. Chỉ bật khi thực sự cần sửa gui/vm,
xong thì tắt ngay.

## 6. Nợ kỹ thuật, lỗi đã biết

| Vấn đề | Mức | Ghi chú |
|---|---|---|
| **Chưa commit gì cả** | CAO | 11 file đã sửa nằm rải ở 3 repo, chưa có commit nào. Bàn giao mà không commit thì người sau không biết cái gì là của ai. |
| Cầu nối bài học mới chỉ điều khiển thiết bị/extension | TRUNG | Đã tự chọn ThingBot và extension bằng API VM. Chưa bày sẵn block mẫu, chưa có vườn ảo. |
| `index.html` của app bị sửa tay | TRUNG | Thêm 2 thẻ `<script>`. Cài lại app là mất. Chưa có script tự động tiêm lại. |
| Chú Dế chưa đúng chất Socratic | TRUNG | Đang giải thích nhiều hơn hỏi ngược. Giáo trình đã có sẵn câu hỏi mẫu cho từng bài trong `lessons-debasekit.js` (trường `hoiAI`) — nên dùng làm chuẩn. |
| 4 module gốc còn tiếng Anh | TRUNG | dht, ultrasonic, oled, passiveBuzzer — cả tên module lẫn tên khối bên trong. |
| Khối servo/motor thừa | THẤP | Giáo trình ghi rõ **"Không có servo"**, nhưng extension ThingBot vẫn có 5 khối servo + 4 khối motor. Nên ẩn để học sinh không kéo nhầm. |
| Bug treo "OpenBlock is loading…" | ĐÃ VÁ | Bản build ThingEdu ghi đè file HSTS lên chính thư mục userData. `userdata-guard.js` tự dọn mỗi lần khởi động. Bản build từ mã nguồn (đường B) **chưa có bản vá này** — nếu treo splash, kiểm tra `%APPDATA%\OpenBlockDesktop (ThingEdu)` xem nó là file hay thư mục. |
| Icon extension là ảnh mượn | THẤP | `soilMoisture` đang dùng tạm icon của Sharp IR. |
| Chưa có video introduction chính thức | THẤP | Khi thiếu `app-mods/media/gioi-thieu-khoa-hoc.mp4`, app dùng bản giới thiệu tích hợp 10 giây và vẫn khóa 7 bài tới khi xem hết. Có file thì installer tự chép vào app và dùng video thật. |

## 7. Cách kiểm chứng bằng máy (đừng tin cảm giác)

Bài học xương máu: đã từng báo "xong" dựa trên phép thử gián tiếp rồi hoá ra sai.
Có 3 cách kiểm chứng thật:

**a. Hỏi server nội bộ của app** (app phải đang chạy):
```bash
curl -s http://127.0.0.1:20112/extensions/en   # danh sách khối lệnh app thực sự nạp
curl -s http://127.0.0.1:20112/devices/en      # dữ liệu thiết bị
```

**b. Đọc thẳng DOM app đang chạy** — chính xác nhất, xem `scratchpad/probe.js`:
```bash
WS=$(curl -s http://localhost:9222/json/list | grep -A3 'resources/app/index.html"' | grep -o 'ws://[^"]*' | head -1)
node probe.js "$WS" "document.getElementById('de-wrap').innerText"
```
Lưu ý: click giả lập qua DOM **không ăn** với React — đừng mất thời gian, hãy nhờ người dùng bấm.

**c. Chạy thử bộ sinh mã** mà không cần mở app — dựng Blockly giả rồi gọi từng khối,
xem mã C++ sinh ra có đúng không.

## 8. Việc tiếp theo — lát cắt dọc Bài 3

Mục tiêu: chạy trọn vẹn MỘT bài trước khi nhân ra 6 bài còn lại.

1. **Khối bật/tắt bơm qua relay** trong `external-resources` (đang thiếu, chặn cả Bài 5).
   → Cần biết relay đấu vào đâu: cổng servo qua PCA9685, hay chiếm cổng IO? **CHƯA CÓ ĐÁP ÁN.**
2. **ĐÃ NỐI bài học vào workspace**: bấm "Bắt đầu làm bài" tự chọn ThingBot, gỡ extension
   thừa và nạp đúng extension theo trường `khoiLenh`. Bài 3 đã kiểm chứng chỉ còn Độ ẩm đất.
   Không bày sẵn block khi mở bài. Riêng Chú Dế có thể bày mẫu tạm 10 giây khi học sinh thực sự bí,
   rồi hoàn nguyên workspace.
3. **Chú Dế cho 2 tình huống Bài 3**, dùng đúng câu trong giáo trình:
   - "số lúc khô và lúc ẩm chênh nhau bao nhiêu? em chọn ngưỡng ở giữa được không?"
   - cảm biến không ra số → hỏi ngược theo thứ tự nguồn → dây → cổng → code.

## 9. Câu hỏi CHƯA có lời đáp (chặn công việc)

Hỏi người phụ trách phần cứng, đừng tự đoán:

1. **Bo chỉ có 4 cổng cảm biến (IO0, IO1, IO4, IO5) nhưng Bài 4 cần 6 chân tín hiệu**
   (DHT11 + ánh sáng + không khí + siêu âm 2 chân + âm thanh), Bài 6 còn thêm độ ẩm đất
   và 4 đầu ra. **Về số cổng là không đủ.** Có bo mở rộng không, hay phân bổ lại theo bài?
2. **Relay cho bơm/quạt/đèn đấu vào đâu?** (chặn Bài 5 và bước 1 ở §8)
3. **Chân I2C của bo là GPIO nào?** Code không gọi `Wire.begin(sda, scl)` nên đang dùng
   mặc định — cần số thật để in vào tài liệu cho học sinh.
4. **Cổng IO5**: xác nhận chỉ dùng cho cảm biến bật/tắt? (ESP32-C3 đọc analog ở IO5 không ổn định)
5. **Chú Dế lớp 2**: bản thử đang dùng Gemini 3.6 Flash và key chỉ giữ trong bộ nhớ. App phát
   cho học sinh không được chứa key — vẫn cần dựng proxy server trước khi phát hành.
6. **Hình chú Dế**: đang dùng emoji 🦗. ThingEdu có bộ nhận diện riêng không?

## 10. Trước khi bàn giao — việc phải làm

- [ ] **Commit 3 repo** (external-resources 8 file, desktop 2 file, gui 1 file) với ghi chú rõ ràng
- [ ] Đẩy `app-mods/` vào một repo (hiện chỉ nằm trên ổ D: của một máy, không ai khác có)
- [ ] Viết script tự động tiêm `<script>` vào `index.html` để cài lại app không mất
- [ ] Trả lời 6 câu ở §9
