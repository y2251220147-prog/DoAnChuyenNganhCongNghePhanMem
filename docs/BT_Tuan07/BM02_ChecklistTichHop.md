# BIỂU MẪU 02: DANH SÁCH KIỂM TRA TÍCH HỢP FRONTEND-BACKEND
*(Sprint 2 - Tuần 1)*

**Tên dự án:** EventPro Management System  
**Nhóm:** [Tên nhóm]  
**Ngày kiểm tra:** 02/04/2026  
**Người kiểm tra:** Nguyễn Như Ý

---

## 1. CẤU HÌNH MÔI TRƯỜNG
- [x] Đã cấu hình CORS trong Backend (Bắt buộc)
- [x] Đã tạo file .env với các biến môi trường (Bắt buộc)
- [x] Đã thêm .env vào .gitignore (Bắt buộc)
- [x] Đã tạo file axios.js / api.js với baseURL (Bắt buộc)
- [x] Đã cấu hình Request Interceptor (thêm token) (Bắt buộc)
- [x] Đã cấu hình Response Interceptor (xử lý 401) (Khuyến khích)

## 2. API XÁC THỰC
- [x] API Đăng ký hoạt động (test bằng Postman) (Bắt buộc)
- [x] API Đăng nhập trả về JWT (Bắt buộc)
- [x] Mật khẩu được hash bằng bcrypt (Bắt buộc)
- [x] Middleware xác thực JWT hoạt động (Bắt buộc)
- [x] API Lấy hồ sơ người dùng hoạt động (Khuyến khích)
- [x] Có xử lý token hết hạn (Khuyến khích)

## 3. FRONTEND XÁC THỰC
- [x] Trang Đăng nhập hoạt động (Bắt buộc)
- [x] Trang Đăng ký hoạt động (Bắt buộc)
- [x] Lưu token vào localStorage sau đăng nhập (Bắt buộc)
- [x] Hiển thị lỗi khi đăng nhập sai (Bắt buộc)
- [x] AuthContext/Provider đã tạo (Khuyến khích)
- [x] ProtectedRoute bảo vệ trang (Khuyến khích)
- [x] Nút Đăng xuất hoạt động (Khuyến khích)
- [x] Redirect sau đăng nhập thành công (Khuyến khích)

## 4. GHI CHÚ / VẤN ĐỀ GẶP PHẢI
- Hệ thống đã kết nối tốt giữa React và NodeJS.
- Đã tách biệt giao diện cho 3 Role: Admin, Organizer và Nhân viên (User).
- Interceptor đã tự động điều hướng về trang Login khi nhận mã 401 (token hết hạn hoặc không hợp lệ).
