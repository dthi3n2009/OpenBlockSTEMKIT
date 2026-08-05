# Sơ đồ chân ThingBot Shield — đối chiếu ảnh PCB với code

Nguồn: ảnh mặt sau bo ThingBot Shield (ThingEdu) + đọc ngược từ
`external-resources/extensions/arduinoThingBotC3/generator.js`.
Vi điều khiển: ESP32-C3.

## Các cụm chân trên bo (theo nhãn in trên PCB)

| Cụm | Nhãn chân | Dùng cho |
|---|---|---|
| Cổng PS2 | CLK, ATT, CMD, DATA, 3.3V, GND | Tay cầm PS2 |
| Cổng I2C | GND, 5V, SDA, SCL | Màn OLED 0.96", và PCA9685 trên bo |
| Nút bấm | Sw | Nút trên bo |
| Cổng cảm biến A | IO5, IO4, 5V, GND | Cắm cảm biến |
| Cổng cảm biến B | IO1, IO0, 5V, GND | Cắm cảm biến |
| Nguồn ngoài | 5V–9V (+/−) | Nuôi motor/relay/đèn |

> Ảnh chụp là MẶT SAU, nên thứ tự chân nhìn từ mặt trước sẽ ngược lại.
> Cần đối chiếu bo thật trước khi in tài liệu cho học sinh.

## Hai không gian đánh số — dễ nhầm

Code dùng SONG SONG hai hệ số hoàn toàn khác nhau:

**1. GPIO thật của ESP32-C3** — đọc/ghi trực tiếp bằng `digitalRead`/`analogRead`:
- `IO0`, `IO1`, `IO4`, `IO5` → 4 cổng cắm cảm biến
- `SW = 3` → GPIO3, code dùng `pinMode(SW, INPUT)` + `digitalRead(SW)`
- PS2: `DAT=7, CMD=2, SEL=10, CLK=6`

**2. Kênh của chip PCA9685** (điều khiển qua I2C) — dùng `pwm.setPWM()`/`pwm.setPin()`:
- Motor: `M1_A=2, M1_B=3, M2_A=4, M2_B=5, M3_A=7, M3_B=6, M4_A=1, M4_B=0`
- Servo: `SERVO_1=12, SERVO_2=11, SERVO_3=10, SERVO_4=9, SERVO_5=8`
- `BUZZER=14`, `LED_1=15`, `LED_2=13`

Số trùng nhau giữa hai hệ (ví dụ "3" vừa là GPIO3 của nút bấm, vừa là kênh PCA9685 của motor 1)
nhưng KHÔNG xung đột vì khác không gian. Khi đặt tên khối lệnh cho học sinh phải tránh lộ số này ra —
chỉ hiện "cổng IO0", "motor 1", "servo 2".

## Chân nào đọc được cảm biến analog?

ESP32-C3 có:
- **ADC1 = GPIO0, 1, 2, 3, 4** → đọc analog ổn định
- **ADC2 = GPIO5** → dùng chung tài nguyên với WiFi, Arduino-ESP32 đọc không ổn định

Đối chiếu 4 cổng cảm biến của bo:

| Cổng | Đọc digital | Đọc analog |
|---|---|---|
| IO0 | được | được (ADC1) |
| IO1 | được | được (ADC1) |
| IO4 | được | được (ADC1) |
| IO5 | được | **không nên** (ADC2, dễ sai số) |

→ Khi làm khối cảm biến analog (độ ẩm đất, ánh sáng, chất lượng không khí, âm thanh),
danh sách cổng chỉ nên cho chọn **IO0, IO1, IO4**.

→ Menu chân mặc định của app hiện SAI: ThingBot khai `deviceExtensionsCompatible: 'arduinoEsp32'`
nên thừa hưởng menu của ESP32 đời cũ (IO0, IO2, IO4, IO12, IO13, IO14, IO15) — toàn chân
không có trên bo này. Vì vậy khối lệnh của kit phải **ghi cứng danh sách cổng**, không dùng
`Blockly.Device.getPinOptions()`.

## Điểm cần kiểm chứng trên phần cứng thật

1. **Chân I2C là GPIO nào?** Code không gọi `Wire.begin(sda, scl)` nên đang dùng mặc định của
   Arduino-ESP32 cho C3. Cần đo hoặc hỏi nhà sản xuất để ghi vào tài liệu học sinh.
2. **Chỉ có 4 cổng cảm biến** nhưng kit có 6 loại cảm biến, riêng siêu âm SRF04 cần 2 chân
   (TRIG + ECHO). Không lắp hết cùng lúc được → cần biết mỗi bài học dùng cảm biến nào
   để phân bổ cổng, hoặc cần bo mở rộng.
3. **Relay cho bơm/quạt/đèn đấu vào đâu?** Nếu đi qua kênh PCA9685 (như buzzer/LED) thì bật/tắt
   bằng `pwm.setPin(ch, 0/4095)`. Nếu đấu thẳng vào cổng IO thì lại càng ít cổng cho cảm biến.
