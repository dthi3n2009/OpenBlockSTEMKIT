# Backend Cloudflare — hợp đồng API v1

Tài liệu này thay thế hoàn toàn hướng Firebase/Firestore. Ứng dụng OpenBlockSTEMKIT vẫn **local-first**: học sinh học, lưu khối lệnh và hồ sơ trên máy trước; cloud chỉ nhận dữ liệu đã chọn để giáo viên theo dõi lớp.

## Mục tiêu và phạm vi v1

- Đồng bộ tiến độ, mốc học và feedback sau bài từ desktop lên lớp học.
- Giáo viên xem tiến độ, bằng chứng và báo cáo theo học sinh/lớp trên web quản lí.
- Không gửi ảnh, file `.dehoc`, hay nội dung chat thô trong v1.
- Không cho desktop ghi trực tiếp vào cơ sở dữ liệu.

Kiến trúc đề xuất:

```text
OpenBlock Desktop -- batch HTTPS --> Cloudflare Worker API --> D1
                                                     |          |
                                                     v          v
                                                  Queue     Web quản lí
                                                     |
                                                     v
                                      cập nhật báo cáo học tập bất đồng bộ
```

- **Cloudflare Workers**: API HTTPS và xác thực.
- **D1**: dữ liệu quan hệ lớp, học sinh, sự kiện và báo cáo.
- **Cloudflare Queues**: tính lại báo cáo sau khi nhận sự kiện; không làm request đồng bộ bị chậm.
- **R2**: để sau v1, chỉ dùng khi cần phụ huynh/giáo viên chủ động chia sẻ ảnh quan sát.

Worker dùng binding `DB` cho D1 và `SYNC_QUEUE` cho Queue. Bí mật như `JWT_SECRET` chỉ đặt trong Cloudflare secrets, tuyệt đối không đóng vào desktop hay web.

## Định danh và quyền

| Đối tượng | Cách vào hệ thống | Quyền |
|---|---|---|
| Giáo viên | tài khoản web | tạo lớp, tạo mã mời, xem đúng lớp mình phụ trách |
| Máy học sinh | đổi mã mời một lần lấy token thiết bị | chỉ gửi/đọc dữ liệu của chính thiết bị đó |
| Phụ huynh | chưa có trong v1 | chỉ dùng file `.dehoc` local khi cần |

Desktop không lưu mật khẩu giáo viên. Khi ghép lớp, app dùng mã mời một lần và nhận token thiết bị. Token gửi bằng `Authorization: Bearer <token>`; app cần lưu token qua Electron safe storage, không dùng localStorage.

## Dữ liệu app gửi lên

Mỗi sự kiện có dạng sau. `eventId` là UUID do app tạo và không đổi khi gửi lại, để server chống trùng lặp khi máy mất mạng.

```json
{
  "schemaVersion": 1,
  "eventId": "uuid",
  "occurredAt": "2026-08-11T10:20:00.000Z",
  "lessonId": 3,
  "type": "task_completed",
  "payload": {"taskId": "dat-coi-vao-neu-thi"}
}
```

Chỉ nhận các loại: `lesson_opened`, `task_completed`, `workspace_saved`, `code_milestone`, `upload_succeeded`, `upload_failed`, `ai_question_asked`, `lesson_feedback_submitted`, `lesson_completed`.

- `ai_question_asked` chỉ gửi mã bài và chủ đề/loại câu hỏi, không gửi nguyên văn hội thoại mặc định.
- `lesson_feedback_submitted` có thể gửi lựa chọn cảm nhận và ghi chú tự nguyện sau khi hoàn tất bài.
- Hash khối lệnh hoặc danh sách mốc code có thể làm bằng chứng; không cần upload toàn bộ workspace ở v1.

App duy trì **outbox local**: ghi event trước vào máy, gửi theo lô khi có mạng; xóa khỏi outbox chỉ khi API xác nhận. Không có mạng thì trải nghiệm học không thay đổi.

## Route API

Base URL: `https://api.<ten-mien>/v1`. Mọi response lỗi dùng:

```json
{"error":{"code":"INVALID_INVITE","message":"Mã ghép lớp không hợp lệ","requestId":"uuid"}}
```

### Xác thực và ghép lớp

| Method | Route | Ai gọi | Mục đích |
|---|---|---|---|
| GET | `/health` | mọi client | kiểm tra Worker hoạt động |
| POST | `/auth/teacher/login` | web | đăng nhập giáo viên |
| POST | `/auth/refresh` | web/desktop | đổi token còn hiệu lực |
| POST | `/auth/logout` | web/desktop | thu hồi phiên hiện tại |
| POST | `/classes/{classId}/enrollments` | giáo viên | tạo mã mời dùng một lần/có hạn |
| POST | `/devices/enroll` | desktop | đổi `inviteCode`, tên hiển thị thành token thiết bị |

