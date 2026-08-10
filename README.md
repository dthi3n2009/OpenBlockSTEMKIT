# OpenBlockSTEMKIT

Môi trường tự học STEM tiếng Việt cho học sinh THCS, xây trên OpenBlock và
được thiết kế cho Dế Base KIT — Khu vườn thông minh.

Học sinh có thể học theo từng bài, lập trình kéo-thả với ThingBot, lưu tiến độ
ngay trên máy và nhận hướng dẫn từ Chú Dế. Các chức năng cốt lõi vẫn hoạt động
khi không có mạng.

## Phạm vi hiện tại

- Hành trình học theo KIT và Dự án riêng.
- Bài 1–2: quan sát/thực hành, sổ tay cục bộ và Chú Dế trong bài.
- Bài 3: cảm biến độ ẩm đất, điều kiện, còi, tự lưu tiến độ và hỗ trợ từng bước.
- Sao lưu/khôi phục dữ liệu học bằng file `.dehoc` trên máy.

Đây là bản thử nghiệm nội bộ. Không đưa API key, dữ liệu học sinh hoặc file
backup vào repository.

## Cấu trúc

- `app-mods/`: giao diện học, nội dung bài, Chú Dế và script cài đặt.
- `docs/`: tài liệu kỹ thuật và giáo trình đã rút gọn.
- `gui/`, `desktop/`, `external-resources/`: các fork OpenBlock/ThingEdu tách
  thành repository riêng, không được gộp vào repository này.

## Ghi công và giấy phép

OpenBlockSTEMKIT là bản tùy biến xây trên các thành phần OpenBlock/ThingEdu.
Các bản sao nguồn cục bộ hiện có của GUI, Desktop và External Resources đều
được phát hành theo giấy phép MIT của OpenBlock.cc. Xem
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) trước khi phát hành.

Mã tùy biến trong repository này chưa được gắn giấy phép phát hành riêng.
Giáo trình, video, hình ảnh, tên thương hiệu và tài liệu phần cứng chỉ được
đưa lên công khai khi đã có quyền sử dụng/phát hành từ chủ sở hữu.

## Phát triển

Đọc [HANDOFF.md](HANDOFF.md) trước khi chỉnh sửa. Hướng dẫn build và các bẫy
kỹ thuật nằm ở [docs/build-setup.md](docs/build-setup.md).
