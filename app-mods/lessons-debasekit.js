/* Giáo trình chính thức — Dế Base KIT · Khu vườn thông minh (9 bài).
 * Nguồn: Giao_Trinh_Vuon_Thong_Minh_De_Lab.docx.
 * Nhịp chung: Quan sát → Thử → Hiểu vì sao → Sai & sửa → Kể lại.
 */
const LESSONS = [
    {
        so: 1, ten: 'Nhìn cây thật, tìm vấn đề thật',
        phuDe: 'Chưa cần mạch: nhìn kỹ trước khi kết luận.', thoiLuong: '60–90 phút',
        hoatDongDe: 'Chặng 1 · Tư duy khoa học', video: 'media/bai-1-quan-sat-vuon.mp4', coLapTrinh: false, khoiLenh: [],
        moDau: 'Người làm kỹ thuật giỏi không bắt đầu bằng cắm dây. Họ nhìn thật kỹ để tìm một vấn đề đáng giải quyết.',
        mucTieu: ['Ghi được điều nhìn thấy thay vì đoán vội', 'Biến quan sát thành câu hỏi đo được', 'Đặt tên một vấn đề sẽ theo em tới Bài 9'],
        chuanBi: 'Sổ tay, bút, điện thoại chụp ảnh nếu có. Chưa cần linh kiện.',
        cacBuoc: [
            {ten: 'Mười phút đứng yên', noiDung: 'Quan sát một cây hoặc góc vườn. Ghi ít nhất 5 dòng về lá, đất, ánh sáng, vị trí hay thay đổi em thấy.'},
            {ten: 'Quan sát hay suy đoán?', noiDung: 'Tách câu “em thấy” khỏi câu “em đoán”. Ví dụ: “lá vàng” là thấy; “cây bị bệnh” là đoán.'},
            {ten: 'Ba lần thu hẹp', noiDung: 'Thu hẹp điều em thấy thành một thứ có thể đo hoặc kiểm tra: ở đâu, lúc nào, thay đổi thế nào?'},
            {ten: 'Đặt tên vấn đề', noiDung: 'Viết vấn đề bằng ba mảnh: chuyện gì xảy ra – ở đâu – khi nào. Đây là vấn đề dự án của em.'}
        ],
        hoiAI: ['Câu này là quan sát hay suy đoán: ...?', 'Giúp em biến điều em thấy thành một câu hỏi kiểm tra được.'],
        tuKiemTra: ['Em đã ghi điều nhìn thấy thật chưa?', 'Em tách được quan sát và suy đoán chưa?', 'Em đặt được vấn đề có chuyện gì – ở đâu – khi nào chưa?'],
        sanPham: 'Một trang Sổ tay: ảnh/ghi chép quan sát và một vấn đề rõ ràng.',
        anToan: 'Đi cùng người lớn nếu ra ngoài; không hái hay nếm cây lạ.',
        chuanBiBaiSau: 'Gom chai nhựa, bìa carton, que kem và hai cốc giống nhau cho Bài 2.'
    },
    {
        so: 2, ten: 'Mô phỏng tái chế',
        phuDe: 'Thử ý tưởng nhỏ trước khi tin là nó đúng.', thoiLuong: '60–90 phút',
        hoatDongDe: 'Chặng 1 · Thí nghiệm DIY', video: 'media/bai-2-mo-hinh-vuon-mini.mp4', coLapTrinh: false, khoiLenh: [],
        moDau: 'Mô hình bìa carton cho phép em sai rẻ, sửa nhanh, rồi mới đưa công nghệ vào.',
        mucTieu: ['Dựng mô hình để trả lời vấn đề Bài 1', 'Biết chỉ đổi một yếu tố trong thí nghiệm', 'Viết kết luận dựa trên điều đã quan sát'],
        chuanBi: 'Chai nhựa, bìa carton, que kem, băng keo, đất hoặc xơ dừa, nước; hai cốc giống nhau.',
        cacBuoc: [
            {ten: 'Dựng mô hình', noiDung: 'Làm một góc vườn mini có chậu, đất, đường nước hoặc mái che liên quan đến vấn đề của em.'},
            {ten: 'Thiết kế thử công bằng', noiDung: 'Dùng hai cốc đất giống nhau; chỉ đổi một thứ (ví dụ mái che hoặc lượng nước), giữ những thứ khác giống nhau.'},
            {ten: 'Chạy và ghi số', noiDung: 'Thử, quan sát và ghi kết quả: lượng nước, thời gian, độ ướt hoặc điều em đo được.'},
            {ten: 'Kể lại kết luận', noiDung: 'Viết một câu có dữ liệu: “Khi…, em thấy… nên…”. Nêu cả điều em chưa chắc.'}
        ],
        hoiAI: ['Em nên giữ cố định cái gì và đổi cái gì để so sánh công bằng?', 'Câu kết luận này đã dựa vào quan sát hay chỉ là đoán?'],
        tuKiemTra: ['Em có mô hình liên quan vấn đề Bài 1 chưa?', 'Em chỉ thay đổi một yếu tố trong lúc thử chưa?', 'Em ghi được kết quả và một câu kết luận chưa?'],
        sanPham: 'Mô hình vườn mini cùng bảng thử nghiệm và kết luận ngắn.',
        anToan: 'Nhờ người lớn khi dùng kéo hoặc dao; lau nước đổ để tránh trơn.',
        chuanBiBaiSau: 'Chuẩn bị ThingBot, cảm biến độ ẩm đất, đất khô và đất ẩm cho Bài 3.'
    },
    {
        so: 3, ten: 'ThingBot đo độ ẩm đất',
        phuDe: 'Đo hai đầu trước, rồi mới dạy vườn báo khát.', thoiLuong: '90 phút',
        hoatDongDe: 'Chặng 2 · Hiểu KIT', coLapTrinh: true, khoiLenh: ['soilMoisture', 'arduinoThingBotC3'],
        tutorial: [
            {title: 'Cắm cảm biến S1', text: 'Cắm đầu dò độ ẩm vào S1, sau đó bật mạch.', target: 'workspace'},
            {title: 'Đo hai đầu', text: 'Đo đất khô và đất ẩm, ghi hai số rồi chọn ngưỡng ở giữa.', target: 'category:soilMoisture'},
            {title: 'Ghép còi báo', text: 'Kéo điều kiện nếu–thì và đặt còi vào bên trong.', target: 'workspace'},
            {title: 'Nạp và thử', text: 'Nạp vào ThingBot rồi thử lại bằng đất khô và đất ẩm.', target: 'upload'}
        ],
        moDau: 'Hôm nay em cho ThingBot một giác quan: biết đất đang khô hay ẩm, dựa trên số em tự đo.',
        mucTieu: ['Cắm cảm biến độ ẩm đất vào S1', 'Đo giá trị khô – ẩm và chọn ngưỡng có lý do', 'Lập trình đất khô thì còi báo'],
        chuanBi: 'ThingBot, cảm biến độ ẩm đất, đất khô, đất ẩm, dây USB.',
        cacBuoc: [
            {ten: 'Cắm và bật', noiDung: 'Kiểm tra nguồn và cắm cảm biến đất vào S1.'},
            {ten: 'Đo hai đầu', noiDung: 'Ghi số khi đầu dò ở đất khô và đất ẩm.'},
            {ten: 'Chọn ngưỡng', noiDung: 'Chọn một số ở giữa hai lần đo và giải thích vì sao.'},
            {ten: 'Ghép khối, cho còi kêu', noiDung: 'Đất khô dưới ngưỡng thì còi báo.'},
            {ten: 'Chỉnh cho vừa', noiDung: 'Thử lại, chỉnh ngưỡng nếu còi báo quá sớm hoặc quá muộn.'}
        ],
        hoiAI: ['Hai số em đo được là bao nhiêu? Ngưỡng ở giữa là số nào?', 'Cảm biến không ra số: kiểm tra nguồn, dây, cổng hay chương trình trước?'],
        tuKiemTra: ['Em đã đọc được số từ cảm biến chưa?', 'Em đã ghi số đất khô và đất ẩm chưa?', 'Em chọn được ngưỡng có lý do chưa?', 'Còi có báo đúng lúc đất khô không?'],
        sanPham: 'Thiết bị báo đất khô đã nạp thật vào ThingBot.',
        anToan: 'Tay khô khi cắm dây; chỉ nhúng đầu dò, không nhúng mạch.',
        chuanBiBaiSau: 'Chuẩn bị DHT11, cảm biến ánh sáng, siêu âm và OLED cho Bài 4.'
    },
    {
        so: 4, ten: 'Bốn giác quan của khu vườn',
        phuDe: 'Đọc, so sánh và hiện dữ liệu môi trường.', thoiLuong: '90–120 phút',
        hoatDongDe: 'Chặng 2 · Hiểu KIT', coLapTrinh: true, khoiLenh: ['dht', 'ultrasonic', 'oled', 'soilMoisture', 'arduinoThingBotC3'],
        moDau: 'Một số đo chưa kể hết câu chuyện. Hôm nay vườn có nhiệt độ, ánh sáng, nước và màn hình để nhìn dữ liệu.',
        mucTieu: ['Đọc DHT11 ở S2, ánh sáng S3 và siêu âm S4', 'Hiện các số quan trọng lên OLED', 'Tính một giá trị so sánh với ngưỡng'],
        chuanBi: 'ThingBot, DHT11 (S2), ánh sáng (S3), siêu âm (S4), OLED, cốc nước.',
        cacBuoc: [
            {ten: 'Đọc nhiệt – ẩm', noiDung: 'Cắm DHT11 vào S2 và ghi hai số.'},
            {ten: 'Đọc ánh sáng', noiDung: 'Cắm cảm biến ánh sáng S3, thử che và mở sáng.'},
            {ten: 'Đo bồn nước', noiDung: 'Dùng siêu âm S4 đo khoảng cách tới mặt nước.'},
            {ten: 'Hiện và so sánh', noiDung: 'Đưa số lên OLED; tính nhiệt độ đang cách ngưỡng nóng bao xa.'},
            {ten: 'Kể lại', noiDung: 'Chọn một số thay đổi rõ nhất và giải thích bằng lần thử của em.'}
        ],
        hoiAI: ['Số nào nên hiện trước trên OLED?', 'Vì sao số cảm biến thay đổi liên tục?'],
        tuKiemTra: ['Em đọc được DHT11 chưa?', 'Em thử được ánh sáng hoặc khoảng cách nước chưa?', 'OLED có hiện dữ liệu em cần chưa?', 'Em có so sánh được một số với ngưỡng chưa?'],
        sanPham: 'Trạm đo môi trường mini có màn OLED.', anToan: 'Đặt mạch xa nước và tắt nguồn trước khi đổi dây.',
        chuanBiBaiSau: 'Chuẩn bị relay, bơm M1, quạt M2 và đèn M3 cho Bài 5.'
    },
    {
        so: 5, ten: 'Dạy vườn hành động',
        phuDe: 'Từ dữ liệu sang bơm, quạt, đèn — đúng lúc và có giới hạn.', thoiLuong: '90–120 phút',
        hoatDongDe: 'Chặng 2 · Hiểu KIT', coLapTrinh: true, khoiLenh: ['soilMoisture', 'arduinoThingBotC3', 'motorOutputs'],
        moDau: 'Cảm biến chỉ nói cho mạch biết tình hình. Relay và các đầu ra mới giúp khu vườn làm điều hữu ích.',
        mucTieu: ['Hiểu relay là công tắc cho tải', 'Thử bơm M1, quạt M2, đèn M3 an toàn', 'Tưới theo điều kiện và thời gian, rồi đếm lượt tưới'],
        chuanBi: 'ThingBot, relay, bơm M1, quạt M2, đèn M3, nguồn phù hợp và cảm biến đất.',
        cacBuoc: [
            {ten: 'Hiểu relay', noiDung: 'Thử công tắc relay và nhận ra vì sao tải không nối thẳng vào mạch.'},
            {ten: 'Thử bơm M1', noiDung: 'Chạy bơm trong thời gian ngắn, quan sát dòng nước.'},
            {ten: 'Thử quạt và đèn', noiDung: 'Điều khiển quạt M2, đèn M3 từng cái một.'},
            {ten: 'Tưới có giới hạn', noiDung: 'Đất khô thì bật bơm vài giây, sau đó tắt.'},
            {ten: 'Đếm lượt tưới', noiDung: 'Lưu biến đếm và ghi mỗi lần bơm đã chạy.'}
        ],
        hoiAI: ['Vì sao bơm cần chạy có thời gian giới hạn?', 'Nếu tưới quá nhiều lần, em kiểm tra ngưỡng hay thời gian trước?'],
        tuKiemTra: ['Em thử từng đầu ra an toàn chưa?', 'Bơm có tự tắt sau thời gian đặt trước chưa?', 'Em có ghi hoặc đếm được lượt tưới chưa?'],
        sanPham: 'Cụm tưới giới hạn thời gian, có dữ liệu lượt tưới.', anToan: 'Nước và nguồn tải phải xa mạch; nhờ người lớn kiểm tra phần relay/nguồn.',
        chuanBiBaiSau: 'Chuẩn bị các số đo đã ghi để tìm quy luật ở Bài 6.'
    },
    {
        so: 6, ten: 'Từ số đo đến quy luật',
        phuDe: 'Không chỉ nhìn từng số — tìm mẫu và kiểm tra lại.', thoiLuong: '90 phút',
        hoatDongDe: 'Chặng 3 · Dữ liệu & lập luận', coLapTrinh: true, khoiLenh: ['dht', 'soilMoisture', 'arduinoThingBotC3'],
        moDau: 'Dữ liệu không tự nói. Em sẽ so sánh nhiều lần đo để tìm quy luật, rồi kiểm tra xem quy luật đó có thật không.',
        mucTieu: ['So sánh ba tình huống từ số đo', 'Đề xuất một công thức/chỉ số đơn giản', 'Kiểm tra công thức bằng dữ liệu khác'],
        chuanBi: 'Sổ tay số đo các bài trước, ThingBot và các cảm biến cần dùng.',
        cacBuoc: [
            {ten: 'Nhìn từng số', noiDung: 'Chọn dữ liệu nhiệt độ, đất hoặc ánh sáng em đã ghi.'},
            {ten: 'So sánh ba trường hợp', noiDung: 'Đặt ba lần đo cạnh nhau: khi nào cao, thấp, khác nhau?'},
            {ten: 'Tìm quy luật', noiDung: 'Nói thử một mẫu: “Khi…, thì…”.'},
            {ten: 'Tạo chỉ số', noiDung: 'Tạo một phép tính đơn giản, ví dụ nhiệt độ trừ một phần độ ẩm.'},
            {ten: 'Kiểm tra lại', noiDung: 'Đem quy luật thử với dữ liệu/lần đo khác và ghi điều chưa đúng.'}
        ],
        hoiAI: ['Ba lần đo này có quy luật gì, hay chỉ là trùng hợp?', 'Công thức của em cần kiểm tra lại ở trường hợp nào?'],
        tuKiemTra: ['Em có ba trường hợp để so sánh chưa?', 'Em nêu được một quy luật có điều kiện chưa?', 'Em đã kiểm tra lại quy luật bằng lần đo khác chưa?'],
        sanPham: 'Một chỉ số hoặc quy luật nhỏ, kèm bằng chứng thử lại.', anToan: 'Áp dụng an toàn điện như các bài trước.',
        chuanBiBaiSau: 'Chuẩn bị cảm biến chất lượng không khí cho Bài 7.'
    },
    {
        so: 7, ten: 'Không khí có đang khác thường?',
        phuDe: 'Đo nền trước, rồi mới gọi đó là cảnh báo.', thoiLuong: '90 phút',
        hoatDongDe: 'Chặng 3 · Dữ liệu & lập luận', coLapTrinh: true, khoiLenh: ['arduinoThingBotC3'],
        moDau: 'Một cảm biến không khí cần thời gian ổn định. Em sẽ đo mức bình thường trước khi đặt ngưỡng cảnh báo.',
        mucTieu: ['Hiểu cảm biến cần làm nóng/ổn định', 'Ghi được mức nền', 'Lập trình báo khi lệch nền và đo độ trễ'],
        chuanBi: 'ThingBot, cảm biến chất lượng không khí, sổ tay, không gian thông thoáng.',
        cacBuoc: [
            {ten: 'Làm quen cảm biến', noiDung: 'Cắm cảm biến và chờ ổn định theo hướng dẫn phần cứng.'},
            {ten: 'Ghi mức nền', noiDung: 'Ghi các số ở không khí bình thường.'},
            {ten: 'Chọn độ lệch', noiDung: 'Đặt ngưỡng dựa vào mức nền, không dùng số đoán sẵn.'},
            {ten: 'Thử cảnh báo', noiDung: 'Thử trong điều kiện an toàn và ghi thời gian từ thay đổi tới báo hiệu.'},
            {ten: 'Sai và sửa', noiDung: 'Nếu báo quá nhạy/chậm, chỉnh một yếu tố rồi thử lại.'}
        ],
        hoiAI: ['Vì sao không nên lấy một số ngẫu nhiên làm ngưỡng không khí?', 'Độ trễ của em bao nhiêu giây?'],
        tuKiemTra: ['Em chờ cảm biến ổn định chưa?', 'Em ghi được mức nền chưa?', 'Ngưỡng của em có dựa vào mức nền chưa?', 'Em thử và ghi độ trễ chưa?'],
        sanPham: 'Cảnh báo không khí có mức nền và kết quả thử.', anToan: 'Không tạo khói hoặc hít chất lạ để thử; làm nơi thông thoáng, có người lớn.',
        chuanBiBaiSau: 'Mang mô hình và các cụm đã làm để tích hợp ở Bài 8.'
    },
    {
        so: 8, ten: 'Lắp thành khu vườn chạy được',
        phuDe: 'Tích hợp từng lớp, không cắm hết rồi mới mong nó chạy.', thoiLuong: '120 phút trở lên',
        hoatDongDe: 'Chặng 3 · Tích hợp hệ thống', coLapTrinh: true, khoiLenh: ['soilMoisture', 'dht', 'ultrasonic', 'oled', 'arduinoThingBotC3', 'motorOutputs'],
        moDau: 'Một dự án lớn dễ lỗi nếu làm tất cả cùng lúc. Em sẽ ráp theo bốn lớp và thử từng lớp.',
        mucTieu: ['Bố trí cơ khí gọn, an toàn', 'Thử riêng cảm biến và đầu ra', 'Ghép thành chương trình tích hợp'],
        chuanBi: 'Mô hình Bài 2, các cảm biến/đầu ra đã dùng, dây, nhãn dán và sổ tay.',
        cacBuoc: [
            {ten: 'Bố trí cơ khí', noiDung: 'Đặt chậu, bồn, mạch và dây ở vị trí khô, dễ kiểm tra.'},
            {ten: 'Thử cảm biến', noiDung: 'Đọc từng cảm biến trước khi nối chung.'},
            {ten: 'Thử đầu ra tay', noiDung: 'Thử bơm, quạt, đèn từng cái với thời gian ngắn.'},
            {ten: 'Tích hợp chương trình', noiDung: 'Ghép đọc → quyết định → hành động → hiển thị; sửa từng lỗi một.'},
            {ten: 'Chạy kiểm tra', noiDung: 'Ghi điều chạy được, điều chưa ổn và thứ tự em đã sửa.'}
        ],
        hoiAI: ['Hệ thống lỗi thì kiểm tra theo thứ tự nguồn – dây – cổng – linh kiện – chương trình – ngưỡng được không?', 'Em nên tách phần nào ra để thử trước?'],
        tuKiemTra: ['Bố trí của em an toàn và có nhãn chưa?', 'Các cảm biến đọc riêng được chưa?', 'Các đầu ra thử riêng được chưa?', 'Em có một lượt chạy tích hợp và nhật ký sửa lỗi chưa?'],
        sanPham: 'Khu vườn thông minh tích hợp, có nhật ký thử và sửa.', anToan: 'Tắt nguồn khi đổi dây; nguồn tải riêng và nước phải cách mạch.',
        chuanBiBaiSau: 'Mở lại vấn đề Bài 1, ảnh/ghi chép và dữ liệu thử để làm dự án cuối.'
    },
    {
        so: 9, ten: 'Dự án của em: thử, sửa, kể lại',
        phuDe: 'Quay lại vấn đề đầu tiên và chứng minh giải pháp của em.', thoiLuong: '120 phút trở lên',
        hoatDongDe: 'Chặng 3 · Dự án & trình bày', coLapTrinh: true, khoiLenh: ['soilMoisture', 'dht', 'ultrasonic', 'oled', 'arduinoThingBotC3'],
        moDau: 'Đây là lúc em tự chọn một cải tiến, đặt thước đo thành công và kể lại cả điều chưa hoàn hảo.',
        mucTieu: ['Nối giải pháp với vấn đề Bài 1', 'So sánh hai lần thử khi chỉ đổi một yếu tố', 'Trình bày sản phẩm bằng bằng chứng'],
        chuanBi: 'Khu vườn Bài 8, Sổ tay, ảnh/số đo, poster hoặc slide nếu có.',
        cacBuoc: [
            {ten: 'Mở lại vấn đề', noiDung: 'Đọc lại: chuyện gì – ở đâu – khi nào em đã ghi ở Bài 1.'},
            {ten: 'Đặt tiêu chí thành công', noiDung: 'Viết một tiêu chí đo được, không chỉ “trông có vẻ tốt”.'},
            {ten: 'Thiết kế nâng cấp', noiDung: 'Chọn một chức năng hoặc cách bố trí để giải vấn đề.'},
            {ten: 'Chạy lần 1', noiDung: 'Ghi số liệu/ảnh và điều xảy ra.'},
            {ten: 'Chỉ sửa một thứ, chạy lần 2', noiDung: 'So sánh với lần 1 và nêu tác động của thay đổi.'},
            {ten: 'Kể lại trong 3 phút', noiDung: 'Nói: vấn đề – giải pháp – bằng chứng – điều còn hạn chế – bước tiếp theo.'}
        ],
        hoiAI: ['Tiêu chí này đo được chưa?', 'Em chỉ đổi một thứ giữa hai lần thử chưa?', 'Bằng chứng nào giúp em kể dự án thuyết phục hơn?'],
        tuKiemTra: ['Em nối được giải pháp với vấn đề Bài 1 chưa?', 'Em có tiêu chí thành công đo được chưa?', 'Em có dữ liệu của hai lần thử chưa?', 'Em nêu được một hạn chế và bước tiếp theo chưa?'],
        sanPham: 'Dự án khu vườn cá nhân hoá, hai lượt thử và bài nói 3 phút.', anToan: 'Nhờ người lớn kiểm tra phần nguồn/relay mới trước khi chạy.',
        chuanBiBaiSau: ''
    }
];

if (typeof module !== 'undefined') module.exports = LESSONS;
