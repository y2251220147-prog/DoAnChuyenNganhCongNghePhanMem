# 05. Hướng dẫn cài đặt & sử dụng (Setup Guide)

## 1. Yêu cầu hệ thống
- **Node.js**: Phiên bản 18.x trở lên.
- **MySQL Server**: Phiên bản 8.0 trở lên.
- **Package Manager**: NPM hoặc Yarn.

## 2. Cài đặt Backend
1. Chuyển đến thư mục: `cd server`
2. Cài đặt thư viện: `npm install`
3. Cấu hình môi trường: Sao chép `.env.example` thành `.env` và điền chính xác:
    - `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME` (theo cấu hình MySQL của bạn).
    - `JWT_SECRET`: Chuỗi ký tự bảo mật (Ví dụ: `eventpro_secret_2024`).
4. Khởi tạo dữ liệu: Import file `schema.sql` vào MySQL.
5. Khởi động: `npm run dev` (Sử dụng Nodemon để tự động reload).

## 3. Cài đặt Frontend
1. Chuyển đến thư mục: `cd frontend`
2. Cài đặt thư viện: `npm install`
3. Khởi động: `npm run dev`
4. Truy cập: `http://localhost:5173`

## 4. Tài khoản Demo chuẩn (Từ Database)
Sau khi import `schema.sql`, bạn có thể đăng nhập bằng các tài khoản sau (Mật khẩu mặc định: `123456` cho tất cả):

- **Admin**: `admin@eventpro.com` (Toàn quyền hệ thống).
- **Organizer**: `organizer@eventpro.com` (Quản lý sự kiện/ngân sách).
- **User**: `user@eventpro.com` (Nhân viên/Thành viên tham gia).

## 5. Các lỗi thường gặp (Troubleshooting)
- **Lỗi 500 khi login**: Kiểm tra kết nối MySQL và file `.env` đã đúng tên Database chưa.
- **Lỗi CORS**: Đảm bảo cổng Frontend (5173) khớp với khai báo trong `server.js`.
- **Lỗi 401 trên Frontend**: Token đã hết hạn, hãy Reset localStorage và đăng nhập lại.
