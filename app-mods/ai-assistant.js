/**
 * ThingEdu AI Assistant — offline knowledge-base chatbot for OpenBlock Desktop.
 *
 * Chế độ hiện tại: 'local' — trả lời bằng bộ kiến thức đóng gói sẵn (không cần mạng).
 * Khi có API key, đổi window.ThingEduAI.config.mode = 'api' và điền endpoint/apiKey
 * bên dưới; hàm askApi() đã chừa sẵn, local sẽ tự thành phương án dự phòng.
 */
(function () {
    'use strict';

    // ---------------------------------------------------------------- config
    const config = {
        mode: 'local', // 'local' | 'api'
        api: {
            endpoint: '', // ví dụ: https://your-proxy.example.com/chat
            apiKey: '',
            model: ''
        }
    };

    // ------------------------------------------------------------- utilities
    // Bỏ dấu tiếng Việt + thường hóa để so khớp từ khóa
    function normalize (s) {
        return s.toLowerCase()
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '')
            .replace(/đ/g, 'd')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function pick (arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    // -------------------------------------------------------- knowledge base
    // Mỗi mục: keywords (đã bỏ dấu), answer (có thể là mảng để trả lời ngẫu nhiên), chips gợi ý tiếp
    const KB = [
        {
            id: 'connect',
            keywords: ['ket noi', 'khong nhan', 'cong com', 'com port', 'usb', 'driver', 'khong thay thiet bi', 'khong tim thay'],
            answer: 'Để kết nối ThingBot C3:\n' +
                '1. Cắm cáp USB (dùng cáp truyền dữ liệu, không phải cáp chỉ sạc).\n' +
                '2. Bấm nút "Chưa kết nối" trên thanh công cụ → chọn cổng COM hiện ra → Kết nối.\n' +
                '3. Nếu không thấy cổng COM: cài driver CH340 hoặc CP210x, rút cắm lại cáp, thử cổng USB khác.\n' +
                'ThingBot C3 dùng USB native của ESP32-C3 nên đa số máy Windows 10/11 nhận không cần driver.',
            chips: ['Cách nạp chương trình', 'Lỗi nạp code']
        },
        {
            id: 'upload',
            keywords: ['nap chuong trinh', 'nap code', 'upload', 'tai chuong trinh', 'loi nap'],
            answer: 'Cách nạp chương trình:\n' +
                '1. Kết nối board qua cổng COM trước.\n' +
                '2. Kéo các block vào vùng làm việc — code C++ tương ứng hiện ở panel bên phải.\n' +
                '3. Bấm nút "Nạp" (Upload). Chờ biên dịch xong (lần đầu hơi lâu).\n' +
                'Nếu lỗi: kiểm tra đã chọn đúng thiết bị ThingBot chưa, thử rút cắm lại USB rồi nạp lại.',
            chips: ['Không kết nối được', 'Ý tưởng dự án']
        },
        {
            id: 'soil',
            keywords: ['do am dat', 'soil', 'moisture', 'tuoi cay', 'cam bien dat'],
            answer: 'Cảm biến độ ẩm đất (extension "Độ ẩm đất") có 3 block:\n' +
                '• "giá trị analog" — đọc số thô 0–4095 từ chân A0 của cảm biến.\n' +
                '• "độ ẩm đất (%)" — đổi ra phần trăm, có 2 ô hiệu chuẩn: cắm cảm biến vào đất KHÔ ghi lại giá trị analog điền vào ô "khô", nhúng vào đất ƯỚT điền vào ô "ướt".\n' +
                '• "tín hiệu digital (D0)" — báo khô/ướt theo ngưỡng vặn bằng biến trở trên module.\n' +
                'Đấu dây 3 chân: VCC → 3.3V, GND → GND, A0 → chân analog (GPIO0–4 trên ESP32-C3).',
            chips: ['Ý tưởng với độ ẩm đất', 'Cảm biến nhiệt độ']
        },
        {
            id: 'soil-idea',
            keywords: ['y tuong voi do am dat', 'tuoi cay tu dong'],
            answer: 'Dự án gợi ý với cảm biến độ ẩm đất:\n' +
                '🌱 Hệ thống tưới cây tự động: đọc "độ ẩm đất (%)" → nếu < 30% thì bật bơm mini (qua khối motor) trong 3 giây → chờ 10 giây đo lại.\n' +
                '🌱 Nâng cấp: thêm 2 LED báo trạng thái (xanh = đủ ẩm, đỏ = khô), hoặc còi kêu khi đất khô quá lâu.\n' +
                'Block cần dùng: vòng lặp mãi mãi, nếu–thì, so sánh, độ ẩm đất (%), motor/LED.',
            chips: ['Cảm biến độ ẩm đất', 'Ý tưởng dự án']
        },
        {
            id: 'temp',
            keywords: ['nhiet do', 'dht', 'do am khong khi', 'temperature'],
            answer: 'Đo nhiệt độ & độ ẩm không khí dùng extension "DHT" (hỗ trợ DHT11/DHT22):\n' +
                '1. Thêm extension DHT từ nút góc dưới trái.\n' +
                '2. Dùng block khởi tạo DHT với chân digital đã cắm, rồi block đọc nhiệt độ / độ ẩm.\n' +
                'Đấu dây: VCC → 3.3V, GND → GND, DATA → một chân digital.\n' +
                'Ngoài ra có DS18B20 (đầu dò chống nước) cho đo nhiệt độ nước/đất.',
            chips: ['Ý tưởng dự án', 'Cảm biến độ ẩm đất']
        },
        {
            id: 'servo-motor',
            keywords: ['servo', 'motor', 'dong co', 'banh xe', 'quay'],
            answer: 'Trên ThingBot C3, motor và servo điều khiển qua chip PCA9685:\n' +
                '• Bắt đầu chương trình bằng block "khởi tạo ThingBot" (bắt buộc, chạy 1 lần trong setup).\n' +
                '• Block motor: chọn M1–M4, chiều quay và tốc độ 0–100.\n' +
                '• Block servo: chọn S1–S5 và giá trị xung.\n' +
                'Nếu motor không quay: kiểm tra đã gắn pin/nguồn cho mạch công suất chưa — USB chỉ đủ nuôi vi điều khiển.',
            chips: ['Robot tránh vật cản', 'Ý tưởng dự án']
        },
        {
            id: 'ultrasonic',
            keywords: ['sieu am', 'ultrasonic', 'khoang cach', 'tranh vat can', 'hc-sr04'],
            answer: 'Đo khoảng cách dùng extension "Ultrasonic" (HC-SR04):\n' +
                'Đấu dây: VCC → 5V, GND → GND, TRIG và ECHO → 2 chân digital.\n' +
                '🤖 Robot tránh vật cản: vòng lặp mãi mãi → đọc khoảng cách → nếu < 15cm thì lùi + xoay, ngược lại đi thẳng.',
            chips: ['Điều khiển motor', 'Ý tưởng dự án']
        },
        {
            id: 'sound-air',
            keywords: ['am thanh', 'tieng on', 'mic', 'khong khi', 'bui', 'mq135', 'chat luong'],
            answer: 'Cảm biến âm thanh và chất lượng không khí (MQ135) là các cảm biến 3 chân đọc analog — block chuyên dụng đang được bổ sung.\n' +
                'Trong lúc chờ, bạn dùng được ngay block "đọc chân analog" trong mục chân (Pin) của thiết bị: giá trị to = ồn/ô nhiễm nhiều.\n' +
                '💡 Ý tưởng: máy đo tiếng ồn lớp học — đọc analog mic, nếu vượt ngưỡng thì bật LED đỏ + còi nhắc giữ trật tự.',
            chips: ['Ý tưởng dự án', 'Cảm biến độ ẩm đất']
        },
        {
            id: 'ideas',
            keywords: ['y tuong', 'du an', 'lam gi', 'goi y', 'project', 'de tai', 'stem'],
            answer: [
                'Vài ý tưởng dự án với ThingBot C3:\n' +
                '🌱 Chậu cây thông minh — độ ẩm đất + bơm nước tự động\n' +
                '🌡️ Trạm thời tiết mini — DHT + hiển thị OLED\n' +
                '🤖 Robot tránh vật cản — siêu âm + 2 motor\n' +
                '🔊 Máy đo tiếng ồn lớp học — mic analog + LED cảnh báo\n' +
                'Hỏi tiếp về ý tưởng nào để mình hướng dẫn block cụ thể nhé!',
                'Gợi ý theo chủ đề:\n' +
                '🏠 Nhà thông minh: đèn tự bật khi tối, quạt tự chạy khi nóng (DHT + motor)\n' +
                '🗑️ Thùng rác tự mở nắp — siêu âm phát hiện tay + servo mở nắp\n' +
                '🎮 Xe điều khiển tay cầm PS2 — extension PS2 có sẵn cho ThingBot\n' +
                '🌾 Nông nghiệp: tưới cây tự động theo độ ẩm đất\n' +
                'Bạn thích chủ đề nào, mình chỉ block cần dùng cho!'
            ],
            chips: ['Ý tưởng với độ ẩm đất', 'Robot tránh vật cản', 'Xe điều khiển PS2']
        },
        {
            id: 'obstacle-robot',
            keywords: ['robot tranh vat can'],
            answer: 'Robot tránh vật cản — các bước:\n' +
                '1. Block "khởi tạo ThingBot" + block khởi tạo siêu âm (TRIG/ECHO đúng chân đã cắm).\n' +
                '2. Vòng lặp mãi mãi: đọc khoảng cách.\n' +
                '3. Nếu khoảng cách < 15: cả 2 motor lùi 0.5 giây, rồi motor trái tiến + motor phải lùi 0.4 giây (xoay).\n' +
                '4. Ngược lại: 2 motor cùng tiến tốc độ 60.\n' +
                'Mẹo: để tốc độ vừa phải robot mới kịp phanh!',
            chips: ['Điều khiển motor', 'Cảm biến siêu âm']
        },
        {
            id: 'ps2',
            keywords: ['ps2', 'tay cam', 'dieu khien xe', 'gamepad'],
            answer: 'Xe điều khiển bằng tay cầm PS2:\n' +
                '1. Thêm extension "PS2" (có sẵn cho ThingBot).\n' +
                '2. Block "khởi tạo ThingBot" + "khởi tạo PS2" trong setup.\n' +
                '3. Vòng lặp: đọc joystick/nút bấm → gán tốc độ cho motor trái/phải tương ứng.\n' +
                'Lưu ý cắm đúng đầu nhận PS2 vào cổng trên mạch trước khi bật nguồn.',
            chips: ['Điều khiển motor', 'Ý tưởng dự án']
        },
        {
            id: 'realtime',
            keywords: ['realtime', 'thoi gian thuc', 'san khau', 'sprite', 'scratch'],
            answer: 'ThingBot hỗ trợ 2 chế độ (nút chuyển trên thanh công cụ):\n' +
                '• "Nạp" (Upload): chương trình biên dịch và chạy độc lập trên board — dùng cho robot/dự án chạy rời máy tính.\n' +
                '• "Thời gian thực" (Realtime): board phải nối máy tính liên tục, block chạy tương tác ngay.\n' +
                'Tính năng sân khấu/sprite kiểu Scratch đang trong lộ trình phát triển của app.',
            chips: ['Cách nạp chương trình']
        },
        {
            id: 'hello',
            keywords: ['xin chao', 'hello', 'hi', 'chao', 'ban la ai', 'help', 'giup'],
            answer: 'Chào bạn! 👋 Mình là trợ lý AI của ThingEdu Block. Mình có thể:\n' +
                '• Hướng dẫn dùng các cảm biến, motor, servo của ThingBot C3\n' +
                '• Gợi ý ý tưởng dự án STEM\n' +
                '• Xử lý lỗi kết nối, nạp chương trình\n' +
                'Bạn bấm gợi ý bên dưới hoặc gõ câu hỏi nhé!',
            chips: ['Ý tưởng dự án', 'Cảm biến độ ẩm đất', 'Không kết nối được']
        }
    ];

    const FALLBACK = 'Mình chưa hiểu rõ câu hỏi này 😅. Bạn thử hỏi về: cách kết nối, nạp chương trình, ' +
        'các cảm biến (độ ẩm đất, nhiệt độ, siêu âm...), motor/servo, hoặc xin ý tưởng dự án nhé.\n' +
        '(Phiên bản này dùng kiến thức offline — khi kết nối API AI, mình sẽ trả lời được mọi câu hỏi.)';

    // Map nhãn chip → câu truy vấn
    const CHIP_QUERY = {
        'Cách nạp chương trình': 'nạp chương trình',
        'Lỗi nạp code': 'lỗi nạp',
        'Không kết nối được': 'không kết nối được',
        'Ý tưởng dự án': 'ý tưởng dự án',
        'Ý tưởng với độ ẩm đất': 'ý tưởng với độ ẩm đất',
        'Cảm biến độ ẩm đất': 'độ ẩm đất',
        'Cảm biến nhiệt độ': 'nhiệt độ',
        'Cảm biến siêu âm': 'siêu âm',
        'Điều khiển motor': 'motor',
        'Robot tránh vật cản': 'robot tránh vật cản',
        'Xe điều khiển PS2': 'ps2'
    };

    // ---------------------------------------------------------- local engine
    function askLocal (question) {
        const q = normalize(question);
        let best = null;
        let bestScore = 0;
        KB.forEach(entry => {
            let score = 0;
            entry.keywords.forEach(kw => {
                if (q.indexOf(kw) !== -1) {
                    score += kw.split(' ').length; // cụm dài khớp thì điểm cao hơn
                }
            });
            if (score > bestScore) {
                bestScore = score;
                best = entry;
            }
        });
        if (!best) {
            return {text: FALLBACK, chips: ['Ý tưởng dự án', 'Cảm biến độ ẩm đất', 'Không kết nối được']};
        }
        const text = Array.isArray(best.answer) ? pick(best.answer) : best.answer;
        return {text: text, chips: best.chips || []};
    }

    // ------------------------------------------------------------ api engine
    // Khi có API: config.mode = 'api', điền endpoint (khuyến nghị qua server proxy
    // giữ key, không nhúng key thẳng vào app phát cho học sinh).
    async function askApi (question, history) {
        const res = await fetch(config.api.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.api.apiKey}`
            },
            body: JSON.stringify({model: config.api.model, messages: history.concat([{role: 'user', content: question}])})
        });
        if (!res.ok) throw new Error(`API ${res.status}`);
        const data = await res.json();
        return {text: data.reply || data.content || JSON.stringify(data), chips: []};
    }

    async function ask (question, history) {
        if (config.mode === 'api' && config.api.endpoint) {
            try {
                return await askApi(question, history);
            } catch (e) {
                const local = askLocal(question);
                local.text = `(Mất kết nối AI, dùng trả lời offline)\n${local.text}`;
                return local;
            }
        }
        return askLocal(question);
    }

    // ------------------------------------------------------------------- UI
    const css = `
    #te-ai-fab {
        position: fixed; right: 18px; bottom: 18px; width: 54px; height: 54px;
        border-radius: 50%; border: none; cursor: pointer; z-index: 2147483000;
        background: linear-gradient(135deg, #00A876, #4D97FF); color: #fff;
        font-size: 26px; box-shadow: 0 4px 14px rgba(0,0,0,.3);
        display: flex; align-items: center; justify-content: center;
    }
    #te-ai-fab:hover { transform: scale(1.07); }
    #te-ai-panel {
        position: fixed; right: 18px; bottom: 82px; width: 340px; height: 460px;
        background: #fff; border-radius: 14px; z-index: 2147483000;
        box-shadow: 0 8px 30px rgba(0,0,0,.35); display: none;
        flex-direction: column; overflow: hidden;
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; font-size: 13px;
    }
    #te-ai-panel.open { display: flex; }
    #te-ai-head {
        background: linear-gradient(135deg, #00A876, #4D97FF); color: #fff;
        padding: 10px 14px; font-weight: bold; font-size: 14px;
        display: flex; justify-content: space-between; align-items: center;
    }
    #te-ai-head small { font-weight: normal; opacity: .85; display: block; font-size: 11px; }
    #te-ai-close { background: none; border: none; color: #fff; font-size: 16px; cursor: pointer; }
    #te-ai-msgs { flex: 1; overflow-y: auto; padding: 10px; background: #f2f6fa; }
    .te-ai-msg { margin: 6px 0; max-width: 85%; padding: 8px 11px; border-radius: 12px;
        white-space: pre-wrap; word-wrap: break-word; line-height: 1.45; }
    .te-ai-bot { background: #fff; border: 1px solid #dde5ec; border-bottom-left-radius: 3px; }
    .te-ai-user { background: #4D97FF; color: #fff; margin-left: auto; border-bottom-right-radius: 3px; }
    #te-ai-chips { padding: 4px 10px; display: flex; flex-wrap: wrap; gap: 6px; background: #f2f6fa; }
    .te-ai-chip { background: #fff; border: 1px solid #4D97FF; color: #4D97FF; border-radius: 20px;
        padding: 4px 10px; font-size: 12px; cursor: pointer; }
    .te-ai-chip:hover { background: #4D97FF; color: #fff; }
    #te-ai-inputrow { display: flex; border-top: 1px solid #e2e8ee; background: #fff; }
    #te-ai-input { flex: 1; border: none; outline: none; padding: 11px 12px; font-size: 13px; }
    #te-ai-send { border: none; background: none; color: #4D97FF; font-size: 18px;
        padding: 0 14px; cursor: pointer; }
    `;

    function buildUI () {
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);

        const fab = document.createElement('button');
        fab.id = 'te-ai-fab';
        fab.title = 'Trợ lý AI ThingEdu';
        fab.textContent = '🤖';
        document.body.appendChild(fab);

        const panel = document.createElement('div');
        panel.id = 'te-ai-panel';
        panel.innerHTML =
            '<div id="te-ai-head"><div>Trợ lý ThingEdu 🤖<small>Bản offline — sẽ thông minh hơn khi có API</small></div>' +
            '<button id="te-ai-close">✕</button></div>' +
            '<div id="te-ai-msgs"></div>' +
            '<div id="te-ai-chips"></div>' +
            '<div id="te-ai-inputrow"><input id="te-ai-input" placeholder="Hỏi mình điều gì đó..." />' +
            '<button id="te-ai-send">➤</button></div>';
        document.body.appendChild(panel);

        const msgs = panel.querySelector('#te-ai-msgs');
        const chipsBox = panel.querySelector('#te-ai-chips');
        const input = panel.querySelector('#te-ai-input');
        const history = [];

        function addMsg (text, who) {
            const div = document.createElement('div');
            div.className = `te-ai-msg te-ai-${who}`;
            div.textContent = text;
            msgs.appendChild(div);
            msgs.scrollTop = msgs.scrollHeight;
        }

        function setChips (labels) {
            chipsBox.innerHTML = '';
            (labels || []).forEach(label => {
                const b = document.createElement('button');
                b.className = 'te-ai-chip';
                b.textContent = label;
                b.onclick = () => send(CHIP_QUERY[label] || label);
                chipsBox.appendChild(b);
            });
        }

        async function send (text) {
            const q = (text || input.value).trim();
            if (!q) return;
            input.value = '';
            addMsg(q, 'user');
            history.push({role: 'user', content: q});
            const reply = await ask(q, history.slice(0, -1));
            addMsg(reply.text, 'bot');
            history.push({role: 'assistant', content: reply.text});
            setChips(reply.chips);
        }

        fab.onclick = () => {
            panel.classList.toggle('open');
            if (panel.classList.contains('open') && !msgs.childElementCount) {
                const hello = askLocal('xin chào');
                addMsg(hello.text, 'bot');
                setChips(hello.chips);
            }
        };
        panel.querySelector('#te-ai-close').onclick = () => panel.classList.remove('open');
        panel.querySelector('#te-ai-send').onclick = () => send();
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') send();
        });
    }

    window.ThingEduAI = {config: config, ask: ask};

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', buildUI);
    } else {
        buildUI();
    }
})();
