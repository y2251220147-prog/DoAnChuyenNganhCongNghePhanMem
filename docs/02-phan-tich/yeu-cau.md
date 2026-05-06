# 02. Phân tích yêu cầu (Systems Analysis)

## 1. Yêu cầu chức năng (Functional Requirements)

### Phân hệ Người dùng & Bảo mật
- **Đăng ký/Đăng nhập**: Người dùng có thể tạo tài khoản và đăng nhập bằng Email/Mật khẩu.
- **Quản lý hồ sơ**: Xem thông tin cá nhân và quản lý bảo mật (đổi mật khẩu/hết hạn phiên).
- **Phân quyền (3-Role System)**: 
    - `Admin`: Quản trị viên (Phê duyệt sự kiện, quản lý người dùng, khai báo Địa điểm/Tài nguyên).
    - `Organizer`: Người tổ chức (Lập kế hoạch, quản lý ngân sách, timeline, khách mời và phân công task).
    - `User`: Thành viên tham gia (Thực hiện task được giao, check-in QR và gửi Feedback).

### Phân hệ Quản lý Sự kiện & Tài chính
- **Cấu hình sự kiện**: Thiết lập thời gian, địa điểm, sức chứa (Capacity) và ngân sách tổng.
- **Quản lý Ngân sách (Budget)**: Theo dõi quỹ thu chi chi tiết cho từng sự kiện.
- **Quản lý Địa điểm (Venues)**: Quản lý hạ tầng (Hội trường/Phòng họp), sức chứa và trạng thái bảo trì.
- **Tiến độ & Timeline**: Hệ thống Dashboard theo dõi mốc thời gian thực hiện sự kiện.

### Phân hệ Vận hành & Check-in
- **Quản lý Công việc (Tasks)**: Phân công công việc (Assigned to), theo dõi Deadline và Ghi chú (Notes).
- **Mã QR & Check-in**: Tự động tạo mã QR định danh cho từng khách mời, hỗ trợ quét điểm danh qua Web/Mobile.
- **Feedback**: Trình thu thập đánh giá dịch vụ từ người tham dự.

## 2. Yêu cầu phi chức năng (Non-functional Requirements)
- **Tính an toàn**: Hashing Bcrypt, phiên làm việc JWT 2h, chặn SQL Injection/XSS.
- **Tính toàn vẹn**: Ràng buộc Foreign Key quan hệ 20+ bảng dữ liệu.
- **Khả năng mở rộng**: Tách biệt logic API Backend và Frontend (Next.js/React).

## 3. Ma trận phân quyền hiện tại (Role Matrix)

| Chức năng | Admin | Organizer | User |
|-----------|:---:|:---:|:---:|
| Quản lý Người dùng | ✅ | ❌ | ❌ |
| Phê duyệt Sự kiện | ✅ | ❌ | ❌ |
| Tạo sự kiện, Ngân sách | ✅ | ✅ | ❌ |
| Quản lý Địa điểm/Tài nguyên | ✅ | ❌ | ❌ |
| Quản lý Tasks | ✅ | ✅ | ✅ |
| Check-in Khách mời | ✅ | ✅ | ✅ |
| Xem lịch trình/QR cá nhân | ✅ | ✅ | ✅ |
