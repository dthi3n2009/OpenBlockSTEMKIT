# Prompt bàn giao — copy nguyên khối dưới đây

```
Bạn là kỹ sư phần mềm tiếp quản dự án OpenBlockSTEMKIT / "Dế Base KIT — Khu vườn thông minh".

QUY ƯỚC GIT: Sau mỗi hạng mục đã làm xong và kiểm tra được, hãy quét key/dữ liệu cá nhân,
commit với nội dung rõ ràng và push lên `origin/main`. Không đẩy các thử nghiệm dang dở hoặc
API key. Nhờ vậy GitHub luôn là bản sao cập nhật của mã nguồn đã ổn định.

VIỆC ĐẦU TIÊN, BẮT BUỘC: đọc D:\OpenBlockSTEMKIT\HANDOFF.md và
D:\OpenBlockSTEMKIT\docs\danh-gia-ux-hoc-sinh.md trước khi sửa bất cứ dòng nào.
Đừng viết code cho tới khi đã đọc xong hai file đó.

── DỰ ÁN LÀ GÌ ──
Biến app OpenBlock (fork Scratch, kéo–thả khối lệnh, chạy trên Electron) thành môi trường
tự học cho học sinh THCS lớp 6–9 ở Việt Nam, đi kèm bộ phần cứng Dế Base KIT.
Học sinh tự học ở nhà, KHÔNG có giáo viên bên cạnh. Giáo trình 7 bài, tất cả cùng xây
trên MỘT khu vườn thông minh (tự tưới, tự bật đèn, tự quạt mát).

── RÀNG BUỘC BẮT BUỘC ──
1. Toàn bộ chữ trong app bằng tiếng Việt, xưng "em", câu ngắn, giọng động viên.
   Không để lọt thuật ngữ kỹ thuật tiếng Anh ra màn hình học sinh.
2. Mọi thứ cốt lõi phải chạy được khi KHÔNG có mạng.
3. AI ("chú Dế") theo lối Socratic: HỎI NGƯỢC để em tự nghĩ ra, KHÔNG viết code hộ,
   KHÔNG đưa đáp án. Mỗi bài đã có sẵn câu hỏi mẫu trong app-mods/lessons-debasekit.js
   (trường hoiAI) — dùng đúng những câu đó làm chuẩn giọng.
4. Thay đổi tối thiểu, có kiểm soát. Không đập đi làm lại. Giữ tương thích OpenBlock gốc.
5. Kit KHÔNG CÓ servo và KHÔNG CÓ motor (giáo trình ghi rõ). Đừng thêm khối cho chúng.

── TRẠNG THÁI HIỆN TẠI ──
A. Khối lệnh cho kit (external-resources): ĐANG DỞ.
   Đã có extension soilMoisture (5 khối tiếng Việt). Đã lọc kho khối lệnh từ 37 module
   xuống 6 module đúng linh kiện kit. CÒN THIẾU 4 extension: cảm biến ánh sáng,
   chất lượng không khí, âm thanh, và relay (bơm/quạt/đèn). 4 module gốc
   (dht, ultrasonic, oled, passiveBuzzer) vẫn còn nguyên tên tiếng Anh.

B. Vườn ảo mô phỏng (gui/vm): CHƯA CÓ. Chưa viết dòng nào.
   Mục tiêu: chưa cắm phần cứng vẫn thấy trên màn "đất khô → bơm chạy → độ ẩm tăng".

C. Chú Dế (AI 2 lớp): ĐANG DỞ. Lớp 1 offline theo quy tắc đã chạy. Lớp 2 gọi Gemini
   đang thử nghiệm, key mã hoá bằng Electron safeStorage. Bản phát cho học sinh VẪN CẦN
   proxy server để giấu key. Giọng hiện tại còn liệt kê các bước thay vì hỏi ngược.

D. Hành trình 7 bài + màn Home: ĐANG DỞ. Màn Home hai lối (Bộ Kit / Dự án riêng) đã chạy.
   Khoá bài tuần tự đã chạy. Bài 1–2 đã thiết kế thành hành trình 4 chặng bấm chọn,
   có chấm đúng/sai. Bài 3 đã nối được workspace thật (tự chọn ThingBot, tự nạp extension
   của bài) qua cầu nối trong gui/src/containers/blocks.jsx.

── VIỆC CẦN LÀM, THEO ĐÚNG THỨ TỰ ƯU TIÊN ──

VIỆC 1 (đang dở, làm nốt trước): kiểm chứng bộ lọc ngăn khối lệnh.
  Vừa thêm gui/src/lib/de-loc-toolbox.js — ẩn khối quá sức với lứa tuổi (PWM, ngắt,
  cổng nối tiếp, chuyển kiểu dữ liệu) và khối không có phần cứng (servo, motor, PS2).
  Đã đo được: 72 khối → 43 khối, 10 nhóm → 8 nhóm.
  CHƯA XÁC NHẬN: phần đổi chân mặc định từ IO2 sang IO0. Bo ThingBot chỉ có 4 cổng
  IO0/IO1/IO4/IO5, không có IO2 — để mặc định IO2 thì học sinh làm đúng hướng dẫn vẫn
  không đọc ra số. Hãy mở Bài 3, xem khối "đọc chân analog" mặc định là gì, sửa nếu còn sai.

VIỆC 2 (lớn nhất): chuyển Bài 3–7 sang cùng nhịp hành trình như Bài 1–2.
  Hiện Bài 3 vẫn là trang chữ dài ~2000 ký tự, trong khi Bài 1–2 là chuỗi chặng bấm chọn.
  Nhịp học gãy ngay giữa khoá: em quen bấm chọn sẽ lướt qua bức tường chữ mà không đọc.
  Xem hàm troChoiNhiemVu và moBaiNhiemVu trong app-mods/lesson-mode.js để theo đúng khuôn.

VIỆC 3: chỉnh giọng chú Dế về đúng lối Socratic.
  Hiện trả lời kiểu "em hãy làm theo 2 bước nhỏ này" rồi liệt kê. Phải đổi thành hỏi ngược,
  ví dụ "Em nhìn quanh xem có nhóm nào tên giống cảm biến em đang cầm không?".
  Đồng thời bắt chú Dế gọi tên nhóm khối bằng ĐÚNG chữ hiện trên màn hình — hiện đang nói
  "nhóm khối soilMoisture" trong khi màn hình ghi "Độ ẩm đất", học sinh tìm không ra.

VIỆC 4: viết 4 extension còn thiếu (ánh sáng, chất lượng không khí, âm thanh, relay).
  Theo đúng khuôn external-resources/extensions/soilMoisture (7 file). Tên khối tiếng Việt,
  danh sách cổng ghi cứng IO0/IO1/IO4 cho khối đọc số analog (KHÔNG dùng getPinOptions vì
  menu mặc định hiện các chân không có trên bo).
  VƯỚNG: chưa biết relay đấu vào đâu — phải hỏi người phụ trách phần cứng trước khi viết.

VIỆC 5: vườn ảo mô phỏng trong gui/vm. Bắt đầu tối giản: chỉ 2 biến {doAmDat, bomDangChay},
  vẽ chậu cây + thanh độ ẩm, bơm chạy thì độ ẩm tăng dần, không tưới thì giảm dần.
  Đừng làm cả 5 cảm biến ngay.

VIỆC 6 (bàn phạm vi trước khi làm): bảng theo dõi lớp cho giáo viên. Hiện chỉ xuất được
  file .dehoc từng máy, dạy 30 em không biết ai đang kẹt ở đâu.

── CÁCH CHẠY, 4 CÁI BẪY PHẢI BIẾT ──
Sửa nội dung bài học / chú Dế (file trong app-mods) — không cần build:
  powershell -ExecutionPolicy Bypass -File D:\OpenBlockSTEMKIT\app-mods\cai-dat-mod.ps1
Sửa giao diện (gui/src) — phải build rồi mới cài:
  $env:Path = 'D:\OpenBlockSTEMKIT\tools\node16;' + $env:Path
  $env:NODE_OPTIONS = '--max-old-space-size=8192'
  cd D:\OpenBlockSTEMKIT\desktop; npm run compile
  powershell -ExecutionPolicy Bypass -File ..\app-mods\cai-dat-mod.ps1 -KemGuiBuild

BẪY 1: Electron ưu tiên app.asar HƠN thư mục app. Còn file app.asar thì mọi sửa đổi giao diện
       đều vô nghĩa mà KHÔNG báo lỗi gì. Hiện đã đổi tên thành app.asar.tam-tat — đừng đổi về.
BẪY 2: PHẢI dùng Node 16 (gui dùng webpack 4, không chạy trên Node 17+).
BẪY 3: PHẢI đặt NODE_OPTIONS=--max-old-space-size=8192, máy 15 GB RAM vẫn hết heap khi build.
BẪY 4: npm install XOÁ MẤT junction openblock-blocks và openblock-vm trong desktop\node_modules.
       Sau mỗi lần npm install phải tạo lại (lệnh trong HANDOFF.md §5).

── CÁCH KIỂM CHỨNG: ĐỪNG TIN CẢM GIÁC, PHẢI ĐO ──
Dự án này đã nhiều lần báo "xong" rồi hoá ra chưa có tác dụng gì. Bắt buộc kiểm chứng thật:
- Mở app kèm cổng gỡ lỗi:
  Start-Process 'C:\OpenBlockDesktop\OpenBlockDesktop.exe' -ArgumentList '--remote-debugging-port=9222'
- Đọc thẳng DOM app đang chạy để xác nhận (xem HANDOFF.md §7, có sẵn script probe.js).
- Hỏi server nội bộ: curl http://127.0.0.1:20112/extensions/en và /devices/en
- LƯU Ý: click giả lập qua DOM KHÔNG ăn với React — đừng mất thời gian, hãy nhờ người dùng bấm.
- Muốn thử như học sinh mới: xoá khoá de_base_kit_tien_do trong localStorage rồi tải lại app.

── CÂU HỎI PHẢI HỎI NGƯỜI DÙNG, ĐỪNG TỰ ĐOÁN ──
1. Bo chỉ có 4 cổng cảm biến (IO0, IO1, IO4, IO5) nhưng Bài 4 cần 6 chân tín hiệu
   (DHT11 + ánh sáng + không khí + siêu âm 2 chân + âm thanh), Bài 6 còn thêm nữa.
   Về số cổng là KHÔNG ĐỦ. Có bo mở rộng không, hay phân bổ lại theo từng bài?
2. Relay cho bơm/quạt/đèn đấu vào đâu — cổng servo qua PCA9685 hay chiếm cổng IO?
3. Chân I2C của bo là GPIO nào? (code không gọi Wire.begin nên đang dùng mặc định)
4. Chú Dế lớp 2: dùng model nào, và API key đặt ở đâu khi phát cho học sinh?

── CÁCH LÀM VIỆC ──
Trình bày kế hoạch TRƯỚC khi sửa code. Làm từng việc nhỏ, kiểm chứng bằng máy rồi mới sang
việc tiếp. Thiếu thông tin thì hỏi, đừng đoán bừa. Báo cáo trung thực: chỗ nào chưa kiểm
chứng được thì nói thẳng là chưa, đừng nói "đã xong".
```
