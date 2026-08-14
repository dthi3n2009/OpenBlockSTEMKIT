# Feedback sau bài — hợp đồng dữ liệu v1

Feedback chỉ xuất hiện sau khi học sinh hoàn thành bài. App luôn lưu bản local-first trong `de_base_kit_tien_do`.

Khi máy đã kết nối DeSTEM Hub, app đưa thêm một sự kiện `lesson_feedback_submitted` vào hàng đợi đồng bộ:

```json
{
  "schemaVersion": 1,
  "lessonId": 3,
  "type": "lesson_feedback_submitted",
  "payload": {
    "source": "openblock-desktop",
    "action": "feedback-bai",
    "feedbackFeeling": "Em có chỗ đang bí",
    "feedbackNote": "Em chưa hiểu vì sao phải chọn ngưỡng."
  }
}
```

- `feedbackFeeling`: tối đa 80 ký tự.
- `feedbackNote`: tùy chọn, tối đa 500 ký tự.
- Không gửi ảnh, workspace XML hay lịch sử chat cùng feedback.

Web DeSTEM Hub nên nhóm feedback theo `lessonId` và `feedbackFeeling`, sau đó cho giáo viên/đội nội dung xem góp ý tự nguyện. Không dùng feedback để chấm điểm hay suy đoán năng lực học sinh.
