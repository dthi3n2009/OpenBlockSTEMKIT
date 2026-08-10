/* Chế độ Bài học — Dế Base KIT · Khu vườn thông minh
 * Dựng cho học sinh THCS lớp 6–9 tự học ở nhà.
 * Chạy hoàn toàn ngoại tuyến, không gọi mạng.
 */
(function () {
    'use strict';

    if (window.location.search && !/^\?(?:locale|lang)=vi$/i.test(window.location.search)) return;
    if (window.__DE_LESSON_MODE__) return;
    window.__DE_LESSON_MODE__ = true;

    const MAU = {
        xanh: '#00A876',
        xanhDam: '#08765A',
        xanhNhat: '#E6F8F2',
        cam: '#F29B35',
        camNhat: '#FFF3D7',
        chu: '#163C39',
        chuNhat: '#667F7A',
        vien: '#D5EAE5',
        nen: '#F8FFFD'
    };

    const LUU_KEY = 'de_base_kit_tien_do';
    const MA_PHU_HUYNH_KEY = 'de_lab_ma_phu_huynh';
    const INTRO_VIDEO = 'media/gioi-thieu-khoa-hoc.mp4';
    const UI_VERSION = 7;

    let LESSONS = [];
    let baiDangMo = null;
    let manHinh = 'dangNhap'; // dangNhap | home | danhSach | chiTiet
    let nguCanhWorkspace = {mode: 'project'};
    let videoGioiThieuLoi = false;
    let trangThaiBai3 = {hasSensor: false, hasCondition: false, threshold: null, hasAlert: false};
    let guiWorkspaceTimer = null;

    /* ---------- lưu tiến độ ---------- */
    function docTienDo () {
        try {
            return JSON.parse(localStorage.getItem(LUU_KEY)) || {};
        } catch (e) {
            return {};
        }
    }

    function ghiTienDo (data) {
        try {
            localStorage.setItem(LUU_KEY, JSON.stringify(data));
        } catch (e) { /* không chặn học sinh nếu trình duyệt chặn lưu */ }
    }

    function coVideoGioiThieu () {
        if (videoGioiThieuLoi) return false;
        try {
            const fileURLToPath = require('url').fileURLToPath;
            const videoPath = fileURLToPath(new URL(INTRO_VIDEO, window.location.href));
            return require('fs').existsSync(videoPath);
        } catch (e) {
            return false;
        }
    }

    // Video của từng bài là tuỳ chọn: chưa có file thì không để lại ô trống.
    function coVideoBai (bai) {
        if (!bai || !bai.video) return false;
        try {
            const fileURLToPath = require('url').fileURLToPath;
            const videoPath = fileURLToPath(new URL(bai.video, window.location.href));
            return require('fs').existsSync(videoPath);
        } catch (e) {
            return false;
        }
    }

    function danhDauDieuKhienWorkspace () {
        const deviceIcon = document.querySelector('[class*="menu-bar_device-icon"]');
        if (deviceIcon && deviceIcon.parentElement) {
            deviceIcon.parentElement.classList.add('de-an-trong-bai-kit');
            const divider = deviceIcon.parentElement.previousElementSibling;
            if (divider) divider.classList.add('de-an-trong-bai-kit');
        }

        const extensionButton = document.querySelector('button[title="Thêm cảm biến"]');
        if (extensionButton) {
            (extensionButton.parentElement || extensionButton).classList.add('de-an-trong-bai-kit');
        }
    }

    function apDungCheDoWorkspace (mode, bai) {
        const hocKit = mode === 'kit';
        document.body.classList.toggle('de-mode-kit', hocKit);
        document.body.classList.toggle('de-mode-project', !hocKit);
        document.body.classList.toggle('de-bai-3', hocKit && bai && bai.so === 3);

        const tienDoBai = bai ? (docTienDo()[bai.so] || {}) : {};
        nguCanhWorkspace = hocKit ? {
            mode: 'kit',
            lesson: bai.so,
            lessonName: bai.ten,
            deviceId: 'thingBot_arduinoEsp32C3',
            extensions: (bai.khoiLenh || []).filter(id => id !== 'arduinoThingBotC3'),
            focusExtension: (bai.khoiLenh || []).find(id => id !== 'arduinoThingBotC3') || null,
            tutorial: bai.tutorial || [],
            workspaceXml: tienDoBai.workspaceXml || '',
            workspaceKey: tienDoBai.workspaceKey || 0
        } : {mode: 'project'};

        setTimeout(danhDauDieuKhienWorkspace, 0);
        setTimeout(danhDauDieuKhienWorkspace, 500);
        const guiSanSang = () => {
            window.dispatchEvent(new CustomEvent('de:workspace-mode', {detail: nguCanhWorkspace}));
        };
        clearTimeout(guiWorkspaceTimer);
        guiWorkspaceTimer = setTimeout(guiSanSang, 300);
    }

    function danhDauMuc (soBai, chiSo, xong) {
        const td = docTienDo();
        if (!td[soBai]) td[soBai] = {};
        if (!td[soBai].tuKiemTra) td[soBai].tuKiemTra = {};
        td[soBai].tuKiemTra[chiSo] = xong;
        ghiTienDo(td);
        capNhatHuyHieu();
    }

    function baiDaXong (soBai) {
        const bai = LESSONS.find(b => b.so === soBai);
        if (!bai) return false;
        const td = docTienDo()[soBai];
        if (!td || !td.tuKiemTra) return false;
        return bai.tuKiemTra.every((_, i) => td.tuKiemTra[i]);
    }

    function trangThaiHoc (bai) {
        const td = docTienDo()[bai.so] || {};
        const tong = bai.cacBuoc.length;
        let dangO = td.buocHienTai || 0;
        if (bai.so === 3) {
            if (trangThaiBai3.hasAlert) dangO = tong;
            else if (trangThaiBai3.hasCondition) dangO = 3;
            else if (trangThaiBai3.hasSensor) dangO = 2;
        } else if (td.blockCount > 0) {
            dangO = Math.min(2, tong);
        }
        const daXong = Math.min(dangO, tong);
        const tiepTheo = daXong < tong ? bai.cacBuoc[daXong] : null;
        return {daXong: daXong, tong: tong, tiepTheo: tiepTheo, coCode: !!td.workspaceXml};
    }

    function luuWorkspace (chiTiet) {
        if (!chiTiet || !chiTiet.lesson) return;
        const td = docTienDo();
        const bai = LESSONS.find(item => item.so === chiTiet.lesson);
        if (!bai) return;
        if (!td[chiTiet.lesson]) td[chiTiet.lesson] = {};
        if (!chiTiet.blockCount && td[chiTiet.lesson].workspaceXml) return;
        td[chiTiet.lesson].workspaceXml = chiTiet.xml || '';
        td[chiTiet.lesson].blockCount = chiTiet.blockCount || 0;
        td[chiTiet.lesson].savedAt = Date.now();
        ghiTienDo(td);
    }

    /* ---------- giao diện ---------- */
    function themCSS () {
        const css = `
        .de-overlay {
            position: fixed; inset: 0; z-index: 99990;
            background:
                radial-gradient(circle at 88% 8%, rgba(77,151,255,.18), transparent 27%),
                radial-gradient(circle at 8% 92%, rgba(255,221,75,.20), transparent 28%),
                ${MAU.nen};
            font-family: "Segoe UI", system-ui, sans-serif;
            color: ${MAU.chu};
            overflow-y: auto;
            display: none;
        }
        .de-overlay.hien { display: block; }
        body.de-mode-kit .de-an-trong-bai-kit { display: none !important; }
        [aria-label="Cộng đồng OpenBlock"],
        [aria-label="Wiki"],
        [aria-label="Hướng dẫn"] { display: none !important; }
        body.de-lesson-open #te-ai-fab,
        body.de-lesson-open #te-ai-panel { display: none !important; }
        .de-wrap { max-width: 1100px; margin: 0 auto; padding: 32px 24px 60px; }

        /* --- đăng nhập demo --- */
        .de-login {
            min-height: calc(100vh - 64px); display: grid;
            grid-template-columns: 1.08fr .92fr; align-items: stretch;
            background: rgba(255,255,255,.60); border: 1px solid rgba(255,255,255,.9);
            border-radius: 28px; overflow: hidden;
            box-shadow: 0 24px 70px rgba(42,121,105,.14);
        }
        .de-login-art {
            position: relative; display: grid; place-items: center; padding: 40px;
            background:
                radial-gradient(circle at 16% 20%, rgba(255,222,89,.55), transparent 22%),
                radial-gradient(circle at 82% 18%, rgba(102,219,255,.42), transparent 25%),
                radial-gradient(circle at 72% 86%, rgba(111,236,175,.46), transparent 24%),
                #F8FFFD;
        }
        .de-login-logo {
            position: absolute; top: 26px; left: 30px;
            display: flex; align-items: center; gap: 10px;
            font-size: 18px; font-weight: 800;
        }
        .de-login-logo span:first-child {
            width: 42px; height: 42px; display: grid; place-items: center;
            border-radius: 15px; background: linear-gradient(135deg,#00B982,#4D97FF);
            box-shadow: 0 10px 24px rgba(0,185,130,.22);
        }
        .de-login-giua { text-align: center; }
        .de-login-de {
            width: 220px; height: 220px; margin: 0 auto 26px;
            display: grid; place-items: center; border-radius: 50%;
            font-size: 92px; background: linear-gradient(145deg,#C9FFF0,#DCEAFF);
            border: 2px dashed rgba(0,169,118,.25);
            box-shadow: 0 28px 65px rgba(30,138,115,.18);
        }
        .de-login-giua h1 { margin: 0 0 8px; font-size: 42px; letter-spacing: -1.5px; }
        .de-gradient {
            background: linear-gradient(90deg,#00A876,#4D97FF);
            -webkit-background-clip: text; background-clip: text; color: transparent;
        }
        .de-login-giua p { margin: 0; color: ${MAU.chuNhat}; font-size: 17px; }
        .de-login-form-wrap {
            display: grid; align-content: center; padding: 46px;
            background: rgba(255,255,255,.88); backdrop-filter: blur(18px);
        }
        .de-login-form { width: min(390px,100%); margin: 0 auto; }
        .de-login-form h2 { margin: 0 0 6px; font-size: 30px; }
        .de-login-form > p { margin: 0 0 24px; color: ${MAU.chuNhat}; }
        .de-field { display: block; margin-bottom: 14px; }
        .de-field span { display: block; margin-bottom: 7px; font-size: 13px; color: #52706A; }
        .de-field input {
            width: 100%; padding: 13px 14px; border: 1px solid #CAE4DE;
            border-radius: 13px; outline: none; color: ${MAU.chu}; background: #fff;
            font-family: inherit; font-size: 15px;
        }
        .de-field input:focus { border-color: ${MAU.xanh}; box-shadow: 0 0 0 3px rgba(0,168,118,.12); }
        .de-login-submit {
            width: 100%; padding: 13px 16px; border: 0; border-radius: 13px;
            color: #fff; background: linear-gradient(135deg,#00B982,#4D97FF);
            box-shadow: 0 10px 24px rgba(0,168,118,.20);
            cursor: pointer; font-family: inherit; font-size: 16px; font-weight: 700;
        }
        .de-login-demo {
            width: 100%; margin-top: 10px; padding: 10px; border: 0;
            color: #3A776B; background: transparent; cursor: pointer; font-family: inherit;
        }

        .de-header { text-align: center; margin-bottom: 28px; }
        .de-header h1 {
            font-size: 30px; font-weight: 800; margin: 0 0 6px;
            color: ${MAU.xanh}; letter-spacing: -0.3px;
        }
        .de-header p { font-size: 17px; color: ${MAU.chuNhat}; margin: 0; }

        /* --- trang chủ sáng, ít chữ --- */
        .de-home-top {
            display: flex; align-items: center; justify-content: space-between;
            gap: 18px; margin-bottom: 30px;
        }
        .de-home-brand { display: flex; align-items: center; gap: 10px; font-weight: 800; font-size: 18px; }
        .de-home-brand span:first-child {
            width: 38px; height: 38px; display: grid; place-items: center;
            border-radius: 13px; color: #fff; background: linear-gradient(135deg,#00B982,#4D97FF);
        }
        .de-home-user { display: flex; align-items: center; gap: 10px; }
        .de-quan-ly { width:34px; height:34px; padding:0; border:0; border-radius:10px; background:#EDF8F5; color:${MAU.xanhDam}; cursor:pointer; font-size:16px; }
        .de-home-avatar {
            width: 38px; height: 38px; display: grid; place-items: center;
            border-radius: 50%; color: #fff; background: #4D97FF; font-size: 13px;
        }
        .de-dang-xuat { border: 0; color: ${MAU.chuNhat}; background: transparent; cursor: pointer; }
        .de-chao { margin-bottom: 26px; }
        .de-chao h1 { margin: 0 0 5px; font-size: 38px; letter-spacing: -1px; }
        .de-chao p { margin: 0; color: ${MAU.chuNhat}; font-size: 17px; }

        .de-home-luoi {
            display: grid; gap: 20px;
            grid-template-columns: 1.3fr .7fr;
            align-items: stretch;
        }
        .de-lua-chon {
            position: relative; min-height: 330px; overflow: hidden;
            border: 0; border-radius: 24px; padding: 28px; cursor: pointer; text-align: left;
            font-family: inherit; color: ${MAU.chu};
            display: flex; flex-direction: column;
            transition: transform .12s, box-shadow .15s;
        }
        .de-lua-chon-kit { background: linear-gradient(145deg,#D8FFF0,#E8F7FF); }
        .de-lua-chon-moi { background: linear-gradient(145deg,#FFF6BA,#FFE6C7); color: #594900; }
        .de-lua-chon:hover {
            transform: translateY(-3px);
            box-shadow: 0 16px 34px rgba(35,105,91,.14);
        }
        .de-lua-chon-icon {
            width: 58px; height: 58px; display: grid; place-items: center;
            border-radius: 19px; background: rgba(255,255,255,.72);
            font-size: 30px; line-height: 1; margin-bottom: 42px;
        }
        .de-lua-chon h2 { margin: 0 0 7px; font-size: 27px; font-weight: 800; }
        .de-lua-chon-mota { margin: 0; font-size: 15px; color: currentColor; opacity: .72; }
        .de-tiendo { position: absolute; left: 28px; right: 92px; bottom: 29px; }
        .de-tiendo-thanh {
            height: 8px; background: rgba(255,255,255,.70);
            border-radius: 6px; overflow: hidden;
        }
        .de-tiendo-day {
            height: 100%; background: ${MAU.xanh};
            border-radius: 6px; transition: width .3s;
        }
        .de-tiendo span { display: none; }
        .de-lua-chon-nut {
            position: absolute; right: 24px; bottom: 22px;
            width: 50px; height: 50px; display: grid; place-items: center;
            background: ${MAU.xanh}; color: #fff; border-radius: 16px;
            font-size: 0; text-align: center;
        }
        .de-lua-chon-nut::after { content: '→'; font-size: 24px; }
        .de-lua-chon-nut-cam { background: ${MAU.cam}; }

        .de-luoi {
            display: grid; gap: 16px;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        }
        .de-the {
            background: #fff; border: 2px solid ${MAU.vien}; border-radius: 16px;
            padding: 18px 20px; cursor: pointer; text-align: left;
            transition: border-color .15s, transform .1s, box-shadow .15s;
            display: flex; gap: 14px; align-items: flex-start;
            font-family: inherit;
        }
        .de-the:hover {
            border-color: ${MAU.xanh}; transform: translateY(-2px);
            box-shadow: 0 6px 18px rgba(46,139,87,.15);
        }
        .de-the[disabled] {
            cursor: not-allowed; opacity: .52; filter: grayscale(.35);
            transform: none; box-shadow: none; border-color: ${MAU.vien};
        }
        .de-so {
            flex: 0 0 46px; height: 46px; border-radius: 12px;
            background: ${MAU.xanhNhat}; color: ${MAU.xanh};
            font-size: 20px; font-weight: 800;
            display: flex; align-items: center; justify-content: center;
        }
        .de-the.xong .de-so { background: ${MAU.xanh}; color: #fff; }
        .de-the-noidung { flex: 1; min-width: 0; }
        .de-the h3 { margin: 0 0 4px; font-size: 17px; font-weight: 700; }
        .de-the p { margin: 0 0 8px; font-size: 14px; color: ${MAU.chuNhat}; line-height: 1.45; }
        .de-nhan {
            display: inline-block; font-size: 12px; font-weight: 600;
            padding: 3px 10px; border-radius: 20px; margin-right: 6px;
        }
        .de-nhan-code { background: ${MAU.camNhat}; color: ${MAU.cam}; }
        .de-nhan-tay { background: ${MAU.xanhNhat}; color: ${MAU.xanh}; }
        .de-nhan-xong { background: ${MAU.xanh}; color: #fff; }

        /* trang chi tiết */
        .de-quaylai {
            background: none; border: none; color: ${MAU.xanh};
            font-size: 15px; font-weight: 600; cursor: pointer;
            padding: 8px 0; margin-bottom: 8px; font-family: inherit;
        }
        .de-quaylai:hover { text-decoration: underline; }

        .de-bai-tieude { margin-bottom: 18px; }
        .de-bai-tieude h2 {
            font-size: 26px; font-weight: 800; margin: 0 0 6px; color: ${MAU.xanh};
        }
        .de-bai-tieude .phude { font-size: 17px; color: ${MAU.chuNhat}; margin: 0 0 10px; }

        .de-khoi {
            background: #fff; border: 1px solid ${MAU.vien}; border-radius: 14px;
            padding: 18px 22px; margin-bottom: 14px;
        }
        .de-khoi h4 {
            margin: 0 0 12px; font-size: 16px; font-weight: 700;
            color: ${MAU.xanh}; display: flex; align-items: center; gap: 8px;
        }
        .de-khoi p, .de-khoi li { font-size: 15px; line-height: 1.6; }
        .de-khoi ul { margin: 0; padding-left: 22px; }
        .de-khoi li { margin-bottom: 6px; }

        .de-de-dan { background:linear-gradient(135deg,#E8FAF4,#EEF5FF); border-color:#CBEADF; }
        .de-de-dan button { width:100%; border:0; border-radius:11px; padding:11px; margin-top:8px; cursor:pointer; font:700 14px inherit; }
        .de-video-bai { overflow:hidden; background:#12343B; border-color:#12343B; color:#fff; }
        .de-video-bai h4 { color:#E2FFF6; }
        .de-video-bai video { display:block; width:100%; margin-top:4px; border-radius:10px; background:#071B20; }
        .de-video-cho-noidung { min-height:128px; display:flex; align-items:center; gap:15px; padding:16px; border-radius:10px; background:linear-gradient(135deg,#1A5055,#205D72); }
        .de-video-cho-noidung > span { font-size:46px; filter:drop-shadow(0 5px 8px rgba(0,0,0,.2)); }
        .de-video-cho-noidung strong { display:block; font-size:16px; }
        .de-video-cho-noidung p { margin:5px 0 0; color:#D8F4EE; }
        .de-so-tay { background:linear-gradient(135deg,#FFFDF5,#F3FBF7); border-color:#E7DFC1; }
        .de-so-tay h4 { justify-content:space-between; }
        .de-so-tay h4 small { font-size:12px; font-weight:600; color:${MAU.chuNhat}; }
        .de-so-tay > p { margin:0 0 12px; color:${MAU.chuNhat}; }
        .de-so-tay label { display:block; margin:11px 0; color:${MAU.chu}; font-size:14px; font-weight:700; }
        .de-so-tay input:not([type=file]), .de-so-tay textarea { display:block; width:100%; box-sizing:border-box; margin-top:5px; padding:10px 11px; border:1px solid #D9D2B6; border-radius:10px; background:#fff; color:${MAU.chu}; font:14px inherit; font-weight:400; resize:vertical; outline:none; }
        .de-so-tay textarea { min-height:68px; }
        .de-so-tay input:focus, .de-so-tay textarea:focus { border-color:${MAU.xanh}; box-shadow:0 0 0 3px rgba(0,168,118,.11); }
        .de-so-tay-anh-label { display:inline-block !important; padding:9px 12px; border-radius:10px; background:#fff; border:1px dashed #9BCFC0; color:${MAU.xanhDam} !important; cursor:pointer; }
        .de-so-tay-anh-label input { display:none; }
        .de-so-tay-preview { min-height:44px; margin:6px 0 11px; color:${MAU.chuNhat}; font-size:13px; }
        .de-so-tay-preview img { display:block; max-width:100%; max-height:230px; border-radius:10px; border:1px solid #D5EAE5; }
        .de-so-tay-preview button { margin-top:6px; border:0; background:transparent; color:#B65341; font:700 13px inherit; cursor:pointer; }
        .de-so-tay-hoi { border:0; border-radius:11px; padding:11px 14px; background:linear-gradient(135deg,#00A876,#4D97FF); color:#fff; font:700 14px inherit; cursor:pointer; }
        .de-chat-bai { position:fixed; top:86px; right:18px; z-index:99971; display:flex; flex-direction:column; width:300px; max-height:calc(100vh - 106px); margin:0; padding:14px; background:linear-gradient(135deg,#F0FBF7,#EEF5FF); border-color:#C9EAE0; box-shadow:0 14px 34px rgba(20,76,68,.18); }
        .de-chat-bai > p { margin:0 0 12px; color:${MAU.chuNhat}; }
        .de-chat-bai-msgs { flex:1; min-height:90px; overflow:auto; padding:2px 2px 4px; }
        .de-chat-bai-bot, .de-chat-bai-user { max-width:86%; padding:10px 12px; margin:7px 0; border-radius:13px; line-height:1.5; font-size:14px; white-space:pre-wrap; }
        .de-chat-bai-bot { background:#fff; border:1px solid ${MAU.vien}; color:${MAU.chu}; border-bottom-left-radius:4px; }
        .de-chat-bai-user { margin-left:auto; background:linear-gradient(135deg,#00A876,#4D97FF); color:#fff; border-bottom-right-radius:4px; }
        .de-chat-bai-thinking { color:${MAU.chuNhat}; font-style:italic; }
        .de-chat-bai-form { display:flex; gap:8px; margin-top:10px; }
        .de-chat-bai-form input { flex:1; min-width:0; border:1px solid #B9DDD3; border-radius:11px; padding:11px 12px; font:14px inherit; outline:none; }
        .de-chat-bai-form input:focus { border-color:${MAU.xanh}; box-shadow:0 0 0 3px rgba(0,168,118,.12); }
        .de-chat-bai-form button { border:0; border-radius:11px; padding:0 17px; background:${MAU.xanh}; color:#fff; font:700 14px inherit; cursor:pointer; }
        .de-chat-bai-form button:disabled { opacity:.55; cursor:wait; }
        #de-dan-tung-buoc { color:#fff; background:linear-gradient(135deg,#00A876,#4D97FF); }
        #de-hoi-dang-bi { color:#3168B0; background:#EAF2FF; }
        #de-huong-dan-bai { position:fixed; inset:0; z-index:99999; display:grid; place-items:center; padding:20px; background:rgba(18,60,57,.42); font-family:"Segoe UI",system-ui,sans-serif; }
        .de-huong-dan-card { width:min(460px,100%); padding:28px; border-radius:24px; background:#fff; box-shadow:0 28px 75px rgba(12,58,52,.28); }
        .de-huong-dan-card h3 { margin:0 0 10px; color:${MAU.xanhDam}; font-size:23px; }
        .de-huong-dan-card p { min-height:72px; margin:0; color:${MAU.chuNhat}; line-height:1.6; }
        #de-huong-dan-count { margin:16px 0 10px; color:${MAU.xanhDam}; font-size:13px; font-weight:700; }
        .de-huong-dan-actions { display:flex; gap:8px; }
        .de-huong-dan-actions button { flex:1; border:0; border-radius:11px; padding:11px; cursor:pointer; font:700 14px inherit; }
        #de-huong-dan-next { color:#fff; background:${MAU.xanh}; }
        #de-huong-dan-back { color:${MAU.xanhDam}; background:${MAU.xanhNhat}; }
        #de-huong-dan-close { color:${MAU.chuNhat}; background:#F2F5F4; }

        .de-tien-do-hoc {
            margin: 0 0 16px; padding: 15px 17px; border-radius: 14px;
            background: linear-gradient(135deg,#E8FAF4,#ECF4FF); border: 1px solid #CBEADF;
        }
        .de-tien-do-hoc > div:first-child { display:flex; align-items:baseline; justify-content:space-between; gap:12px; }
        .de-tien-do-hoc strong { color:${MAU.xanhDam}; font-size:15px; }
        .de-tien-do-hoc span, .de-tien-do-hoc small { color:${MAU.chuNhat}; font-size:13px; }
        .de-tien-do-hoc-thanh { height:7px; margin:10px 0 7px; overflow:hidden; border-radius:9px; background:rgba(255,255,255,.8); }
        .de-tien-do-hoc-thanh i { display:block; height:100%; border-radius:9px; background:linear-gradient(90deg,#00B982,#4D97FF); transition:width .25s; }

        .de-khoi-antoan { background: ${MAU.camNhat}; border-color: #FFD9A8; }
        .de-khoi-antoan h4 { color: ${MAU.cam}; }

        .de-buoc {
            display: flex; gap: 14px; padding: 12px 0;
            border-bottom: 1px solid ${MAU.vien};
        }
        .de-buoc:last-child { border-bottom: none; }
        .de-buoc-so {
            flex: 0 0 30px; height: 30px; border-radius: 50%;
            background: ${MAU.xanhNhat}; color: ${MAU.xanh};
            font-weight: 700; font-size: 15px;
            display: flex; align-items: center; justify-content: center;
        }
        .de-buoc-noidung strong { display: block; margin-bottom: 3px; font-size: 15px; }
        .de-buoc-noidung span { font-size: 14px; color: ${MAU.chuNhat}; line-height: 1.55; }

        .de-intro-player {
            background: #102B35; border-radius: 18px; overflow: hidden;
            min-height: 380px; display: grid; place-items: center; color: #fff;
            position: relative; margin-bottom: 14px;
        }
        .de-intro-player video { width: 100%; max-height: 65vh; display: block; }
        .de-intro-demo { width: 100%; box-sizing: border-box; padding: 46px; text-align: center; }
        .de-intro-demo-icon { font-size: 72px; margin-bottom: 16px; }
        .de-intro-demo h3 { font-size: 27px; margin: 0 0 10px; }
        .de-intro-demo p { color: #CDE9E5; font-size: 16px; line-height: 1.6; margin: 0 auto 24px; max-width: 620px; }
        .de-intro-track { height: 8px; background: rgba(255,255,255,.18); border-radius: 8px; overflow: hidden; }
        .de-intro-track span { display: block; width: 0; height: 100%; background: #53E2AE; transition: width .12s linear; }
        .de-intro-note { color: ${MAU.chuNhat}; font-size: 13px; text-align: center; margin: 8px 0 18px; }
        .de-nut-chinh[disabled] { background: #AFC5BF; cursor: not-allowed; }

        .de-hoi {
            display: block; width: 100%; text-align: left;
            background: ${MAU.xanhNhat}; border: 1px solid ${MAU.vien};
            border-radius: 10px; padding: 11px 15px; margin-bottom: 8px;
            font-size: 14px; color: ${MAU.chu}; cursor: pointer;
            font-family: inherit; transition: background .15s;
        }
        .de-hoi:hover { background: #D9EDE2; }

        .de-check { display: flex; align-items: flex-start; gap: 11px; padding: 9px 0; cursor: pointer; }
        .de-check input { width: 20px; height: 20px; margin-top: 1px; cursor: pointer; accent-color: ${MAU.xanh}; flex-shrink: 0; }
        .de-check span { font-size: 15px; line-height: 1.5; }

        .de-nut-chinh {
            background: ${MAU.xanh}; color: #fff; border: none;
            border-radius: 12px; padding: 15px 30px;
            font-size: 17px; font-weight: 700; cursor: pointer;
            font-family: inherit; width: 100%; margin-top: 6px;
            transition: background .15s;
        }
        .de-nut-chinh:hover { background: ${MAU.xanhDam}; }
        .de-nut-phu {
            background: #fff; color: ${MAU.xanh}; border: 2px solid ${MAU.xanh};
        }
        .de-nut-phu:hover { background: ${MAU.xanhNhat}; }

        /* nút mở lại trên thanh công cụ */
        .de-nut-noi {
            position: fixed; left: 72px; bottom: 14px; z-index: 99980;
            background: ${MAU.xanh}; color: #fff; border: none;
            border-radius: 26px; padding: 12px 20px;
            font-size: 15px; font-weight: 700; cursor: pointer;
            box-shadow: 0 4px 14px rgba(46,139,87,.35);
            font-family: "Segoe UI", system-ui, sans-serif;
            display: flex; align-items: center; gap: 8px;
        }
        .de-nut-noi:hover { background: ${MAU.xanhDam}; }

        #de-tro-giup-bai {
            position:fixed; right:18px; top:86px; z-index:99970; display:none; width:270px;
            padding:12px; box-sizing:border-box; border:1px solid #CBEADF; border-radius:16px;
            background:rgba(255,255,255,.96); box-shadow:0 12px 30px rgba(20,76,68,.16);
            font-family:"Segoe UI",system-ui,sans-serif;
        }
        body.de-bai-3:not(.de-lesson-open) #de-tro-giup-bai { display:block; }
        #de-tro-giup-bai strong { display:block; color:${MAU.xanhDam}; font-size:14px; margin-bottom:7px; }
        #de-tro-giup-status { margin:8px 0; padding:9px 10px; border-radius:10px; background:#F3FAF8; color:${MAU.chuNhat}; font-size:12px; line-height:1.55; }
        #de-tro-giup-status b { color:${MAU.xanhDam}; }
        #de-tro-giup-bai button { width:100%; border:0; border-radius:10px; padding:9px; margin-top:6px; cursor:pointer; font-family:inherit; font-weight:700; }
        #de-tro-giup-chat { background:#EAF2FF; color:#3168B0; }
        #de-tro-giup-tutorial { background:${MAU.xanhNhat}; color:${MAU.xanhDam}; }
        #de-tro-giup-demo { color:#fff; background:linear-gradient(135deg,#00A876,#4D97FF); }
        #de-tro-giup-close-demo { color:#8A5000; background:${MAU.camNhat}; }
        #de-tro-giup-done { color:#fff; background:linear-gradient(135deg,#00A876,#4D97FF); }
        #de-tro-giup-note { min-height:17px; margin-top:7px; color:${MAU.chuNhat}; font-size:12px; line-height:1.35; }
        body.de-bai3-demo .blocklySvg { pointer-events:none; opacity:.82; }

        #de-chuc-mung { position:fixed; inset:0; z-index:99999; display:grid; place-items:center; padding:20px; background:rgba(18,60,57,.42); font-family:"Segoe UI",system-ui,sans-serif; }
        .de-chuc-mung-card { width:min(440px,100%); padding:34px 28px; text-align:center; border-radius:25px; background:linear-gradient(145deg,#F4FFFB,#F4F8FF); box-shadow:0 28px 75px rgba(12,58,52,.28); }
        .de-chuc-mung-icon { font-size:64px; line-height:1; }
        .de-chuc-mung-card h2 { margin:12px 0 8px; color:${MAU.xanhDam}; font-size:27px; }
        .de-chuc-mung-card p { margin:0 0 20px; color:${MAU.chuNhat}; line-height:1.55; }
        .de-chuc-mung-card button { width:100%; border:0; border-radius:12px; padding:12px; margin-top:8px; font:700 15px inherit; cursor:pointer; }
        #de-chuc-next { color:#fff; background:linear-gradient(135deg,#00A876,#4D97FF); }
        #de-chuc-more { color:${MAU.xanhDam}; background:${MAU.xanhNhat}; }
        #de-chuc-review { color:${MAU.chuNhat}; background:transparent; }

        .de-mach {
            background: ${MAU.camNhat}; border: 1px solid #FFD9A8;
            border-radius: 10px; padding: 12px 16px; margin-bottom: 14px;
            font-size: 14px; color: #8A5000; line-height: 1.55;
        }
        #de-quan-ly-du-lieu, #de-ma-phu-huynh { position:fixed; inset:0; z-index:99999; display:grid; place-items:center; padding:20px; background:rgba(18,60,57,.42); font-family:"Segoe UI",system-ui,sans-serif; }
        .de-quan-ly-card { width:min(440px,100%); padding:28px; border-radius:22px; background:#fff; box-shadow:0 28px 75px rgba(12,58,52,.28); }
        .de-quan-ly-card h3 { margin:0 0 7px; color:${MAU.xanhDam}; }
        .de-quan-ly-card p { margin:0 0 12px; color:${MAU.chuNhat}; line-height:1.55; }
        #de-quan-ly-status { min-height:18px; margin:0 0 12px; color:${MAU.xanhDam}; font-size:13px; font-weight:700; }
        .de-quan-ly-card button, .de-quan-ly-card label { display:block; width:100%; box-sizing:border-box; margin-top:9px; padding:12px; border:0; border-radius:11px; font:700 14px inherit; text-align:center; cursor:pointer; }
        #de-xuat-sao-luu { color:#fff; background:linear-gradient(135deg,#00A876,#4D97FF); }
        .de-nap-sao-luu { color:${MAU.xanhDam}; background:${MAU.xanhNhat}; }
        .de-nap-sao-luu input { display:none; }
        #de-dong-quan-ly { color:${MAU.chuNhat}; background:#F2F5F4; }
        .de-ma-card { width:min(360px,100%); padding:28px; border-radius:22px; background:#fff; box-shadow:0 28px 75px rgba(12,58,52,.28); }
        .de-ma-card h3 { margin:0 0 8px; color:${MAU.xanhDam}; }
        .de-ma-card p { margin:0 0 14px; color:${MAU.chuNhat}; line-height:1.5; }
        .de-ma-card input { display:block; width:100%; box-sizing:border-box; border:1px solid ${MAU.vien}; border-radius:11px; padding:12px; font:15px inherit; outline:none; }
        .de-ma-card input:focus { border-color:${MAU.xanh}; box-shadow:0 0 0 3px rgba(0,168,118,.12); }
        #de-ma-loi { min-height:18px; margin-top:8px; color:#B65341; font-size:13px; }
        .de-ma-actions { display:flex; gap:8px; margin-top:10px; }
        .de-ma-actions button { flex:1; border:0; border-radius:11px; padding:11px; cursor:pointer; font:700 14px inherit; }
        #de-ma-xac-nhan { color:#fff; background:${MAU.xanh}; }
        #de-ma-huy { color:${MAU.chuNhat}; background:#F2F5F4; }

        @media (max-width: 640px) {
            .de-wrap { padding: 20px 14px 50px; }
            .de-header h1 { font-size: 24px; }
            .de-luoi { grid-template-columns: 1fr; }
            .de-login { grid-template-columns: 1fr; }
            .de-login-art { min-height: 340px; }
            .de-login-de { width: 160px; height: 160px; font-size: 66px; }
            .de-login-giua h1 { font-size: 30px; }
            .de-login-form-wrap { padding: 30px 22px 40px; }
            .de-home-luoi { grid-template-columns: 1fr; }
            .de-lua-chon { min-height: 280px; }
            .de-chat-bai { position:static; width:auto; max-height:none; margin-bottom:14px; box-shadow:none; }
            .de-chat-bai-msgs { max-height:220px; }
        }
        `;
        const el = document.createElement('style');
        el.textContent = css;
        document.head.appendChild(el);
    }

    function esc (s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function escAttr (s) {
        return esc(s).replace(/"/g, '&quot;');
    }

    /* ---------- đăng nhập demo, lưu cục bộ ---------- */
    function veDangNhap () {
        manHinh = 'dangNhap';
        const wrap = document.getElementById('de-wrap');
        wrap.innerHTML = `
            <div class="de-login">
                <div class="de-login-art">
                    <div class="de-login-logo"><span>🦗</span><span>Dế Lab</span></div>
                    <div class="de-login-giua">
                        <div class="de-login-de">🦗</div>
                        <h1>Học bằng cách <span class="de-gradient">tự tay làm</span></h1>
                        <p>Thử · Sai · Hiểu</p>
                    </div>
                </div>
                <div class="de-login-form-wrap">
                    <form class="de-login-form" id="de-login-form">
                        <h2>Chào em! 👋</h2>
                        <p>Đăng nhập để học tiếp</p>
                        <label class="de-field">
                            <span>Tài khoản</span>
                            <input id="de-login-ten" value="an.nguyen" autocomplete="username">
                        </label>
                        <label class="de-field">
                            <span>Mật khẩu</span>
                            <input type="password" value="12345678" autocomplete="current-password">
                        </label>
                        <button class="de-login-submit" id="de-login-submit" type="button">Vào Dế Lab →</button>
                        <button class="de-login-demo" id="de-login-demo" type="button">Dùng thử không cần tài khoản</button>
                    </form>
                </div>
            </div>
        `;

        const dangNhap = () => {
            const td = docTienDo();
            const tenNhap = document.getElementById('de-login-ten').value.trim();
            const tenNgan = tenNhap ? tenNhap.split(/[.@ _-]/)[0] : 'em';
            td.daDangNhap = true;
            td.tenHocSinh = tenNgan === 'em' ? tenNgan :
                tenNgan.charAt(0).toUpperCase() + tenNgan.slice(1);
            ghiTienDo(td);
            veHome();
        };
        document.getElementById('de-login-form').addEventListener('submit', e => e.preventDefault());
        document.getElementById('de-login-submit').addEventListener('click', dangNhap);
        document.getElementById('de-login-demo').addEventListener('click', dangNhap);
    }

    /* ---------- màn hình mở đầu: chọn lối đi ---------- */
    function veHome () {
        manHinh = 'home';
        const wrap = document.getElementById('de-wrap');
        const soXong = LESSONS.filter(b => baiDaXong(b.so)).length;
        const td = docTienDo();
        const dangHoc = td.baiHienTai;
        const ten = td.tenHocSinh && td.tenHocSinh !== 'em' ? td.tenHocSinh : 'em';

        wrap.innerHTML = `
            <div class="de-home-top">
                <div class="de-home-brand"><span>🦗</span><span>Dế Lab</span></div>
                <div class="de-home-user">
                    <span class="de-home-avatar">${esc(ten.slice(0, 2))}</span>
                    <button class="de-quan-ly" id="de-quan-ly" title="Phụ huynh / giáo viên">⚙</button>
                    <button class="de-dang-xuat" id="de-dang-xuat">Đăng xuất</button>
                </div>
            </div>
            <div class="de-chao">
                <h1>Chào ${esc(ten)}! ☀️</h1>
                <p>Hôm nay em muốn làm gì?</p>
            </div>

            <div class="de-home-luoi">
                <button class="de-lua-chon de-lua-chon-kit" id="de-chon-kit">
                    <div class="de-lua-chon-icon">🌱</div>
                    <h2>Khu vườn thông minh</h2>
                    <p class="de-lua-chon-mota">${td.daXemGioiThieu ? (dangHoc ? `Học tiếp Bài ${dangHoc}` : 'Bài 1 · Quan sát khu vườn') : 'Video mở đầu · Bắt buộc'}</p>
                    <div class="de-tiendo">
                        <div class="de-tiendo-thanh">
                            <div class="de-tiendo-day" style="width:${(soXong / 7) * 100}%"></div>
                        </div>
                    </div>
                    <div class="de-lua-chon-nut">Đi tiếp</div>
                </button>

                <button class="de-lua-chon de-lua-chon-moi" id="de-chon-moi">
                    <div class="de-lua-chon-icon">✨</div>
                    <h2>Dự án mới</h2>
                    <p class="de-lua-chon-mota">Kể ý tưởng cho chú Dế</p>
                    <div class="de-lua-chon-nut de-lua-chon-nut-cam">Tạo mới</div>
                </button>
            </div>
        `;

        document.getElementById('de-chon-kit').addEventListener('click', vaoKhoaHoc);
        document.getElementById('de-chon-moi').addEventListener('click', taoDuAnMoi);
        document.getElementById('de-quan-ly').addEventListener('click', xacNhanPhuHuynh);
        document.getElementById('de-dang-xuat').addEventListener('click', () => {
            const moi = docTienDo();
            delete moi.daDangNhap;
            ghiTienDo(moi);
            veDangNhap();
        });
    }

    function xacNhanPhuHuynh () {
        const cu = document.getElementById('de-ma-phu-huynh');
        if (cu) cu.remove();
        const maCu = localStorage.getItem(MA_PHU_HUYNH_KEY);
        const modal = document.createElement('div');
        modal.id = 'de-ma-phu-huynh';
        modal.innerHTML = `<div class="de-ma-card">
            <h3>🔒 Phụ huynh / giáo viên</h3>
            <p>${maCu ? 'Nhập mã để quản lý sao lưu dữ liệu.' : 'Tạo mã riêng để học sinh không dùng phần sao lưu.'}</p>
            <input id="de-ma-input" type="password" autocomplete="off" placeholder="${maCu ? 'Nhập mã của bạn' : 'Tạo mã ít nhất 4 ký tự'}">
            <div id="de-ma-loi"></div>
            <div class="de-ma-actions"><button id="de-ma-huy">Hủy</button><button id="de-ma-xac-nhan">Tiếp tục</button></div>
        </div>`;
        document.body.appendChild(modal);
        const input = document.getElementById('de-ma-input');
        const loi = document.getElementById('de-ma-loi');
        const xacNhan = () => {
            const ma = input.value.trim();
            if (!maCu && ma.length < 4) return loi.textContent = 'Mã cần ít nhất 4 ký tự.';
            if (maCu && ma !== maCu) return loi.textContent = 'Mã chưa đúng.';
            if (!maCu) localStorage.setItem(MA_PHU_HUYNH_KEY, ma);
            modal.remove();
            moQuanLyDuLieu();
        };
        document.getElementById('de-ma-xac-nhan').addEventListener('click', xacNhan);
        document.getElementById('de-ma-huy').addEventListener('click', () => modal.remove());
        input.addEventListener('keydown', event => { if (event.key === 'Enter') xacNhan(); });
        input.focus();
    }

    function duLieuSaoLuu () {
        const chat = {};
        for (let i = 0; i < localStorage.length; i += 1) {
            const key = localStorage.key(i);
            if (key && key.indexOf('te_ai_memory_v1:') === 0) chat[key] = localStorage.getItem(key);
        }
        return {app: 'DeLab', version: 1, createdAt: new Date().toISOString(), progress: docTienDo(), chat: chat};
    }

    function moQuanLyDuLieu () {
        const cu = document.getElementById('de-quan-ly-du-lieu');
        if (cu) cu.remove();
        const modal = document.createElement('div');
        modal.id = 'de-quan-ly-du-lieu';
        modal.innerHTML = `<div class="de-quan-ly-card">
            <h3>🔒 Dữ liệu học trên máy</h3>
            <p>Tiến độ, sổ tay, ảnh và lịch sử chat chỉ nằm trên máy này. Hãy xuất file trước khi đổi máy hoặc cài lại app.</p>
            <div id="de-quan-ly-status"></div>
            <button id="de-xuat-sao-luu">Tải file sao lưu</button>
            <button class="de-nap-sao-luu" id="de-nap-sao-luu">Nạp file đã sao lưu</button>
            <button id="de-dong-quan-ly">Xong</button>
        </div>`;
        document.body.appendChild(modal);

        const status = document.getElementById('de-quan-ly-status');
        const ipc = require('electron').ipcRenderer;
        const napDuLieu = noiDung => {
            try {
                const data = JSON.parse(noiDung);
                if (!data || data.app !== 'DeLab' || data.version !== 1 || typeof data.progress !== 'object') throw new Error('bad file');
                if (!window.confirm('Nạp bản sao lưu sẽ thay tiến độ và sổ tay hiện tại trên máy này. Tiếp tục?')) return;
                localStorage.setItem(LUU_KEY, JSON.stringify(data.progress));
                for (let i = localStorage.length - 1; i >= 0; i -= 1) {
                    const key = localStorage.key(i);
                    if (key && key.indexOf('te_ai_memory_v1:') === 0) localStorage.removeItem(key);
                }
                Object.keys(data.chat || {}).forEach(key => {
                    if (key.indexOf('te_ai_memory_v1:') === 0 && typeof data.chat[key] === 'string') localStorage.setItem(key, data.chat[key]);
                });
                modal.remove();
                veHome();
            } catch (e) {
                status.textContent = 'File sao lưu không đúng định dạng Dế Lab.';
            }
        };

        document.getElementById('de-xuat-sao-luu').addEventListener('click', async () => {
            status.textContent = 'Chọn nơi lưu file…';
            try {
                const daLuu = await ipc.invoke('de-backup:save', JSON.stringify(duLieuSaoLuu(), null, 2));
                status.textContent = daLuu ? 'Đã lưu bản sao lưu ✓' : '';
            } catch (e) {
                status.textContent = 'Chưa lưu được file. Thử lại nhé.';
            }
        });
        document.getElementById('de-nap-sao-luu').addEventListener('click', async () => {
            status.textContent = 'Chọn file sao lưu…';
            try {
                const noiDung = await ipc.invoke('de-backup:open');
                if (noiDung) napDuLieu(noiDung);
                else status.textContent = '';
            } catch (e) {
                status.textContent = 'Chưa mở được file. Thử lại nhé.';
            }
        });
        document.getElementById('de-dong-quan-ly').addEventListener('click', () => modal.remove());
    }

    /* ---------- lối 2: dự án tự do cùng chú Dế ---------- */
    function taoDuAnMoi () {
        const td = docTienDo();
        td.cheDo = 'duAnRieng';
        delete td.baiHienTai;
        ghiTienDo(td);
        apDungCheDoWorkspace('project');
        capNhatNutNoi();
        dongOverlay();

        setTimeout(() => {
            guiChoTroLy('Em muốn tự làm một dự án riêng. Chú Dế gợi ý giúp em bắt đầu từ đâu?');
        }, 300);
    }

    function vaoKhoaHoc () {
        if (!docTienDo().daXemGioiThieu) moGioiThieu();
        else veDanhSach();
    }

    /* ---------- bài mở đầu: phải xem hết mới mở khóa ---------- */
    function moGioiThieu () {
        manHinh = 'gioiThieu';
        const wrap = document.getElementById('de-wrap');
        const daXem = !!docTienDo().daXemGioiThieu;
        const coVideo = coVideoGioiThieu();

        wrap.innerHTML = `
            <button class="de-quaylai" id="de-intro-back">← Trang chủ</button>
            <div class="de-bai-tieude">
                <h2>Video mở đầu · Chào mừng em</h2>
                <p class="phude">Xem hết phần giới thiệu để biết mình sẽ làm gì trong 7 bài.</p>
                <span class="de-nhan de-nhan-code">Bắt buộc trước Bài 1</span>
            </div>
            <div class="de-intro-player">
                ${coVideo ? `<video id="de-intro-video" controls controlsList="nodownload noplaybackrate"
                    disablePictureInPicture preload="metadata" src="${INTRO_VIDEO}"></video>` : ''}
                <div class="de-intro-demo" id="de-intro-demo" ${coVideo ? 'style="display:none"' : ''}>
                    <div class="de-intro-demo-icon" id="de-intro-icon">🌱</div>
                    <h3 id="de-intro-title">Khu vườn thông minh</h3>
                    <p id="de-intro-text">Em sẽ quan sát, làm mô hình, lắp cảm biến và tạo một khu vườn của riêng mình.</p>
                    <button class="de-nut-chinh" id="de-intro-play" style="max-width:320px">▶ Xem phần giới thiệu</button>
                    <div class="de-intro-track" id="de-intro-track" style="display:none"><span></span></div>
                </div>
            </div>
            <p class="de-intro-note" id="de-intro-note">
                ${daXem ? 'Em đã xem xong. Em có thể xem lại bất cứ lúc nào.' : 'Nút tiếp tục chỉ mở khi phần giới thiệu chạy hết.'}
            </p>
            <button class="de-nut-chinh" id="de-intro-next" ${daXem ? '' : 'disabled'}>
                ${daXem ? 'Vào danh sách 7 bài →' : 'Hãy xem hết video trước'}
            </button>
        `;

        const video = document.getElementById('de-intro-video');
        const next = document.getElementById('de-intro-next');
        const back = document.getElementById('de-intro-back');
        const note = document.getElementById('de-intro-note');
        let daXemDen = 0;
        let daKhoiTaoBanTichHop = false;

        function hoanTat () {
            const td = docTienDo();
            td.daXemGioiThieu = true;
            ghiTienDo(td);
            next.disabled = false;
            next.textContent = 'Vào danh sách 7 bài →';
            note.textContent = 'Tuyệt! Em đã mở khóa 7 bài học.';
            back.disabled = false;
        }

        function chayBanTichHop () {
            if (daKhoiTaoBanTichHop) return;
            daKhoiTaoBanTichHop = true;
            videoGioiThieuLoi = true;
            if (video) video.style.display = 'none';

            const demo = document.getElementById('de-intro-demo');
            const play = document.getElementById('de-intro-play');
            const track = document.getElementById('de-intro-track');
            const fill = track.querySelector('span');
            const icon = document.getElementById('de-intro-icon');
            const title = document.getElementById('de-intro-title');
            const text = document.getElementById('de-intro-text');
            const slides = [
                ['🌱', 'Quan sát vấn đề thật', 'Em bắt đầu từ cây và khu vườn, chưa vội cắm dây hay viết lệnh.'],
                ['🧩', 'Làm từng phần nhỏ', 'Mỗi bài thêm một mảnh: mô hình, cảm biến, điều khiển rồi mới ghép lại.'],
                ['🦗', 'Chú Dế đồng hành', 'Khi em bí, chú Dế sẽ gợi mở để em tự tìm ra cách làm.']
            ];

            demo.style.display = 'block';
            play.addEventListener('click', () => {
                play.style.display = 'none';
                track.style.display = 'block';
                back.disabled = true;
                const batDau = Date.now();
                const tongThoiGian = 10000;
                const timer = setInterval(() => {
                    const daChay = Math.min(tongThoiGian, Date.now() - batDau);
                    const slide = Math.min(slides.length - 1, Math.floor(daChay / (tongThoiGian / slides.length)));
                    icon.textContent = slides[slide][0];
                    title.textContent = slides[slide][1];
                    text.textContent = slides[slide][2];
                    fill.style.width = ((daChay / tongThoiGian) * 100) + '%';
                    if (daChay >= tongThoiGian) {
                        clearInterval(timer);
                        hoanTat();
                    }
                }, 100);
            }, {once: true});
        }

        if (video) {
            video.addEventListener('timeupdate', () => {
                if (!video.seeking) daXemDen = Math.max(daXemDen, video.currentTime);
            });
            video.addEventListener('seeking', () => {
                if (video.currentTime > daXemDen + 1) video.currentTime = daXemDen;
            });
            video.addEventListener('ended', () => {
                const daXemThucTe = Math.max(daXemDen, video.currentTime);
                if (video.duration && daXemThucTe >= video.duration - 1) hoanTat();
            });
            video.addEventListener('error', chayBanTichHop, {once: true});
        } else {
            chayBanTichHop();
        }
        back.addEventListener('click', veHome);
        next.addEventListener('click', () => {
            if (!next.disabled) veDanhSach();
        });
        wrap.parentElement.scrollTop = 0;
    }

    /* ---------- màn hình chọn bài ---------- */
    function veDanhSach () {
        if (!docTienDo().daXemGioiThieu) return moGioiThieu();
        manHinh = 'danhSach';
        const wrap = document.getElementById('de-wrap');
        const soXong = LESSONS.filter(b => baiDaXong(b.so)).length;

        wrap.innerHTML = `
            <button class="de-quaylai" id="de-ve-home">← Trang chủ</button>
            <div class="de-header">
                <h1>Khu vườn thông minh</h1>
                <p>Dế Base KIT · Bài mở đầu + 7 bài · Em đã xong ${soXong}/7 bài</p>
            </div>
            <div class="de-luoi">
                <button class="de-the xong" id="de-xem-lai-intro">
                    <div class="de-so">▶</div>
                    <div class="de-the-noidung">
                        <h3>Video mở đầu</h3>
                        <p>Chào mừng em đến với hành trình Khu vườn thông minh.</p>
                        <span class="de-nhan de-nhan-xong">Đã xem</span>
                    </div>
                </button>
                ${LESSONS.map(b => {
                    const xong = baiDaXong(b.so);
                    return `
                    <button class="de-the ${xong ? 'xong' : ''}" data-bai="${b.so}">
                        <div class="de-so">${xong ? '✓' : b.so}</div>
                        <div class="de-the-noidung">
                            <h3>${esc(b.ten)}</h3>
                            <p>${esc(b.phuDe)}</p>
                            <span class="de-nhan ${b.coLapTrinh ? 'de-nhan-code' : 'de-nhan-tay'}">
                                ${b.coLapTrinh ? 'Có lập trình' : 'Làm tay, chưa cần mạch'}
                            </span>
                            ${xong ? '<span class="de-nhan de-nhan-xong">Đã xong</span>' : ''}
                        </div>
                    </button>`;
                }).join('')}
            </div>
        `;

        const veHomeBtn = document.getElementById('de-ve-home');
        if (veHomeBtn) veHomeBtn.addEventListener('click', veHome);
        const xemLaiIntro = document.getElementById('de-xem-lai-intro');
        if (xemLaiIntro) xemLaiIntro.addEventListener('click', moGioiThieu);

        wrap.querySelectorAll('.de-the[data-bai]').forEach(el => {
            el.addEventListener('click', () => moBai(Number(el.dataset.bai)));
        });
    }

    /* ---------- màn hình một bài ---------- */
    function moBai (so) {
        if (!docTienDo().daXemGioiThieu) return moGioiThieu();
        const b = LESSONS.find(x => x.so === so);
        if (!b) return;
        baiDangMo = b;
        manHinh = 'chiTiet';

        const td = docTienDo()[so] || {};
        const check = td.tuKiemTra || {};
        const hoc = trangThaiHoc(b);
        const coVideoBaiHoc = coVideoBai(b);
        const soTay = td.soTay || {};
        if (!b.coLapTrinh) {
            nguCanhWorkspace = {mode: 'kit', lesson: b.so, lessonName: b.ten, extensions: b.khoiLenh};
        }
        const wrap = document.getElementById('de-wrap');

        wrap.innerHTML = `
            <button class="de-quaylai" id="de-back">← Quay lại danh sách bài</button>

            <div class="de-bai-tieude">
                <h2>Bài ${b.so} · ${esc(b.ten)}</h2>
                <p class="phude">${esc(b.phuDe)}</p>
                <span class="de-nhan de-nhan-tay">${esc(b.thoiLuong)}</span>
                <span class="de-nhan ${b.coLapTrinh ? 'de-nhan-code' : 'de-nhan-tay'}">
                    ${b.coLapTrinh ? 'Có lập trình' : 'Chưa cần mạch'}
                </span>
            </div>

            <div class="de-tien-do-hoc">
                <div><strong>${hoc.daXong === hoc.tong ? 'Đã hoàn thành phần thực hành' : `Đang ở bước ${hoc.daXong + 1}/${hoc.tong}`}</strong>
                    <span>${hoc.tiepTheo ? `Tiếp theo: ${esc(hoc.tiepTheo.ten)}` : 'Em có thể tự kiểm tra sản phẩm của mình.'}</span></div>
                <div class="de-tien-do-hoc-thanh"><i style="width:${Math.round(hoc.daXong / hoc.tong * 100)}%"></i></div>
                <small>${hoc.coCode ? '✓ Đã tự lưu chương trình của em' : 'Chưa có chương trình được lưu cho bài này'}</small>
            </div>

            ${!b.coLapTrinh ? `<div class="de-mach">
                Bài này em làm bằng tay và quan sát thật, chưa cần lắp mạch hay viết chương trình.
            </div>` : ''}

            ${!b.coLapTrinh ? `<div class="de-khoi de-de-dan">
                <h4>🦗 Đi cùng Chú Dế</h4>
                <p style="margin:0">Chú sẽ dẫn em làm từng việc nhỏ, rồi em tự làm ngoài đời thật.</p>
                <button id="de-dan-tung-buoc">Chú Dế dẫn từng bước</button>
                <button id="de-hoi-dang-bi">Em đang bí, hỏi Chú Dế</button>
            </div>` : ''}

            ${b.video ? `<div class="de-khoi de-video-bai ${coVideoBaiHoc ? '' : 'de-video-cho'}">
                <h4>🎬 ${b.so === 1 ? 'Video: quan sát cùng Chú Dế' : 'Video: làm mô hình cùng Chú Dế'}</h4>
                ${coVideoBaiHoc
                    ? `<video controls controlsList="nodownload noplaybackrate" disablePictureInPicture preload="metadata" src="${esc(b.video)}"></video>`
                    : `<div class="de-video-cho-noidung"><span>${b.so === 1 ? '🌿' : '🧰'}</span><div><strong>Video hướng dẫn đang cập nhật</strong><p>Khi có video, em sẽ xem cách ${b.so === 1 ? 'quan sát cây và ghi sổ tay' : 'làm mô hình vườn mini'} ngay tại đây.</p></div></div>`}
            </div>` : ''}

            ${!b.coLapTrinh ? `<div class="de-khoi de-chat-bai">
                <h4>🦗 Hỏi Chú Dế ngay tại bài học</h4>
                <p>Em đang vướng chỗ nào? Chú gợi ý từng việc nhỏ, không đưa đáp án làm sẵn.</p>
                <div class="de-chat-bai-msgs" id="de-chat-bai-msgs"><div class="de-chat-bai-bot">Chú đang ở đây. Em kể chú nghe xem em quan sát hoặc làm mô hình tới đâu rồi nhé.</div></div>
                <form class="de-chat-bai-form" id="de-chat-bai-form">
                    <input id="de-chat-bai-input" autocomplete="off" placeholder="Nhắn Chú Dế ở ngay đây…">
                    <button type="submit">Gửi</button>
                </form>
            </div>` : ''}

            <div class="de-khoi">
                <p style="margin:0">${esc(b.moDau)}</p>
            </div>

            ${b.so === 1 ? `<div class="de-khoi de-so-tay">
                <h4>📒 Sổ tay quan sát của em <small id="de-so-tay-status">Tự lưu trên máy</small></h4>
                <p>Ghi điều em thấy trước. Nếu có ảnh, Chú Dế sẽ cùng em quan sát, không đoán bệnh cây thay em.</p>
                <label>Cây hoặc nơi em quan sát<input id="de-so-tay-cay" value="${escAttr(soTay.cay)}" placeholder="Ví dụ: chậu cây ở ban công"></label>
                <label>Điều em thấy<textarea id="de-so-tay-thay" placeholder="Ví dụ: 3 lá dưới hơi vàng, đất mặt khô…">${esc(soTay.thay)}</textarea></label>
                <label>Điều em đoán<textarea id="de-so-tay-doan" placeholder="Ví dụ: có thể cây thiếu nước…">${esc(soTay.doan)}</textarea></label>
                <label class="de-so-tay-anh-label">📷 Thêm một ảnh cây<input id="de-so-tay-anh" type="file" accept="image/*"></label>
                <div class="de-so-tay-preview" id="de-so-tay-preview">${soTay.anh ? `<img src="${escAttr(soTay.anh)}" alt="Ảnh cây em quan sát"><button type="button" id="de-so-tay-xoa-anh">Xóa ảnh</button>` : '<span>Chưa có ảnh. Em có thể chụp bằng điện thoại rồi tải lên.</span>'}</div>
                <button class="de-so-tay-hoi" id="de-so-tay-hoi-ai">🦗 Nhờ Chú Dế cùng xem ghi chép${soTay.anh ? ' và ảnh' : ''}</button>
            </div>` : ''}

            <div class="de-khoi">
                <h4>🎯 Sau bài này em sẽ</h4>
                <ul>${b.mucTieu.map(m => `<li>${esc(m)}</li>`).join('')}</ul>
            </div>

            <div class="de-khoi">
                <h4>🧰 Em cần chuẩn bị</h4>
                <p style="margin:0">${esc(b.chuanBi)}</p>
            </div>

            <div class="de-khoi">
                <h4>📋 Các bước làm</h4>
                ${b.cacBuoc.map((s, i) => `
                    <div class="de-buoc">
                        <div class="de-buoc-so">${i + 1}</div>
                        <div class="de-buoc-noidung">
                            <strong>${esc(s.ten)}</strong>
                            <span>${esc(s.noiDung)}</span>
                        </div>
                    </div>`).join('')}
            </div>

            <div class="de-khoi">
                <h4>💬 Khi bí thì hỏi trợ lý</h4>
                <p style="margin:0 0 10px;color:${MAU.chuNhat};font-size:14px">
                    Bấm một câu bên dưới để hỏi. Trợ lý sẽ hỏi ngược lại giúp em tự tìm ra đáp án,
                    chứ không làm hộ em.
                </p>
                ${b.hoiAI.map(q => `<button class="de-hoi" data-hoi="${esc(q)}">${esc(q)}</button>`).join('')}
            </div>

            <div class="de-khoi">
                <h4>✅ Em tự kiểm tra</h4>
                ${b.tuKiemTra.map((t, i) => `
                    <label class="de-check">
                        <input type="checkbox" data-idx="${i}" ${check[i] ? 'checked' : ''} ${b.so === 3 ? 'disabled' : ''}>
                        <span>${esc(t)}</span>
                    </label>`).join('')}
                <p style="margin:12px 0 0;color:${MAU.chuNhat};font-size:14px">
                    ${b.so === 3 ? 'Các ô này được app tự đánh dấu khi em làm và thử chương trình.' :
                        'Đủ hết các ô là em qua bài sau được rồi.'}
                </p>
            </div>

            <div class="de-khoi">
                <h4>🏆 Sản phẩm của em</h4>
                <p style="margin:0">${esc(b.sanPham)}</p>
            </div>

            <div class="de-khoi de-khoi-antoan">
                <h4>⚠️ Lưu ý an toàn</h4>
                <p style="margin:0">${esc(b.anToan)}</p>
            </div>

            ${b.chuanBiBaiSau ? `
            <div class="de-khoi">
                <h4>👉 Chuẩn bị cho bài sau</h4>
                <p style="margin:0">${esc(b.chuanBiBaiSau)}</p>
            </div>` : ''}

            ${b.coLapTrinh
                ? `<button class="de-nut-chinh" id="de-vao-lam">Bắt đầu làm bài này →</button>`
                : `<button class="de-nut-chinh de-nut-phu" id="de-xong-bai">Em làm xong rồi, quay lại danh sách</button>`}
        `;

        document.getElementById('de-back').addEventListener('click', veDanhSach);

        wrap.querySelectorAll('.de-check input').forEach(inp => {
            if (inp.disabled) return;
            inp.addEventListener('change', () => danhDauMuc(so, Number(inp.dataset.idx), inp.checked));
        });

        const hoiTaiBai = !b.coLapTrinh ? batChatTaiBai(b) : null;
        if (b.so === 1) khoiTaoSoTayBai1(hoiTaiBai);
        wrap.querySelectorAll('.de-hoi').forEach(btn => {
            btn.addEventListener('click', () => hoiTaiBai ? hoiTaiBai(btn.dataset.hoi) : guiChoTroLy(btn.dataset.hoi));
        });

        const vaoLam = document.getElementById('de-vao-lam');
        if (vaoLam) vaoLam.addEventListener('click', () => vaoWorkspace(b));

        const xongBai = document.getElementById('de-xong-bai');
        if (xongBai) xongBai.addEventListener('click', veDanhSach);

        const danTungBuoc = document.getElementById('de-dan-tung-buoc');
        if (danTungBuoc) danTungBuoc.addEventListener('click', () => moHuongDanBai(b));
        const hoiDangBi = document.getElementById('de-hoi-dang-bi');
        if (hoiDangBi) hoiDangBi.addEventListener('click', () => hoiTaiBai(b.hoiAI[0]));

        wrap.parentElement.scrollTop = 0;
    }

    function moHuongDanBai (bai) {
        const cu = document.getElementById('de-huong-dan-bai');
        if (cu) cu.remove();
        const td = docTienDo()[bai.so] || {};
        let index = Math.min(td.buocHuongDan || 0, bai.cacBuoc.length - 1);
        const modal = document.createElement('div');
        modal.id = 'de-huong-dan-bai';
        modal.innerHTML = `<div class="de-huong-dan-card">
            <div id="de-huong-dan-count"></div><h3 id="de-huong-dan-title"></h3>
            <p id="de-huong-dan-text"></p>
            <div class="de-huong-dan-actions"><button id="de-huong-dan-close">Để sau</button><button id="de-huong-dan-back">← Trước</button><button id="de-huong-dan-next">Tiếp →</button></div>
        </div>`;
        document.body.appendChild(modal);
        const count = document.getElementById('de-huong-dan-count');
        const title = document.getElementById('de-huong-dan-title');
        const text = document.getElementById('de-huong-dan-text');
        const back = document.getElementById('de-huong-dan-back');
        const next = document.getElementById('de-huong-dan-next');
        const ve = () => {
            const buoc = bai.cacBuoc[index];
            count.textContent = `Bước ${index + 1} / ${bai.cacBuoc.length}`;
            title.textContent = '🦗 ' + buoc.ten;
            text.textContent = buoc.noiDung;
            back.style.visibility = index ? 'visible' : 'hidden';
            next.textContent = index === bai.cacBuoc.length - 1 ? 'Xong ✓' : 'Tiếp →';
        };
        document.getElementById('de-huong-dan-close').addEventListener('click', () => modal.remove());
        back.addEventListener('click', () => { if (index) { index -= 1; ve(); } });
        next.addEventListener('click', () => {
            const data = docTienDo();
            if (!data[bai.so]) data[bai.so] = {};
            data[bai.so].buocHuongDan = Math.min(index + 1, bai.cacBuoc.length - 1);
            ghiTienDo(data);
            if (index === bai.cacBuoc.length - 1) return modal.remove();
            index += 1;
            ve();
        });
        ve();
    }

    /* ---------- sổ tay quan sát Bài 1 ---------- */
    function nenAnhSoTay (file) {
        return new Promise((resolve, reject) => {
            const doc = new FileReader();
            doc.onerror = () => reject(new Error('Không đọc được ảnh'));
            doc.onload = () => {
                const anh = new Image();
                anh.onerror = () => reject(new Error('Ảnh không hợp lệ'));
                anh.onload = () => {
                    const tiLe = Math.min(1, 900 / Math.max(anh.width, anh.height));
                    const canvas = document.createElement('canvas');
                    canvas.width = Math.max(1, Math.round(anh.width * tiLe));
                    canvas.height = Math.max(1, Math.round(anh.height * tiLe));
                    canvas.getContext('2d').drawImage(anh, 0, 0, canvas.width, canvas.height);
                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                };
                anh.src = doc.result;
            };
            doc.readAsDataURL(file);
        });
    }

    function khoiTaoSoTayBai1 (hoiTaiBai) {
        const cay = document.getElementById('de-so-tay-cay');
        const thay = document.getElementById('de-so-tay-thay');
        const doan = document.getElementById('de-so-tay-doan');
        const anh = document.getElementById('de-so-tay-anh');
        const preview = document.getElementById('de-so-tay-preview');
        const trangThai = document.getElementById('de-so-tay-status');
        const nutHoi = document.getElementById('de-so-tay-hoi-ai');
        if (!cay || !thay || !doan || !anh || !preview || !trangThai || !nutHoi) return;

        function duLieu () {
            return (docTienDo()[1] || {}).soTay || {};
        }
        function luu (phan) {
            const td = docTienDo();
            if (!td[1]) td[1] = {};
            td[1].soTay = Object.assign({}, td[1].soTay || {}, phan);
            ghiTienDo(td);
            trangThai.textContent = 'Đã tự lưu ✓';
        }
        [cay, thay, doan].forEach(o => o.addEventListener('input', () => {
            luu({cay: cay.value, thay: thay.value, doan: doan.value});
        }));
        anh.addEventListener('change', async () => {
            const file = anh.files && anh.files[0];
            if (!file) return;
            trangThai.textContent = 'Đang lưu ảnh…';
            try {
                const data = await nenAnhSoTay(file);
                luu({anh: data});
                preview.innerHTML = `<img src="${escAttr(data)}" alt="Ảnh cây em quan sát"><button type="button" id="de-so-tay-xoa-anh">Xóa ảnh</button>`;
                document.getElementById('de-so-tay-xoa-anh').addEventListener('click', () => {
                    luu({anh: ''});
                    anh.value = '';
                    preview.innerHTML = '<span>Chưa có ảnh. Em có thể chụp bằng điện thoại rồi tải lên.</span>';
                });
            } catch (e) {
                trangThai.textContent = 'Chưa lưu được ảnh';
            }
        });
        const xoa = document.getElementById('de-so-tay-xoa-anh');
        if (xoa) xoa.addEventListener('click', () => {
            luu({anh: ''});
            preview.innerHTML = '<span>Chưa có ảnh. Em có thể chụp bằng điện thoại rồi tải lên.</span>';
        });
        nutHoi.addEventListener('click', () => {
            const data = duLieu();
            const cau = `Chú xem cùng em ghi chép Bài 1 nhé. Cây/nơi: ${data.cay || 'em chưa ghi'}. Điều em thấy: ${data.thay || 'em chưa ghi'}. Điều em đoán: ${data.doan || 'em chưa ghi'}. Đừng chẩn đoán bệnh cây ngay; hãy chỉ ra điều nào là quan sát, điều nào là suy đoán, rồi hỏi em một câu để quan sát thêm.`;
            hoiTaiBai(cau, data.anh || '');
        });
    }

    /* ---------- chat ngay trong Bài 1–2 ---------- */
    function batChatTaiBai (bai) {
        const khung = document.getElementById('de-chat-bai-msgs');
        const form = document.getElementById('de-chat-bai-form');
        const input = document.getElementById('de-chat-bai-input');
        const nutGui = form && form.querySelector('button');
        if (!khung || !form || !input || !nutGui) return () => {};
        const lichSu = [];

        function themTin (noiDung, lop) {
            const tin = document.createElement('div');
            tin.className = lop;
            tin.textContent = noiDung;
            khung.appendChild(tin);
            khung.scrollTop = khung.scrollHeight;
            return tin;
        }

        async function hoi (cauHoi, anh) {
            const cau = String(cauHoi || input.value).trim();
            if (!cau) return input.focus();
            input.value = '';
            themTin(cau, 'de-chat-bai-user');
            lichSu.push({role: 'user', content: cau});
            const dangNghi = themTin('Chú Dế đang suy nghĩ…', 'de-chat-bai-bot de-chat-bai-thinking');
            input.disabled = true;
            nutGui.disabled = true;
            try {
                if (!window.ThingEduAI || !window.ThingEduAI.ask) throw new Error('Chú Dế chưa sẵn sàng');
                const traLoi = anh && window.ThingEduAI.askWithImage ?
                    await window.ThingEduAI.askWithImage(cau, anh, lichSu.slice(0, -1)) :
                    await window.ThingEduAI.ask(cau, lichSu.slice(0, -1));
                dangNghi.textContent = traLoi.text;
                dangNghi.classList.remove('de-chat-bai-thinking');
                lichSu.push({role: 'assistant', content: traLoi.text});
            } catch (e) {
                dangNghi.textContent = 'Chú đang bận một chút. Em thử nhắn lại sau nhé.';
                dangNghi.classList.remove('de-chat-bai-thinking');
            } finally {
                input.disabled = false;
                nutGui.disabled = false;
                input.focus();
                khung.scrollTop = khung.scrollHeight;
            }
        }

        form.addEventListener('submit', event => {
            event.preventDefault();
            hoi();
        });
        return hoi;
    }

    /* ---------- nối sang trợ lý AI đã có ---------- */
    function guiChoTroLy (cauHoi) {
        dongOverlay();
        setTimeout(() => {
            const fab = document.getElementById('te-ai-fab');
            const panel = document.getElementById('te-ai-panel');
            if (panel && !panel.classList.contains('open') && fab) fab.click();

            const o = document.getElementById('te-ai-input');
            if (o) {
                o.value = cauHoi;
                o.focus();
                const guiBtn = document.getElementById('te-ai-send');
                if (guiBtn) guiBtn.click();
            } else if (window.ThingEduAI && window.ThingEduAI.ask) {
                window.ThingEduAI.ask(cauHoi);
            }
        }, 250);
    }

    /* ---------- vào workspace làm bài ---------- */
    function vaoWorkspace (bai) {
        const td = docTienDo();
        if (!td[bai.so]) td[bai.so] = {};
        td[bai.so].daMo = true;
        td[bai.so].workspaceKey = (td[bai.so].workspaceKey || 0) + 1;
        td.cheDo = 'hocKit';
        td.baiHienTai = bai.so;
        ghiTienDo(td);
        apDungCheDoWorkspace('kit', bai);
        dongOverlay();
        capNhatNutNoi();
    }

    function taoTroGiupBai () {
        const box = document.createElement('aside');
        box.id = 'de-tro-giup-bai';
        box.innerHTML = `<strong>🦗 Bài 3 · Tiến độ của em</strong>
            <div id="de-tro-giup-status">Đang xem chương trình của em…</div>
            <button id="de-tro-giup-tutorial">Chú chỉ từng bước</button>
            <button id="de-tro-giup-chat">Em đang bí chỗ lập trình</button>
            <button id="de-tro-giup-demo" hidden>Bí quá — xem mẫu 10 giây</button>
            <button id="de-tro-giup-close-demo" hidden>Tắt mẫu ngay</button>
            <button id="de-tro-giup-done" hidden>Em đã nạp và thử xong</button>
            <div id="de-tro-giup-note"></div>`;
        document.body.appendChild(box);
        const demo = document.getElementById('de-tro-giup-demo');
        const tatDemo = document.getElementById('de-tro-giup-close-demo');
        const note = document.getElementById('de-tro-giup-note');
        let demoTimer = null;
        const tatMau = () => {
            if (demoTimer) clearInterval(demoTimer);
            demoTimer = null;
            window.dispatchEvent(new CustomEvent('de:lesson-demo', {detail: {lesson: 3, action: 'clear'}}));
        };
        document.getElementById('de-tro-giup-tutorial').addEventListener('click', () => {
            const startAt = !trangThaiBai3.hasSensor ? 0 :
                (!trangThaiBai3.hasCondition ? 1 : 2);
            if (window.ThingEduAI && window.ThingEduAI.startTutorial) window.ThingEduAI.startTutorial(startAt);
        });
        document.getElementById('de-tro-giup-chat').addEventListener('click', () => {
            guiChoTroLy(cauHoiTheoTienDoBai3());
            if (!trangThaiBai3.hasAlert) demo.hidden = false;
        });
        demo.addEventListener('click', () => {
            if (demo.disabled) return;
            demo.disabled = true;
            tatDemo.hidden = false;
            note.textContent = 'Nhìn thứ tự khối, mẫu sẽ tự xóa sau 10 giây.';
            window.dispatchEvent(new CustomEvent('de:lesson-demo', {detail: {lesson: 3, action: 'show'}}));
            let conLai = 10;
            demoTimer = setInterval(() => {
                conLai -= 1;
                note.textContent = `Mẫu tự xóa sau ${conLai} giây.`;
                if (conLai > 0) return;
                tatMau();
            }, 1000);
        });
        tatDemo.addEventListener('click', tatMau);
        document.getElementById('de-tro-giup-done').addEventListener('click', moChucMungBai3);
        window.addEventListener('de:lesson-demo-status', event => {
            if (!event.detail || event.detail.lesson !== 3 || event.detail.state !== 'cleared') return;
            demo.disabled = false;
            demo.hidden = true;
            tatDemo.hidden = true;
            note.textContent = 'Mẫu đã xóa. Tới lượt em tự ghép lại nhé!';
        });
    }

    function cauHoiTheoTienDoBai3 () {
        if (!trangThaiBai3.hasSensor) return 'Em đang ở Bài 3 và chưa có khối đọc độ ẩm đất. Chỉ em đúng chỗ tìm khối đó.';
        if (!trangThaiBai3.hasCondition) return 'Em đã kéo khối độ ẩm đất. Chỉ em ghép nó vào điều kiện nếu–thì.';
        if (!trangThaiBai3.hasAlert) return 'Em đã có điều kiện đất khô. Chỉ em thêm khối còi vào bên trong nếu–thì.';
        return 'Em đã ghép xong code Bài 3. Hãy hướng dẫn em theo thứ tự: kiểm tra dây và nguồn, kết nối ThingBot, nạp chương trình, rồi thử đầu dò trong đất khô. Nếu còi không kêu thì em kiểm tra gì trước?';
    }

    function moChucMungBai3 () {
        const td = docTienDo();
        if (!td[3]) td[3] = {};
        td[3].daHoanTat = true;
        td[3].tuKiemTra = {0: true, 1: true, 2: true};
        delete td[3].workspaceXml;
        delete td[3].blockCount;
        delete td[3].savedAt;
        td[3].workspaceKey = (td[3].workspaceKey || 0) + 1;
        ghiTienDo(td);
        const bai = LESSONS.find(item => item.so === 3);
        if (bai) apDungCheDoWorkspace('kit', bai);
        const cu = document.getElementById('de-chuc-mung');
        if (cu) cu.remove();
        const modal = document.createElement('div');
        modal.id = 'de-chuc-mung';
        modal.innerHTML = `<div class="de-chuc-mung-card">
            <div class="de-chuc-mung-icon">🎉</div>
            <h2>Em đã pass Bài 3!</h2>
            <p>Em đã tạo được chương trình báo đất khô bằng cảm biến và còi. Rất ổn! Khối lệnh đã được dọn để sẵn sàng cho bài tiếp theo.</p>
            <button id="de-chuc-next">Sang Bài 4 →</button>
            <button id="de-chuc-more">Muốn tìm hiểu thêm bài này</button>
            <button id="de-chuc-review">Xem lại bài này</button>
        </div>`;
        document.body.appendChild(modal);
        document.getElementById('de-chuc-next').addEventListener('click', () => {
            modal.remove();
            moOverlay();
            moBai(4);
        });
        document.getElementById('de-chuc-more').addEventListener('click', () => {
            modal.remove();
            guiChoTroLy('Em đã hoàn thành Bài 3. Gợi ý cho em một thử thách nhỏ để tìm hiểu sâu hơn về ngưỡng độ ẩm và còi cảnh báo.');
        });
        document.getElementById('de-chuc-review').addEventListener('click', () => {
            modal.remove();
            moOverlay();
            moBai(3);
        });
    }

    function capNhatBangTienDoBai3 () {
        const status = document.getElementById('de-tro-giup-status');
        if (!status) return;
        const docAm = trangThaiBai3.hasSensor;
        const dieuKien = trangThaiBai3.hasCondition;
        const coi = trangThaiBai3.hasAlert;
        const daXongCode = docAm && dieuKien && coi;
        const tieuDe = document.querySelector('#de-tro-giup-bai strong');
        const tutorial = document.getElementById('de-tro-giup-tutorial');
        const chat = document.getElementById('de-tro-giup-chat');
        const demo = document.getElementById('de-tro-giup-demo');
        const done = document.getElementById('de-tro-giup-done');
        if (tieuDe) tieuDe.textContent = daXongCode ? '🦗 Phần code đã xong!' : '🦗 Bài 3 · Tiến độ của em';
        if (tutorial) tutorial.textContent = daXongCode ? 'Chú hướng dẫn nạp và thử' : 'Chú chỉ từng bước';
        if (chat) chat.textContent = daXongCode ? 'Nạp không được / còi không kêu' : 'Em đang bí chỗ lập trình';
        if (demo && daXongCode) demo.hidden = true;
        if (done) done.hidden = !daXongCode;
        const dong = (xong, dang, text) => `<div>${xong ? '✓' : (dang ? '→' : '○')} ${dang ? `<b>${text}</b>` : text}</div>`;
        status.innerHTML =
            dong(docAm, !docAm, 'Kéo khối đọc độ ẩm đất') +
            dong(dieuKien, docAm && !dieuKien, 'Đặt vào điều kiện nếu–thì') +
            dong(coi, dieuKien && !coi, 'Thêm còi bên trong nếu–thì') +
            (coi ? '<div><b>→ Tiếp theo: kết nối, nạp và thử đất khô</b></div>' : '');
    }

    /* ---------- overlay ---------- */
    function moOverlay () {
        const ov = document.getElementById('de-overlay');
        if (!ov) return;
        document.body.classList.add('de-lesson-open');
        ov.classList.add('hien');
        const td = docTienDo();
        if (!td.daDangNhap) {
            veDangNhap();
            return;
        }
        if (!td.daXemGioiThieu && td.baiHienTai) {
            moGioiThieu();
            return;
        }
        // Đang học dở một bài thì mở thẳng bài đó, khỏi bắt em bấm lại từ đầu.
        if (td.baiHienTai && LESSONS.some(b => b.so === td.baiHienTai)) {
            moBai(td.baiHienTai);
        } else {
            veHome();
        }
    }

    function dongOverlay () {
        const ov = document.getElementById('de-overlay');
        document.body.classList.remove('de-lesson-open');
        if (ov) ov.classList.remove('hien');
    }

    function capNhatHuyHieu () {
        const ov = document.getElementById('de-overlay');
        if (!ov || !ov.classList.contains('hien')) return;
        if (manHinh === 'danhSach') veDanhSach();
        else if (manHinh === 'home') veHome();
        else if (manHinh === 'dangNhap') veDangNhap();
        else if (manHinh === 'gioiThieu') moGioiThieu();
    }

    function capNhatNutNoi () {
        const nut = document.getElementById('de-nut-noi');
        if (!nut) return;
        const td = docTienDo();
        if (td.baiHienTai) nut.innerHTML = `📚 Bài ${td.baiHienTai} — xem hướng dẫn`;
        else if (td.cheDo === 'duAnRieng') nut.innerHTML = '✨ Dự án của em';
        else nut.innerHTML = '📚 Bài học';
    }

    /* ---------- khởi tạo ---------- */
    function khoiTao () {
        if (!document.body) return setTimeout(khoiTao, 300);

        themCSS();

        const ov = document.createElement('div');
        ov.id = 'de-overlay';
        ov.className = 'de-overlay';
        ov.innerHTML = '<div class="de-wrap" id="de-wrap"></div>';
        document.body.appendChild(ov);

        const nut = document.createElement('button');
        nut.id = 'de-nut-noi';
        nut.className = 'de-nut-noi';
        nut.innerHTML = '📚 Bài học';
        nut.addEventListener('click', moOverlay);
        document.body.appendChild(nut);

        window.addEventListener('de:lesson-workspace-snapshot', event => {
            luuWorkspace(event.detail);
        });
        window.addEventListener('de:lesson-workspace-state', event => {
            if (!event.detail || event.detail.lesson !== 3) return;
            trangThaiBai3 = event.detail;
            const td = docTienDo();
            if (!td[3]) td[3] = {};
            td[3].buocHienTai = trangThaiBai3.hasAlert ? 4 :
                (trangThaiBai3.hasCondition ? 3 : (trangThaiBai3.hasSensor ? 2 : 0));
            ghiTienDo(td);
            capNhatBangTienDoBai3();
        });
        taoTroGiupBai();
        capNhatBangTienDoBai3();

        capNhatNutNoi();

        const td = docTienDo();
        const baiHienTai = LESSONS.find(b => b.so === td.baiHienTai);
        if (td.cheDo === 'hocKit' && baiHienTai) apDungCheDoWorkspace('kit', baiHienTai);
        else apDungCheDoWorkspace('project');

        // Luôn mở màn hình bắt đầu khi khởi động; tiến độ học vẫn được giữ nguyên.
        if (td.uiVersion !== UI_VERSION) {
            td.uiVersion = UI_VERSION;
            ghiTienDo(td);
        }
        setTimeout(moOverlay, 900);

        window.DeLessonMode = {
            mo: moOverlay,
            dong: dongOverlay,
            moBai: moBai,
            layNguCanh: () => nguCanhWorkspace
        };
    }

    function napDuLieu () {
        try {
            LESSONS = require('./lessons-debasekit.js');
        } catch (e) {
            if (window.LESSONS_DE_BASE_KIT) {
                LESSONS = window.LESSONS_DE_BASE_KIT;
            } else {
                console.error('[Bài học] Không nạp được dữ liệu bài:', e);
                return false;
            }
        }
        return Array.isArray(LESSONS) && LESSONS.length > 0;
    }

    if (napDuLieu()) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', khoiTao);
        } else {
            khoiTao();
        }
    }
})();