`POST /devices/enroll` request:

```json
{"inviteCode":"ABC-123","studentDisplayName":"An","deviceName":"Máy của An"}
```

Response chỉ trả `studentId`, `deviceId`, access token, refresh token và hạn dùng; không trả dữ liệu của học sinh khác.

### Đồng bộ từ desktop

| Method | Route | Mục đích |
|---|---|---|
| POST | `/sync/batches` | nhận tối đa 100 events/lô, ghi idempotent rồi đưa việc cập nhật report vào Queue |
| GET | `/sync/status` | app biết lần đồng bộ cuối và số event còn chờ trên server |

`POST /sync/batches` request:

```json
{"deviceId":"uuid","events":[{"schemaVersion":1,"eventId":"uuid","occurredAt":"...","lessonId":3,"type":"task_completed","payload":{"taskId":"..."}}]}
```

Response: `{ "accepted": 1, "duplicate": 0, "rejected": [] }`. Một event trùng `deviceId + eventId` luôn được coi là thành công, để app có thể retry an toàn.

### Web quản lí giáo viên

| Method | Route | Mục đích |
|---|---|---|
| GET | `/classes` | danh sách lớp của giáo viên đang đăng nhập |
| GET | `/classes/{classId}/students` | bảng tiến độ, có `lessonId`, `status`, `cursor` để lọc/phân trang |
| GET | `/classes/{classId}/insights` | tổng hợp chỗ nhiều học sinh cần gợi ý hoặc feedback |
| GET | `/students/{studentId}` | hồ sơ tiến độ tóm tắt của một em |
| GET | `/students/{studentId}/sessions` | các buổi học và mốc bằng chứng |
| GET | `/students/{studentId}/reports` | báo cáo theo bài/buổi |
| POST | `/students/{studentId}/teacher-notes` | nhận xét riêng của giáo viên |
| POST | `/reports/generate` | yêu cầu tính lại report; trả `202 Accepted`, xử lí qua Queue |

Worker phải kiểm tra quan hệ giáo viên–lớp–học sinh từ token ở mọi route. Không nhận `teacherId`, `classId` hay `studentId` như một bằng chứng quyền từ client.

## Mô hình D1 tối thiểu

```text
teacher_users, classes, class_teachers
students, student_devices, enrollments
learning_sessions, learning_events, lesson_progress
lesson_feedback, learning_reports, teacher_notes
```

Ràng buộc quan trọng:

- `learning_events`: unique `(device_id, event_id)`.
- `enrollments`: mã mời hash, có `expires_at`, `used_at`, `class_id`.
- `lesson_progress`: unique `(student_id, lesson_id)`; chỉ là bản tóm tắt, nguồn bằng chứng vẫn là events.
- `learning_reports`: lưu `report_version`, nguồn event/session đã dùng và thời điểm tạo.

## Báo cáo học tập

Queue cập nhật báo cáo sau lô event. Nội dung phải theo đúng khuôn:

`đã học được gì → bằng chứng → tiến độ → mức hỗ trợ cần thiết → bước tiếp theo`.

Ba mức đánh giá duy nhất trong v1: **tự làm trôi chảy**, **làm được khi có gợi ý**, **cần thêm quan sát**. Không suy luận “đã hiểu hoàn toàn” từ số lần click hay chat.

## Thứ tự triển khai

1. Worker `health`, xác thực giáo viên, lớp/mã mời và `devices/enroll`.
2. D1 migration cho các bảng trên; `POST /sync/batches` idempotent và outbox desktop.
3. Web giáo viên: lớp, bảng tiến độ, hồ sơ một học sinh.
4. Queue tạo report từ dữ liệu thật.
5. Chỉ sau khi có consent rõ ràng mới thêm upload ảnh qua R2 và route signed-upload.

## Không làm ở v1

- Không tự upload ảnh/sổ tay/chat thô.
- Không nhúng khóa Cloudflare, API AI hay khóa database vào app.
- Không biến cloud thành điều kiện để học bài.
- Không xóa dữ liệu local khi đồng bộ thành công.

Tham khảo kiến trúc Cloudflare: [Workers bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/), [D1 trong Worker](https://developers.cloudflare.com/d1/worker-api/d1-database/), [Queues](https://developers.cloudflare.com/queues/).
