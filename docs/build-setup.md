# Dây chuyền build OpenBlockSTEMKIT (dựng ngày 25/07/2026)

> **Trạng thái: CHẠY ĐƯỢC.** App khởi động từ mã nguồn bằng `npm start` trong `desktop\`.
> Lệnh dùng hàng ngày khi sửa giao diện:
> ```powershell
> $env:Path = 'D:\OpenBlockSTEMKIT\tools\node16;' + $env:Path
> $env:NODE_OPTIONS = '--max-old-space-size=8192'
> cd D:\OpenBlockSTEMKIT\desktop; npm start
> ```
> Hai điều bắt buộc, thiếu là hỏng:
> 1. `NODE_OPTIONS=--max-old-space-size=8192` — máy 15 GB RAM vẫn hết bộ nhớ khi đóng gói
>    nếu để mặc định. Đóng bớt ứng dụng nặng trước khi build.
> 2. Module native `usb` phải copy từ `C:\OpenBlockDesktop\resources\app-src\node_modules\usb`
>    (cùng nhóm với noble và bluetooth-hci-socket) — thiếu thì app tắt ngay lúc khởi động.

## Bố cục thư mục

```
D:\OpenBlockSTEMKIT\
├── tools\node16\          Node 16.20.2 portable — CHỈ dùng để build, không cài vào hệ thống
├── gui\                   Mã nguồn giao diện (fork thingblock/thingedublock-gui)
├── desktop\               Mã nguồn vỏ Electron (fork thingblock/thingedublock-desktop, v1.0.2)
├── external-resources\    Mã nguồn khối lệnh (lgthevinh/thingedublock-external-resources)
├── app-mods\              Các bản vá tiêm thẳng vào bản cài C:\OpenBlockDesktop
└── docs\                  Tài liệu khảo sát
```

## Vì sao phải dùng Node 16

GUI dùng webpack 4, **không chạy được trên Node 17 trở lên** (lỗi OpenSSL).
Kiểm thử tự động của chính repo chỉ dùng Node 12/14/16.
Node hệ thống (v24) vẫn giữ nguyên cho việc khác; mọi lệnh build phải đặt Node 16 lên đầu PATH:

```powershell
$env:Path = 'D:\OpenBlockSTEMKIT\tools\node16;' + $env:Path
```

## Cách các mảnh nối với nhau (điểm dễ hiểu nhầm)

Vỏ desktop **không dùng** thư mục `gui\build` do `npm run build` tạo ra.
Nó `import` thẳng mã nguồn React của gui (`openblock-gui/src/...`) rồi tự đóng gói.

Trong `desktop\package.json` đã đổi:
```
"openblock-gui": "file:../gui"      (gốc: github:openblockcc/openblock-gui#openblock-desktop-v2.5.2)
```
npm tạo symlink `desktop\node_modules\openblock-gui` → `D:\OpenBlockSTEMKIT\gui`,
nên **sửa mã nguồn gui là desktop nhận ngay**, không cần cài lại.

## Các bước đã chạy

```powershell
# 1. Giao diện
cd D:\OpenBlockSTEMKIT\gui
npm install --legacy-peer-deps --no-audit --no-fund     # 2110 gói, ~50 giây
npm run build                                            # tuỳ chọn: bản web độc lập, 118 MB

# 2. Vỏ desktop
cd D:\OpenBlockSTEMKIT\desktop
npm install --legacy-peer-deps --ignore-scripts --no-audit --no-fund   # 1989 gói
node node_modules\electron\install.js                    # tải Electron 15 (~140 MB)
npm run compile                                          # đóng gói vào .\dist
```

### Vì sao phải `--ignore-scripts`

Thư viện Bluetooth `@abandonware/noble` cần trình biên dịch C++ của Visual Studio
(máy chưa cài, mà cài thì tốn vài GB). Bỏ qua bước biên dịch, rồi lấy file đã biên dịch sẵn
từ chính bản app đang cài:

```
C:\OpenBlockDesktop\resources\app-src\node_modules\@abandonware\noble\build\
C:\OpenBlockDesktop\resources\app-src\node_modules\@abandonware\bluetooth-hci-socket\build\
                → copy sang D:\OpenBlockSTEMKIT\desktop\node_modules\...
```
Hợp lệ vì cả hai cùng chạy trên Electron 15. `@serialport/bindings-cpp` đã có sẵn bản dựng sẵn,
không cần xử lý.

Nếu sau này cần biên dịch lại native module (đổi phiên bản Electron), phải cài
**Visual Studio Build Tools kèm "Desktop development with C++"**.

### Hệ quả của việc dùng symlink: phải khai báo thêm 4 thư viện

Khi cài `openblock-gui` từ GitHub, npm "nâng" các thư viện con của gui lên thư mục chung
để desktop dùng ké. Dùng `file:../gui` (symlink) thì không còn nâng nữa, nên
`webpack.makeConfig.js` của desktop báo thiếu module. Đã thêm vào `devDependencies` của desktop:

```
autoprefixer@^9.0.1  postcss-import@^12.0.0  postcss-simple-vars@^5.0.1  monaco-editor@^0.20.0
css-loader@^1.0.0    file-loader@2.0.0       postcss-loader@^3.0.0
lodash.omit
```
(phiên bản lấy đúng theo `gui\package.json` để không lệch)

Khai báo tường minh như vậy đúng bản chất hơn (đây là thư viện lúc build của desktop),
và không phụ thuộc vào hành vi nâng ngầm của npm.

Riêng `openblock-blocks` và `openblock-vm` thì **không cài bản riêng cho desktop** — nếu cài,
máy sẽ có hai bản máy ảo cùng lúc và dễ sinh lỗi khó tìm. Thay vào đó tạo liên kết (junction)
trỏ về đúng bản của gui:

```powershell
New-Item -ItemType Junction -Path 'D:\OpenBlockSTEMKIT\desktop\node_modules\openblock-blocks' `
         -Target 'D:\OpenBlockSTEMKIT\gui\node_modules\openblock-blocks'
New-Item -ItemType Junction -Path 'D:\OpenBlockSTEMKIT\desktop\node_modules\openblock-vm' `
         -Target 'D:\OpenBlockSTEMKIT\gui\node_modules\openblock-vm'
```

**Bẫy cần nhớ:** `npm install` xoá mất hai liên kết này (nó dọn những thứ không có trong
package.json). Sau **bất kỳ** lần `npm install` nào trong `desktop`, phải chạy lại đoạn tạo
junction ở trên, nếu không compile sẽ báo `Cannot find module 'openblock-blocks/package.json'`.

## Tài nguyên đi kèm

`external-resources` và `static` được copy từ bản cài `C:\OpenBlockDesktop` sang `desktop\`
thay vì tải lại từ mạng. Nếu cần bản mới: `npm run fetch:exts` / `fetch:static`.
`tools` (Arduino CLI) và `firmwares` chỉ cần khi biên dịch và nạp code xuống mạch — chưa copy.
