# 03. Thiết kế cơ sở dữ liệu (Database Design)

Hệ thống sử dụng cơ sở dữ liệu quan hệ MySQL với cấu trúc gồm 15+ bảng chính, đảm bảo tính nhất quán của dữ liệu thông qua các ràng buộc khóa ngoại (Constraints).

## 1. Các bảng dữ liệu chính (20 bảng)

### Core & Auth Tables
- `users`: Thông tin tài khoản, mật khẩu (hash), vai trò (`admin`, `organizer`, `user`).
- `events`: Thông tin sự kiện, trạng thái (`draft` đến `completed`), ngân sách tổng.
- `venues`: Danh mục địa điểm (phòng họp, hội trường, online).
- `resources`: Danh mục thiết bị hỗ trợ (Âm thanh, ánh sáng, máy chiếu).

### Event Planning & Resource Modules
- `budgets` & `event_budget`: Quản lý các khoản chi phí chi tiết theo từng sự kiện.
- `event_deadlines`: Các mốc thời gian quan trọng cần hoàn thành trước sự kiện.
- `event_timeline`: Lịch trình chi tiết các hoạt động diễn ra trong buổi sự kiện.
- `event_venue_bookings`: Nhật ký đặt địa điểm, tránh xung đột thời gian.
- `event_resource_bookings`: Nhật ký thuê/mượn thiết bị.

### Operational (Tasks & Staff)
- `event_tasks`: Quản lý công việc (Kanban) với các trạng thái (`todo`, `done`,...).
- `event_staff`: Phân công nhiệm vụ cụ thể cho từng thành sự viên tham gia tổ chức.
- `task_phases`: Phân giai đoạn cho các đầu việc.
- `task_comments` & `task_history`: Lưu vết trao đổi và lịch sử thay đổi công việc.
- `task_reminders`: Hệ thống nhắc nhở thời hạn công việc.

### Attendees & Feedback
- `guests` & `attendees`: Quản lý danh sách khách mời, mã QR định danh và trạng thái check-in.
- `notifications`: Hệ thống thông báo đẩy (Real-time) cho người dùng.
- `feedback`: Đánh giá của khách sau khi kết thúc sự kiện.

## 2. Các ràng buộc toàn vẹn (Integrity Constraints)

Hệ thống thiết kế với các ràng buộc chặt chẽ:
- **Xử lý sự kiện bị xóa**: Sử dụng `ON DELETE CASCADE` cho các bảng Timeline, Tasks, Budget, Attendees. Khi xóa 1 sự kiện, toàn bộ dữ liệu phụ thuộc sẽ được dọn dẹp sạch sẽ.
- **Ràng buộc người dùng**: `ON DELETE SET NULL` cho các trường `owner_id` hoặc `assigned_to` để giữ lại dữ liệu lịch sử ngay cả khi tài khoản nhân viên bị xóa.
- **Định danh duy nhất**: `qr_code` là Unique Key để đảm bảo không có hai khách mời nhận trùng mã định danh.
