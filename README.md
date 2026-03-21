# Hệ Thống Quản Lý Sự Kiện Nội Bộ (Corporate Event Manager)

Hệ thống quản lý và tổ chức sự kiện nội bộ chuyên nghiệp dành cho doanh nghiệp, được xây dựng với cấu trúc hiện đại, phân quyền chặt chẽ và giao diện Dark Theme sang trọng.

## 🚀 Tính năng chính

### 🛡️ Phân quyền 3 cấp độ (RBAC)
- **Admin**: Quản trị toàn bộ người dùng và sự kiện.
- **Organizer**: Điều phối viên, quản lý nội dung chi tiết của sự kiện.
- **User**: Nhân viên, xem thông tin và tham gia sự kiện.

### 📅 Quản lý sự kiện tập trung
- **Tabbed Interface**: Quản lý Lịch trình, Khách mời, Nhân sự và Ngân sách trong một trang duy nhất.
- **Master Lists**: Hệ thống báo cáo tổng hợp cho tất cả sự kiện trên toàn công ty.
- **Quick Check-in**: Công cụ quét ID/QR để xác nhận tham dự nhanh chóng.

### 🔐 Bảo mật nâng cao
- **JWT Authentication**: Xác thực người dùng qua mã Token.
- **Registration**: Đăng ký tài khoản với tính năng xác nhận mật khẩu và mã bảo mật (Captcha số).

## 🛠️ Cấu trúc dự án

### Backend (`/server`)
- **Node.js + Express**: Framework xử lý API.
- **MySQL**: Cơ sở dữ liệu quan hệ (schema tối ưu cho doanh nghiệp).
- **Middleware**: `auth` & `authorize` để kiểm soát truy cập từng Route.

### Frontend (`/frontend`)
- **React.js**: Thư viện UI.
- **Context API**: Quản lý trạng thái đăng nhập toàn cục.
- **Premium CSS**: Hệ thống Design System Dark Mode đồng bộ.

## 📦 Cài đặt

1. **Database**:
   - Chạy các lệnh SQL trong file cấu trúc (đã cung cấp trong conversation) để tạo DB `event_management`.

2. **Backend**:
   ```bash
   cd server
   npm install
   npm start
   ```

3. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---
*Dự án được phát triển theo mô hình Scrum dành cho Đồ án chuyên ngành Công nghệ phần mềm.*
