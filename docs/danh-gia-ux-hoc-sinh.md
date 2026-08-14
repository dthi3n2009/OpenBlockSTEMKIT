# Đánh giá trải nghiệm tự học — đi thật một lượt trong app

Ngày 11/08/2026. Cách làm: xoá sạch tiến độ để thành "học sinh mới", rồi đi hết luồng
đăng nhập → chọn lối → video mở đầu → Bài 1 (làm hết 4 chặng) → Bài 3 → workspace → hỏi chú Dế.
Mọi nhận xét dưới đây đọc từ giao diện thật, không suy đoán từ mã nguồn.

## Làm tốt

- **Vào được ngay**: có lối "Dùng thử không cần tài khoản", không bắt học sinh đăng ký.
- **Bài 1–2 đúng lứa tuổi**: không bắt đọc chữ mà cho chạm chọn thẻ qua 4 chặng
  (chọn chỗ → nhìn tinh → đặt câu hỏi → chọn nhiệm vụ). Chọn sai bị chặn, không cho qua bừa.
- **Dạy đúng kỹ năng cốt lõi**: chặng 2 bắt phân biệt "Lá cây đang vàng" (quan sát)
  với "Cây chắc thiếu nước" (suy đoán) — dạy bằng thao tác thay vì giảng lý thuyết.
- **Khoá bài tuần tự chạy đúng**: xong Bài 1 thì Bài 2 mở, 5 bài sau vẫn khoá.
- **Vào Bài 3 không phải mò**: app tự chọn ThingBot và tự nạp nhóm "Độ ẩm đất".
  Đây là khác biệt lớn so với bản gốc (trước phải qua 3 lớp menu mới thấy khối).
- **Chú Dế có ngữ cảnh và biết nhắc an toàn**: trả lời đúng bài đang học, kèm
  "chỉ cho que đo chạm nước, đừng để bo mạch ướt", và kết bằng câu hỏi ngược.

## Vấn đề tìm được

| # | Vấn đề | Vì sao hại việc tự học | Mức |
|---|---|---|---|
| 1 | Ngăn khối có **72 khối**, gồm PWM, ngắt, cạnh lên, kênh CH0, cổng nối tiếp, chuyển kiểu dữ liệu | Học sinh mở ra không biết khối nào là của mình | Cao |
| 2 | Có **khối servo và motor** dù hộp kit không có (giáo trình ghi rõ "Không có servo") | Kéo ra, nạp xong không thấy gì chạy, không hiểu vì sao | Cao |
| 3 | Chân mặc định trong khối là **IO2** — bo không có chân này (chỉ IO0/IO1/IO4/IO5) | Làm đúng hướng dẫn vẫn không đọc ra số | Cao |
| 4 | **Bài 3 là trang chữ dài ~2000 ký tự**, trong khi Bài 1–2 là hành trình bấm chọn | Nhịp học gãy giữa chừng; em quen bấm sẽ lướt qua không đọc | Cao |
| 5 | Chọn sai rồi bấm tiếp thì báo **"Hãy chọn một thẻ trước nhé"** | Em vừa chọn xong, tưởng app không nhận | Trung |
| 6 | Xong chặng cuối Bài 1, màn hình **không đổi gì** dù đã lưu xong | Tưởng app đơ, không biết mình đã qua bài | Trung |
| 7 | Chú Dế nói **"mở nhóm khối soilMoisture"** nhưng màn hình ghi "Độ ẩm đất" | Tìm chữ đó không ra | Trung |
| 8 | Chú Dế **liệt kê các bước** thay vì hỏi ngược | Lệch nguyên tắc Socratic của chính giáo trình | Trung |
| 9 | Không có cách nào cho **giáo viên nhìn cả lớp** | Dạy 30 em không biết ai đang kẹt ở đâu | Trung |

## Đã sửa trong lượt này

**Vấn đề 1, 2, 3** — thêm `gui/src/lib/de-loc-toolbox.js`, gọi từ `blocks.jsx`:
chỉ áp dụng khi đang học bộ kit, vào "Dự án riêng" vẫn giữ đủ khối.
- Ẩn cả nhóm: `arduino_serial` (Cổng nối tiếp), `arduino_data` (Chuyển kiểu dữ liệu)
- Ẩn từng khối: PWM, servo, gắn/gỡ ngắt, `thingBotC3_setMotor`, `thingBotC3_setServo`, `thingBotC3_initPS2`
- Đổi chân mặc định `2` → `0` (trong XML là số, màn hình mới hiện thành "IO2"/"IO0")

Đã đo trên app thật sau khi cài bản build mới:

| | Trước | Sau |
|---|---|---|
| Số nhóm trong ngăn khối | 10 | **8** |
| Số khối học sinh nhìn thấy | 72 | **43** |

Kiểm chứng từng khối bằng cách đọc XML ngăn khối trong app đang chạy: servo/PWM/ngắt/motor/PS2
đều đã biến mất, còn khối "Độ ẩm đất" và khối còi của bài vẫn nguyên.

**Vấn đề 5** — `lesson-mode.js` phân biệt "chưa chạm thẻ nào" với "đã chọn nhưng chưa đúng",
câu sau đổi thành "Thẻ đó chưa đúng. Em đọc lại câu hỏi rồi thử thẻ còn lại nhé!".

## Chưa sửa — đề xuất thứ tự

1. **Vấn đề 4** (Bài 3 còn là trang chữ dài) — việc lớn nhất còn lại, nên làm tiếp ngay.
   Chuyển Bài 3–7 sang cùng nhịp hành trình như Bài 1–2.
2. **Vấn đề 8 và 7** — chỉnh giọng chú Dế về đúng kiểu hỏi ngược, và bắt nó gọi tên
   nhóm khối bằng đúng chữ hiện trên màn hình.
3. **Vấn đề 6** — cho màn chúc mừng hiện chắc chắn khi xong chặng cuối.
4. **Vấn đề 9** — bảng theo dõi lớp cho giáo viên (việc lớn, cần bàn phạm vi trước).
