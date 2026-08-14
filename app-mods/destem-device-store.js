/* Lưu mã thiết bị DeSTEM bằng Electron safeStorage (Windows DPAPI).
 * Không lưu access token của học sinh trong localStorage. */
'use strict';

const {app, ipcMain, safeStorage} = require('electron');
const fs = require('fs');
const path = require('path');

const deviceFile = () => path.join(app.getPath('appData'), 'DeLab', 'destem-device.bin');
const ready = () => safeStorage && safeStorage.isEncryptionAvailable();

ipcMain.handle('de-destem-device:load', () => {
    try {
        if (!ready() || !fs.existsSync(deviceFile())) return null;
        return JSON.parse(safeStorage.decryptString(fs.readFileSync(deviceFile())));
    } catch (e) { return null; }
});

ipcMain.handle('de-destem-device:save', (_event, device) => {
    if (!device || typeof device !== 'object' || typeof device.deviceId !== 'string' ||
        typeof device.studentId !== 'string' || typeof device.accessToken !== 'string' ||
        device.accessToken.length < 32) throw new Error('Thông tin ghép lớp không hợp lệ');
    if (!ready()) throw new Error('Máy chưa sẵn sàng mã hóa dữ liệu ghép lớp');
    const file = deviceFile();
    fs.mkdirSync(path.dirname(file), {recursive: true});
    fs.writeFileSync(file, safeStorage.encryptString(JSON.stringify(device)));
    return true;
});

ipcMain.handle('de-destem-device:clear', () => {
    try { if (fs.existsSync(deviceFile())) fs.unlinkSync(deviceFile()); } catch (e) { /* ignore */ }
    return true;
});
