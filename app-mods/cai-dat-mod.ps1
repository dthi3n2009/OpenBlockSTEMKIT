<#
    Cài các bản vá của Dế Base KIT vào app OpenBlockDesktop đã cài sẵn.
    Chạy lại được nhiều lần, không nhân đôi thẻ <script>.

    Dùng:
        powershell -ExecutionPolicy Bypass -File cai-dat-mod.ps1
        powershell -ExecutionPolicy Bypass -File cai-dat-mod.ps1 -GoBo    # gỡ mod, về bản gốc

    Xem HANDOFF.md §5 để hiểu vì sao phải tắt app.asar.
#>
param(
    [string]$AppDir = 'C:\OpenBlockDesktop',
    [switch]$GoBo
)

$ErrorActionPreference = 'Stop'
$modDir = $PSScriptRoot
$res    = Join-Path $AppDir 'resources'
$appJs  = Join-Path $res 'app'
$asar   = Join-Path $res 'app.asar'
$asarTat= Join-Path $res 'app.asar.tam-tat'

$cacFile = @('ai-assistant.js', 'lesson-mode.js', 'lessons-debasekit.js', 'userdata-guard.js')
$cacScript = @('ai-assistant.js', 'lesson-mode.js')

function Dung-App {
    Get-Process OpenBlockDesktop -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 2
}

if (-not (Test-Path $res)) {
    Write-Error "Khong thay $res. App chua duoc cai, hoac duong dan khac -> dung tham so -AppDir."
}

# ---------------- GỠ BỎ ----------------
if ($GoBo) {
    Dung-App
    if (Test-Path $asarTat) {
        if (Test-Path $asar) { Remove-Item $asar -Force }
        Rename-Item $asarTat 'app.asar'
        Write-Host "Da bat lai app.asar goc." -ForegroundColor Green
    }
    Write-Host "Da go mod. App chay lai nhu ban goc cua nha san xuat." -ForegroundColor Green
    Write-Host "(Thu muc resources\app van con, nhung app.asar duoc uu tien nen khong dung toi.)"
    exit 0
}

# ---------------- CÀI ĐẶT ----------------
Dung-App

# 1. Thư mục app phải tồn tại (giải nén sẵn từ app.asar)
if (-not (Test-Path $appJs)) {
    Write-Host "Chua co thu muc resources\app -> dang giai nen tu app.asar..." -ForegroundColor Yellow
    $nguon = if (Test-Path $asar) { $asar } elseif (Test-Path $asarTat) { $asarTat } else { $null }
    if (-not $nguon) { Write-Error "Khong tim thay app.asar de giai nen." }
    npx -y @electron/asar extract $nguon $appJs
    if (-not (Test-Path (Join-Path $appJs 'index.html'))) { Write-Error "Giai nen that bai." }
}

# 2. Chép các file mod vào
foreach ($f in $cacFile) {
    $src = Join-Path $modDir $f
    if (Test-Path $src) {
        Copy-Item $src (Join-Path $appJs $f) -Force
        Write-Host "  chep $f"
    } else {
        Write-Warning "  thieu $f trong $modDir"
    }
}

# 3. Tiêm thẻ <script> vào index.html (bỏ qua nếu đã có)
$indexPath = Join-Path $appJs 'index.html'
$html = Get-Content $indexPath -Raw -Encoding UTF8
$daSua = $false
foreach ($s in $cacScript) {
    if ($html -notmatch [regex]::Escape($s)) {
        $html = $html -replace '(<script src="renderer\.js"></script>)', "`$1`n<script src=`"$s`"></script>"
        $daSua = $true
        Write-Host "  them the script: $s"
    }
}
if ($daSua) {
    [System.IO.File]::WriteAllText($indexPath, $html, (New-Object System.Text.UTF8Encoding $false))
} else {
    Write-Host "  index.html da co du the script"
}

# 4. Vá main.js gọi userdata-guard (chống bug treo man hinh cho)
$mainPath = Join-Path $appJs 'main.js'
$main = Get-Content $mainPath -Raw -Encoding UTF8
if ($main -notmatch 'userdata-guard') {
    $main = 'require("./userdata-guard.js");' + "`n" + $main
    [System.IO.File]::WriteAllText($mainPath, $main, (New-Object System.Text.UTF8Encoding $false))
    Write-Host "  da va main.js goi userdata-guard"
} else {
    Write-Host "  main.js da co ban va"
}

# 5. Tắt app.asar để Electron dùng thư mục app
#    (Electron UU TIEN app.asar hon thu muc app -> khong tat thi moi sua deu vo nghia)
if (Test-Path $asar) {
    if (Test-Path $asarTat) { Remove-Item $asarTat -Force }
    Rename-Item $asar 'app.asar.tam-tat'
    Write-Host "  da tat app.asar (doi ten -> app.asar.tam-tat)"
}

# 6. Nối external-resources sang repo nguon (neu co)
$repoExt = Join-Path (Split-Path $modDir -Parent) 'external-resources'
$appExt  = Join-Path $AppDir 'external-resources'
if ((Test-Path $repoExt) -and -not ((Get-Item $appExt -ErrorAction SilentlyContinue).LinkType)) {
    Write-Host ""
    Write-Host "Goi y: noi khoi lenh cua app sang repo nguon de sua la thay ngay:" -ForegroundColor Yellow
    Write-Host "  Remove-Item '$appExt' -Recurse -Force"
    Write-Host "  New-Item -ItemType Junction -Path '$appExt' -Target '$repoExt'"
}

Write-Host ""
Write-Host "XONG. Mo app de kiem tra:" -ForegroundColor Green
Write-Host "  Start-Process '$AppDir\OpenBlockDesktop.exe'"
Write-Host "Muon go mod: chay lai script nay voi tham so -GoBo"
