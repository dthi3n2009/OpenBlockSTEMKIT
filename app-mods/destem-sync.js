/* Đồng bộ mốc học DeSTEM. Local-first: mạng lỗi thì giữ hàng đợi cục bộ. */
(function () {
    'use strict';
    const OUTBOX_KEY = 'de_destem_outbox_v1';
    let device = null;
    let syncing = false;

    const typeMap = {
        'mo-bai': 'lesson_opened', 'nhiem-vu': 'task_completed', 'code': 'workspace_saved',
        'thao-tac-code': 'code_milestone', 'nap-mach': 'upload_succeeded', 'loi-nap': 'upload_failed',
        'hoi-ai': 'ai_question_asked', 'feedback-bai': 'lesson_feedback_submitted', 'hoan-thanh-bai': 'lesson_completed'
    };
    const outbox = () => { try { return JSON.parse(localStorage.getItem(OUTBOX_KEY)) || []; } catch (e) { return []; } };
    const saveOutbox = value => localStorage.setItem(OUTBOX_KEY, JSON.stringify(value.slice(-300)));
    const eventId = () => crypto.randomUUID ? crypto.randomUUID() : `evt-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    async function loadDevice () {
        try { device = await require('electron').ipcRenderer.invoke('de-destem-device:load'); } catch (e) { device = null; }
        return device;
    }
    async function request(path, body, accessToken) {
        return require('electron').ipcRenderer.invoke('de-destem-api:request', {path, body, accessToken});
    }
    async function flush () {
        if (!device || syncing || !navigator.onLine) return;
        const events = outbox();
        if (!events.length) return;
        syncing = true;
        try {
            const batch = events.slice(0, 100);
            await request('/v1/sync/batches', {deviceId: device.deviceId, events: batch}, device.accessToken);
            saveOutbox(events.slice(batch.length));
            window.dispatchEvent(new CustomEvent('de:destem-sync-status', {detail: {state: 'synced'}}));
        } catch (e) {
            window.dispatchEvent(new CustomEvent('de:destem-sync-status', {detail: {state: 'waiting', message: e.message}}));
        } finally { syncing = false; }
    }
    function record(log) {
        const type = typeMap[log?.loai];
        if (!type || !Number.isInteger(log.bai) || log.bai < 1 || log.bai > 7) return;
        const events = outbox();
        const payload = {source: 'openblock-desktop', action: log.loai};
        if (log.loai === 'feedback-bai' && log.payload && typeof log.payload === 'object') {
            payload.feedbackFeeling = String(log.payload.feedbackFeeling || '').slice(0, 80);
            payload.feedbackNote = String(log.payload.feedbackNote || '').slice(0, 500);
        }
        events.push({schemaVersion: 1, eventId: eventId(), occurredAt: new Date(log.luc || Date.now()).toISOString(), lessonId: log.bai, type, payload});
        saveOutbox(events);
        flush();
    }
    function importExistingProgress() {
        let progress;
        try { progress = JSON.parse(localStorage.getItem('de_base_kit_tien_do')) || {}; } catch (e) { return; }
        const events = outbox();
        const now = new Date().toISOString();
        for (let lessonId = 1; lessonId <= 7; lessonId += 1) {
            const lesson = progress[lessonId];
            if (!lesson) continue;
            events.push({schemaVersion: 1, eventId: eventId(), occurredAt: now, lessonId, type: 'lesson_opened', payload: {source: 'local-import', action: 'existing_progress'}});
            if (lesson.feedbackBai || lesson.daHoanTat) {
                events.push({schemaVersion: 1, eventId: eventId(), occurredAt: now, lessonId, type: 'lesson_completed', payload: {source: 'local-import', action: 'existing_completion'}});
            }
        }
        saveOutbox(events);
    }
    async function enroll({inviteCode, studentDisplayName, deviceName}) {
        const result = await request('/v1/devices/enroll', {inviteCode, studentDisplayName, deviceName});
        device = {studentId: result.studentId, deviceId: result.deviceId, accessToken: result.accessToken};
        await require('electron').ipcRenderer.invoke('de-destem-device:save', device);
        importExistingProgress();
        await flush();
        return device;
    }
    async function createStudentCode(studentDisplayName) {
        if (device) return {studentCode: localStorage.getItem('de_destem_student_code') || '', connected: true};
        const result = await request('/v1/student-registrations', {studentDisplayName, deviceName: 'OpenBlock Desktop (Windows)'});
        device = {studentId: result.studentId, deviceId: result.deviceId, accessToken: result.accessToken};
        await require('electron').ipcRenderer.invoke('de-destem-device:save', device);
        localStorage.setItem('de_destem_student_code', result.studentCode);
        return {studentCode: result.studentCode, connected: false};
    }
    async function disconnect () {
        device = null;
        saveOutbox([]);
        await require('electron').ipcRenderer.invoke('de-destem-device:clear');
    }
    window.addEventListener('de:learning-log', event => record(event.detail));
    window.addEventListener('online', flush);
    window.DeStemSync = {enroll, createStudentCode, disconnect, flush, status: () => ({connected: Boolean(device), studentCode: localStorage.getItem('de_destem_student_code') || '', pending: outbox().length})};
    loadDevice().then(() => { flush(); setInterval(flush, 30000); });
}());
