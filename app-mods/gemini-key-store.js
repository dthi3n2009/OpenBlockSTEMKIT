/* Lưu API key cho bản demo bằng Electron safeStorage (Windows DPAPI).
 * File trên đĩa chỉ chứa dữ liệu đã mã hóa theo tài khoản Windows hiện tại.
 */
'use strict';

const {app, BrowserWindow, dialog, ipcMain, safeStorage} = require('electron');
const fs = require('fs');
const path = require('path');

// Chỉ cho một phiên Dế Lab chạy để tránh nhiều renderer cùng tranh tài nguyên.
if (!app.requestSingleInstanceLock()) {
    app.quit();
} else {
    app.on('second-instance', () => {
        const win = BrowserWindow.getAllWindows().find(item => !item.isDestroyed());
        if (!win) return;
        if (win.isMinimized()) win.restore();
        win.focus();
    });
}

const secretFile = () => path.join(app.getPath('appData'), 'DeLab', 'ai-key.bin');

function encryptionReady () {
    return safeStorage && safeStorage.isEncryptionAvailable();
}

ipcMain.handle('de-ai-key:load', () => {
    try {
        if (!encryptionReady() || !fs.existsSync(secretFile())) return '';
        return safeStorage.decryptString(fs.readFileSync(secretFile()));
    } catch (e) {
        return '';
    }
});

ipcMain.handle('de-ai-key:save', (_event, key) => {
    if (typeof key !== 'string' || key.length < 20 || key.length > 300) {
        throw new Error('API key không hợp lệ');
    }
    if (!encryptionReady()) throw new Error('Máy chưa sẵn sàng mã hóa API key');

    const file = secretFile();
    fs.mkdirSync(path.dirname(file), {recursive: true});
    fs.writeFileSync(file, safeStorage.encryptString(key));
    return true;
});

ipcMain.handle('de-ai-key:clear', () => {
    try {
        if (fs.existsSync(secretFile())) fs.unlinkSync(secretFile());
    } catch (e) { /* vẫn cho app chuyển về offline */ }
    return true;
});

ipcMain.handle('de-backup:save', async (event, contents) => {
    if (typeof contents !== 'string' || contents.length > 25 * 1024 * 1024) {
        throw new Error('Dữ liệu sao lưu không hợp lệ');
    }
    const result = await dialog.showSaveDialog(BrowserWindow.fromWebContents(event.sender), {
        title: 'Lưu bản sao lưu Dế Lab',
        defaultPath: `de-lab-sao-luu-${new Date().toISOString().slice(0, 10)}.dehoc`,
        filters: [{name: 'Sao lưu Dế Lab', extensions: ['dehoc']}]
    });
    if (result.canceled || !result.filePath) return false;
    fs.writeFileSync(result.filePath, contents, 'utf8');
    return true;
});

ipcMain.handle('de-backup:open', async event => {
    const result = await dialog.showOpenDialog(BrowserWindow.fromWebContents(event.sender), {
        title: 'Chọn bản sao lưu Dế Lab',
        properties: ['openFile'],
        filters: [{name: 'Sao lưu Dế Lab', extensions: ['dehoc']}]
    });
    if (result.canceled || !result.filePaths[0]) return '';
    return fs.readFileSync(result.filePaths[0], 'utf8');
});
