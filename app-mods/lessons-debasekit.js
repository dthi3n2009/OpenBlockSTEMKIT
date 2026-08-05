/* Dữ liệu 7 bài — Dế Base KIT · Khu vườn thông minh
 * Rút từ "Hồ sơ giáo trình v0.3 (24/07/2026)" và "Mẫu giáo trình tự học · Bài 1".
 * Giọng văn giữ đúng bản gốc: xưng "em", câu ngắn, động viên.
 *
 * Mỗi bài:
 *   coLapTrinh : bài này có phần kéo thả khối lệnh không (Bài 1, 2 thì không)
 *   khoiLenh   : những nhóm khối được mở ở bài này (mở dần, tránh ngợp)
 *   video      : để trống '' khi chưa quay -> giao diện hiện ô "đang chuẩn bị"
 *   hoiAI      : câu hỏi mẫu lấy nguyên từ giáo trình, bấm là gửi cho trợ lý
 */
const LESSONS = [
    {
        so: 1,
        ten: 'Quan sát vườn, chọn vấn đề',
        phuDe: 'Nhìn ra vấn đề thật của cây trước khi nghĩ tới công nghệ.',
        thoiLuong: '60–90 phút',
        hoatDongDe: 'Quan sát thiên nhiên',
        coLapTrinh: false,
        khoiLenh: [],
        video: '',
        moDau: 'Chào em! Người làm kỹ thuật giỏi không bắt đầu bằng việc cắm dây — họ bắt đầu bằng việc nhìn thật kỹ để tìm ra vấn đề đáng giải quyết. Hôm nay em tập đúng điều đó.',
        mucTieu: [
            'Biết cách quan sát cây cối như một người làm khoa học',
            'Phân biệt được "điều em thấy" với "điều em đoán"',
            'Chọn được một vấn đề của riêng em để theo suốt cả khoá'
        ],
        chuanBi: 'Sổ tay Maker, bút, điện thoại chụp ảnh nếu có. Chưa cần linh kiện.',
        cacBuoc: [
            {ten: 'Xem video mở đầu', noiDung: 'Vài khu vườn đang gặp vấn đề, và vì sao nên quan sát trước khi bắt tay làm.'},
            {ten: 'Ra quan sát thật', noiDung: 'Chọn 2–3 cây, ghi lại ba thứ: sự kiện (chuyện gì đang xảy ra), bối cảnh (ở đâu, lúc nào), tần suất (thỉnh thoảng hay thường xuyên).'},
            {ten: 'Tách "thấy" và "đoán"', noiDung: 'Gạch chân câu em nhìn thấy thật, khoanh tròn câu em đoán. "Lá vàng" là thấy, "chắc do thiếu nước" là đoán. Đây là kỹ năng quan trọng nhất của bài.'},
            {ten: 'Đặt câu hỏi kiểm tra được', noiDung: 'Ví dụ: "Có phải cây ở góc này héo vì đất khô nhanh hơn không?"'},
            {ten: 'Chọn vấn đề của em', noiDung: 'Chọn một vấn đề em thấy thú vị nhất. Vấn đề này sẽ đi theo em tới tận Bài 7.'}
        ],
        hoiAI: [
            'Câu này là quan sát hay suy đoán: ...?',
            'Làm sao biến điều em thấy thành câu hỏi kiểm tra được?'
        ],
        tuKiemTra: [
            'Em đã ghi được ít nhất 3 điều quan sát chưa?',
            'Em phân biệt được "thấy" và "đoán" chưa?',
            'Em có một vấn đề kèm câu hỏi kiểm tra được chưa?'
        ],
        sanPham: 'Một trang Sổ tay có phần quan sát, vấn đề em chọn và câu hỏi của em.',
        anToan: 'Ra ngoài nên đi cùng người thân, tránh nắng gắt. Không hái hay nếm cây lạ.',
        chuanBiBaiSau: 'Gom sẵn chai nhựa, bìa carton, que kem cho Bài 2.'
    },
    {
        so: 2,
        ten: 'Mô phỏng tái chế',
        phuDe: 'Sai trên bìa carton rẻ hơn sai trên mạch điện.',
        thoiLuong: '60–90 phút',
        hoatDongDe: 'Mô phỏng & thí nghiệm · DIY loại 1 (không điện)',
        coLapTrinh: false,
        khoiLenh: [],
        video: '',
        moDau: 'Trước khi tốn linh kiện, mình thử ý tưởng bằng đồ rẻ đã. Mô hình bìa carton sai thoải mái, hỏng cũng không tiếc.',
        mucTieu: [
            'Biến câu hỏi ở Bài 1 thành mô hình để kiểm tra',
            'Thử nguyên lý nước thấm – chảy – chứa',
            'Thử hướng nắng và cách làm mái che'
        ],
        chuanBi: 'Chai nhựa, bìa carton, que kem, ống hút, nắp chai, băng keo, nước, đất hoặc xơ dừa.',
        cacBuoc: [
            {ten: 'Vì sao phải mô phỏng', noiDung: 'Thử trên đồ tái chế trước để biết cái gì hiệu quả, rồi mới làm thật.'},
            {ten: 'Làm mô hình vườn mini', noiDung: 'Dựng chậu, khung, mái bằng chai nhựa và bìa carton.'},
            {ten: 'Thử nguyên lý', noiDung: 'Đổ nước xem thấm và chảy thế nào. Nghiêng mô hình đón nắng thử.'},
            {ten: 'Rút kết luận', noiDung: 'Ghi bảng kết quả: cái gì giữ ẩm tốt? Mái đặt sao để che nắng?'}
        ],
        hoiAI: [
            'Em nên giữ cố định cái gì và đổi cái gì để so sánh cho công bằng?',
            'Vật liệu nào giữ ẩm tốt hơn?'
        ],
        tuKiemTra: [
            'Em đã làm xong mô hình vườn mini chưa?',
            'Em có bảng ghi kết quả thử nghiệm chưa?',
            'Em rút ra được điều gì cho khu vườn thật chưa?'
        ],
        sanPham: 'Mô hình vườn tái chế và một bảng thử nghiệm nguyên lý.',
        anToan: 'Nhờ người lớn khi dùng kéo hoặc dao. Lau nước đổ ra sàn để tránh trơn trượt.',
        chuanBiBaiSau: 'Bài 3 bắt đầu dùng mạch điện — chuẩn bị Mạch Thing và cảm biến độ ẩm đất.'
    },
    {
        so: 3,
        ten: 'Mạch Thing + độ ẩm đất',
        phuDe: 'Vườn biết "khát" — bài điện tử đầu tiên.',
        thoiLuong: '90 phút',
        hoatDongDe: 'Vận hành Vườn IoT · DIY loại 2 · Làm trên bàn',
        coLapTrinh: true,
        khoiLenh: ['soilMoisture', 'arduinoThingBotC3'],
        video: '',
        moDau: 'Hôm nay mạch của em sẽ "cảm nhận" được đất khô hay ẩm. Làm trên bàn thôi, chưa lắp vào vườn vội.',
        mucTieu: [
            'Hiểu "đầu vào" — cách mạch thu nhận thông tin từ cảm biến',
            'Cắm được cảm biến độ ẩm đất và đọc giá trị',
            'Dùng khối điều kiện: đất khô thì kêu còi'
        ],
        chuanBi: 'Mạch Thing, cảm biến độ ẩm đất, còi buzzer, dây; một ly đất khô và một ly đất ẩm để thử.',
        cacBuoc: [
            {ten: 'Làm quen bộ não của vườn', noiDung: 'Nhận biết cổng nguồn, GND và cổng tín hiệu trên Mạch Thing. Quy tắc vàng: tắt nguồn trước khi đổi dây.'},
            {ten: 'Cắm cảm biến', noiDung: 'Cắm cảm biến độ ẩm đất vào cổng, đúng chiều ba dây: tín hiệu – 5V – GND.'},
            {ten: 'Đọc số', noiDung: 'Kéo khối "độ ẩm đất ở cổng ... (%)" ra. Nhúng đầu dò vào đất khô rồi đất ẩm, xem số thay đổi.'},
            {ten: 'Báo khi khô', noiDung: 'Dùng khối "nếu ... thì": đất khô thì cho còi kêu. Đây là chương trình thật đầu tiên của em.'}
        ],
        hoiAI: [
            'Số lúc khô và lúc ẩm chênh nhau bao nhiêu? Em chọn ngưỡng ở giữa được không?',
            'Vì sao em chọn mốc ngưỡng đó?',
            'Cảm biến không ra số, em nên kiểm tra gì trước?'
        ],
        tuKiemTra: [
            'Em đọc được số từ cảm biến chưa?',
            'Em đã tự đo giá trị lúc đất khô và lúc đất ẩm chưa?',
            'Còi có kêu đúng lúc đất khô không?'
        ],
        sanPham: 'Một thiết bị "báo đất khô" cầm tay chạy độc lập.',
        anToan: 'Tay khô ráo khi cắm dây. Chỉ nhúng đầu dò, không nhúng phần mạch điện tử. Tắt nguồn trước khi đổi dây.',
        chuanBiBaiSau: 'Bài 4 thêm nhiều giác quan: DHT11, ánh sáng, không khí, siêu âm và màn OLED.'
    },
    {
        so: 4,
        ten: 'Cụm cảm biến môi trường',
        phuDe: 'Cho vườn nhiều giác quan và biết hiển thị dữ liệu.',
        thoiLuong: '90–120 phút',
        hoatDongDe: 'Vận hành Vườn IoT · DIY loại 2 · Làm trên bàn',
        coLapTrinh: true,
        khoiLenh: ['dht', 'ultrasonic', 'oled', 'soilMoisture', 'arduinoThingBotC3'],
        video: '',
        moDau: 'Mỗi con cảm biến là một giác quan cho vườn. Hôm nay vườn của em có thêm mắt, mũi và tai.',
        mucTieu: [
            'Đọc được DHT11 (nhiệt độ, độ ẩm), cảm biến ánh sáng và chất lượng không khí',
            'Dùng siêu âm SRF04 đo mức nước trong bồn',
            'Hiển thị các thông số lên màn OLED'
        ],
        chuanBi: 'Mạch Thing, DHT11, cảm biến ánh sáng, cảm biến chất lượng không khí, siêu âm SRF04, cảm biến âm thanh, OLED, dây; một cốc nước để thử đo mức.',
        cacBuoc: [
            {ten: 'Thêm giác quan', noiDung: 'Bày các cảm biến ra bàn, xem mỗi con đo được gì.'},
            {ten: 'Nhiệt – ẩm – sáng – không khí', noiDung: 'Cắm và đọc lần lượt DHT11, cảm biến ánh sáng, cảm biến chất lượng không khí. Hiểu từng thông số nghĩa là gì.'},
            {ten: 'Đo mức nước', noiDung: 'Siêu âm đo khoảng cách tới mặt nước trong cốc. Biết còn bao nhiêu nước để sau này không bơm khô.'},
            {ten: 'Hiện lên OLED', noiDung: 'Đưa các số lên màn hình, cập nhật mỗi 2 giây.'}
        ],
        hoiAI: [
            'Em nên đưa thông tin nào lên màn trước?',
            'Làm sao quy đổi khoảng cách siêu âm thành "còn nhiều nước" hay "sắp hết"?',
            'Vì sao số của cảm biến cứ nhảy liên tục?'
        ],
        tuKiemTra: [
            'Em đọc được cả bốn loại cảm biến chưa?',
            'Siêu âm đo mức nước có hợp lý không?',
            'Màn OLED hiện đủ thông số chưa?'
        ],
        sanPham: 'Một "trạm đo môi trường mini" hiển thị nhiệt độ, độ ẩm, ánh sáng, chất lượng không khí và mức nước.',
        anToan: 'Đặt cảm biến và mạch nơi khô, tránh nước bắn. Kiểm tra cắm đúng chiều chân trước khi bật nguồn.',
        chuanBiBaiSau: 'Bài 5 học điều khiển bơm, quạt, đèn qua relay.'
    },
    {
        so: 5,
        ten: 'Cụm đầu ra qua relay',
        phuDe: 'Vườn cảm nhận được rồi, giờ dạy nó hành động.',
        thoiLuong: '90 phút',
        hoatDongDe: 'Vận hành Vườn IoT · DIY loại 2 · Làm trên bàn',
        coLapTrinh: true,
        khoiLenh: ['passiveBuzzer', 'arduinoThingBotC3'],
        video: '',
        moDau: 'Bơm, quạt, đèn là những "tải lớn" — không nối thẳng vào mạch được. Relay chính là công tắc điện tử giúp mạch nhỏ điều khiển đồ lớn an toàn.',
        mucTieu: [
            'Hiểu relay là công tắc điện tử cho tải lớn',
            'Bật/tắt được bơm nước, quạt, đèn 10W và còi',
            'Biết vì sao tải lớn phải đi qua relay'
        ],
        chuanBi: 'Mạch Thing, relay 5V, bơm mini, quạt 5V, đèn 10W (nguồn riêng, có tản nhiệt), cảm biến ánh sáng, còi buzzer, dây.',
        cacBuoc: [
            {ten: 'Đầu ra là gì', noiDung: 'Bày bơm, quạt, đèn, còi ra bàn. Đây là những thứ giúp vườn hành động.'},
            {ten: 'Relay là công tắc', noiDung: 'Nối relay, nghe tiếng "tách", bật tắt quạt. Hiểu vì sao không nối thẳng đèn 10W vào mạch.'},
            {ten: 'Đèn trồng cây', noiDung: 'Che cảm biến ánh sáng cho tối, đèn 10W tự bật qua relay.'},
            {ten: 'Thử từng đầu ra', noiDung: 'Bật lần lượt bơm, quạt, đèn, còi. Bơm chạy vài giây rồi tự tắt.'}
        ],
        hoiAI: [
            'Tải nào cần nguồn riêng?',
            'Bật đèn liên tục có hao pin và nóng không?',
            'Bơm nên chạy bao nhiêu giây một lần tưới?'
        ],
        tuKiemTra: [
            'Em bật tắt được cả bơm, quạt, đèn và còi chưa?',
            'Em giải thích được vì sao cần relay chưa?',
            'Đèn có tự bật khi em che cảm biến ánh sáng không?'
        ],
        sanPham: 'Một "bàn thử đầu ra" điều khiển được bơm, quạt, đèn và còi.',
        anToan: 'Đèn 10W rất nóng và chói: dùng nguồn riêng, có tản nhiệt, không nhìn thẳng, không chạm khi đang sáng. Giữ nước xa mạch điện.',
        chuanBiBaiSau: 'Bài 6 lắp tất cả vào khu vườn thật — chuẩn bị mô hình vườn từ Bài 2, bồn nước và ống.'
    },
    {
        so: 6,
        ten: 'DIY lắp tất cả vào khu vườn',
        phuDe: 'Giờ là lúc mọi mảnh ghép về đúng chỗ.',
        thoiLuong: '120 phút trở lên',
        hoatDongDe: 'Vận hành Vườn IoT → Dự án xanh · DIY loại 2 (tích hợp)',
        coLapTrinh: true,
        khoiLenh: ['soilMoisture', 'dht', 'ultrasonic', 'oled', 'passiveBuzzer', 'arduinoThingBotC3'],
        video: '',
        moDau: 'Từng cụm em đã hiểu rồi. Hôm nay ráp tất cả thành một khu vườn thông minh chạy được thật.',
        mucTieu: [
            'Gắn toàn bộ cảm biến và đầu ra vào vườn tái chế',
            'Viết một chương trình tổng cho cả khu vườn',
            'Đi dây gọn gàng, dán nhãn cho dễ sửa'
        ],
        chuanBi: 'Toàn bộ linh kiện và khu vườn tái chế từ các bài trước, bồn nước và ống.',
        cacBuoc: [
            {ten: 'Ráp lại', noiDung: 'Bày các cụm đã làm cạnh khu vườn tái chế.'},
            {ten: 'Gắn cảm biến', noiDung: 'Độ ẩm vào đất, siêu âm trên bồn nước, DHT11 và cảm biến không khí, ánh sáng lên khung. Tránh nước, đi dây theo cổng.'},
            {ten: 'Gắn đầu ra qua relay', noiDung: 'Bơm vào bồn, quạt và đèn 10W dùng nguồn riêng. Kiểm tra nguồn trước khi chạy.'},
            {ten: 'Chương trình tổng', noiDung: 'Vòng lặp chính: đọc cảm biến → tưới → quạt → cảnh báo mức nước → đèn theo ánh sáng → cập nhật OLED.'}
        ],
        hoiAI: [
            'Vườn chạy sai, em nên kiểm tra theo thứ tự nào?',
            'Nguồn → dây → cổng → code → tải, em đang kẹt ở bước nào?',
            'Làm sao tổ chức chương trình cho gọn và dễ sửa?'
        ],
        tuKiemTra: [
            'Vườn có tự tưới khi đất khô không?',
            'Quạt và đèn có chạy đúng điều kiện không?',
            'OLED hiện đủ thông tin không?',
            'Khi bơm, quạt, đèn cùng chạy thì có bị sụt nguồn không?'
        ],
        sanPham: 'Một khu vườn thông minh hoàn chỉnh chạy tự động toàn bộ chức năng.',
        anToan: 'Kiểm tra tổng dòng khi bơm, quạt, đèn cùng chạy. Đèn 10W nguồn riêng và có tản nhiệt. Chạy thử một lúc rồi kiểm tra linh kiện có nóng bất thường không.',
        chuanBiBaiSau: 'Bài 7 em sẽ thêm chức năng của riêng mình và tập thuyết trình.'
    },
    {
        so: 7,
        ten: 'Dự án riêng + showcase',
        phuDe: 'Vấn đề em chọn ở Bài 1 — giờ giải nó theo cách của em.',
        thoiLuong: '120 phút trở lên',
        hoatDongDe: 'Dự án xanh riêng & Trình bày · Gộp cả hai loại DIY',
        coLapTrinh: true,
        khoiLenh: ['soilMoisture', 'dht', 'ultrasonic', 'oled', 'passiveBuzzer', 'arduinoThingBotC3'],
        video: '',
        moDau: 'Khu vườn giờ là của em. Quay lại vấn đề em chọn ở Bài 1 và thêm một chức năng để giải nó.',
        mucTieu: [
            'Tự thiết kế thêm hoặc đổi một chức năng cho vườn',
            'Test ít nhất hai lượt và cải tiến một yếu tố',
            'Trình bày được sản phẩm trong 2–3 phút'
        ],
        chuanBi: 'Các linh kiện còn lại và đồ tái chế tuỳ ý; Sổ tay Maker; slide hoặc poster.',
        cacBuoc: [
            {ten: 'Vườn của em', noiDung: 'Nghĩ một nâng cấp: nhắc tưới, đếm ngày, báo không khí xấu... miễn là giải được vấn đề em chọn ở Bài 1.'},
            {ten: 'Thiết kế và làm', noiDung: 'Tự thêm chức năng. Ghi lại quyết định và lỗi vào Sổ tay Maker.'},
            {ten: 'Test và cải tiến', noiDung: 'Chạy thử, sửa một yếu tố rồi thử lại. Lỗi là dữ liệu, cứ thử tiếp.'},
            {ten: 'Tập thuyết trình', noiDung: 'Cấu trúc bài nói 2–3 phút: vấn đề – giải pháp – dữ liệu – hạn chế.'}
        ],
        hoiAI: [
            'Nếu em làm vậy thì chuyện gì xảy ra?',
            'Làm sao đặt tiêu chí thành công đo được?',
            'Sản phẩm của em còn hạn chế gì?'
        ],
        tuKiemTra: [
            'Chức năng mới có giải được vấn đề Bài 1 không?',
            'Em đã test ít nhất hai lượt chưa?',
            'Em nêu được hạn chế của sản phẩm không?',
            'Sổ tay Maker đã đầy đủ chưa?'
        ],
        sanPham: 'Khu vườn cá nhân hoá với một chức năng riêng, kèm bài thuyết trình 2–3 phút và Sổ tay Maker.',
        anToan: 'Áp dụng nguyên tắc an toàn của các bài trước cho phần mới. Nhờ người lớn kiểm tra trước khi cấp nguồn cho cơ cấu mới.',
        chuanBiBaiSau: ''
    }
];

if (typeof module !== 'undefined') module.exports = LESSONS;
