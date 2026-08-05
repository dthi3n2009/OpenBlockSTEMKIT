/* Chế độ Bài học — Dế Base KIT · Khu vườn thông minh
 * Dựng cho học sinh THCS lớp 6–9 tự học ở nhà.
 * Chạy hoàn toàn ngoại tuyến, không gọi mạng.
 */
(function () {
    'use strict';

    if (window.__DE_LESSON_MODE__) return;
    window.__DE_LESSON_MODE__ = true;

    const MAU = {
        xanh: '#2E8B57',
        xanhDam: '#256F46',
        xanhNhat: '#E8F4EE',
        cam: '#E07B00',
        camNhat: '#FFF3E0',
        chu: '#1F2D28',
        chuNhat: '#5A6B64',
        vien: '#D6E3DC',
        nen: '#F7FAF8'
    };

    const LUU_KEY = 'de_base_kit_tien_do';

    let LESSONS = [];
    let baiDangMo = null;
    let manHinh = 'home'; // home | danhSach | chiTiet

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

    /* ---------- giao diện ---------- */
    function themCSS () {
        const css = `
        .de-overlay {
            position: fixed; inset: 0; z-index: 99990;
            background: ${MAU.nen};
            font-family: "Segoe UI", system-ui, sans-serif;
            color: ${MAU.chu};
            overflow-y: auto;
            display: none;
        }
        .de-overlay.hien { display: block; }
        .de-wrap { max-width: 1100px; margin: 0 auto; padding: 32px 24px 60px; }

        .de-header { text-align: center; margin-bottom: 28px; }
        .de-header h1 {
            font-size: 30px; font-weight: 800; margin: 0 0 6px;
            color: ${MAU.xanh}; letter-spacing: -0.3px;
        }
        .de-header p { font-size: 17px; color: ${MAU.chuNhat}; margin: 0; }

        /* --- màn hình mở đầu --- */
        .de-header-home { padding-top: 22px; margin-bottom: 34px; }
        .de-de { font-size: 54px; line-height: 1; margin-bottom: 6px; }
        .de-header-home h1 { font-size: 34px; }

        .de-home-luoi {
            display: grid; gap: 20px;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            align-items: stretch;
        }
        .de-lua-chon {
            background: #fff; border: 2px solid ${MAU.vien}; border-radius: 20px;
            padding: 28px 26px 24px; cursor: pointer; text-align: left;
            font-family: inherit; color: ${MAU.chu};
            display: flex; flex-direction: column;
            transition: border-color .15s, transform .12s, box-shadow .15s;
        }
        .de-lua-chon:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 26px rgba(0,0,0,.10);
        }
        .de-lua-chon-kit:hover { border-color: ${MAU.xanh}; }
        .de-lua-chon-moi:hover { border-color: ${MAU.cam}; }
        .de-lua-chon-icon { font-size: 44px; line-height: 1; margin-bottom: 12px; }
        .de-lua-chon h2 { margin: 0 0 10px; font-size: 22px; font-weight: 800; }
        .de-lua-chon-kit h2 { color: ${MAU.xanh}; }
        .de-lua-chon-moi h2 { color: ${MAU.cam}; }
        .de-lua-chon-mota {
            margin: 0 0 18px; font-size: 15px; line-height: 1.6;
            color: ${MAU.chuNhat}; flex: 1;
        }
        .de-tiendo { margin-bottom: 16px; }
        .de-tiendo-thanh {
            height: 9px; background: ${MAU.xanhNhat};
            border-radius: 6px; overflow: hidden; margin-bottom: 7px;
        }
        .de-tiendo-day {
            height: 100%; background: ${MAU.xanh};
            border-radius: 6px; transition: width .3s;
        }
        .de-tiendo span { font-size: 13px; color: ${MAU.chuNhat}; font-weight: 600; }
        .de-goiy-nho { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 16px; }
        .de-goiy-nho span {
            font-size: 12.5px; background: ${MAU.camNhat}; color: #8A5000;
            padding: 5px 11px; border-radius: 20px;
        }
        .de-lua-chon-nut {
            background: ${MAU.xanh}; color: #fff; border-radius: 12px;
            padding: 13px 18px; font-size: 16px; font-weight: 700; text-align: center;
        }
        .de-lua-chon-nut-cam { background: ${MAU.cam}; }
        .de-chan-trang {
            text-align: center; margin: 28px auto 0; max-width: 560px;
            font-size: 14px; color: ${MAU.chuNhat}; line-height: 1.6;
        }

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

        .de-video {
            background: ${MAU.xanhNhat}; border: 2px dashed ${MAU.xanh};
            border-radius: 12px; padding: 28px; text-align: center;
            color: ${MAU.xanh}; font-size: 15px; font-weight: 600;
        }
        .de-video small { display: block; font-weight: 400; color: ${MAU.chuNhat}; margin-top: 5px; font-size: 13px; }

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
            position: fixed; left: 14px; bottom: 14px; z-index: 99980;
            background: ${MAU.xanh}; color: #fff; border: none;
            border-radius: 26px; padding: 12px 20px;
            font-size: 15px; font-weight: 700; cursor: pointer;
            box-shadow: 0 4px 14px rgba(46,139,87,.35);
            font-family: "Segoe UI", system-ui, sans-serif;
            display: flex; align-items: center; gap: 8px;
        }
        .de-nut-noi:hover { background: ${MAU.xanhDam}; }

        .de-mach {
            background: ${MAU.camNhat}; border: 1px solid #FFD9A8;
            border-radius: 10px; padding: 12px 16px; margin-bottom: 14px;
            font-size: 14px; color: #8A5000; line-height: 1.55;
        }

        @media (max-width: 640px) {
            .de-wrap { padding: 20px 14px 50px; }
            .de-header h1 { font-size: 24px; }
            .de-luoi { grid-template-columns: 1fr; }
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

    /* ---------- màn hình mở đầu: chọn lối đi ---------- */
    function veHome () {
        manHinh = 'home';
        const wrap = document.getElementById('de-wrap');
        const soXong = LESSONS.filter(b => baiDaXong(b.so)).length;
        const td = docTienDo();
        const dangHoc = td.baiHienTai;

        wrap.innerHTML = `
            <div class="de-header de-header-home">
                <div class="de-de">🦗</div>
                <h1>Chào em!</h1>
                <p>Hôm nay em muốn làm gì?</p>
            </div>

            <div class="de-home-luoi">
                <button class="de-lua-chon de-lua-chon-kit" id="de-chon-kit">
                    <div class="de-lua-chon-icon">🌱</div>
                    <h2>Khu vườn thông minh</h2>
                    <p class="de-lua-chon-mota">
                        Bộ Kit có sẵn · 7 bài học theo thứ tự.
                        Em làm theo từng bài, cuối khoá có một khu vườn tự tưới,
                        tự bật đèn, tự quạt mát.
                    </p>
                    <div class="de-tiendo">
                        <div class="de-tiendo-thanh">
                            <div class="de-tiendo-day" style="width:${(soXong / 7) * 100}%"></div>
                        </div>
                        <span>${soXong > 0 ? `Đã xong ${soXong}/7 bài` : 'Chưa bắt đầu'}</span>
                    </div>
                    <div class="de-lua-chon-nut">
                        ${dangHoc ? `Học tiếp Bài ${dangHoc} →` : 'Bắt đầu Bài 1 →'}
                    </div>
                </button>

                <button class="de-lua-chon de-lua-chon-moi" id="de-chon-moi">
                    <div class="de-lua-chon-icon">✨</div>
                    <h2>Dự án mới</h2>
                    <p class="de-lua-chon-mota">
                        Em tự nghĩ ra sản phẩm của riêng mình.
                        Chú Dế sẽ hỏi han và gợi ý để em tự tìm ra cách làm —
                        không làm hộ em đâu nhé.
                    </p>
                    <div class="de-goiy-nho">
                        <span>Ví dụ: máy nhắc uống nước</span>
                        <span>Đèn ngủ thông minh</span>
                        <span>Chuông báo khách</span>
                    </div>
                    <div class="de-lua-chon-nut de-lua-chon-nut-cam">
                        Tạo dự án mới →
                    </div>
                </button>
            </div>

            <p class="de-chan-trang">
                Chưa biết chọn gì? Em cứ vào <strong>Khu vườn thông minh</strong> trước —
                học xong Bài 1 là em có ý tưởng cho dự án riêng ngay.
            </p>
        `;

        document.getElementById('de-chon-kit').addEventListener('click', veDanhSach);
        document.getElementById('de-chon-moi').addEventListener('click', taoDuAnMoi);
    }

    /* ---------- lối 2: dự án tự do cùng chú Dế ---------- */
    function taoDuAnMoi () {
        const td = docTienDo();
        td.cheDo = 'duAnRieng';
        delete td.baiHienTai;
        ghiTienDo(td);
        capNhatNutNoi();
        dongOverlay();

        setTimeout(() => {
            guiChoTroLy('Em muốn tự làm một dự án riêng. Chú Dế gợi ý giúp em bắt đầu từ đâu?');
        }, 300);
    }

    /* ---------- màn hình chọn bài ---------- */
    function veDanhSach () {
        manHinh = 'danhSach';
        const wrap = document.getElementById('de-wrap');
        const soXong = LESSONS.filter(b => baiDaXong(b.so)).length;

        wrap.innerHTML = `
            <button class="de-quaylai" id="de-ve-home">← Trang chủ</button>
            <div class="de-header">
                <h1>Khu vườn thông minh</h1>
                <p>Dế Base KIT · 7 bài · Em đã xong ${soXong}/7 bài</p>
            </div>
            <div class="de-luoi">
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

        wrap.querySelectorAll('.de-the').forEach(el => {
            el.addEventListener('click', () => moBai(Number(el.dataset.bai)));
        });
    }

    /* ---------- màn hình một bài ---------- */
    function moBai (so) {
        const b = LESSONS.find(x => x.so === so);
        if (!b) return;
        baiDangMo = b;
        manHinh = 'chiTiet';

        const td = docTienDo()[so] || {};
        const check = td.tuKiemTra || {};
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

            ${!b.coLapTrinh ? `<div class="de-mach">
                Bài này em làm bằng tay và quan sát thật, chưa cần lắp mạch hay viết chương trình.
            </div>` : ''}

            <div class="de-khoi">
                <p style="margin:0">${esc(b.moDau)}</p>
            </div>

            <div class="de-khoi">
                <h4>🎯 Sau bài này em sẽ</h4>
                <ul>${b.mucTieu.map(m => `<li>${esc(m)}</li>`).join('')}</ul>
            </div>

            <div class="de-khoi">
                <h4>🎬 Video hướng dẫn</h4>
                ${b.video
                    ? `<video controls style="width:100%;border-radius:10px" src="${esc(b.video)}"></video>`
                    : `<div class="de-video">Video đang được chuẩn bị
                        <small>Em cứ làm theo các bước bên dưới, không cần chờ video nhé.</small>
                       </div>`}
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
                        <input type="checkbox" data-idx="${i}" ${check[i] ? 'checked' : ''}>
                        <span>${esc(t)}</span>
                    </label>`).join('')}
                <p style="margin:12px 0 0;color:${MAU.chuNhat};font-size:14px">
                    Đủ hết các ô là em qua bài sau được rồi.
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
            inp.addEventListener('change', () => danhDauMuc(so, Number(inp.dataset.idx), inp.checked));
        });

        wrap.querySelectorAll('.de-hoi').forEach(btn => {
            btn.addEventListener('click', () => guiChoTroLy(btn.dataset.hoi));
        });

        const vaoLam = document.getElementById('de-vao-lam');
        if (vaoLam) vaoLam.addEventListener('click', () => vaoWorkspace(b));

        const xongBai = document.getElementById('de-xong-bai');
        if (xongBai) xongBai.addEventListener('click', veDanhSach);

        wrap.parentElement.scrollTop = 0;
    }

    /* ---------- nối sang trợ lý AI đã có ---------- */
    function guiChoTroLy (cauHoi) {
        dongOverlay();
        setTimeout(() => {
            const fab = document.getElementById('te-ai-fab');
            const panel = document.getElementById('te-ai-panel');
            if (panel && panel.style.display === 'none' && fab) fab.click();

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
        dongOverlay();
        const td = docTienDo();
        if (!td[bai.so]) td[bai.so] = {};
        td[bai.so].daMo = true;
        td.baiHienTai = bai.so;
        ghiTienDo(td);
        capNhatNutNoi();
    }

    /* ---------- overlay ---------- */
    function moOverlay () {
        const ov = document.getElementById('de-overlay');
        if (!ov) return;
        ov.classList.add('hien');
        // Đang học dở một bài thì mở thẳng bài đó, khỏi bắt em bấm lại từ đầu.
        const td = docTienDo();
        if (td.baiHienTai && LESSONS.some(b => b.so === td.baiHienTai)) {
            moBai(td.baiHienTai);
        } else {
            veHome();
        }
    }

    function dongOverlay () {
        const ov = document.getElementById('de-overlay');
        if (ov) ov.classList.remove('hien');
    }

    function capNhatHuyHieu () {
        const ov = document.getElementById('de-overlay');
        if (!ov || !ov.classList.contains('hien')) return;
        if (manHinh === 'danhSach') veDanhSach();
        else if (manHinh === 'home') veHome();
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

        capNhatNutNoi();

        // Lần đầu mở app thì chào và hiện danh sách bài luôn.
        const td = docTienDo();
        if (!td.daChao) {
            td.daChao = true;
            ghiTienDo(td);
            setTimeout(moOverlay, 900);
        }

        window.DeLessonMode = {mo: moOverlay, dong: dongOverlay, moBai: moBai};
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
