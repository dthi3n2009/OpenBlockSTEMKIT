/* Cầu nối mạng DeSTEM chạy ở Electron main process.
 * Renderer không gọi API trực tiếp, nên token không phụ thuộc CORS của file://. */
'use strict';

const {ipcMain} = require('electron');
const https = require('https');

const HOST = 'destem-api-staging.td-uyy003.workers.dev';
const ALLOWED_PATHS = new Set(['/v1/student-registrations', '/v1/devices/enroll', '/v1/sync/batches']);

ipcMain.handle('de-destem-api:request', (_event, request) => new Promise((resolve, reject) => {
    if (!request || typeof request !== 'object' || !ALLOWED_PATHS.has(request.path)) {
        reject(new Error('Yêu cầu DeSTEM không hợp lệ'));
        return;
    }
    const body = JSON.stringify(request.body || {});
    const headers = {'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body)};
    if (typeof request.accessToken === 'string' && request.accessToken) headers.Authorization = `Bearer ${request.accessToken}`;
    const call = https.request({hostname: HOST, path: request.path, method: 'POST', headers}, response => {
        let text = '';
        response.setEncoding('utf8');
        response.on('data', chunk => { text += chunk; });
        response.on('end', () => {
            let data = {};
            try { data = text ? JSON.parse(text) : {}; } catch (e) { /* response handled below */ }
            if (response.statusCode < 200 || response.statusCode >= 300) {
                reject(new Error(data?.error?.message || 'Không thể kết nối DeSTEM Hub'));
                return;
            }
            resolve(data);
        });
    });
    call.setTimeout(15000, () => call.destroy(new Error('Kết nối DeSTEM quá lâu')));
    call.on('error', error => reject(new Error(error.message || 'Không thể kết nối DeSTEM Hub')));
    call.write(body);
    call.end();
}));
