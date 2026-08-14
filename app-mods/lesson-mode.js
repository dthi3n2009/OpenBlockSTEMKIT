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
    const UI_VERSION = 8;

    let LESSONS = [];
    let baiDangMo = null;
    let manHinh = 'dangNhap'; // dangNhap | home | danhSach | chiTiet
    let nguCanhWorkspace = {mode: 'project'};
    let videoGioiThieuLoi = false;
    let trangThaiBai3 = {hasStart: false, hasSensor: false, hasCondition: false, threshold: null, hasAlert: false};
    let guiWorkspaceTimer = null;
    let dauVanTayBai3 = '';

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

    // Nhật ký chỉ ghi việc học có bằng chứng, không tự kết luận em đã hiểu bài.
    function ghiNhatKyHoc (loai, bai, noiDung, duLieuDongBo) {
        const td = docTienDo();
        const nhatKy = td.nhatKyHoc || [];
        const ganNhat = nhatKy[nhatKy.length - 1];
        if (ganNhat && ganNhat.loai === loai && ganNhat.bai === bai &&
            ganNhat.noiDung === noiDung && Date.now() - ganNhat.luc < 5 * 60 * 1000) return;
        const luc = Date.now();
        const phien = td.phienHoc || [];
        let buoi = phien[phien.length - 1];
        if (!buoi || buoi.bai !== (bai || 0) || luc - buoi.lucCuoi > 30 * 60 * 1000) {
            buoi = {id: `phien-${luc}`, bai: bai || 0, batDau: luc, lucCuoi: luc, suKien: []};
            phien.push(buoi);
        }
        const suKien = {loai: loai, noiDung: noiDung || '', luc: luc};
        nhatKy.push(Object.assign({bai: bai || 0}, suKien));
        buoi.lucCuoi = luc;
        buoi.suKien = (buoi.suKien || []).concat(suKien).slice(-50);
        td.nhatKyHoc = nhatKy.slice(-80);
        td.phienHoc = phien.slice(-25);
        ghiTienDo(td);
        // Chỉ báo loại mốc và bài cho DeSTEM; không gửi ảnh hay nội dung chat.
        window.dispatchEvent(new CustomEvent('de:learning-log', {detail: {loai: loai, bai: bai || 0, luc: luc, payload: duLieuDongBo || {}}}));
    }

    function thongKeHoSo () {
        const td = docTienDo();
        const xong = LESSONS.filter(b => baiDaXong(b.so)).length;
        const anh = [1, 2].filter(so => Object.values((td[so] || {}).bangChung || {}).some(v => typeof v === 'string' && v.indexOf('data:image/') === 0)).length;
        let cauHoiAI = 0;
        for (let i = 0; i < localStorage.length; i += 1) {
            const key = localStorage.key(i);
            if (!key || key.indexOf('te_ai_memory_v1:') !== 0) continue;
            try { cauHoiAI += JSON.parse(localStorage.getItem(key) || '[]').filter(x => x.role === 'user').length; } catch (e) { /* bỏ qua bộ nhớ lỗi */ }
        }
        return {td: td, xong: xong, anh: anh, cauHoiAI: cauHoiAI, phienGanNhat: (td.phienHoc || []).slice(-1)[0]};
    }

    function baoCaoTuDuLieu () {
        const hoSo = thongKeHoSo();
        const td = hoSo.td;
        const buoi = hoSo.phienGanNhat || {bai: td.baiHienTai || 0, batDau: 0, lucCuoi: 0, suKien: []};
        const soBai = buoi.bai || td.baiHienTai || 0;
        const bai = LESSONS.find(item => item.so === soBai);
        const dataBai = td[soBai] || {};
        const suKien = buoi.suKien || [];
        const co = text => suKien.some(item => item.noiDung.indexOf(text) !== -1);
        const daHoi = suKien.filter(item => item.loai === 'hoi-ai').length;
        const napLoi = suKien.filter(item => item.loai === 'loi-nap').length;
        const hocDuoc = [];
        const bangChung = [];
        if (soBai === 1 && dataBai.tuKiemTra) {
            if (dataBai.tuKiemTra[1]) hocDuoc.push('Phân biệt điều quan sát với điều suy đoán.');
            if (dataBai.tuKiemTra[2]) hocDuoc.push('Chọn được câu hỏi có thể tự kiểm tra.');
            if (dataBai.tuKiemTra[3]) hocDuoc.push('Chọn một vấn đề để theo dõi cho khu vườn.');
        }
        if (soBai === 2 && dataBai.tuKiemTra) {
            if (dataBai.tuKiemTra[0]) hocDuoc.push('Hiểu vì sao cần thử ý tưởng bằng mô hình.');
            if (dataBai.tuKiemTra[2]) hocDuoc.push('Biết quan sát hướng chảy của nước trong mô hình.');
        }
        if (soBai === 3) {
            if (co('độ ẩm đất') || dataBai.buocHienTai >= 2) hocDuoc.push('Dùng khối đọc cảm biến độ ẩm đất.');
            if (co('nếu–thì') || dataBai.buocHienTai >= 3) hocDuoc.push('Tạo được điều kiện nếu–thì.');
            if (co('còi') || dataBai.buocHienTai >= 4) hocDuoc.push('Dùng còi để tạo cảnh báo khi đất khô.');
        }
        // Từ Bài 4 trở đi, báo cáo chỉ khẳng định đúng những phần học sinh đã
        // tự đánh dấu hoàn thành; không suy đoán năng lực từ một lần mở bài.
        if (soBai >= 4 && dataBai.tuKiemTra && bai) {
            bai.tuKiemTra.forEach((muc, i) => {
                if (dataBai.tuKiemTra[i]) hocDuoc.push(muc.replace(/^Em /, '').replace(/ chưa\?$/, '.'));
            });
        }
        if (dataBai.bangChung && Object.values(dataBai.bangChung).some(v => typeof v === 'string' && v.indexOf('data:image/') === 0)) bangChung.push('Có ảnh sản phẩm/quan sát được lưu trong hồ sơ.');
        if (dataBai.workspaceXml || co('khối lệnh')) bangChung.push('Có chương trình block đã được lưu tự động.');
        if (dataBai.napThanhCongAt || co('nạp chương trình vào mạch thành công')) bangChung.push('Có mốc nạp chương trình vào mạch thành công.');
        if (dataBai.feedbackBai) bangChung.push(`Em tự phản hồi: “${dataBai.feedbackBai.camNhan}”.`);
        if (!hocDuoc.length) hocDuoc.push('Chưa đủ bằng chứng để kết luận em đã học được nội dung cụ thể.');
        if (!bangChung.length) bangChung.push('Hiện mới có mốc hoạt động; cần thêm ảnh, code hoặc sản phẩm để xác nhận sâu hơn.');
        const daXong = bai && baiDaXong(soBai);
        const mucDo = daXong && daHoi <= 1 && napLoi === 0 ? 'Tự làm khá trôi chảy' :
            (daXong ? 'Đã làm được khi có gợi ý' : 'Cần thêm quan sát');
        const lyDo = daHoi ? `Đã hỏi Chú Dế ${daHoi} lần${napLoi ? ` và gặp ${napLoi} lần nạp chưa thành công` : ''}.` :
            (napLoi ? `Gặp ${napLoi} lần nạp chưa thành công.` : 'Chưa thấy yêu cầu hỗ trợ trong buổi này.');
        const baiSau = LESSONS.find(item => item.so === soBai + 1);
        const buocTiep = soBai === 1 ? 'Dùng vấn đề đã chọn để làm mô hình và thí nghiệm ở Bài 2.' :
            (soBai === 2 ? 'Dùng mô hình để đo, hiệu chỉnh cảm biến đất ở Bài 3.' :
            (soBai === 3 ? 'Thử đổi ngưỡng độ ẩm rồi giải thích vì sao chọn con số đó.' :
            (baiSau ? `Chuẩn bị bằng chứng để đi tiếp Bài ${baiSau.so}: ${baiSau.ten}.` : 'Hoàn thiện bài nói dự án và lưu các bằng chứng của em.')));
        return {bai: bai, soBai: soBai, buoi: buoi, hocDuoc: hocDuoc, bangChung: bangChung, mucDo: mucDo, lyDo: lyDo, buocTiep: buocTiep};
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

    // Mỗi nhiệm vụ Bài 3 có thể dùng MP4 hoặc GIF thật. Nếu chưa có tư liệu,
    // giao diện vẫn hiện minh hoạ chuyển động để học sinh biết cần nhìn/làm gì.
    function mediaNhiemVuBai3 (step) {
        const ten = ['bai-3-01-quan-sat', 'bai-3-02-lap-cam-bien', 'bai-3-03-ghep-code', 'bai-3-04-thu-dat'][step];
        if (!ten) return null;
        try {
            const fs = require('fs');
            const fileURLToPath = require('url').fileURLToPath;
            for (const ext of ['.mp4', '.gif']) {
                const url = `media/${ten}${ext}`;
                if (fs.existsSync(fileURLToPath(new URL(url, window.location.href)))) return {url: url, video: ext === '.mp4'};
            }
        } catch (e) { /* minh hoạ tích hợp vẫn hoạt động khi không đọc được file */ }
        return null;
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

    // Gói ngữ cảnh tối giản cho Chú Dế. Chỉ gồm dữ liệu học sinh đã tự tạo
    // (không gửi ảnh), để trợ lý không đoán hộ hoặc dạy vượt bài hiện tại.
    function layNguCanhChuDe () {
        const td = docTienDo();
        const soBai = td.baiHienTai || (baiDangMo && baiDangMo.so) || 0;
        const bai = LESSONS.find(item => item.so === soBai);
        if (!bai) return {mode: 'project', lesson: 0, daHoc: [], chuaHoc: []};
        const tienDo = td[soBai] || {};
        const cacKhung = {
            1: ['quan sát', 'suy đoán', 'câu hỏi kiểm tra được'],
            2: ['mô hình', 'thí nghiệm công bằng', 'kết quả'],
            3: ['cảm biến độ ẩm đất', 'đất khô và đất ẩm', 'điều kiện nếu–thì', 'còi'],
            4: ['nhiệt độ', 'độ ẩm không khí', 'ánh sáng', 'khoảng cách', 'màn hình OLED'],
            5: ['relay', 'bơm', 'quạt', 'đèn', 'biến đếm'],
            6: ['so sánh số đo', 'quy luật', 'phép tính'],
            7: ['mức nền', 'độ lệch', 'cảnh báo không khí'],
            8: ['tích hợp cảm biến', 'đầu ra', 'chạy thử hệ thống'],
            9: ['tiêu chí thành công', 'hai lượt thử', 'bằng chứng']
        };
        const daHocTruoc = Object.keys(cacKhung).map(Number).filter(so => so < soBai)
            .reduce((all, so) => all.concat(cacKhung[so]), []);
        const khungBai = cacKhung[soBai] || [];
        let soKhungDaMo = 0;
        let phanDangLam = bai.cacBuoc && bai.cacBuoc[0] ? bai.cacBuoc[0].ten : '';
        if (soBai === 1) {
            const h = tienDo.hanhTrinhBai1 || {};
            phanDangLam = !h.quanSat ? 'Mười phút đứng yên' : (!h.tachThayDoan ? 'Quan sát hay suy đoán?' : (!h.thuHep ? 'Ba lần thu hẹp' : 'Đặt tên vấn đề'));
            soKhungDaMo = !h.quanSat ? 1 : (!h.tachThayDoan ? 2 : (!h.thuHep ? 3 : 3));
        } else if (soBai === 3) {
            const h = tienDo.hanhTrinhBai3 || {};
            phanDangLam = !h.quanSatDat ? 'Quan sát đất' : (!h.lapCamBien ? 'Cắm và đo hai đầu' : (!trangThaiBai3.hasAlert ? 'Ghép khối còi báo' : 'Nạp và thử đất'));
            soKhungDaMo = !h.lapCamBien ? 2 : (trangThaiBai3.hasAlert ? 4 : 3);
        } else {
            soKhungDaMo = Math.min(khungBai.length, Math.max(1, tienDo.buocHienTai || 0));
        }
        const dangMo = khungBai.slice(Math.max(0, soKhungDaMo - 1), soKhungDaMo);
        const chuaHoc = khungBai.slice(soKhungDaMo).concat(Object.keys(cacKhung).map(Number).filter(so => so > soBai)
            .reduce((all, so) => all.concat(cacKhung[so]), []));
        const soTay = (td[1] || {}).soTay || {};
        const suKien = (td.nhatKyHoc || []).filter(item => item.bai === soBai).slice(-6).map(item => item.noiDung);
        const loiDaGap = suKien.filter(item => /lỗi|không|chưa/.test(item.toLowerCase()));
        return {
            mode: td.cheDo === 'hocKit' || bai.coLapTrinh ? 'kit' : 'lesson',
            lesson: soBai, lessonName: bai.ten, phanDangLam: phanDangLam,
            daHoc: daHocTruoc.concat(khungBai.slice(0, Math.max(0, soKhungDaMo - 1))), dangMo: dangMo, chuaHoc: chuaHoc,
            hoSo: {
                vanDeBai1: soTay.vanDe ? `${soTay.vanDe.chuyenGi} · ${soTay.vanDe.oDau} · ${soTay.vanDe.khiNao}` : '',
                cauHoiKiemTra: soTay.cauHoiKiemTra || '',
                ghiChep: soTay.thay || '',
                soDaDo: tienDo.soDo || soTay.soDo || [],
                duDoan: soTay.doan || '',
                loiDaGap: loiDaGap,
                suKienGanDay: suKien
            }
        };
    }

    function danhDauMuc (soBai, chiSo, xong) {
        const td = docTienDo();
        if (!td[soBai]) td[soBai] = {};
        if (!td[soBai].tuKiemTra) td[soBai].tuKiemTra = {};
        td[soBai].tuKiemTra[chiSo] = xong;
        const bai = LESSONS.find(item => item.so === soBai);
        const vuaXong = xong && bai && bai.tuKiemTra.every((_, i) => td[soBai].tuKiemTra[i]) && !td[soBai].daChucMung;
        if (vuaXong) td[soBai].daChucMung = true;
        ghiTienDo(td);
        capNhatHuyHieu();
        if (vuaXong) hienChucMung(soBai);
    }

    function baiDaXong (soBai) {
        const bai = LESSONS.find(b => b.so === soBai);
        if (!bai) return false;
        const td = docTienDo()[soBai];
        if (!td || !td.tuKiemTra) return false;
        return bai.tuKiemTra.every((_, i) => td.tuKiemTra[i]);
    }

    function baiDaMo (soBai) {
        const td = docTienDo();
        if (!td.daXemGioiThieu) return false;
        if (soBai === 1) return true;
        // Khi giáo viên/học sinh luyện lại để test, các bài đã từng mở vẫn
        // giữ cửa mở để việc reset một bài không khóa ngược các bài phía sau.
        if ((td.baiDaTungMo || []).indexOf(soBai) !== -1) return true;
        return baiDaXong(soBai - 1);
    }

    function hocLaiBai (soBai) {
        const bai = LESSONS.find(item => item.so === soBai);
        if (!bai || !window.confirm(`Học lại Bài ${soBai}? Phần làm bài sẽ được làm mới để em test lại. Feedback, ghi chép và lịch sử cũ vẫn được giữ.`)) return;
        const td = docTienDo();
        const cu = td[soBai] || {};
        const baiDaXongTruoc = LESSONS.filter(item => baiDaXong(item.so)).map(item => item.so);
        td.baiDaTungMo = Array.from(new Set((td.baiDaTungMo || []).concat(baiDaXongTruoc, [soBai])));
        // Chỉ làm mới trạng thái thực hành. Bằng chứng và phản hồi là lịch sử
        // học thật nên không tự xóa khi người dùng muốn luyện/test lại.
        td[soBai] = {
            workspaceKey: (cu.workspaceKey || 0) + 1,
            feedbackBai: cu.feedbackBai,
            soTay: cu.soTay,
            bangChung: cu.bangChung
        };
        td.baiHienTai = soBai;
        ghiTienDo(td);
        ghiNhatKyHoc('hoc-lai', soBai, `Bắt đầu làm lại Bài ${soBai} để luyện tập/test`);
        moBai(soBai);
    }

    function moFeedbackSauBai (soBai, xong) {
        const cu = document.getElementById('de-feedback-bai');
        if (cu) cu.remove();
        const modal = document.createElement('div');
        modal.id = 'de-feedback-bai';
        modal.innerHTML = `<div class="de-feedback-card"><div style="font-size:42px">🦗</div><h2>Góp ý cho bài học</h2><p>Bài này với em thế nào?</p><div class="de-feedback-chon"><button type="button" data-cam-nhan="Em thấy dễ hiểu"><b>😊</b>Dễ hiểu</button><button type="button" data-cam-nhan="Em có chỗ đang bí"><b>😵</b>Có chỗ bí</button><button type="button" data-cam-nhan="Em muốn làm thêm"><b>🔥</b>Muốn làm thêm</button></div><textarea id="de-feedback-noi-dung" maxlength="500" placeholder="Em muốn góp ý gì cho bài này? (không bắt buộc)"></textarea><small class="de-feedback-share">Góp ý giúp thầy cô và đội làm bài học tốt hơn.</small><div class="de-feedback-note" id="de-feedback-note"></div><button id="de-feedback-gui">Gửi góp ý & xem thành tích →</button></div>`;
        document.body.appendChild(modal);
        let camNhan = '';
        modal.querySelectorAll('[data-cam-nhan]').forEach(button => button.addEventListener('click', () => {
            camNhan = button.dataset.camNhan;
            modal.querySelectorAll('[data-cam-nhan]').forEach(x => x.classList.remove('chon'));
            button.classList.add('chon');
        }));
        document.getElementById('de-feedback-gui').addEventListener('click', () => {
            if (!camNhan) return document.getElementById('de-feedback-note').textContent = 'Em chọn một cảm nhận trước nhé.';
            const noiDung = document.getElementById('de-feedback-noi-dung').value.trim().slice(0, 500);
            const td = docTienDo(); if (!td[soBai]) td[soBai] = {};
            td[soBai].feedbackBai = {camNhan: camNhan, noiDung: noiDung, luc: Date.now()};
            td.feedback = (td.feedback || []).concat({loai: 'sau-bai', bai: soBai, camNhan: camNhan, noiDung: noiDung, luc: Date.now()}).slice(-30);
            ghiTienDo(td);
            ghiNhatKyHoc('feedback-bai', soBai, `Feedback sau Bài ${soBai}: ${camNhan}`, {feedbackFeeling: camNhan, feedbackNote: noiDung});
            // Feedback này chỉ xuất hiện sau khi hoàn thành bài, nên nó xác nhận mốc pass bài.
            window.dispatchEvent(new CustomEvent('de:learning-log', {detail: {loai: 'hoan-thanh-bai', bai: soBai, luc: Date.now()}}));
            modal.remove();
            xong();
        });
    }

    function hienChucMung (soBai) {
        const td = docTienDo();
        if (!(td[soBai] || {}).feedbackBai) return moFeedbackSauBai(soBai, () => hienChucMung(soBai));
        const cu = document.getElementById('de-chuc-mung');
        if (cu) cu.remove();
        const baiSau = LESSONS.some(item => item.so === soBai + 1) ? soBai + 1 : null;
        const modal = document.createElement('div');
        modal.id = 'de-chuc-mung';
        modal.innerHTML = `<div class="de-chuc-mung-card"><div class="de-chuc-mung-icon">🎉</div><h2>Giỏi lắm, em xong Bài ${soBai}!</h2><p>${baiSau ? `Bài ${baiSau} đã mở. Mình đi tiếp nhé!` : 'Em đã hoàn thành chặng 1!'}</p><button id="de-chuc-next">${baiSau ? `Sang Bài ${baiSau} →` : 'Về hành trình học'}</button><button id="de-chuc-review">Xem lại bài này</button></div>`;
        document.body.appendChild(modal);
        document.getElementById('de-chuc-next').addEventListener('click', () => { modal.remove(); baiSau ? moBai(baiSau) : veDanhSach(); });
        document.getElementById('de-chuc-review').addEventListener('click', () => { modal.remove(); moBai(soBai); });
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

    function hoanThanhNhiemVu (bai) {
        const td = docTienDo();
        if (!td[bai.so]) td[bai.so] = {};
        td[bai.so].buocHienTai = Math.min((td[bai.so].buocHienTai || 0) + 1, bai.cacBuoc.length);
        if (!td[bai.so].tuKiemTra) td[bai.so].tuKiemTra = {};
        const check = Math.min(td[bai.so].buocHienTai - 1, bai.tuKiemTra.length - 1);
        if (check >= 0 && bai.so !== 3) td[bai.so].tuKiemTra[check] = true;
        ghiTienDo(td);
        moBai(bai.so);
    }

    function luuWorkspace (chiTiet) {
        if (!chiTiet || !chiTiet.lesson) return;
        const td = docTienDo();
        const bai = LESSONS.find(item => item.so === chiTiet.lesson);
        if (!bai) return;
        if (!td[chiTiet.lesson]) td[chiTiet.lesson] = {};
        if (!chiTiet.blockCount && td[chiTiet.lesson].workspaceXml) return;
        const codeDaDoi = chiTiet.lesson === 3 && td[3].workspaceXml && td[3].workspaceXml !== (chiTiet.xml || '');
        td[chiTiet.lesson].workspaceXml = chiTiet.xml || '';
        td[chiTiet.lesson].blockCount = chiTiet.blockCount || 0;
        td[chiTiet.lesson].savedAt = Date.now();
        // Một lần nạp chỉ chứng minh đúng phiên bản code lúc đó. Sửa code xong phải nạp lại.
        if (codeDaDoi && td[3].napThanhCongAt) {
            delete td[3].napThanhCongAt;
            delete td[3].napWorkspaceXml;
            if (td[3].hanhTrinhBai3) delete td[3].hanhTrinhBai3.daThuDat;
            ghiNhatKyHoc('doi-code', 3, 'Đã sửa chương trình — cần nạp lại mạch');
        }
        ghiTienDo(td);
        if (chiTiet.blockCount) ghiNhatKyHoc('code', chiTiet.lesson, `Đã lưu ${chiTiet.blockCount} khối lệnh`);
    }

    function daNapBai3 () {
        const bai3 = docTienDo()[3] || {};
        return Boolean(bai3.napThanhCongAt && bai3.workspaceXml && bai3.napWorkspaceXml === bai3.workspaceXml);
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
        .de-chuc-mung-icon { animation:de-nhay .7s ease-out both; }
        @keyframes de-nhay { 0% { transform:scale(.35) rotate(-12deg); } 65% { transform:scale(1.18) rotate(7deg); } 100% { transform:scale(1) rotate(0); } }
        .de-chuc-mung-card h2 { margin:12px 0 8px; color:${MAU.xanhDam}; font-size:27px; }
        .de-chuc-mung-card p { margin:0 0 20px; color:${MAU.chuNhat}; line-height:1.55; }
        .de-chuc-mung-card button { width:100%; border:0; border-radius:12px; padding:12px; margin-top:8px; font:700 15px inherit; cursor:pointer; }
        #de-thu-mach { position:fixed; inset:0; z-index:100001; display:grid; place-items:center; padding:20px; background:rgba(18,60,57,.46); font-family:"Segoe UI",system-ui,sans-serif; }
        .de-thu-mach-card { width:min(455px,100%); padding:28px; border-radius:26px; text-align:center; background:linear-gradient(145deg,#F4FFFB,#F3F8FF); box-shadow:0 28px 75px rgba(12,58,52,.30); color:${MAU.chu}; }
        .de-thu-mach-icon { width:86px; height:86px; display:grid; place-items:center; margin:0 auto 12px; border-radius:50%; font-size:45px; background:linear-gradient(135deg,#C9FFF0,#DCEAFF); animation:de-nhay .7s ease-out both; }
        .de-thu-mach-card h2 { margin:0 0 8px; color:${MAU.xanhDam}; font-size:26px; }.de-thu-mach-card p { margin:0 0 17px; color:${MAU.chuNhat}; line-height:1.55; }
        .de-thu-mach-steps { display:grid; gap:8px; margin:16px 0; text-align:left; }.de-thu-mach-steps span { padding:10px 12px; border-radius:12px; background:#fff; border:1px solid #D6ECE5; font-size:14px; font-weight:700; }
        .de-thu-mach-actions { display:grid; gap:9px; }.de-thu-mach-actions button { border:0; border-radius:13px; padding:13px; font:800 15px inherit; cursor:pointer; }.de-thu-mach-ok { color:#fff; background:linear-gradient(135deg,#00B982,#4D97FF); }.de-thu-mach-help { color:#9A5417; background:#FFF1D7; }.de-thu-mach-later { color:${MAU.chuNhat}; background:transparent; }
        #de-feedback-bai { position:fixed; inset:0; z-index:99999; display:grid; place-items:center; padding:20px; background:rgba(18,60,57,.42); font-family:"Segoe UI",system-ui,sans-serif; }
        .de-feedback-card { width:min(430px,100%); padding:28px; border-radius:24px; background:#fff; box-shadow:0 28px 75px rgba(12,58,52,.28); text-align:center; }.de-feedback-card h2 { margin:5px 0 7px; color:${MAU.xanhDam}; }.de-feedback-card p { margin:0 0 16px; color:${MAU.chuNhat}; line-height:1.5; }
        .de-feedback-chon { display:grid; grid-template-columns:repeat(3,1fr); gap:9px; }.de-feedback-chon button { min-height:92px; padding:9px 5px; border:2px solid ${MAU.vien}; border-radius:15px; background:#fff; color:${MAU.chu}; font:700 13px inherit; cursor:pointer; }.de-feedback-chon button b { display:block; margin-bottom:5px; font-size:27px; }.de-feedback-chon button.chon { border-color:${MAU.xanh}; background:${MAU.xanhNhat}; }
        .de-feedback-card textarea { width:100%; min-height:70px; box-sizing:border-box; margin-top:13px; padding:10px; border:1px solid ${MAU.vien}; border-radius:11px; resize:vertical; font:14px inherit; }.de-feedback-share { display:block; margin-top:7px; color:${MAU.chuNhat}; line-height:1.35; text-align:left; }.de-feedback-card #de-feedback-gui { width:100%; margin-top:10px; padding:13px; border:0; border-radius:12px; background:linear-gradient(135deg,#00A876,#4D97FF); color:#fff; font:800 15px inherit; cursor:pointer; }.de-feedback-note { min-height:18px; margin-top:7px; color:#B65341; font-size:13px; }
        .de-hoc-lai-list { display:flex; align-items:center; justify-content:center; flex-wrap:wrap; gap:9px; margin:0 auto 22px; padding:11px; border:1px solid #CDE6DF; border-radius:16px; background:#F4FFFB; color:${MAU.chuNhat}; font-size:13px; }.de-hoc-lai-list button { border:0; border-radius:10px; padding:8px 11px; background:#fff; color:${MAU.xanhDam}; box-shadow:0 2px 7px rgba(12,85,71,.10); font:800 13px inherit; cursor:pointer; }
        .de-mission-photo-preview { display:block; width:min(100%,310px); max-height:210px; margin:0 auto 11px; object-fit:cover; border-radius:16px; border:2px solid #CBE9E0; }
        .de-mission-ai-button { display:block; width:100%; margin-top:10px; padding:11px; border:0; border-radius:12px; color:#075A49; background:#DFF8EF; font:800 14px inherit; cursor:pointer; }.de-mission-ai-button:disabled { opacity:.65; cursor:wait; }.de-mission-ai-note { display:block; margin-top:6px; color:${MAU.chuNhat}; font-size:11px; line-height:1.35; }.de-ai-xem-anh { margin-top:10px; padding:12px; border-radius:12px; background:#F1F7FF; color:#31587D; text-align:left; white-space:pre-wrap; font-size:14px; line-height:1.5; }
        .de-ai-anh-form { display:grid; gap:8px; margin-top:11px; padding:12px; border:1px solid #CFE5FF; border-radius:13px; background:#FAFCFF; text-align:left; }.de-ai-anh-form label { color:#31587D; font-weight:800; font-size:14px; }.de-ai-anh-form textarea { min-height:62px; padding:9px; border:1px solid #CFE0F5; border-radius:9px; resize:vertical; font:14px inherit; }.de-ai-anh-form button { justify-self:end; border:0; border-radius:9px; padding:9px 12px; color:#fff; background:#4D97FF; font:800 13px inherit; cursor:pointer; }.de-ai-anh-form button:disabled { opacity:.65; cursor:wait; }.de-ai-anh-form small { color:${MAU.chuNhat}; line-height:1.35; }.de-ai-anh-form.de-ai-anh-pass { border-color:#A7E6CF; background:#F0FFF8; }.de-ai-anh-form.de-ai-anh-pass label { color:#08765A; }.de-ai-anh-reply { margin-top:9px; padding:12px; border-radius:12px; background:#E9FFF6; color:#14634F; text-align:left; white-space:pre-wrap; font-size:14px; line-height:1.5; }
        .de-nhiem-vu { margin:18px 0; padding:20px; border-radius:20px; background:linear-gradient(135deg,#E8FFF5,#EAF3FF); border:1px solid ${MAU.vien}; }
        .de-nhiem-vu-top { display:flex; justify-content:space-between; gap:12px; font-size:13px; font-weight:800; color:${MAU.xanhDam}; }
        .de-nhiem-vu-track { height:9px; margin:10px 0 16px; border-radius:99px; background:#DCEDE8; overflow:hidden; }
        .de-nhiem-vu-track i { display:block; height:100%; border-radius:inherit; background:linear-gradient(90deg,${MAU.xanh},#4D97FF); transition:width .35s ease; }
        .de-nhiem-vu h3 { margin:0 0 7px; font-size:22px; }
        .de-nhiem-vu p { margin:0 0 14px; line-height:1.55; }
        .de-goi-chu-de { position:fixed; right:22px; bottom:22px; z-index:99991; border:0; border-radius:999px; padding:13px 17px; background:${MAU.xanh}; color:#fff; font:800 14px inherit; box-shadow:0 8px 24px rgba(0,168,118,.28); cursor:pointer; }
        .de-chat-bai.de-chat-an { display:none !important; }
        .de-mission { margin:10px 0; padding:14px 16px; border:1px solid ${MAU.vien}; border-radius:16px; background:#fff; transition:transform .22s ease, background .22s ease; }
        .de-mission.done { color:${MAU.xanhDam}; background:${MAU.xanhNhat}; }.de-mission.locked { opacity:.48; }.de-mission-main { margin-top:13px; color:${MAU.chu}; }.de-mission-main h3 { margin:0 0 5px; font-size:23px; }.de-mission-main p { margin:0 0 14px; line-height:1.5; }.de-mission-icon { float:right; font-size:40px; }
        /* Form Bài 1 nằm trong overlay của OpenBlock: phải khóa lại style để
           CSS toàn cục của app không làm ô nhập và ảnh preview bị co/lệch. */
        #de-wrap .de-mission-main > label { display:block; margin:14px 0; color:${MAU.chu}; font-weight:800; font-size:15px; }
        #de-wrap .de-mission-main > label > textarea, #de-wrap .de-mission-main > label > input { display:block; box-sizing:border-box; width:100%; min-height:88px; margin-top:7px; padding:12px; border:1px solid #B9DDD3; border-radius:12px; background:#fff; color:${MAU.chu}; font:15px/1.45 inherit; font-weight:400; resize:vertical; outline:none; }
        #de-wrap .de-mission-main > label > input { min-height:0; resize:none; }
        #de-wrap .de-mission-main > label > textarea:focus, #de-wrap .de-mission-main > label > input:focus { border-color:${MAU.xanh}; box-shadow:0 0 0 3px rgba(0,168,118,.12); }
        #de-wrap #de-b1-photo-area { display:flex; flex-direction:column; align-items:stretch; gap:10px; margin:14px 0; clear:both; }
        #de-wrap #de-b2-photo-area { display:flex; flex-direction:column; align-items:flex-start; gap:10px; margin:14px 0; clear:both; }
        #de-wrap #de-b1-photo-area .de-mission-photo-preview { display:block; width:min(100%,420px) !important; height:auto; max-height:260px; margin:0 auto; object-fit:cover; border-radius:16px; border:2px solid #CBE9E0; float:none !important; }
        #de-wrap #de-b2-photo-area .de-mission-photo-preview { display:block; width:min(100%,420px) !important; height:auto; max-height:260px; margin:0; object-fit:cover; border-radius:16px; border:2px solid #CBE9E0; float:none !important; }
        #de-wrap #de-b1-photo-area .de-play-card { display:flex; flex-direction:column; align-items:center; justify-content:center; box-sizing:border-box; width:100%; min-height:112px; margin:0; }
        #de-wrap #de-b1-photo-area .de-mission-ai-button { margin-top:0; }
        #de-wrap .de-b1-task-shell { width:min(660px,100%); margin:18px auto 0; }
        #de-wrap .de-b1-task-shell .de-mission { padding:20px; border-radius:20px; box-shadow:0 8px 24px rgba(24,81,68,.06); }
        #de-wrap .de-b1-task-shell .de-mission:not(.active) { padding:12px 16px; box-shadow:none; }
        #de-wrap .de-b1-task-shell .de-mission-main { margin-top:18px; }
        #de-wrap .de-b1-task-shell .de-mission-main h3 { font-size:26px; letter-spacing:-.3px; }
        #de-wrap .de-b1-task-shell .de-mission-main > p { font-size:16px; color:#4B6871; }
        #de-wrap .de-b1-task-shell #de-b1-photo-area { align-items:flex-start; margin:12px 0 4px; }
        #de-wrap .de-b1-task-shell #de-b1-photo-area .de-mission-photo-preview { width:160px !important; max-height:120px; margin:0; border-radius:12px; }
        #de-wrap .de-b1-task-shell #de-b1-photo-area .de-play-card { width:auto; min-height:0; padding:9px 13px; border:1px dashed #8BCFBD; border-radius:12px; background:#F4FFFA; color:${MAU.xanhDam}; font-weight:700; cursor:pointer; }
        #de-wrap .de-b1-task-shell #de-b1-photo-area .de-play-emoji { display:none; }
        #de-wrap .de-b1-task-shell #de-b1-photo-area .de-play-hint { margin:0; font-size:13px; }
        #de-wrap .de-b1-task-shell .de-b1-help { margin-top:14px; border:1px solid #D6EAE5; border-radius:13px; background:#FAFDFC; overflow:hidden; }
        #de-wrap .de-b1-task-shell .de-b1-help summary { padding:12px 14px; color:#24685B; font-weight:800; cursor:pointer; list-style:none; }
        #de-wrap .de-b1-task-shell .de-b1-help summary::-webkit-details-marker { display:none; }
        #de-wrap .de-b1-task-shell .de-b1-help summary:before { content:'?'; display:inline-grid; place-items:center; width:20px; height:20px; margin-right:8px; border-radius:50%; background:#DFF7EE; color:${MAU.xanhDam}; }
        #de-wrap .de-b1-task-shell .de-b1-help-body { padding:0 14px 14px; color:#527078; font-size:14px; line-height:1.45; }
        #de-wrap .de-b1-task-shell .de-b1-help-body p { margin:0 0 10px; }
        #de-wrap .de-b1-task-shell .de-b1-help-body button { border:0; border-radius:10px; padding:9px 12px; background:#E8F3FF; color:#236CC1; font:800 14px inherit; cursor:pointer; }
        #de-wrap .de-b1-task-shell .de-b1-help-body .de-mission-ai-button { margin-left:8px; background:#E8FFF5; color:${MAU.xanhDam}; }
        #de-wrap .de-b1-task-shell .de-b1-help-body .de-ai-xem-anh { margin-top:12px; }
        #de-wrap .de-b2-tutorial { margin:14px 0 18px; padding:12px; border:1px solid #C9E7E0; border-radius:18px; background:#F5FFFB; }
        #de-wrap .de-b2-tutorial-top { display:flex; align-items:center; justify-content:space-between; gap:12px; margin:0 2px 10px; color:${MAU.xanhDam}; font-weight:800; }
        #de-wrap .de-b2-tutorial-top button { border:0; border-radius:10px; padding:8px 11px; background:#E4F3FF; color:#236CC1; font:800 13px inherit; cursor:pointer; }
        #de-wrap .de-b2-material-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; margin:0 0 10px; }
        #de-wrap .de-b2-material-grid span { padding:9px 10px; border-radius:11px; background:#fff; color:#41626A; font-size:13px; line-height:1.35; }
        #de-wrap .de-b2-material-grid b { color:${MAU.xanhDam}; }
        #de-wrap .de-b2-material-grid span.de-b2-focus { background:#DFF8EE; outline:2px solid #38B98B; box-shadow:0 4px 14px rgba(0,168,118,.16); transform:translateY(-1px); }
        #de-wrap .de-b2-tutorial img { display:block; width:100%; aspect-ratio:16/9; object-fit:cover; border-radius:12px; background:#DDF3EB; }
        #de-wrap .de-b2-tutorial-caption { min-height:24px; margin:10px 4px 0; color:${MAU.chu}; font-weight:700; }
        #de-wrap .de-b2-search { margin:8px 0 14px; padding:13px 15px; border-radius:14px; background:#F2F8FF; color:#42616B; line-height:1.45; }
        #de-wrap .de-b2-search b { color:#156B59; }
        #de-wrap .de-b2-search p { margin:5px 0 0; }
        #de-wrap .de-mini-note { margin:7px 2px 12px; color:#667F83; font-size:13px; }
        #de-wrap .de-chat-noi-bai { position:static; display:flex; width:auto; max-height:none; min-height:0; margin:10px 0 0; padding:12px; border:1px solid #C9EAE0; border-radius:14px; box-shadow:none; background:linear-gradient(135deg,#F0FBF7,#EEF5FF); }
        #de-wrap .de-chat-noi-bai > p { margin:0 0 9px; font-size:13px; }
        #de-wrap .de-chat-noi-bai .de-chat-bai-msgs { max-height:340px; min-height:92px; overflow-y:auto; overscroll-behavior:contain; }
        #de-wrap .de-chat-noi-bai .de-chat-bai-form { margin-top:8px; }
        #de-wrap .de-chat-noi-bai .de-chat-bai-form input, #de-wrap .de-chat-noi-bai .de-chat-bai-form textarea { background:#fff; }
        #de-wrap .de-chat-noi-bai .de-chat-bai-form textarea { flex:1; min-width:0; min-height:46px; max-height:110px; padding:10px 12px; border:1px solid #B9DDD3; border-radius:11px; color:${MAU.chu}; font:14px/1.4 inherit; resize:vertical; outline:none; }
        #de-wrap .de-chat-noi-bai .de-chat-bai-form textarea:focus { border-color:${MAU.xanh}; box-shadow:0 0 0 3px rgba(0,168,118,.12); }
        @media (max-width:640px) { #de-wrap .de-b1-task-shell { margin-top:12px; } #de-wrap .de-b1-task-shell .de-mission { padding:16px; } #de-wrap .de-b1-task-shell .de-mission-main h3 { font-size:23px; } #de-wrap .de-chat-noi-bai .de-chat-bai-msgs { max-height:260px; } }
        #de-wrap .de-ho-so-vu-viec { margin-top:14px; background:linear-gradient(135deg,#F0FFF8,#F1F7FF); border-color:#BFE7DA; }
        #de-wrap .de-ho-so-vu-viec h3 { margin:0 0 12px; color:${MAU.xanhDam}; font-size:21px; }
        #de-wrap .de-ho-so-vu-viec p { margin:8px 0; line-height:1.5; }
        .de-play-card { min-height:112px; padding:15px 12px; border:2px solid #D9EAE5; border-radius:17px; background:#fff; color:${MAU.chu}; font:700 15px inherit; text-align:center; cursor:pointer; transition:transform .15s, border-color .15s, background .15s; }
        .de-play-card:hover { transform:translateY(-2px); border-color:${MAU.xanh}; }.de-play-card.chon { border-color:${MAU.xanh}; background:${MAU.xanhNhat}; box-shadow:0 6px 16px rgba(0,168,118,.13); }.de-play-card .de-play-emoji { display:block; margin-bottom:7px; font-size:34px; }
        .de-play-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; margin:14px 0; }.de-play-grid.hai { grid-template-columns:repeat(2,minmax(0,1fr)); }.de-play-card.dung { border-color:#00A876; background:#E8FFF5; }.de-play-card.sai { border-color:#F36B5B; background:#FFF0ED; }
        .de-play-hint { min-height:20px; margin:4px 0 10px; color:${MAU.chuNhat}; font-size:14px; font-weight:600; }.de-mission.active { border-color:#74CDB6; box-shadow:0 10px 28px rgba(0,168,118,.12); }.de-mission.active.de-mo-tiep { animation:de-mo-tiep .42s ease-out; } @keyframes de-mo-tiep { from { transform:translateY(15px); opacity:.3; } to { transform:translateY(0); opacity:1; } }
        .de-course-path { display:flex; align-items:center; justify-content:center; gap:0; margin:4px auto 26px; overflow-x:auto; padding:12px 4px 16px; }
        .de-path-stop { position:relative; flex:0 0 76px; border:0; background:transparent; color:${MAU.chuNhat}; font:800 12px inherit; cursor:pointer; }
        .de-path-stop::after { content:''; position:absolute; top:25px; left:57px; width:38px; height:5px; border-radius:9px; background:#DCEDE8; }
        .de-path-stop:last-child::after { display:none; }
        .de-path-stop i { display:grid; place-items:center; width:50px; height:50px; margin:0 auto 7px; border-radius:50%; background:#E7EFED; color:#8CA39D; font-style:normal; font-size:21px; box-shadow:0 4px 0 #C9D6D2; }
        .de-path-stop.done { color:${MAU.xanhDam}; }.de-path-stop.done i { background:${MAU.xanh}; color:#fff; box-shadow:0 4px 0 #08765A; }.de-path-stop.done::after { background:${MAU.xanh}; }
        .de-path-stop.current { color:${MAU.xanhDam}; }.de-path-stop.current i { color:#fff; background:linear-gradient(135deg,#00B982,#4D97FF); box-shadow:0 5px 0 #2877C9,0 10px 22px rgba(77,151,255,.25); transform:translateY(-4px); }
        .de-path-stop:disabled { cursor:not-allowed; }.de-path-stop:disabled i { filter:grayscale(.3); }
        .de-bai3-hero { position:relative; overflow:hidden; padding:24px; border-radius:24px; background:linear-gradient(135deg,#E1FFF2,#E8F2FF); border:1px solid #C6EBDE; }
        .de-bai3-hero::after { content:'💧'; position:absolute; right:24px; top:18px; font-size:62px; opacity:.2; transform:rotate(12deg); }
        .de-bai3-hero h2 { max-width:75%; margin:0 0 7px; color:${MAU.xanhDam}; font-size:27px; }.de-bai3-hero p { max-width:620px; margin:0; color:${MAU.chuNhat}; line-height:1.5; }
        .de-bai3-quest { margin-top:17px; padding:20px; border:2px solid ${MAU.vien}; border-radius:21px; background:#fff; }.de-bai3-quest.done { background:#F0FFF8; border-color:#B5E6D6; }.de-bai3-quest.locked { opacity:.48; }
        .de-bai3-quest-head { display:flex; gap:12px; align-items:center; }.de-bai3-quest-num { display:grid; place-items:center; flex:0 0 38px; height:38px; border-radius:13px; color:#fff; background:linear-gradient(135deg,#00B982,#4D97FF); font-weight:900; }.de-bai3-quest.done .de-bai3-quest-num { background:${MAU.xanh}; }
        .de-bai3-quest h3 { margin:0; font-size:18px; }.de-bai3-quest-head small { color:${MAU.chuNhat}; }.de-bai3-quest-main { padding:15px 0 0 50px; }.de-bai3-quest-main p { margin:0 0 13px; line-height:1.55; }
        .de-bai3-observe { display:flex; gap:10px; flex-wrap:wrap; margin:10px 0; }.de-bai3-observe button { min-width:135px; padding:12px; border:2px solid #D9EAE5; border-radius:14px; background:#fff; color:${MAU.chu}; font:800 14px inherit; cursor:pointer; }.de-bai3-observe button.chon { border-color:${MAU.xanh}; background:${MAU.xanhNhat}; }
        .de-bai3-checklist { display:grid; gap:8px; margin:12px 0 15px; color:${MAU.chu}; }.de-bai3-checklist span { padding:9px 11px; border-radius:10px; background:#F4FAF8; }
        .de-micro-tutorial { margin:0 0 15px; overflow:hidden; border:1px solid #C9E8DF; border-radius:16px; background:#F5FFFB; }.de-micro-tutorial-head { display:flex; justify-content:space-between; padding:9px 12px; color:${MAU.xanhDam}; font-size:12px; font-weight:800; }.de-micro-tutorial-head small { color:${MAU.chuNhat}; font-weight:600; }.de-micro-tutorial video, .de-micro-tutorial img { display:block; width:100%; max-height:190px; object-fit:cover; background:#DDF7EF; }
        .de-micro-scene { position:relative; height:145px; overflow:hidden; background:linear-gradient(#DFF5FF 0 55%,#B97C4C 55%); }.de-micro-scene::after { content:'Minh hoạ thao tác'; position:absolute; right:10px; bottom:8px; padding:4px 8px; border-radius:99px; color:#50736B; background:rgba(255,255,255,.7); font-size:11px; font-weight:700; }.de-mini-pot { position:absolute; left:22%; bottom:13px; width:78px; height:58px; border-radius:11px 11px 24px 24px; background:#F49D53; box-shadow:inset 0 7px 0 #74482B; }.de-mini-plant { position:absolute; left:calc(22% + 31px); bottom:67px; width:16px; height:46px; border-radius:10px; background:#36A96D; }.de-mini-plant::before,.de-mini-plant::after { content:''; position:absolute; width:28px; height:14px; border-radius:100% 0 100% 0; background:#63D98B; }.de-mini-plant::before { left:-23px; top:7px; transform:rotate(-25deg); }.de-mini-plant::after { left:10px; top:17px; transform:rotate(25deg); }.de-mini-probe { position:absolute; left:66%; top:12px; width:9px; height:96px; border-radius:9px; background:#566F74; transform-origin:bottom; animation:de-probe 2.5s ease-in-out infinite; }.de-mini-probe::after { content:'●'; position:absolute; top:-9px; left:-5px; color:#1D2B32; font-size:18px; }.de-mini-wire { position:absolute; left:49%; top:24px; width:132px; height:63px; border:4px solid #4D97FF; border-left:0; border-bottom:0; border-radius:0 45px 0 0; transform:rotate(-13deg); }.de-mini-board { position:absolute; right:16%; bottom:27px; width:78px; height:53px; border-radius:11px; background:#277C87; box-shadow:inset 0 0 0 6px #52B5AF; }.de-mini-board::after { content:'ThingBot'; position:absolute; inset:17px 0 auto; color:#E8FFFB; text-align:center; font-size:10px; font-weight:800; }.de-mini-block { position:absolute; left:17%; width:112px; height:30px; border-radius:8px; color:#fff; font-size:12px; font-weight:800; text-align:center; line-height:30px; animation:de-blocks 3s ease-in-out infinite; }.de-mini-block.one { top:25px; background:#00A876; }.de-mini-block.two { top:61px; background:#F29B35; animation-delay:.3s; }.de-mini-block.three { top:97px; background:#7B61FF; animation-delay:.6s; }.de-mini-buzzer { position:absolute; left:42%; top:39px; width:58px; height:58px; border-radius:50%; background:#7B61FF; box-shadow:0 0 0 8px rgba(123,97,255,.18); animation:de-buzz 1.2s ease-in-out infinite; }.de-mini-buzzer::after { content:'🔔'; position:absolute; inset:13px; font-size:27px; }.de-mini-droplet { position:absolute; left:25%; top:18px; color:#4D97FF; font-size:38px; animation:de-drop 2.5s ease-in infinite; } @keyframes de-probe { 0%,35% { transform:rotate(16deg) translateY(-17px); } 62%,100% { transform:rotate(16deg) translateY(15px); } } @keyframes de-blocks { 0%,30% { transform:translateX(100px); opacity:0; } 48%,80% { transform:translateX(0); opacity:1; } 100% { transform:translateX(0); opacity:.55; } } @keyframes de-buzz { 50% { transform:scale(1.1); box-shadow:0 0 0 17px rgba(123,97,255,.06); } } @keyframes de-drop { 0% { transform:translateY(-8px); opacity:0; } 20%,65% { opacity:1; } 100% { transform:translateY(85px); opacity:0; } }
        .de-mini-block { left:13%; width:166px; height:24px; font-size:11px; line-height:24px; }.de-mini-block.zero { top:7px; background:#FFBF00; color:#5F4600; }.de-mini-block.one { top:34px; background:#F29B35; animation-delay:.15s; }.de-mini-block.two { top:61px; background:#00A876; animation-delay:.3s; }.de-mini-block.three { top:88px; background:#7B61FF; animation-delay:.45s; }.de-mini-block.four { top:115px; background:#6445D8; animation-delay:.6s; }
        @media (max-width:620px) { .de-course-path { justify-content:flex-start; }.de-path-stop { flex-basis:65px; font-size:10px; }.de-path-stop::after { left:52px; width:25px; }.de-bai3-hero h2 { max-width:100%; font-size:24px; }.de-bai3-quest-main { padding-left:0; } }
        @media (max-width:620px) { .de-play-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
        #de-chuc-next { color:#fff; background:linear-gradient(135deg,#00A876,#4D97FF); }
        #de-chuc-more { color:${MAU.xanhDam}; background:${MAU.xanhNhat}; }
        #de-chuc-review { color:${MAU.chuNhat}; background:transparent; }

        .de-mach {
            background: ${MAU.camNhat}; border: 1px solid #FFD9A8;
            border-radius: 10px; padding: 12px 16px; margin-bottom: 14px;
            font-size: 14px; color: #8A5000; line-height: 1.55;
        }
        #de-quan-ly-du-lieu, #de-ma-phu-huynh, #de-ghep-lop-modal { position:fixed; inset:0; z-index:99999; display:grid; place-items:center; padding:20px; background:rgba(18,60,57,.42); font-family:"Segoe UI",system-ui,sans-serif; }
        .de-quan-ly-card { width:min(650px,100%); max-height:calc(100vh - 40px); overflow:auto; padding:28px; border-radius:22px; background:#fff; box-shadow:0 28px 75px rgba(12,58,52,.28); }
        .de-quan-ly-card h3 { margin:0 0 7px; color:${MAU.xanhDam}; }
        .de-quan-ly-card p { margin:0 0 12px; color:${MAU.chuNhat}; line-height:1.55; }
        #de-quan-ly-status { min-height:18px; margin:0 0 12px; color:${MAU.xanhDam}; font-size:13px; font-weight:700; }
        .de-quan-ly-card button, .de-quan-ly-card label { display:block; width:100%; box-sizing:border-box; margin-top:9px; padding:12px; border:0; border-radius:11px; font:700 14px inherit; text-align:center; cursor:pointer; }
        #de-xuat-sao-luu { color:#fff; background:linear-gradient(135deg,#00A876,#4D97FF); }
        .de-nap-sao-luu { color:${MAU.xanhDam}; background:${MAU.xanhNhat}; }
        .de-nap-sao-luu input { display:none; }
        #de-dong-quan-ly { color:${MAU.chuNhat}; background:#F2F5F4; }
        .de-ho-so-tom-tat { display:grid; grid-template-columns:repeat(3,1fr); gap:9px; margin:16px 0; }.de-ho-so-tom-tat div { padding:12px 9px; border-radius:14px; background:${MAU.xanhNhat}; text-align:center; color:${MAU.xanhDam}; font-weight:800; }.de-ho-so-tom-tat b { display:block; font-size:23px; }.de-ho-so-tom-tat small { font-size:12px; }
        .de-ho-so-phan { margin:14px 0; padding:14px; border:1px solid ${MAU.vien}; border-radius:15px; }.de-ho-so-phan h4 { margin:0 0 8px; color:${MAU.xanhDam}; }.de-ho-so-phan p { margin:0; font-size:14px; }.de-nhat-ky-dong { padding:8px 0; border-top:1px solid #E9F1EF; font-size:13px; color:${MAU.chuNhat}; }.de-nhat-ky-dong:first-of-type { border-top:0; }.de-phan-hoi { width:100%; min-height:74px; box-sizing:border-box; border:1px solid ${MAU.vien}; border-radius:11px; padding:10px; resize:vertical; font:14px inherit; }
        #de-luu-feedback { color:${MAU.xanhDam}; background:${MAU.xanhNhat}; }
        #de-xem-bao-cao { color:#fff; background:linear-gradient(135deg,#08765A,#4D97FF); }
        #de-bao-cao-hoc-tap { position:fixed; inset:0; z-index:100000; display:grid; place-items:center; padding:20px; background:rgba(18,60,57,.42); font-family:"Segoe UI",system-ui,sans-serif; }.de-bao-cao-card { width:min(650px,100%); max-height:calc(100vh - 40px); overflow:auto; padding:28px; border-radius:22px; background:#fff; box-shadow:0 28px 75px rgba(12,58,52,.28); }.de-bao-cao-card h2 { margin:0 0 6px; color:${MAU.xanhDam}; }.de-bao-cao-card > p { margin:0 0 15px; color:${MAU.chuNhat}; }.de-bao-cao-card section { margin-top:12px; padding:14px; border:1px solid ${MAU.vien}; border-radius:15px; }.de-bao-cao-card h4 { margin:0 0 8px; color:${MAU.xanhDam}; }.de-bao-cao-card ul { margin:0; padding-left:20px; line-height:1.6; }.de-bao-cao-muc { color:#08765A; font-weight:800; }.de-bao-cao-card button { width:100%; margin-top:16px; padding:12px; border:0; border-radius:11px; background:#F2F5F4; color:${MAU.chuNhat}; font:700 14px inherit; cursor:pointer; }
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
            if (window.DeStemSync && window.DeStemSync.createStudentCode) {
                window.DeStemSync.createStudentCode(td.tenHocSinh).then(result => {
                    if (result.studentCode) { const latest = docTienDo(); latest.maHocSinh = result.studentCode; ghiTienDo(latest); }
                }).catch(() => {});
            }
            veHome();
        };
        document.getElementById('de-login-form').addEventListener('submit', e => e.preventDefault());
        document.getElementById('de-login-submit').addEventListener('click', dangNhap);
        document.getElementById('de-login-demo').addEventListener('click', dangNhap);
    }

    /* ---------- màn hình mở đầu: chọn lối đi ---------- */
    function veHome () {
        const goiCu = document.querySelector('.de-goi-chu-de');
        if (goiCu) goiCu.remove();
        manHinh = 'home';
        const wrap = document.getElementById('de-wrap');
        const soXong = LESSONS.filter(b => baiDaXong(b.so)).length;
        const tongBai = LESSONS.length;
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
                            <div class="de-tiendo-day" style="width:${(soXong / tongBai) * 100}%"></div>
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

    function moBaoCaoHocTap () {
        const cu = document.getElementById('de-bao-cao-hoc-tap');
        if (cu) cu.remove();
        const bc = baoCaoTuDuLieu();
        const thoiLuong = bc.buoi.batDau ? Math.max(1, Math.round((bc.buoi.lucCuoi - bc.buoi.batDau) / 60000)) : 0;
        const modal = document.createElement('div');
        modal.id = 'de-bao-cao-hoc-tap';
        modal.innerHTML = `<div class="de-bao-cao-card"><h2>📘 Báo cáo học tập</h2><p>${bc.bai ? `Bài ${bc.soBai} · ${esc(bc.bai.ten)}` : 'Chưa xác định được bài học gần nhất'}${thoiLuong ? ` · ${thoiLuong} phút hoạt động` : ''}</p><section><h4>Đã học được gì</h4><ul>${bc.hocDuoc.map(item => `<li>${esc(item)}</li>`).join('')}</ul></section><section><h4>Bằng chứng trong hồ sơ</h4><ul>${bc.bangChung.map(item => `<li>${esc(item)}</li>`).join('')}</ul></section><section><h4>Tiến độ và mức hỗ trợ</h4><p class="de-bao-cao-muc">${esc(bc.mucDo)}</p><p>${esc(bc.lyDo)}</p></section><section><h4>Bước tiếp theo</h4><p>${esc(bc.buocTiep)}</p></section><p style="margin-top:14px;font-size:12px">Tóm tắt này chỉ dựa trên thao tác, sản phẩm, câu hỏi AI và phản hồi đã lưu. Nó không thay thế nhận xét của giáo viên.</p><button id="de-dong-bao-cao">← Quay lại hồ sơ</button></div>`;
        document.body.appendChild(modal);
        document.getElementById('de-dong-bao-cao').addEventListener('click', () => { modal.remove(); moQuanLyDuLieu(); });
    }

    function moQuanLyDuLieu () {
        const cu = document.getElementById('de-quan-ly-du-lieu');
        if (cu) cu.remove();
        const hoSo = thongKeHoSo();
        const ten = hoSo.td.tenHocSinh || 'Học sinh';
        const nhatKy = (hoSo.td.nhatKyHoc || []).slice(-5).reverse();
        const feedbackDaGui = (hoSo.td.feedback || []).slice(-3).reverse();
        const hienLich = item => `${new Date(item.luc).toLocaleString('vi-VN', {hour:'2-digit', minute:'2-digit', day:'2-digit', month:'2-digit'})} · ${item.noiDung}`;
        const buoi = hoSo.phienGanNhat;
        const thoiLuong = buoi ? Math.max(1, Math.round((buoi.lucCuoi - buoi.batDau) / 60000)) : 0;
        const modal = document.createElement('div');
        modal.id = 'de-quan-ly-du-lieu';
        modal.innerHTML = `<div class="de-quan-ly-card">
            <h3>🔒 Hồ sơ học tập · ${esc(ten)}</h3>
            <p>Đây là bằng chứng hoạt động trên máy, không phải điểm số hay phán đoán “em đã hiểu”.</p>
            <div class="de-ho-so-tom-tat"><div><b>${hoSo.xong}/${LESSONS.length}</b><small>Bài hoàn thành</small></div><div><b>${hoSo.anh}</b><small>Ảnh sản phẩm</small></div><div><b>${hoSo.cauHoiAI}</b><small>Câu hỏi Chú Dế</small></div></div>
            ${buoi ? `<section class="de-ho-so-phan"><h4>⏺ Buổi học gần nhất</h4><p>Bài ${buoi.bai || 'tự do'} · ${thoiLuong} phút hoạt động · ${buoi.suKien.length} mốc đã ghi tự động.</p></section>` : ''}
            <section class="de-ho-so-phan"><h4>🕒 Hoạt động gần đây</h4>${nhatKy.length ? nhatKy.map(item => `<div class="de-nhat-ky-dong">${esc(hienLich(item))}</div>`).join('') : '<p>Chưa có hoạt động nào được ghi lại.</p>'}</section>
            <section class="de-ho-so-phan"><h4>💬 Feedback của học sinh</h4>${feedbackDaGui.length ? feedbackDaGui.map(item => `<div class="de-nhat-ky-dong"><b>${esc(item.camNhan || 'Góp ý')}</b>${item.noiDung ? ` · ${esc(item.noiDung)}` : ''}</div>`).join('') : '<p>Chưa có feedback sau bài nào.</p>'}</section>
            <section class="de-ho-so-phan"><h4>🪪 Mã học sinh</h4><p>${hoSo.td.maHocSinh ? `<b style="font-size:20px;letter-spacing:1px">${esc(hoSo.td.maHocSinh)}</b><br>Giáo viên nhập mã này trên DeSTEM Hub để kết nối lớp.` : 'Đang tạo mã học sinh khi có mạng…'}</p></section>
            <section class="de-ho-so-phan"><h4>📦 Chia sẻ cho giáo viên</h4><p>Xuất một file chứa tiến độ, ảnh, feedback và lịch sử chat của máy này. Chỉ gửi khi phụ huynh/giáo viên đồng ý.</p></section>
            <div id="de-quan-ly-status"></div>
            <button id="de-xem-bao-cao">Xem báo cáo học tập</button>
            <button id="de-ghep-lop">Ghép lớp với giáo viên</button>
            <button id="de-xuat-sao-luu">Xuất hồ sơ học tập</button>
            <button class="de-nap-sao-luu" id="de-nap-sao-luu">Nạp file đã sao lưu</button>
            <button id="de-dong-quan-ly">Xong</button>
        </div>`;
        document.body.appendChild(modal);

        const status = document.getElementById('de-quan-ly-status');
        const ipc = require('electron').ipcRenderer;
        document.getElementById('de-xem-bao-cao').addEventListener('click', () => { modal.remove(); moBaoCaoHocTap(); });
        document.getElementById('de-ghep-lop').addEventListener('click', () => moGhepLop(ten, message => { status.textContent = message; }));
        document.getElementById('de-dong-quan-ly').addEventListener('click', () => modal.remove());
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
    }

    function moGhepLop (tenHocSinh, capNhat) {
        const cu = document.getElementById('de-ghep-lop-modal');
        if (cu) cu.remove();
        const modal = document.createElement('div');
        modal.id = 'de-ghep-lop-modal';
        modal.innerHTML = `<div class="de-ma-card"><h3>🔗 Ghép lớp</h3><p>Nhập mã do giáo viên tạo trên DeSTEM Hub. Mỗi mã chỉ dùng một lần.</p><input id="de-ghep-lop-input" autocomplete="off" placeholder="DST-ABC123"><div id="de-ghep-lop-note"></div><div class="de-ma-actions"><button id="de-ghep-lop-huy">Hủy</button><button id="de-ghep-lop-xac-nhan">Ghép & đồng bộ</button></div></div>`;
        document.body.appendChild(modal);
        const input = document.getElementById('de-ghep-lop-input');
        const note = document.getElementById('de-ghep-lop-note');
        const submit = document.getElementById('de-ghep-lop-xac-nhan');
        const close = () => modal.remove();
        document.getElementById('de-ghep-lop-huy').addEventListener('click', close);
        const submitCode = async () => {
            const code = input.value.trim().toUpperCase();
            if (!/^DST-[A-Z0-9]{6}$/.test(code)) return note.textContent = 'Mã có dạng DST-ABC123.';
            if (!window.DeStemSync) return note.textContent = 'App chưa sẵn sàng. Hãy đóng và mở lại OpenBlock.';
            submit.disabled = true;
            note.textContent = 'Đang ghép lớp và gửi tiến độ…';
            try {
                const state = window.DeStemSync.status();
                if (state.connected) throw new Error('Máy này đã ghép lớp.');
                await window.DeStemSync.enroll({inviteCode: code, studentDisplayName: tenHocSinh, deviceName: 'OpenBlock Desktop (Windows)'});
                capNhat('Đã ghép lớp ✓ Tiến độ hiện có đã được gửi lên DeSTEM Hub.');
                close();
            } catch (e) {
                note.textContent = e.message || 'Chưa ghép lớp được. Kiểm tra mã rồi thử lại.';
                submit.disabled = false;
            }
        };
        submit.addEventListener('click', submitCode);
        input.addEventListener('keydown', event => { if (event.key === 'Enter') submitCode(); });
        input.focus();
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
                <p class="phude">Xem hết phần giới thiệu để biết mình sẽ làm gì trong 9 bài.</p>
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
                ${daXem ? 'Vào hành trình 9 bài →' : 'Hãy xem hết video trước'}
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
            next.textContent = 'Vào hành trình 9 bài →';
            note.textContent = 'Tuyệt! Em đã mở khóa 9 bài học.';
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
        const goiCu = document.querySelector('.de-goi-chu-de');
        if (goiCu) goiCu.remove();
        if (!docTienDo().daXemGioiThieu) return moGioiThieu();
        manHinh = 'danhSach';
        const wrap = document.getElementById('de-wrap');
        const soXong = LESSONS.filter(b => baiDaXong(b.so)).length;

        wrap.innerHTML = `
            <button class="de-quaylai" id="de-ve-home">← Trang chủ</button>
            <div class="de-header">
                <h1>Khu vườn thông minh</h1>
                <p>Dế Base KIT · Bài mở đầu + ${LESSONS.length} bài · Em đã xong ${soXong}/${LESSONS.length} bài</p>
            </div>
            ${soXong ? `<div class="de-hoc-lai-list"><span>🧪 Muốn luyện hoặc test lại?</span>${LESSONS.filter(b => baiDaXong(b.so)).map(b => `<button type="button" data-de-hoc-lai="${b.so}">↻ Học lại Bài ${b.so}</button>`).join('')}</div>` : ''}
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
                    const mo = baiDaMo(b.so);
                    return `
                    <button class="de-the ${xong ? 'xong' : ''}" data-bai="${b.so}" ${mo ? '' : 'disabled'}>
                        <div class="de-so">${xong ? '✓' : (mo ? b.so : '🔒')}</div>
                        <div class="de-the-noidung">
                            <h3>${esc(b.ten)}</h3>
                            <p>${esc(b.phuDe)}</p>
                            <span class="de-nhan ${b.coLapTrinh ? 'de-nhan-code' : 'de-nhan-tay'}">
                                ${b.coLapTrinh ? 'Có lập trình' : 'Làm tay, chưa cần mạch'}
                            </span>
                            ${xong ? '<span class="de-nhan de-nhan-xong">Đã xong</span>' : (!mo ? '<span class="de-nhan">Hoàn thành bài trước để mở</span>' : '')}
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
        wrap.querySelectorAll('[data-de-hoc-lai]').forEach(button => {
            button.addEventListener('click', () => hocLaiBai(Number(button.dataset.deHocLai)));
        });
    }

    /* ---------- màn hình một bài ---------- */
    function troChoiNhiemVu (soBai, buoc) {
        const bai1 = [
            {icon:'📷', title:'Quan sát cùng Chú Dế', prompt:'Chụp một góc cây có cả lá và đất, rồi cùng Chú Dế nhìn thật kỹ. Không có đáp án chọn sẵn — câu chuyện sẽ đi theo đúng ảnh và điều em nói.', photo:true}
        ];
        const bai2 = [
            {icon:'🧪', title:'Thử ý tưởng trước', prompt:'Vì sao mình làm mô hình từ đồ tái chế?', cards:[['💸','Sai thì dễ sửa, không tốn linh kiện',true],['🚀','Để mô hình bay cao hơn',false]]},
            {icon:'📷', title:'Khoảnh khắc của em', prompt:'Chụp một ảnh mô hình vườn mini.', photo:true},
            {icon:'💧', title:'Dự đoán dòng nước', prompt:'Khi em đổ nước, dòng nước tốt nên…', cards:[['→','chảy về nơi cây cần nước',true],['💦','tràn khắp mô hình',false]]},
            {icon:'🧰', title:'Sẵn sàng lên mạch', prompt:'Chọn khi mô hình đã gọn và rõ dòng nước.', cards:[['✨','Mô hình đã sẵn sàng'],['🔧','Cần chỉnh lại dòng nước']]}
        ];
        return (soBai === 1 ? bai1 : bai2)[buoc];
    }

    async function nhoChuDeXemAnhBai1 (anh, nut, khung, onPass) {
        if (!anh) return;
        nut.disabled = true;
        nut.textContent = '🦗 Chú Dế đang xem ảnh…';
        let loiNhan = khung.querySelector('.de-ai-xem-anh');
        if (!loiNhan) {
            loiNhan = document.createElement('div');
            loiNhan.className = 'de-ai-xem-anh';
            khung.appendChild(loiNhan);
        }
        loiNhan.textContent = 'Chú Dế đang nhìn các chi tiết trong ảnh…';
        try {
            if (!window.ThingEduAI || !window.ThingEduAI.askWithImage) throw new Error('AI chưa sẵn sàng');
            const cauHoi = 'Em đang học Bài 1: quan sát trước khi kết luận. Hãy xem ảnh cây này cùng em. Chỉ mô tả tối đa 3 chi tiết nhìn thấy được (lá, đất, ánh sáng, vị trí…), không chẩn đoán bệnh hay bảo em phải làm gì. Sau đó hỏi đúng một câu: “Em thấy chi tiết nào rõ nhất?” Trả lời ngắn, thân thiện, tiếng Việt.';
            const traLoi = await window.ThingEduAI.askWithImage(cauHoi, anh, []);
            loiNhan.textContent = traLoi.text;
            const td = docTienDo();
            if (!td[1]) td[1] = {};
            td[1].soTay = Object.assign({}, td[1].soTay || {}, {anh: anh, goiYAnhAI: traLoi.text, goiYAnhAILuc: Date.now()});
            ghiTienDo(td);
            ghiNhatKyHoc('ai-xem-anh', 1, 'Chú Dế đã cùng xem ảnh quan sát của em');
            taoLuotTraLoiAnhBai1(anh, khung, onPass);
        } catch (e) {
            loiNhan.textContent = 'Chưa gửi được ảnh cho Chú Dế. Ảnh vẫn đã lưu trên máy; em có thể tự nhìn kỹ rồi ghi điều em thấy trước nhé.';
        } finally {
            nut.disabled = false;
            nut.textContent = '🦗 Nhờ Chú Dế xem lại ảnh';
        }
    }

    function taoLuotTraLoiAnhBai1 (anh, khung, onPass) {
        if (khung.querySelector('.de-ai-anh-form')) return;
        const lichSu = [];
        let soLuotHocSinh = 0;
        const form = document.createElement('form');
        form.className = 'de-ai-anh-form';
        form.innerHTML = `<label for="de-ai-anh-input">👀 Em thấy chi tiết nào rõ nhất?</label><textarea id="de-ai-anh-input" maxlength="360" placeholder="Ví dụ: Em thấy đất trong chậu có màu nâu và khô ở mặt trên."></textarea><button type="submit">Gửi Chú Dế →</button><small>Trao đổi với Chú Dế đến khi em đã quan sát đủ rõ nhé.</small>`;
        khung.appendChild(form);
        form.addEventListener('submit', async event => {
            event.preventDefault();
            const input = form.querySelector('textarea');
            const text = input.value.trim();
            if (!text) return input.focus();
            const button = form.querySelector('button');
            button.disabled = true;
            button.textContent = 'Chú Dế đang trả lời…';
            let reply = khung.querySelector('.de-ai-anh-reply');
            if (!reply) { reply = document.createElement('div'); reply.className = 'de-ai-anh-reply'; khung.appendChild(reply); }
            reply.textContent = 'Chú đang đối chiếu câu của em với ảnh…';
            try {
                if (!window.ThingEduAI || !window.ThingEduAI.askWithImage) throw new Error('AI chưa sẵn sàng');
                soLuotHocSinh += 1;
                lichSu.push({role: 'user', content: text});
                const question = `Đây là hội thoại Bài 1: học sinh học cách quan sát ảnh trước khi kết luận. Em vừa nói: “${text}”. Hãy trả lời ngắn bằng tiếng Việt: chỉ ra phần nào là điều nhìn thấy trực tiếp; nếu có suy đoán thì nhắc nhẹ, không chẩn đoán bệnh cây; rồi hỏi MỘT câu quan sát tiếp theo.

Chỉ được kết thúc bằng mã [[DE_PASS]] khi ĐỦ cả 3 điều: (1) ảnh đã có, (2) học sinh đã tự nêu ít nhất một chi tiết nhìn thấy trực tiếp, (3) sau ít nhất 2 lượt trả lời của học sinh, em đã nêu thêm vị trí/sự khác nhau/sự thay đổi hoặc một câu hỏi có thể kiểm tra. Nếu chưa đủ, tuyệt đối không dùng mã này. Lượt học sinh hiện tại: ${soLuotHocSinh}. Khi đủ, hãy khen ngắn, nói “Em đã hoàn thành phần quan sát”, nêu lại điều em quan sát được và đừng hỏi thêm.`;
                const result = await window.ThingEduAI.askWithImage(question, anh, lichSu.slice(0, -1));
                const daDu = result.text.indexOf('[[DE_PASS]]') !== -1;
                const noiDung = result.text.replace(/\[\[DE_PASS\]\]/g, '').trim();
                reply.textContent = noiDung;
                lichSu.push({role: 'assistant', content: noiDung});
                const td = docTienDo();
                if (!td[1]) td[1] = {};
                td[1].soTay = Object.assign({}, td[1].soTay || {}, {anh: anh, traLoiQuanSatAI: text, phanHoiAnhAI: noiDung, phanHoiAnhAILuc: Date.now()});
                if (daDu) td[1].aiQuanSatPass = {luc: Date.now(), luot: soLuotHocSinh};
                ghiTienDo(td);
                ghiNhatKyHoc('tra-loi-ai-anh', 1, 'Đã trả lời Chú Dế về chi tiết quan sát trong ảnh');
                if (daDu) {
                    form.querySelector('label').textContent = '✓ Chú Dế xác nhận: em đã quan sát đủ rõ!';
                    input.disabled = true;
                    button.hidden = true;
                    form.querySelector('small').textContent = 'Câu trả lời và phản hồi đã lưu vào Sổ tay. Em có thể sang bước tiếp theo.';
                    form.classList.add('de-ai-anh-pass');
                    if (onPass) {
                        const next = document.createElement('button');
                        next.type = 'button'; next.textContent = 'Sang chặng tiếp theo →';
                        next.addEventListener('click', onPass);
                        form.appendChild(next);
                    }
                } else {
                    input.value = '';
                    input.placeholder = 'Trả lời câu Chú Dế vừa hỏi…';
                    form.querySelector('label').textContent = '🦗 Em trả lời Chú Dế nhé:';
                    form.querySelector('small').textContent = 'Chú Dế sẽ nói khi em đã quan sát đủ rõ.';
                }
            } catch (e) {
                reply.textContent = 'Chú chưa phản hồi được lúc này. Điều em vừa ghi vẫn đã lưu vào Sổ tay; em thử hỏi lại khi có mạng nhé.';
            } finally {
                button.disabled = false;
                button.textContent = 'Gửi Chú Dế →';
            }
        });
    }

    /* ---------- Bài 1: bốn chặng theo giáo trình ---------- */
    function moBaiMotHanhTrinh (b) {
        baiDangMo = b;
        manHinh = 'chiTiet';
        const td = docTienDo();
        if (!td[1]) td[1] = {};
        const data = td[1];
        const hanhTrinh = data.hanhTrinhBai1 || {};
        const soTay = data.soTay || {};
        const current = !hanhTrinh.quanSat ? 0 : (!hanhTrinh.tachThayDoan ? 1 : (!hanhTrinh.thuHep ? 2 : (!hanhTrinh.datVanDe ? 3 : 4)));
        const stages = [
            ['Mười phút đứng yên', 'Chụp một góc cây và kể điều mắt em nhìn thấy.', '📷'],
            ['Quan sát hay suy đoán?', 'Tách điều em thấy thật khỏi điều em đang đoán.', '👀'],
            ['Ba lần thu hẹp', 'Biến quan sát thành một câu hỏi có thể kiểm tra.', '🔎'],
            ['Đặt tên vấn đề', 'Chốt chuyện gì – ở đâu – khi nào để mang sang Bài 2.', '🎯']
        ];
        const status = i => i < current ? 'done' : (i === current ? 'active' : 'locked');
        const wrap = document.getElementById('de-wrap');
        const active = current < stages.length ? noiDungChuongBaiMot(current, soTay, hanhTrinh) : `<section class="de-khoi de-ho-so-vu-viec"><h3>Hồ sơ điều tra của bạn</h3><p><b>Chuyện gì:</b> ${esc((soTay.vanDe || {}).chuyenGi || '')}</p><p><b>Ở đâu:</b> ${esc((soTay.vanDe || {}).oDau || '')}</p><p><b>Khi nào:</b> ${esc((soTay.vanDe || {}).khiNao || '')}</p><p><b>Câu hỏi cần kiểm tra:</b> ${esc(soTay.cauHoiKiemTra || '')}</p><div class="de-play-hint">Đây chưa phải kết luận. Bài 2 sẽ giúp bạn dựng thí nghiệm để kiểm tra nó.</div><button class="de-nut-chinh" id="de-b1-finish">Khép lại Bài 1 →</button></section>`;
        const goiY = [
            'Em đang ở Bài 1, chặng quan sát. Hãy chỉ hỏi em các câu ngắn để em tự nói chi tiết nhìn thấy trực tiếp trong ảnh, không chẩn đoán cây.',
            'Em đang học phân biệt quan sát và suy đoán. Hãy đưa một gợi ý ngắn, rồi hỏi em tự sửa câu của mình.',
            'Em đang thu hẹp một quan sát thành câu hỏi kiểm tra được. Hãy hỏi em “cái gì, ở đâu, khi nào hoặc so với cái gì”, không tự viết câu hộ em.',
            'Em đang đặt tên vấn đề dự án Bài 1. Hãy kiểm tra nhẹ xem em đã có chuyện gì, ở đâu, khi nào chưa; thiếu gì thì chỉ hỏi đúng phần đó.'
        ];
        const troGiup = current < stages.length ? `${khungChatTaiBai('Bạn đang kẹt ở bước nào? Kể Chú Dế nghe nhé.')}${current === 0 && soTay.anh ? `<details class="de-b1-help"><summary>Muốn Chú Dế xem ảnh này?</summary><div class="de-b1-help-body"><p>Ảnh chỉ được gửi khi bạn bấm nút dưới đây.</p><button type="button" class="de-mission-ai-button" id="de-b1-ai">Gửi ảnh cho Chú Dế</button><div id="de-b1-ai-reply"></div></div></details>` : ''}` : '';
        wrap.innerHTML = `<button class="de-quaylai" id="de-back">← Danh sách bài</button>
            <div class="de-bai-tieude"><h2>Bài 1 · ${esc(b.ten)}</h2><p class="phude">Không có đáp án chọn sẵn. Em quan sát thật, Chú Dế chỉ hỏi để em nghĩ rõ hơn.</p></div>
            <div class="de-nhiem-vu-top"><span>HÀNH TRÌNH QUAN SÁT</span><span>${Math.min(current + 1, 4)}/4</span></div><div class="de-nhiem-vu-track"><i style="width:${Math.min(current, 4) * 25}%"></i></div>
            <div class="de-b1-task-shell"><div class="de-mission-list">${stages.map((item, i) => `<section class="de-mission ${status(i)}"><b>${i < current ? '✓' : (i === current ? '→' : '🔒')} ${i + 1}. ${item[2]} ${esc(item[0])}</b>${i === current ? `<div class="de-mission-main"><h3>${esc(item[0])}</h3><p>${esc(item[1])}</p>${active}${troGiup}</div>` : ''}</section>`).join('')}${current === stages.length ? `<section class="de-mission active"><b>★ Tổng hợp Bài 1</b><div class="de-mission-main">${active}</div></section>` : ''}</div></div>`;
        document.getElementById('de-back').addEventListener('click', veDanhSach);
        const hoiTaiBai = batChatTaiBai(b, goiY[Math.min(current, 3)]);
        if (current === 0) ganChuongQuanSatBaiMot(b, wrap, soTay, hoiTaiBai);
        if (current === 1) ganChuongTachThayDoan(b, wrap, soTay, hoiTaiBai);
        if (current === 2) ganChuongThuHepBaiMot(b, wrap, soTay, hoiTaiBai);
        if (current === 3) ganChuongDatVanDeBaiMot(b, wrap, soTay, hoiTaiBai);
        if (current === 4) document.getElementById('de-b1-finish').addEventListener('click', () => hoanTatBaiMot(b));
        const cu = document.querySelector('.de-goi-chu-de'); if (cu) cu.remove();
        wrap.parentElement.scrollTop = 0;
    }

    function noiDungChuongBaiMot (step, soTay) {
        if (step === 0) return `<label>Điều bạn nhìn thấy<textarea id="de-b1-quan-sat" maxlength="500" placeholder="Ví dụ: Ba lá dưới vàng hơn các lá trên; mặt đất ở mép chậu khô.">${esc(soTay.thay || '')}</textarea></label><div id="de-b1-photo-area">${soTay.anh ? `<img class="de-mission-photo-preview" src="${escAttr(soTay.anh)}" alt="Ảnh cây bạn quan sát" onerror="this.remove()">` : ''}<label class="de-play-card" for="de-b1-photo">${soTay.anh ? 'Đổi ảnh quan sát' : '+ Thêm ảnh (không bắt buộc)'}</label><input id="de-b1-photo" type="file" accept="image/*" capture="environment" style="display:none"><div class="de-play-hint" id="de-b1-hint">${soTay.anh ? 'Ảnh đã được lưu trên máy này.' : 'Ảnh là bằng chứng bổ sung; điều bạn ghi mới là quan trọng.'}</div></div><button class="de-nut-chinh" id="de-b1-next">Tôi đã ghi điều mình thấy →</button>`;
        if (step === 1) return `<label>Điều em thấy thật<textarea id="de-b1-thay" maxlength="500" placeholder="Ví dụ: Ba lá dưới có màu vàng, đất mặt khô…">${esc(soTay.thay || '')}</textarea></label><label>Điều em đang đoán<textarea id="de-b1-doan" maxlength="500" placeholder="Ví dụ: Em đoán cây thiếu nước…">${esc(soTay.doan || '')}</textarea></label><div class="de-play-hint" id="de-b1-hint">Không sao nếu em chưa chắc. Mình chỉ cần tách hai loại câu ra.</div><button class="de-nut-chinh" id="de-b1-next">Em đã tách xong →</button>`;
        if (step === 2) return `<label>Câu hỏi em muốn kiểm tra<textarea id="de-b1-cau-hoi" maxlength="500" placeholder="Ví dụ: Đất ở chậu ban công có khô nhanh hơn chậu trong nhà không?">${esc(soTay.cauHoiKiemTra || '')}</textarea></label><div class="de-play-hint" id="de-b1-hint">Một câu tốt thường có thứ cần so sánh hoặc kiểm tra, không cần biết đáp án ngay.</div><button class="de-nut-chinh" id="de-b1-next">Câu hỏi này kiểm tra được →</button>`;
        return `<label>Chuyện gì đang xảy ra?<input id="de-b1-chuyen-gi" maxlength="180" value="${escAttr((soTay.vanDe || {}).chuyenGi || '')}" placeholder="Ví dụ: lá dưới bị vàng"></label><label>Ở đâu?<input id="de-b1-o-dau" maxlength="180" value="${escAttr((soTay.vanDe || {}).oDau || '')}" placeholder="Ví dụ: chậu cây ở ban công"></label><label>Khi nào / trong điều kiện nào?<input id="de-b1-khi-nao" maxlength="180" value="${escAttr((soTay.vanDe || {}).khiNao || '')}" placeholder="Ví dụ: sau hai ngày không tưới"></label><div class="de-play-hint" id="de-b1-hint">Đây là tên vấn đề để em đem sang mô hình Bài 2.</div><button class="de-nut-chinh" id="de-b1-next">Chốt vấn đề của em →</button>`;
    }

    function capNhatChuongBaiMot (thayDoi, noiDung) {
        const td = docTienDo(); if (!td[1]) td[1] = {};
        td[1].hanhTrinhBai1 = Object.assign({}, td[1].hanhTrinhBai1 || {}, thayDoi);
        ghiTienDo(td); ghiNhatKyHoc('nhiem-vu', 1, noiDung);
    }

    async function xinChuDePhanHoi (hoiTaiBai, nut, hint, noiDungGuiAI, noiDungHienThi, nhanNut) {
        if (nut.dataset.deAiDaXem === '1') return true;
        const chat = document.querySelector('.de-chat-toggle'); if (chat) chat.open = true;
        nut.disabled = true; nut.textContent = 'Chú Dế đang xem…';
        const ketQua = await hoiTaiBai(noiDungGuiAI, null, noiDungHienThi);
        nut.disabled = false;
        if (!ketQua || !ketQua.ok) {
            nut.textContent = nhanNut;
            hint.textContent = 'Chú Dế chưa phản hồi được. Bạn thử gửi lại nhé.';
            return false;
        }
        nut.dataset.deAiDaXem = '1';
        nut.textContent = 'Đã xem phản hồi — tiếp tục →';
        hint.textContent = 'Bạn đọc phản hồi của Chú Dế nhé. Có thể trả lời thêm trong khung chat, hoặc tiếp tục khi đã hiểu.';
        return false;
    }

    function datLaiPhanHoiNeuSua (nut, oNhap, nhanNut) {
        oNhap.forEach(o => o.addEventListener('input', () => {
            if (nut.dataset.deAiDaXem !== '1') return;
            delete nut.dataset.deAiDaXem;
            nut.textContent = nhanNut;
        }));
    }

    function ganChuongQuanSatBaiMot (b, wrap, soTay, hoiTaiBai) {
        let anh = soTay.anh || '';
        const input = document.getElementById('de-b1-photo'); const nut = document.getElementById('de-b1-ai');
        input.addEventListener('change', async () => {
            if (!input.files || !input.files[0]) return;
            const hint = document.getElementById('de-b1-hint'); hint.textContent = 'Đang chuẩn bị ảnh…';
            try { anh = await nenAnhSoTay(input.files[0]); const td = docTienDo(); td[1] = td[1] || {}; td[1].soTay = Object.assign({}, td[1].soTay || {}, {anh: anh}); delete td[1].aiQuanSatPass; ghiTienDo(td); moBaiMotHanhTrinh(b); } catch (e) { hint.textContent = 'Chưa đọc được ảnh này. Em thử ảnh khác nhé.'; }
        });
        if (nut) nut.addEventListener('click', () => nhoChuDeXemAnhBai1(anh, nut, document.getElementById('de-b1-ai-reply')));
        const nutTiep = document.getElementById('de-b1-next');
        datLaiPhanHoiNeuSua(nutTiep, [document.getElementById('de-b1-quan-sat')], 'Gửi ghi chép cho Chú Dế →');
        nutTiep.textContent = 'Gửi ghi chép cho Chú Dế →';
        nutTiep.addEventListener('click', async () => {
            const thay = document.getElementById('de-b1-quan-sat').value.trim();
            if (thay.length < 12) return document.getElementById('de-b1-hint').textContent = 'Bạn ghi rõ ít nhất một chi tiết mắt mình nhìn thấy nhé.';
            const td = docTienDo(); td[1] = td[1] || {};
            td[1].soTay = Object.assign({}, td[1].soTay || {}, {thay: thay}); ghiTienDo(td);
            if (await xinChuDePhanHoi(hoiTaiBai, nutTiep, document.getElementById('de-b1-hint'), `Bạn vừa ghi điều quan sát: “${thay}”. Hãy phản hồi ngắn: nhắc lại đúng một chi tiết bạn ấy đã thấy, rồi hỏi đúng một câu để bạn ấy tự quan sát kỹ hơn. Không kết luận nguyên nhân và không tự cho qua bước.`, `Mình ghi: “${thay}”`, 'Gửi ghi chép cho Chú Dế →')) {
                capNhatChuongBaiMot({quanSat: true}, 'Đã ghi điều quan sát trực tiếp và nhận phản hồi từ Chú Dế'); moBaiMotHanhTrinh(b);
            }
        });
    }

    function ganChuongTachThayDoan (b, wrap, soTay, hoiTaiBai) {
        const nutTiep = document.getElementById('de-b1-next');
        datLaiPhanHoiNeuSua(nutTiep, [document.getElementById('de-b1-thay'), document.getElementById('de-b1-doan')], 'Gửi ghi chép cho Chú Dế →');
        nutTiep.textContent = 'Gửi ghi chép cho Chú Dế →';
        nutTiep.addEventListener('click', async () => {
            const thay = document.getElementById('de-b1-thay').value.trim(); const doan = document.getElementById('de-b1-doan').value.trim();
            if (!thay || !doan) return document.getElementById('de-b1-hint').textContent = 'Em ghi cả điều thấy thật và điều em đang đoán nhé.';
            const td = docTienDo(); td[1] = td[1] || {}; td[1].soTay = Object.assign({}, td[1].soTay || {}, {thay: thay, doan: doan}); ghiTienDo(td);
            if (await xinChuDePhanHoi(hoiTaiBai, nutTiep, document.getElementById('de-b1-hint'), `Bạn vừa tách: điều thấy thật là “${thay}”; điều đang đoán là “${doan}”. Hãy phản hồi ngắn: chỉ ra một câu thuộc mỗi loại, rồi hỏi một câu để bạn ấy tự kiểm tra phần đang đoán. Không sửa hộ và không kết luận.`, `Điều mình thấy: “${thay}”\nĐiều mình đang đoán: “${doan}”`, 'Gửi ghi chép cho Chú Dế →')) {
                capNhatChuongBaiMot({tachThayDoan: true}, 'Đã tách quan sát và suy đoán, nhận phản hồi từ Chú Dế'); moBaiMotHanhTrinh(b);
            }
        });
    }

    function ganChuongThuHepBaiMot (b, wrap, soTay, hoiTaiBai) {
        const nutTiep = document.getElementById('de-b1-next');
        datLaiPhanHoiNeuSua(nutTiep, [document.getElementById('de-b1-cau-hoi')], 'Gửi câu hỏi cho Chú Dế →');
        nutTiep.textContent = 'Gửi câu hỏi cho Chú Dế →';
        nutTiep.addEventListener('click', async () => {
            const cauHoi = document.getElementById('de-b1-cau-hoi').value.trim();
            if (cauHoi.length < 12) return document.getElementById('de-b1-hint').textContent = 'Em viết rõ hơn câu hỏi em muốn kiểm tra nhé.';
            const td = docTienDo(); td[1] = td[1] || {}; td[1].soTay = Object.assign({}, td[1].soTay || {}, {cauHoiKiemTra: cauHoi}); ghiTienDo(td);
            if (await xinChuDePhanHoi(hoiTaiBai, nutTiep, document.getElementById('de-b1-hint'), `Bạn vừa đặt câu hỏi: “${cauHoi}”. Hãy phản hồi ngắn: nói câu hỏi này đang muốn so sánh hoặc kiểm tra điều gì, rồi hỏi một câu giúp bạn ấy làm câu hỏi rõ hơn. Không tự viết lại câu hỏi hộ bạn ấy.`, `Câu hỏi mình muốn kiểm tra: “${cauHoi}”`, 'Gửi câu hỏi cho Chú Dế →')) {
                capNhatChuongBaiMot({thuHep: true}, 'Đã đặt câu hỏi có thể kiểm tra và nhận phản hồi từ Chú Dế'); moBaiMotHanhTrinh(b);
            }
        });
    }

    function ganChuongDatVanDeBaiMot (b, wrap, soTay, hoiTaiBai) {
        const nutTiep = document.getElementById('de-b1-next');
        datLaiPhanHoiNeuSua(nutTiep, [document.getElementById('de-b1-chuyen-gi'), document.getElementById('de-b1-o-dau'), document.getElementById('de-b1-khi-nao')], 'Gửi vấn đề cho Chú Dế →');
        nutTiep.textContent = 'Gửi vấn đề cho Chú Dế →';
        nutTiep.addEventListener('click', async () => {
            const chuyenGi = document.getElementById('de-b1-chuyen-gi').value.trim(); const oDau = document.getElementById('de-b1-o-dau').value.trim(); const khiNao = document.getElementById('de-b1-khi-nao').value.trim();
            if (!chuyenGi || !oDau || !khiNao) return document.getElementById('de-b1-hint').textContent = 'Vấn đề cần đủ: chuyện gì, ở đâu và khi nào nhé.';
            const td = docTienDo(); td[1] = td[1] || {}; td[1].soTay = Object.assign({}, td[1].soTay || {}, {vanDe: {chuyenGi: chuyenGi, oDau: oDau, khiNao: khiNao}}); ghiTienDo(td);
            if (await xinChuDePhanHoi(hoiTaiBai, nutTiep, document.getElementById('de-b1-hint'), `Bạn vừa mô tả vấn đề: chuyện gì là “${chuyenGi}”, ở “${oDau}”, khi “${khiNao}”. Hãy phản hồi ngắn: nhắc lại một phần đã rõ, rồi hỏi đúng một câu về phần bạn ấy cần quan sát hoặc kiểm tra thêm. Không kết luận nguyên nhân.`, `Vấn đề mình ghi: “${chuyenGi}” — ở “${oDau}”, khi “${khiNao}”`, 'Gửi vấn đề cho Chú Dế →')) {
                capNhatChuongBaiMot({datVanDe: true}, `Đã chốt vấn đề và nhận phản hồi từ Chú Dế: ${chuyenGi} · ${oDau} · ${khiNao}`); moBaiMotHanhTrinh(b);
            }
        });
    }

    function hoanTatBaiMot (b) {
        const td = docTienDo(); td[1] = td[1] || {};
        td[1].tuKiemTra = b.tuKiemTra.reduce((ketQua, _, i) => { ketQua[i] = true; return ketQua; }, {});
        td[1].daChucMung = true; ghiTienDo(td);
        ghiNhatKyHoc('ho-so-van-de', 1, 'Đã xác nhận hồ sơ vấn đề và hoàn thành Bài 1');
        hienChucMung(1);
    }

    /* ---------- Bài 2: dựng mô hình tái chế ---------- */
    let timerTutorialBai2 = null;

    function tutorialBaiHai () {
        return `<section class="de-b2-tutorial" aria-label="Ý tưởng mẫu dựng vườn mini"><div class="de-b2-tutorial-top"><span>💡 Ý tưởng mẫu — chỉ xem khi bạn đang bí</span><button type="button" id="de-b2-tutorial-play">Tự chạy</button></div><div class="de-b2-material-grid"><span><b>2 ly giống nhau</b> → hai chậu để so sánh</span><span><b>Đất / xơ dừa</b> → cho bằng nhau vào mỗi ly</span><span><b>Bìa carton</b> → làm mái che cho một ly</span><span><b>Que kem</b> → ghi nhãn hai ly</span></div><img id="de-b2-tutorial-image" src="media/bai-2-tutorial-1.png" alt="Các bước dựng mô hình vườn mini" onerror="this.parentElement.hidden=true"><p class="de-b2-tutorial-caption" id="de-b2-tutorial-caption">1/4 · Hai ly giống nhau: làm hai chậu để so sánh.</p></section>`;
    }

    function ganTutorialBaiHai () {
        if (timerTutorialBai2) { clearInterval(timerTutorialBai2); timerTutorialBai2 = null; }
        const nut = document.getElementById('de-b2-tutorial-play'); const caption = document.getElementById('de-b2-tutorial-caption'); const hinh = document.getElementById('de-b2-tutorial-image');
        const cards = Array.from(document.querySelectorAll('.de-b2-material-grid span'));
        if (!nut || !caption || !hinh) return;
        const scenes = [
            {caption:'1/4 · Hai ly giống nhau: làm hai chậu để so sánh.', image:'media/bai-2-tutorial-1.png'},
            {caption:'2/4 · Đất hoặc xơ dừa: cho cùng lượng vào hai chậu.', image:'media/bai-2-tutorial-2.png'},
            {caption:'3/4 · Bìa carton và que kem: làm mái che cho một chậu.', image:'media/bai-2-tutorial-3.png'},
            {caption:'4/4 · Đặt hai chậu cùng chỗ; chỉ thay đổi đúng điều bạn muốn thử.', image:'media/bai-2-tutorial-4.png'}
        ];
        let scene = 0;
        const hienCanh = () => {
            caption.textContent = scenes[scene].caption;
            hinh.src = scenes[scene].image;
            cards.forEach((card, index) => card.classList.toggle('de-b2-focus', index === scene));
        };
        const chay = () => {
            if (timerTutorialBai2) { clearInterval(timerTutorialBai2); timerTutorialBai2 = null; cards.forEach(card => card.classList.remove('de-b2-focus')); nut.textContent = 'Xem lại'; return; }
            scene = 0;
            nut.textContent = 'Dừng';
            hienCanh();
            timerTutorialBai2 = setInterval(() => {
                scene += 1;
                if (scene >= scenes.length) { clearInterval(timerTutorialBai2); timerTutorialBai2 = null; cards.forEach(card => card.classList.remove('de-b2-focus')); nut.textContent = 'Xem lại'; return; }
                hienCanh();
            }, 2200);
        };
        nut.addEventListener('click', chay);
    }

    function moBaiHaiHanhTrinh (b) {
        baiDangMo = b;
        manHinh = 'chiTiet';
        const td = docTienDo(); if (!td[2]) td[2] = {};
        const data = td[2]; const hanhTrinh = data.hanhTrinhBai2 || {};
        const soTay = (td[1] || {}).soTay || {};
        const current = !hanhTrinh.cauHoi ? 0 : (!hanhTrinh.vatLieu ? 1 : (!hanhTrinh.moHinh ? 2 : (!hanhTrinh.haiCoc ? 3 : (!hanhTrinh.baMoc ? 4 : 5))));
        const stages = [
            ['Chọn điều cần kiểm tra', 'Xác định câu hỏi và thứ bạn sẽ quan sát trước khi làm mô hình.', '🎯'],
            ['Tìm vật liệu quanh bạn', 'Không cần mua gì và chưa mở hộp kit.', '🧺'],
            ['Dựng mô hình mini', 'Dùng vật liệu tìm được để mô phỏng một góc vườn.', '🛠'],
            ['Chuẩn bị hai cốc công bằng', 'Hai cốc giống nhau; chỉ đổi một thứ để so sánh.', '🥤'],
            ['Chạy thử và ghi ba mốc', 'Ghi điều đã xảy ra ở ba thời điểm rồi mới kết luận.', '📝']
        ];
        const status = i => i < current ? 'done' : (i === current ? 'active' : 'locked');
        const vanDe = soTay.vanDe ? `${soTay.vanDe.chuyenGi || ''} · ${soTay.vanDe.oDau || ''} · ${soTay.vanDe.khiNao || ''}` : 'vấn đề bạn đã chọn ở Bài 1';
        const active = current < 5 ? noiDungChuongBaiHai(current, data.bangChung || {}, vanDe) : `<section class="de-khoi de-ho-so-vu-viec"><h3>Thí nghiệm nhỏ của bạn</h3><p><b>Câu hỏi đang kiểm tra:</b> ${esc((data.bangChung || {}).cauHoi || '')}</p><p><b>Điều đã quan sát/đo:</b> ${esc((data.bangChung || {}).dauHieu || '')}</p><p><b>Điều bạn đổi:</b> ${esc((data.bangChung || {}).dieuDoi || '')}</p><p><b>Điều giữ giống nhau:</b> ${esc((data.bangChung || {}).giuGiong || '')}</p><p><b>Ba mốc đã ghi:</b> ${esc((data.bangChung || {}).baMoc || '')}</p><div class="de-play-hint">Bài 3 mới bắt đầu dùng mạch và cảm biến. Hôm nay bạn đã học cách so sánh công bằng bằng mô hình.</div><button class="de-nut-chinh" id="de-b2-finish">Khép lại Bài 2 →</button></section>`;
        const goiY = [
            'Bạn đang ở Bài 2, phần chọn điều cần kiểm tra. Hãy hỏi một câu ngắn xem học sinh sẽ quan sát hoặc đo điều gì ở cả hai cốc. Không nhắc cảm biến hay mạch.',
            'Bạn đang ở Bài 2, phần tìm vật liệu. Hãy hỏi một câu ngắn để bạn ấy tự chọn vật liệu có thể làm chậu, đất hoặc thành mô hình. Không nhắc cảm biến hay mạch.',
            'Bạn đang ở Bài 2, phần dựng mô hình vườn mini. Hãy hỏi một câu ngắn: mô hình này giúp kiểm tra phần nào của vấn đề Bài 1? Không thiết kế hộ.',
            'Bạn đang ở Bài 2, phần hai cốc đất. Hãy hỏi xem hai cốc khác nhau mấy chỗ. Nếu nhiều hơn một, gợi ý bạn ấy giữ mọi thứ khác giống nhau.',
            'Bạn đang ở Bài 2, phần ghi ba mốc sau khi thử. Hãy hỏi mốc thứ ba nói thêm điều gì so với mốc đầu. Không kết luận hộ.'
        ];
        const wrap = document.getElementById('de-wrap');
        wrap.innerHTML = `<button class="de-quaylai" id="de-back">← Danh sách bài</button><div class="de-bai-tieude"><h2>Ca 02 · Bài 2 · ${esc(b.ten)}</h2><p class="phude">Dựng lại một góc vườn thật bằng đồ tái chế, rồi thử ý tưởng trước khi tin nó đúng.</p></div><div class="de-khoi de-b2-mo-dau"><b>Chuyện hôm trước:</b> ${esc(vanDe)}<br><span>Hôm nay bạn biến chuyện đó thành mô hình nhỏ để kiểm tra.</span></div><div class="de-nhiem-vu-top"><span>HÀNH TRÌNH KỸ SƯ NHÍ</span><span>${Math.min(current + 1, 5)}/5</span></div><div class="de-nhiem-vu-track"><i style="width:${Math.min(current, 5) * 20}%"></i></div><div class="de-b1-task-shell"><div class="de-mission-list">${stages.map((item, i) => `<section class="de-mission ${status(i)}"><b>${i < current ? '✓' : (i === current ? '→' : '🔒')} ${i + 1}. ${item[2]} ${esc(item[0])}</b>${i === current ? `<div class="de-mission-main"><h3>${esc(item[0])}</h3><p>${esc(item[1])}</p>${active}${khungChatTaiBai('Bạn cần bàn cách làm mô hình? Hỏi Chú Dế ngay tại đây.')}</div>` : ''}</section>`).join('')}${current === 5 ? `<section class="de-mission active"><b>★ Tổng hợp Bài 2</b><div class="de-mission-main">${active}</div></section>` : ''}</div></div>`;
        document.getElementById('de-back').addEventListener('click', () => { if (timerTutorialBai2) { clearInterval(timerTutorialBai2); timerTutorialBai2 = null; } veDanhSach(); });
        ganTutorialBaiHai();
        const hoiTaiBai = batChatTaiBai(b, goiY[Math.min(current, 3)]);
        if (current < 5) ganChuongBaiHai(b, current, hoiTaiBai);
        if (current === 5) document.getElementById('de-b2-finish').addEventListener('click', () => {
            const saved = docTienDo(); saved[2] = saved[2] || {}; saved[2].tuKiemTra = b.tuKiemTra.reduce((all, _, i) => Object.assign(all, {[i]: true}), {}); saved[2].daChucMung = true; ghiTienDo(saved); ghiNhatKyHoc('hoan-thanh-bai', 2, 'Đã dựng mô hình tái chế và ghi ba mốc thử'); hienChucMung(2);
        });
        const cu = document.querySelector('.de-goi-chu-de'); if (cu) cu.remove();
        wrap.parentElement.scrollTop = 0;
    }

    function noiDungChuongBaiHai (step, bangChung, vanDe) {
        if (step === 0) return `<p class="de-b2-note">Vấn đề từ Bài 1: <b>${esc(vanDe)}</b></p><label>Câu hỏi bạn muốn kiểm tra<textarea id="de-b2-cau-hoi" maxlength="360" placeholder="Ví dụ: Mái che có làm đất trong cốc khô chậm hơn không?">${esc(bangChung.cauHoi || '')}</textarea></label><label>Bạn sẽ quan sát hoặc đo điều gì ở cả hai cốc?<textarea id="de-b2-dau-hieu" maxlength="360" placeholder="Ví dụ: Cùng một cách ghi độ khô mặt đất hoặc lượng nước chảy ra ở mỗi mốc.">${esc(bangChung.dauHieu || '')}</textarea></label><div class="de-play-hint" id="de-b2-hint">Chưa có thứ cần quan sát/đo thì đặt hai cốc xuống cũng chưa trả lời được gì.</div><button class="de-nut-chinh" id="de-b2-next">Gửi câu hỏi cho Chú Dế →</button>`;
        if (step === 1) return `<div class="de-b2-search"><b>🔎 Nhiệm vụ của bạn</b><p>Nhìn quanh nhà và tìm vật liệu có thể làm: <b>hai chậu nhỏ</b>, <b>đất</b> và <b>một thứ để thử</b>. Chỉ ghi đồ bạn thật sự có; chưa cần nghĩ cách ghép.</p></div><label>Ba thứ bạn đã tìm được<textarea id="de-b2-vat-lieu" maxlength="360" placeholder="Ghi những đồ bạn thật sự có ở chỗ mình.">${esc(bangChung.vatLieu || '')}</textarea></label><div class="de-play-hint" id="de-b2-hint">Không có cây thật cũng được: đất trong hai cốc là đủ để bắt đầu thử.</div><button class="de-nut-chinh" id="de-b2-next">Gửi danh sách cho Chú Dế →</button>`;
        if (step === 2) return `<p class="de-b2-note">Mô hình này sẽ giúp kiểm tra: <b>${esc(bangChung.cauHoi || vanDe)}</b></p><label>Bạn sẽ dựng phần nào của góc vườn?<textarea id="de-b2-mo-hinh" maxlength="360" placeholder="Ví dụ: hai ly làm chậu; bìa carton làm mái che; que kem đánh dấu từng ly.">${esc(bangChung.moHinh || '')}</textarea></label>${bangChung.xemYTuongMau ? tutorialBaiHai() : `<button class="de-nut-phu" type="button" id="de-b2-show-idea">Bí quá — xem ý tưởng mẫu</button><p class="de-mini-note">Mẫu này chỉ giúp bạn ghép vật liệu đã tìm được, không phải đáp án bắt buộc.</p>`}<div id="de-b2-photo-area">${bangChung.anhMoHinh ? `<img class="de-mission-photo-preview" src="${escAttr(bangChung.anhMoHinh)}" alt="Ảnh mô hình của bạn" onerror="this.remove()">` : ''}<label class="de-play-card" for="de-b2-photo">${bangChung.anhMoHinh ? 'Đổi ảnh mô hình' : '+ Chụp mô hình của bạn (không bắt buộc)'}</label><input id="de-b2-photo" type="file" accept="image/*" capture="environment" style="display:none"></div><div class="de-play-hint" id="de-b2-hint">Dựng đơn giản trước, chưa cần đẹp.</div><button class="de-nut-chinh" id="de-b2-next">Gửi mô hình cho Chú Dế →</button>`;
        if (step === 3) return `<label>Chỉ đổi một thứ nào?<textarea id="de-b2-doi" maxlength="250" placeholder="Ví dụ: một ly có mái che, một ly không có mái che.">${esc(bangChung.dieuDoi || '')}</textarea></label><label>Những thứ nào phải giữ giống nhau?<textarea id="de-b2-giu" maxlength="250" placeholder="Ví dụ: cùng loại đất, cùng lượng nước ban đầu, cùng vị trí đặt.">${esc(bangChung.giuGiong || '')}</textarea></label><div class="de-play-hint" id="de-b2-hint">Nếu đổi hai thứ cùng lúc, bạn sẽ không biết thứ nào làm kết quả khác đi.</div><button class="de-nut-chinh" id="de-b2-next">Gửi kế hoạch thử cho Chú Dế →</button>`;
        return `<p class="de-b2-note">Bạn đang theo dõi: <b>${esc(bangChung.dauHieu || 'điều bạn đã chọn')}</b></p><label>Mốc 1 — lúc bắt đầu<textarea id="de-b2-moc-1" maxlength="360" placeholder="Ghi điều bạn thấy hoặc số bạn đo ở hai cốc ngay lúc bắt đầu.">${esc(bangChung.moc1 || '')}</textarea></label><label>Mốc 2 — sau thời gian bạn chọn<textarea id="de-b2-moc-2" maxlength="360" placeholder="Ghi lại cùng một điều ở cả hai cốc.">${esc(bangChung.moc2 || '')}</textarea></label><label>Mốc 3 — mốc cuối<textarea id="de-b2-moc-3" maxlength="360" placeholder="Ghi lại cùng một điều ở cả hai cốc, chưa kết luận vội.">${esc(bangChung.moc3 || '')}</textarea></label><div class="de-play-hint" id="de-b2-hint">Bạn cần thử thật rồi ghi ba mốc; đây không phải phần lên kế hoạch nữa.</div><button class="de-nut-chinh" id="de-b2-next">Gửi ba mốc cho Chú Dế →</button>`;
    }

    function ganChuongBaiHai (b, step, hoiTaiBai) {
        const nut = document.getElementById('de-b2-next'); const hint = document.getElementById('de-b2-hint');
        const fields = step === 0 ? ['de-b2-cau-hoi', 'de-b2-dau-hieu'] : (step === 1 ? ['de-b2-vat-lieu'] : (step === 2 ? ['de-b2-mo-hinh'] : (step === 3 ? ['de-b2-doi', 'de-b2-giu'] : ['de-b2-moc-1', 'de-b2-moc-2', 'de-b2-moc-3'])));
        datLaiPhanHoiNeuSua(nut, fields.map(id => document.getElementById(id)), nut.textContent);
        const inputAnh = document.getElementById('de-b2-photo');
        if (inputAnh) inputAnh.addEventListener('change', async () => {
            const file = inputAnh.files && inputAnh.files[0]; if (!file) return;
            hint.textContent = 'Đang lưu ảnh mô hình…';
            try {
                const anh = await nenAnhSoTay(file);
                const saved = docTienDo(); saved[2] = saved[2] || {};
                saved[2].bangChung = Object.assign({}, saved[2].bangChung || {}, {anhMoHinh: anh});
                ghiTienDo(saved); ghiNhatKyHoc('anh-mo-hinh', 2, 'Đã lưu ảnh mô hình tái chế');
                moBaiHaiHanhTrinh(b);
            } catch (e) { hint.textContent = 'Chưa đọc được ảnh này. Bạn thử chọn ảnh khác nhé.'; }
        });
        const xemYTuong = document.getElementById('de-b2-show-idea');
        if (xemYTuong) xemYTuong.addEventListener('click', () => {
            const saved = docTienDo(); saved[2] = saved[2] || {};
            saved[2].bangChung = Object.assign({}, saved[2].bangChung || {}, {xemYTuongMau: true});
            ghiTienDo(saved); ghiNhatKyHoc('xem-y-tuong-mau', 2, 'Đã mở ý tưởng mẫu khi đang dựng mô hình tái chế');
            moBaiHaiHanhTrinh(b);
        });
        nut.addEventListener('click', async () => {
            const values = fields.map(id => document.getElementById(id).value.trim());
            const thieu = values.findIndex(value => !value);
            if (thieu !== -1) {
                const tenO = step === 4 ? `Mốc ${thieu + 1}` : 'Ô này';
                hint.textContent = `${tenO} chưa có ghi chép. Bạn ghi điều đã thấy hoặc số đã đo rồi gửi nhé.`;
                document.getElementById(fields[thieu]).focus();
                return;
            }
            const saved = docTienDo(); saved[2] = saved[2] || {}; const bang = Object.assign({}, saved[2].bangChung || {});
            if (step === 0) { bang.cauHoi = values[0]; bang.dauHieu = values[1]; }
            if (step === 1) bang.vatLieu = values[0];
            if (step === 2) bang.moHinh = values[0];
            if (step === 3) { bang.dieuDoi = values[0]; bang.giuGiong = values[1]; }
            if (step === 4) { bang.moc1 = values[0]; bang.moc2 = values[1]; bang.moc3 = values[2]; bang.baMoc = `Mốc 1: ${values[0]}\nMốc 2: ${values[1]}\nMốc 3: ${values[2]}`; }
            saved[2].bangChung = bang; ghiTienDo(saved);
            const hienThi = step === 0 ? `Câu hỏi mình muốn kiểm tra: ${values[0]}\nMình sẽ quan sát/đo: ${values[1]}` : (step === 1 ? `Mình tìm được: ${values[0]}` : (step === 2 ? `Mô hình mình sẽ dựng: ${values[0]}` : (step === 3 ? `Mình chỉ đổi: ${values[0]}\nMình giữ giống nhau: ${values[1]}` : `Mốc 1: ${values[0]}\nMốc 2: ${values[1]}\nMốc 3: ${values[2]}`)));
            const huongDan = step === 0 ? `Bạn vừa đặt câu hỏi: “${values[0]}” và chọn quan sát/đo: “${values[1]}”. Hãy phản hồi ngắn: nhắc lại phần nào sẽ được so sánh ở cả hai cốc, rồi hỏi một câu để bạn ấy tự kiểm tra cách ghi đó có giống nhau ở mỗi mốc không. Không nhắc kit hay cảm biến.` : (step === 1 ? `Bạn vừa tìm vật liệu: “${values[0]}”. Hãy hỏi một câu ngắn xem mỗi thứ sẽ dùng để làm phần nào của mô hình. Không nhắc kit hay cảm biến.` : (step === 2 ? `Bạn vừa mô tả mô hình: “${values[0]}”. Hãy hỏi một câu ngắn xem mô hình này giúp kiểm tra phần nào của câu hỏi đã chọn. Không thiết kế hộ.` : (step === 3 ? `Bạn vừa nêu điều đổi: “${values[0]}”; điều giữ giống nhau: “${values[1]}”. Hãy chỉ hỏi một câu để bạn ấy tự kiểm tra còn thứ nào bị đổi thêm không.` : `Bạn vừa ghi ba mốc thật: mốc 1 “${values[0]}”; mốc 2 “${values[1]}”; mốc 3 “${values[2]}”. Hãy hỏi một câu về điều thay đổi từ mốc 1 đến mốc 3. Không kết luận hộ.`)));
            if (await xinChuDePhanHoi(hoiTaiBai, nut, hint, huongDan, hienThi, nut.textContent)) {
                const latest = docTienDo(); latest[2] = latest[2] || {}; latest[2].hanhTrinhBai2 = Object.assign({}, latest[2].hanhTrinhBai2 || {}, {[['cauHoi','vatLieu','moHinh','haiCoc','baMoc'][step]]: true}); ghiTienDo(latest); ghiNhatKyHoc('nhiem-vu', 2, `Đã hoàn thành phần ${step + 1} của mô hình tái chế`); moBaiHaiHanhTrinh(b);
            }
        });
    }

    function moBaiNhiemVu (b) {
        if (b.so === 1) return moBaiMotHanhTrinh(b);
        if (b.so === 2) return moBaiHaiHanhTrinh(b);
        baiDangMo = b;
        manHinh = 'chiTiet';
        const td = docTienDo();
        if (!td[b.so]) td[b.so] = {};
        const data = td[b.so].bangChung || {};
        const soNhiemVu = b.so === 1 ? 1 : b.cacBuoc.length;
        const current = Math.min(td[b.so].nhiemVu || 0, soNhiemVu - 1);
        const nhan = b.so === 1 ? ['Quan sát cùng Chú Dế'] : ['Thử ý tưởng', 'Chụp mô hình', 'Thử nước', 'Sẵn sàng'];
        const key = `n${current}`;
        const game = troChoiNhiemVu(b.so, current);
        const wrap = document.getElementById('de-wrap');
        wrap.innerHTML = `<button class="de-quaylai" id="de-back">← Danh sách bài</button><div class="de-bai-tieude"><h2>Bài ${b.so} · ${esc(b.ten)}</h2></div>
            <div class="de-nhiem-vu-top"><span>HÀNH TRÌNH</span><span>${current + 1}/${soNhiemVu}</span></div><div class="de-nhiem-vu-track"><i style="width:${(current / soNhiemVu) * 100}%"></i></div>
            <div class="de-mission-list">${Array.from({length: soNhiemVu}, (_, i) => `<section class="de-mission ${i < current ? 'done' : (i === current ? 'active' : 'locked')}"><b>${i < current ? '✓' : (i === current ? '→' : '🔒')} ${i + 1}. ${esc(nhan[i])}</b>${i === current ? `<div class="de-mission-main"><span class="de-mission-icon">${game.icon}</span><h3>${esc(game.title)}</h3><p>${esc(game.prompt)}</p>${game.photo ? `<div id="de-mission-photo-area">${data[key] ? `<img class="de-mission-photo-preview" src="${escAttr(data[key])}" alt="Ảnh quan sát của em">` : ''}<label class="de-play-card" for="de-mission-photo"><span class="de-play-emoji">${data[key] ? '✅' : '📸'}</span>${data[key] ? 'Đã có ảnh — chụp lại nếu muốn' : 'Chạm để chụp hoặc chọn ảnh'}</label><input id="de-mission-photo" type="file" accept="image/*" capture="environment" style="display:none"><div class="de-play-hint" id="de-play-hint">${data[key] ? 'Ảnh đã sẵn sàng.' : 'Chưa có ảnh nào.'}</div><button class="de-mission-ai-button" id="de-mission-ai" ${data[key] ? '' : 'hidden'}>🦗 Nhờ Chú Dế xem cùng</button><small class="de-mission-ai-note">Chỉ khi em bấm nút này, ảnh mới được gửi cho AI để cùng quan sát.</small></div>` : ''}${khungChatTaiBai('Bạn đang làm mô hình tới đâu? Kể Chú Dế nghe để cùng gỡ từng việc.') }<button class="de-nut-chinh" id="de-mission-done">Hoàn thành phần quan sát →</button></div>` : ''}</section>`).join('')}</div>`;
        document.getElementById('de-back').addEventListener('click', veDanhSach);
        batChatTaiBai(b, b.hoiAI[current] || b.hoiAI[0]);
        let luaChon = data[key] || '';
        let anhDaChon = game.photo ? (data[key] || '') : '';
        let daChonSai = false;
        wrap.querySelectorAll('[data-choice]').forEach(card => card.addEventListener('click', () => {
            const option = game.cards[Number(card.dataset.choice)];
            const hint = document.getElementById('de-play-hint');
            if (option[2] === false) { card.classList.add('sai'); daChonSai = true; hint.textContent = 'Chưa đúng rồi, thử thẻ khác nhé!'; return; }
            daChonSai = false;
            luaChon = option[1];
            wrap.querySelectorAll('[data-choice]').forEach(x => x.classList.remove('chon'));
            card.classList.add('chon'); hint.textContent = 'Chuẩn! Bây giờ em qua bước tiếp theo. ✨';
        }));
        const anhInput = document.getElementById('de-mission-photo');
        const nutXemAnh = document.getElementById('de-mission-ai');
        if (anhInput) anhInput.addEventListener('change', async () => {
            const file = anhInput.files && anhInput.files[0];
            if (!file) return;
            const hint = document.getElementById('de-play-hint');
            hint.textContent = 'Đang chuẩn bị ảnh…';
            try {
                anhDaChon = await nenAnhSoTay(file);
                luaChon = anhDaChon;
                const area = document.getElementById('de-mission-photo-area');
                let preview = area.querySelector('.de-mission-photo-preview');
                if (!preview) { preview = document.createElement('img'); preview.className = 'de-mission-photo-preview'; preview.alt = 'Ảnh quan sát của em'; area.insertBefore(preview, area.firstChild); }
                preview.src = anhDaChon;
                hint.textContent = 'Ảnh đã sẵn sàng. Em có thể nhờ Chú Dế xem cùng.';
                nutXemAnh.hidden = false;
            } catch (e) { hint.textContent = 'Chưa đọc được ảnh này. Em thử một ảnh khác nhé.'; }
        });
        if (nutXemAnh) nutXemAnh.addEventListener('click', () => nhoChuDeXemAnhBai1(anhDaChon, nutXemAnh, document.getElementById('de-mission-photo-area')));
        document.getElementById('de-mission-done').addEventListener('click', async () => {
            let value = luaChon;
            const file = document.getElementById('de-mission-photo')?.files?.[0];
            if (file && !anhDaChon) value = await nenAnhSoTay(file);
            if (!value) {
                // Phân biệt "chưa chạm thẻ nào" với "đã chọn nhưng chưa đúng",
                // vì báo "hãy chọn một thẻ" khi em vừa chọn xong sẽ làm em tưởng app không nhận.
                document.getElementById('de-play-hint').textContent = game.photo
                    ? 'Chụp hoặc chọn một ảnh trước nhé.'
                    : (daChonSai
                        ? 'Thẻ đó chưa đúng. Em đọc lại câu hỏi rồi thử thẻ còn lại nhé!'
                        : 'Hãy chọn một thẻ trước nhé.');
                return;
            }
            const saved = docTienDo(); if (!saved[b.so]) saved[b.so] = {};
            if (b.so === 1 && game.photo && !saved[b.so].aiQuanSatPass) {
                document.getElementById('de-play-hint').textContent = 'Hãy trao đổi thêm với Chú Dế về ảnh. Khi Chú Dế nói em đã quan sát đủ rõ thì mới sang bước tiếp theo nhé.';
                return;
            }
            saved[b.so].bangChung = Object.assign({}, saved[b.so].bangChung || {}, {[key]: value});
            if (b.so === 1 && game.photo) {
                saved[b.so].soTay = Object.assign({}, saved[b.so].soTay || {}, {
                    anh: value
                });
            }
            saved[b.so].nhiemVu = Math.min(current + 1, soNhiemVu - 1);
            saved[b.so].tuKiemTra = b.so === 1 ? b.tuKiemTra.reduce((all, _, i) => Object.assign(all, {[i]: true}), {}) : Object.assign({}, saved[b.so].tuKiemTra || {}, {[current]: true});
            ghiTienDo(saved);
            ghiNhatKyHoc('nhiem-vu', b.so, `Hoàn thành nhiệm vụ ${current + 1}: ${nhan[current]}`);
            const next = current + 1;
            if (next >= soNhiemVu) { saved[b.so].daChucMung = true; ghiTienDo(saved); hienChucMung(b.so); } else { wrap.querySelector('.de-mission.active').classList.add('de-mo-tiep'); setTimeout(() => moBaiNhiemVu(b), 280); }
        });
        const cu = document.querySelector('.de-goi-chu-de'); if (cu) cu.remove();
    }

    function veBanDoKhoaHoc (baiDangHoc) {
        return `<nav class="de-course-path" aria-label="Hành trình ${LESSONS.length} bài">${LESSONS.map(b => {
            const xong = baiDaXong(b.so);
            const dangHoc = b.so === baiDangHoc;
            const mo = baiDaMo(b.so);
            const icon = xong ? '✓' : (dangHoc ? '🦗' : (mo ? b.so : '🔒'));
            return `<button class="de-path-stop ${xong ? 'done' : ''} ${dangHoc ? 'current' : ''}" data-de-path-bai="${b.so}" ${mo ? '' : 'disabled'}><i>${icon}</i><span>Bài ${b.so}</span></button>`;
        }).join('')}</nav>`;
    }

    function ganSuKienBanDo (wrap) {
        wrap.querySelectorAll('[data-de-path-bai]').forEach(button => {
            button.addEventListener('click', () => moBai(Number(button.dataset.dePathBai)));
        });
    }

    function luuNhiemVuBai3 (thayDoi, noiDung) {
        const td = docTienDo();
        if (!td[3]) td[3] = {};
        td[3].hanhTrinhBai3 = Object.assign({}, td[3].hanhTrinhBai3 || {}, thayDoi);
        ghiTienDo(td);
        if (noiDung) ghiNhatKyHoc('nhiem-vu', 3, noiDung);
    }

    // Nạp thành công chỉ chứng minh file đã vào bo. Màn này yêu cầu học sinh
    // thử phần cứng thật trước khi app đánh dấu sản phẩm chạy thành công.
    function moManHinhThuMachBai3 () {
        if (document.getElementById('de-thu-mach')) return;
        const modal = document.createElement('div');
        modal.id = 'de-thu-mach';
        modal.innerHTML = `<section class="de-thu-mach-card" role="dialog" aria-modal="true" aria-labelledby="de-thu-mach-title">
            <div class="de-thu-mach-icon">🔔</div>
            <h2 id="de-thu-mach-title">Đã nạp vào ThingBot!</h2>
            <p>App đã nhận tín hiệu nạp thành công. Giờ em hãy kiểm tra xem chương trình có chạy đúng trên mạch thật không nhé.</p>
            <div class="de-thu-mach-steps"><span>1 · Đặt đầu dò vào đất khô.</span><span>2 · Chờ một chút: còi cần kêu.</span><span>3 · Đưa sang đất ẩm: còi phải im.</span></div>
            <div class="de-thu-mach-actions"><button class="de-thu-mach-ok" id="de-thu-mach-ok">🔔 Còi đã chạy đúng</button><button class="de-thu-mach-help" id="de-thu-mach-help">🛠 Còi chưa kêu / có lỗi</button><button class="de-thu-mach-later" id="de-thu-mach-later">Để em thử sau</button></div>
        </section>`;
        document.body.appendChild(modal);
        document.getElementById('de-thu-mach-ok').addEventListener('click', () => {
            luuNhiemVuBai3({daThuDat: true}, 'Đã thử đất thật: còi chỉ kêu khi đất khô');
            modal.remove();
            moChucMungBai3();
        });
        document.getElementById('de-thu-mach-help').addEventListener('click', () => {
            modal.remove();
            guiChoTroLy('Em đã nạp thành công Bài 3 nhưng khi thử đất, còi chưa chạy đúng. Hãy hỏi em lần lượt về nguồn, dây đầu dò, dây còi, cổng cảm biến và giá trị độ ẩm trước khi đề nghị sửa code.');
        });
        document.getElementById('de-thu-mach-later').addEventListener('click', () => modal.remove());
    }

    function moBaiBaHanhTrinh (b) {
        baiDangMo = b;
        manHinh = 'chiTiet';
        const td = docTienDo();
        if (!td[3]) td[3] = {};
        const hanhTrinh = td[3].hanhTrinhBai3 || {};
        const daCode = trangThaiBai3.hasStart && trangThaiBai3.hasSensor && trangThaiBai3.hasCondition && trangThaiBai3.hasAlert;
        const daNap = daNapBai3();
        const daThu = Boolean(hanhTrinh.daThuDat);
        const current = !hanhTrinh.quanSatDat ? 0 : (!hanhTrinh.lapCamBien ? 1 : (!daCode ? 2 : (!daThu ? 3 : 4)));
        const quests = [
            ['Nhìn đất thật', 'Quan sát rồi nói điều em thấy.', '👀'],
            ['Cắm và đo hai đầu', 'Đo đất khô – đất ẩm, rồi chọn ngưỡng.', '🔌'],
            ['Làm còi báo khô', 'Tự ghép các khối trong OpenBlock.', '🧩'],
            ['Nạp & thử với đất', 'Chỉ mở khi app nhận mạch đã nạp xong.', '💧']
        ];
        const trangThai = i => i < current ? 'done' : (i === current ? 'active' : 'locked');
        const wrap = document.getElementById('de-wrap');
        wrap.innerHTML = `<button class="de-quaylai" id="de-back">← Hành trình ${LESSONS.length} bài</button>
            ${veBanDoKhoaHoc(3)}
            <section class="de-bai3-hero"><h2>Bài 3 · ThingBot đo độ ẩm đất</h2><p>Em sẽ đo đất khô và đất ẩm trước, rồi mới làm chiếc chuông nhắc em chăm cây.</p></section>
            <div class="de-nhiem-vu-top" style="margin:18px 2px 0"><span>NHIỆM VỤ HÔM NAY</span><span>${Math.min(current + 1, 4)}/4</span></div><div class="de-nhiem-vu-track"><i style="width:${Math.min(current, 4) * 25}%"></i></div>
            ${quests.map((quest, i) => `<section class="de-bai3-quest ${trangThai(i)}"><div class="de-bai3-quest-head"><span class="de-bai3-quest-num">${i < current ? '✓' : i + 1}</span><div><h3>${quest[2]} ${esc(quest[0])}</h3><small>${esc(quest[1])}</small></div></div>${i === current ? `<div class="de-bai3-quest-main">${noiDungNhiemVuBai3(i, hanhTrinh, daNap)}</div>` : ''}</section>`).join('')}
            ${current === 4 ? '<section class="de-bai3-quest done"><div class="de-bai3-quest-head"><span class="de-bai3-quest-num">★</span><div><h3>Em đã hoàn thành thử thách!</h3><small>Còi báo đất khô đã sẵn sàng giúp em chăm cây.</small></div></div></section>' : ''}`;
        document.getElementById('de-back').addEventListener('click', veDanhSach);
        ganSuKienBanDo(wrap);
        ganSuKienNhiemVuBai3(b, current, wrap, daNap);
        const cu = document.querySelector('.de-goi-chu-de'); if (cu) cu.remove();
        const ai = document.createElement('button'); ai.className = 'de-goi-chu-de'; ai.textContent = '🦗 Hỏi Chú Dế';
        ai.addEventListener('click', () => guiChoTroLy(current < 2 ? 'Em đang chuẩn bị Bài 3. Chú chỉ hỏi gợi mở để em tự kiểm tra cảm biến và đất nhé.' : cauHoiTheoTienDoBai3()));
        document.body.appendChild(ai);
        wrap.parentElement.scrollTop = 0;
    }

    function noiDungNhiemVuBai3 (step, hanhTrinh, daNap) {
        const video = khungTutorialBai3(step);
        if (step === 0) return `${video}<p>Nhìn chậu cây hoặc sờ nhẹ mặt đất. Theo em lúc này đất đang thế nào?</p><div class="de-bai3-observe"><button data-de-observe="khô" class="${hanhTrinh.quanSatDat === 'khô' ? 'chon' : ''}">☀️ Đất khô</button><button data-de-observe="ẩm" class="${hanhTrinh.quanSatDat === 'ẩm' ? 'chon' : ''}">💧 Đất ẩm</button></div><div class="de-play-hint" id="de-bai3-hint">${hanhTrinh.quanSatDat ? 'Em đã ghi lại quan sát của mình.' : 'Không có đáp án đúng — hãy chọn điều em vừa quan sát.'}</div><button class="de-nut-chinh" id="de-bai3-next">Xong phần quan sát →</button>`;
        if (step === 1) return `${video}<p>Trước khi viết lệnh, em hãy kiểm tra an toàn và <b>đo hai lần</b>: đầu dò trong đất khô, rồi trong đất ẩm. Ghi hai số vào Sổ tay; ngưỡng hợp lý nằm giữa chúng.</p><div class="de-bai3-checklist"><span>✓ Đầu dò cắm vào đất, bo ThingBot ở nơi khô</span><span>✓ Dây không bị kéo căng</span><span>✓ Đã ghi số đất khô và đất ẩm</span></div><button class="de-nut-chinh" id="de-bai3-next">Em đã đo và chọn ngưỡng →</button>`;
        if (step === 2) return `${video}<p>Giờ mới tới OpenBlock. Bắt đầu bằng khối vàng <b>“khi Arduino bắt đầu”</b>, rồi đặt <b>liên tục</b> bên dưới trước khi ghép cảm biến, nếu–thì và còi.</p><button class="de-nut-chinh" id="de-bai3-code">Mở bàn lập trình →</button>`;
        if (!daNap) return `${video}<p>Code đã đúng, nhưng app <b>chưa nhận được mạch nạp thành công</b>. Hãy bấm <b>“Nạp vào bo mạch”</b> ở thanh trên. App sẽ tự mở khóa phần thử khi mạch báo nạp xong.</p><div class="de-play-hint">Không có nút “đã nạp” thủ công ở đây.</div><button class="de-nut-chinh de-nut-phu" id="de-bai3-upload-help">Em không nạp được</button>`;
        return `${video}<p><b>✓ App đã nhận mạch nạp thành công.</b> Giờ thử đầu dò với đất khô. Kết quả em thấy là gì?</p><div class="de-bai3-observe"><button data-de-test="đúng">🔔 Còi chỉ kêu khi đất khô</button><button data-de-test="lỗi">🛠️ Còi chưa hoạt động đúng</button></div><div class="de-play-hint" id="de-bai3-hint">Chọn kết quả thử thật để đi tiếp.</div><button class="de-nut-chinh" id="de-bai3-test">Xác nhận đã thử thật →</button>`;
    }

    function khungTutorialBai3 (step) {
        const media = mediaNhiemVuBai3(step);
        const tieuDe = ['Quan sát đất', 'Lắp đầu dò', 'Ghép khối', 'Thử còi'][step] || 'Xem trước';
        if (media) return `<figure class="de-micro-tutorial"><figcaption class="de-micro-tutorial-head"><span>▶ ${tieuDe}</span><small>Video hướng dẫn</small></figcaption>${media.video ? `<video autoplay muted loop playsinline src="${media.url}"></video>` : `<img src="${media.url}" alt="${tieuDe}">`}</figure>`;
        const scene = step === 0 ? '<span class="de-mini-pot"></span><span class="de-mini-plant"></span><span class="de-mini-probe"></span>' :
            (step === 1 ? '<span class="de-mini-wire"></span><span class="de-mini-probe"></span><span class="de-mini-board"></span>' :
            (step === 2 ? '<span class="de-mini-block zero">khi Arduino bắt đầu</span><span class="de-mini-block one">liên tục</span><span class="de-mini-block two">đọc độ ẩm đất</span><span class="de-mini-block three">nếu đất khô</span><span class="de-mini-block four">bật còi</span>' :
                '<span class="de-mini-pot"></span><span class="de-mini-plant"></span><span class="de-mini-droplet">💧</span><span class="de-mini-buzzer"></span>'));
        return `<figure class="de-micro-tutorial"><figcaption class="de-micro-tutorial-head"><span>▶ ${tieuDe}</span><small>Minh hoạ lặp lại</small></figcaption><div class="de-micro-scene">${scene}</div></figure>`;
    }

    function ganSuKienNhiemVuBai3 (b, step, wrap, daNap) {
        if (step === 0) {
            let quanSat = (docTienDo()[3]?.hanhTrinhBai3 || {}).quanSatDat;
            wrap.querySelectorAll('[data-de-observe]').forEach(button => button.addEventListener('click', () => {
                quanSat = button.dataset.deObserve;
                wrap.querySelectorAll('[data-de-observe]').forEach(x => x.classList.toggle('chon', x === button));
                document.getElementById('de-bai3-hint').textContent = 'Đã ghi nhận quan sát của em.';
            }));
            document.getElementById('de-bai3-next').addEventListener('click', () => {
                if (!quanSat) return document.getElementById('de-bai3-hint').textContent = 'Hãy quan sát cây hoặc đất rồi chọn điều em thấy nhé.';
                luuNhiemVuBai3({quanSatDat: quanSat}, 'Đã quan sát đất trước khi lập trình'); moBaiBaHanhTrinh(b);
            });
        } else if (step === 1) {
            document.getElementById('de-bai3-next').addEventListener('click', () => {
                luuNhiemVuBai3({lapCamBien: true}, 'Đã kiểm tra an toàn, đo đất khô – đất ẩm và chọn ngưỡng'); moBaiBaHanhTrinh(b);
            });
        } else if (step === 2) {
            document.getElementById('de-bai3-code').addEventListener('click', () => vaoWorkspace(b));
        } else if (step === 3 && !daNap) {
            document.getElementById('de-bai3-upload-help').addEventListener('click', () => {
                guiChoTroLy('Em đã ghép đúng code Bài 3 nhưng OpenBlock chưa báo nạp mạch thành công. Hãy hỏi em xem ThingBot đã kết nối USB chưa, rồi hướng dẫn kiểm tra cổng và nút Nạp vào bo mạch từng bước.');
            });
        } else if (step === 3) {
            let ketQua = '';
            wrap.querySelectorAll('[data-de-test]').forEach(button => button.addEventListener('click', () => {
                ketQua = button.dataset.deTest;
                wrap.querySelectorAll('[data-de-test]').forEach(x => x.classList.toggle('chon', x === button));
                document.getElementById('de-bai3-hint').textContent = ketQua === 'đúng' ? 'Tốt lắm — em đã có bằng chứng thử thật.' : 'Chú Dế sẽ giúp em tìm lỗi trước khi em xác nhận.';
            }));
            document.getElementById('de-bai3-test').addEventListener('click', () => {
                if (ketQua !== 'đúng') {
                    guiChoTroLy('Em đã ghép đủ code Bài 3 nhưng khi thử đất thì còi chưa hoạt động đúng. Hãy hướng dẫn em kiểm tra theo từng bước: nguồn, dây, nạp chương trình rồi đầu dò.');
                    return;
                }
                luuNhiemVuBai3({daThuDat: true}, 'Đã nạp và thử còi báo đất khô thành công');
                moChucMungBai3();
            });
        }
    }

    function moBai (so) {
        if (!docTienDo().daXemGioiThieu) return moGioiThieu();
        if (!baiDaMo(so)) return veDanhSach();
        const b = LESSONS.find(x => x.so === so);
        if (!b) return;
        ghiNhatKyHoc('mo-bai', b.so, `Bắt đầu Bài ${b.so}: ${b.ten}`);
        if (!b.coLapTrinh) return moBaiNhiemVu(b);
        if (b.so === 3) return moBaiBaHanhTrinh(b);
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

            <section class="de-nhiem-vu">
                <div class="de-nhiem-vu-top"><span>HÀNH TRÌNH BÀI HỌC</span><span>${Math.min(hoc.daXong + 1, hoc.tong)} / ${hoc.tong}</span></div>
                <div class="de-nhiem-vu-track"><i style="width:${Math.round(hoc.daXong / hoc.tong * 100)}%"></i></div>
                <h3>${hoc.tiepTheo ? esc(hoc.tiepTheo.ten) : 'Đã xong phần học!'}</h3>
                <p>${hoc.tiepTheo ? esc(hoc.tiepTheo.noiDung) : 'Em đã đi hết các bước. Hãy hoàn tất phần kiểm tra để pass bài nhé.'}</p>
                ${hoc.tiepTheo && b.so !== 3 ? '<button class="de-nut-chinh" id="de-nhiem-vu-xong">Em làm xong bước này ✓</button>' : ''}
            </section>

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
        const nutNhiemVu = document.getElementById('de-nhiem-vu-xong');
        if (nutNhiemVu) nutNhiemVu.addEventListener('click', () => hoanThanhNhiemVu(b));

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

        const goiCu = document.querySelector('.de-goi-chu-de');
        if (goiCu) goiCu.remove();
        const goiChuDe = document.createElement('button');
        goiChuDe.className = 'de-goi-chu-de';
        goiChuDe.textContent = '🦗 Hỏi Chú Dế';
        goiChuDe.addEventListener('click', () => guiChoTroLy(hoc.tiepTheo ? `Em đang ở Bài ${b.so}, bước “${hoc.tiepTheo.ten}”. ${b.hoiAI[0]}` : b.hoiAI[0]));
        document.body.appendChild(goiChuDe);

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
    function khungChatTaiBai (loiChao) {
        return `<details class="de-b1-help de-chat-toggle"><summary>Cần một gợi ý? Hỏi Chú Dế</summary><div class="de-b1-help-body"><section class="de-chat-bai de-chat-noi-bai"><p>${esc(loiChao || 'Bạn đang kẹt ở đâu? Kể Chú Dế nghe nhé.')}</p><div class="de-chat-bai-msgs" id="de-chat-bai-msgs" aria-live="polite"><div class="de-chat-bai-bot">Mình đang nghe đây. Bạn làm tới đâu rồi?</div></div><form class="de-chat-bai-form" id="de-chat-bai-form"><textarea id="de-chat-bai-input" rows="2" autocomplete="off" placeholder="Nhắn Chú Dế ở ngay đây…"></textarea><button type="submit">Gửi</button></form></section></div></details>`;
    }

    function batChatTaiBai (bai, nguCanh) {
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

        async function hoi (cauHoi, anh, noiDungHienThi) {
            const cau = String(cauHoi || input.value).trim();
            if (!cau) return input.focus();
            input.value = '';
            themTin(noiDungHienThi || cau, 'de-chat-bai-user');
            lichSu.push({role: 'user', content: cau});
            const dangNghi = themTin('Chú Dế đang suy nghĩ…', 'de-chat-bai-bot de-chat-bai-thinking');
            input.disabled = true;
            nutGui.disabled = true;
            try {
                if (!window.ThingEduAI || !window.ThingEduAI.ask) throw new Error('Chú Dế chưa sẵn sàng');
                const cauGuiAI = nguCanh ? `${nguCanh}\n\nHọc sinh vừa hỏi: ${cau}` : cau;
                const traLoi = anh && window.ThingEduAI.askWithImage ?
                    await window.ThingEduAI.askWithImage(cauGuiAI, anh, lichSu.slice(0, -1)) :
                    await window.ThingEduAI.ask(cauGuiAI, lichSu.slice(0, -1));
                dangNghi.textContent = traLoi.text;
                dangNghi.classList.remove('de-chat-bai-thinking');
                lichSu.push({role: 'assistant', content: traLoi.text});
                return {ok: true, text: traLoi.text};
            } catch (e) {
                dangNghi.textContent = 'Chú đang bận một chút. Em thử nhắn lại sau nhé.';
                dangNghi.classList.remove('de-chat-bai-thinking');
                return {ok: false};
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
        ghiNhatKyHoc('vao-workspace', bai.so, `Mở khu lập trình của Bài ${bai.so}`);
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
        document.getElementById('de-tro-giup-done').addEventListener('click', () => {
            moOverlay();
            moBai(3);
        });
        window.addEventListener('de:lesson-demo-status', event => {
            if (!event.detail || event.detail.lesson !== 3 || event.detail.state !== 'cleared') return;
            demo.disabled = false;
            demo.hidden = true;
            tatDemo.hidden = true;
            note.textContent = 'Mẫu đã xóa. Tới lượt em tự ghép lại nhé!';
        });
    }

    function cauHoiTheoTienDoBai3 () {
        if (!trangThaiBai3.hasStart) return 'Em đang ở Bài 3 và chưa có luồng bắt đầu chương trình. Chỉ em tìm khối “khi Arduino bắt đầu”, rồi đặt khối “liên tục” ngay bên dưới.';
        if (!trangThaiBai3.hasSensor) return 'Em đang ở Bài 3 và chưa có khối đọc độ ẩm đất. Chỉ em đúng chỗ tìm khối đó.';
        if (!trangThaiBai3.hasCondition) return 'Em đã kéo khối độ ẩm đất. Chỉ em ghép nó vào điều kiện nếu–thì.';
        if (!trangThaiBai3.hasAlert) return 'Em đã có điều kiện đất khô. Chỉ em thêm khối còi vào bên trong nếu–thì.';
        return 'Em đã ghép xong code Bài 3. Hãy hướng dẫn em theo thứ tự: kiểm tra dây và nguồn, kết nối ThingBot, nạp chương trình, rồi thử đầu dò trong đất khô. Nếu còi không kêu thì em kiểm tra gì trước?';
    }

    function moChucMungBai3 (daNhanFeedback) {
        if (!daNapBai3()) {
            guiChoTroLy('Bài 3 chưa thể pass vì app chưa nhận được mạch nạp thành công. Em hãy nạp lại bằng nút “Nạp vào bo mạch”, rồi quay lại thử đất nhé.');
            return;
        }
        const td = docTienDo();
        if (!td[3]) td[3] = {};
        td[3].daHoanTat = true;
        td[3].daChucMung = true;
        td[3].tuKiemTra = LESSONS.find(item => item.so === 3).tuKiemTra.reduce((ketQua, _, i) => { ketQua[i] = true; return ketQua; }, {});
        delete td[3].workspaceXml;
        delete td[3].blockCount;
        delete td[3].savedAt;
        delete td[3].napWorkspaceXml;
        td[3].workspaceKey = (td[3].workspaceKey || 0) + 1;
        ghiTienDo(td);
        // Feedback là ghi nhận của lần hoàn thành hiện tại, không phải một ô
        // chỉ được gửi duy nhất trong đời học sinh. Dữ liệu cũ vẫn được lưu
        // trong lịch sử, nhưng không được phép chặn form của buổi học mới.
        if (!daNhanFeedback) return moFeedbackSauBai(3, () => moChucMungBai3(true));
        ghiNhatKyHoc('hoan-thanh-bai', 3, 'Đã hoàn thành Bài 3 và xác nhận thử mạch');
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
            <button id="de-chuc-next">Về hành trình học</button>
            <button id="de-chuc-more">Muốn tìm hiểu thêm bài này</button>
            <button id="de-chuc-review">Xem lại bài này</button>
        </div>`;
        document.body.appendChild(modal);
        document.getElementById('de-chuc-next').addEventListener('click', () => {
            modal.remove();
            moOverlay();
            veDanhSach();
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
        const batDau = trangThaiBai3.hasStart;
        const docAm = trangThaiBai3.hasSensor;
        const dieuKien = trangThaiBai3.hasCondition;
        const coi = trangThaiBai3.hasAlert;
        const daXongCode = batDau && docAm && dieuKien && coi;
        const daNap = daNapBai3();
        const tieuDe = document.querySelector('#de-tro-giup-bai strong');
        const tutorial = document.getElementById('de-tro-giup-tutorial');
        const chat = document.getElementById('de-tro-giup-chat');
        const demo = document.getElementById('de-tro-giup-demo');
        const done = document.getElementById('de-tro-giup-done');
        if (tieuDe) tieuDe.textContent = daXongCode ? '🦗 Phần code đã xong!' : '🦗 Bài 3 · Tiến độ của em';
        if (tutorial) tutorial.textContent = daXongCode ? 'Chú hướng dẫn nạp và thử' : 'Chú chỉ từng bước';
        if (chat) chat.textContent = daXongCode ? 'Nạp không được / còi không kêu' : 'Em đang bí chỗ lập trình';
        if (demo && daXongCode) demo.hidden = true;
        if (done) done.hidden = !(daXongCode && daNap);
        const dong = (xong, dang, text) => `<div>${xong ? '✓' : (dang ? '→' : '○')} ${dang ? `<b>${text}</b>` : text}</div>`;
        status.innerHTML =
            dong(batDau, !batDau, 'Kéo “khi Arduino bắt đầu”, rồi thêm “liên tục”') +
            dong(docAm, batDau && !docAm, 'Kéo khối đọc độ ẩm đất') +
            dong(dieuKien, docAm && !dieuKien, 'Đặt vào điều kiện nếu–thì') +
            dong(coi, dieuKien && !coi, 'Thêm còi bên trong nếu–thì') +
            (coi ? (daNap
                ? '<div>✓ App đã nhận mạch nạp thành công</div><div><b>→ Tiếp theo: thử đất khô</b></div>'
                : '<div><b>→ Tiếp theo: bấm “Nạp vào bo mạch” để app kiểm chứng</b></div>') : '');
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
            const dauVanTayMoi = [trangThaiBai3.hasStart, trangThaiBai3.hasSensor, trangThaiBai3.hasCondition, trangThaiBai3.hasAlert, trangThaiBai3.threshold].join('|');
            if (dauVanTayMoi !== dauVanTayBai3) {
                dauVanTayBai3 = dauVanTayMoi;
                const moc = trangThaiBai3.hasAlert && trangThaiBai3.hasStart ? 'Đã tạo luồng bắt đầu và đặt còi cảnh báo vào điều kiện' :
                    (!trangThaiBai3.hasStart ? 'Cần thêm khối “khi Arduino bắt đầu” và “liên tục”' :
                    (trangThaiBai3.hasCondition ? 'Đã tạo điều kiện nếu–thì' :
                    (trangThaiBai3.hasSensor ? 'Đã thêm khối đọc độ ẩm đất' : 'Đang chỉnh sửa chương trình')));
                ghiNhatKyHoc('thao-tac-code', 3, moc);
            }
            const td = docTienDo();
            if (!td[3]) td[3] = {};
            td[3].buocHienTai = trangThaiBai3.hasStart && trangThaiBai3.hasAlert ? 4 :
                (trangThaiBai3.hasCondition ? 3 : (trangThaiBai3.hasSensor ? 2 : (trangThaiBai3.hasStart ? 1 : 0)));
            ghiTienDo(td);
            capNhatBangTienDoBai3();
        });
        window.addEventListener('de:ai-question', event => {
            const bai = docTienDo().baiHienTai || 0;
            const text = (event.detail && event.detail.text) || '';
            ghiNhatKyHoc('hoi-ai', bai, `Đã hỏi Chú Dế${text ? ': ' + text.slice(0, 80) : ''}`);
        });
        window.addEventListener('de:upload-result', event => {
            const td = docTienDo();
            if (!td[3]) td[3] = {};
            if (event.detail && event.detail.success) {
                td[3].napThanhCongAt = event.detail.at || Date.now();
                td[3].napWorkspaceXml = td[3].workspaceXml || '';
                ghiNhatKyHoc('nap-mach', 3, 'Đã nạp chương trình vào mạch thành công');
            } else {
                td[3].napLoiAt = Date.now();
                ghiNhatKyHoc('loi-nap', 3, 'Nạp mạch chưa thành công');
            }
            ghiTienDo(td);
            capNhatBangTienDoBai3();
            if (event.detail && event.detail.success && td.baiHienTai === 3) setTimeout(moManHinhThuMachBai3, 350);
            if (event.detail && event.detail.success && manHinh === 'chiTiet' && baiDangMo && baiDangMo.so === 3 && document.getElementById('de-overlay')?.classList.contains('hien')) moBai(3);
            if (event.detail && !event.detail.success) guiChoTroLy('Em đang ở Bài 3, nạp mạch chưa thành công. Hãy hướng dẫn em kiểm tra nguồn, dây, cổng và kết nối theo từng bước.');
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
        if (td.daDangNhap && !td.maHocSinh && window.DeStemSync && window.DeStemSync.createStudentCode) {
            window.DeStemSync.createStudentCode(td.tenHocSinh || 'Học sinh').then(result => {
                if (!result.studentCode) return;
                const latest = docTienDo(); latest.maHocSinh = result.studentCode; ghiTienDo(latest);
            }).catch(() => {});
        }
        setTimeout(moOverlay, 900);

        window.DeLessonMode = {
            mo: moOverlay,
            dong: dongOverlay,
            moBai: moBai,
            layNguCanh: () => nguCanhWorkspace,
            layNguCanhChuDe: layNguCanhChuDe
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
