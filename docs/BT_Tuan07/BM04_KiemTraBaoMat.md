# BIỂU MẪU 04: DANH SÁCH KIỂM TRA BẢO MẬT CƠ BẢN

**Tên dự án:** EventPro Management System  
**Nhóm:** [Tên nhóm]  
**Người kiểm tra:** Nguyễn Như Ý  
**Ngày:** 02/04/2026

---

## 1. BẢO MẬT MẬT KHẨU
- [x] Mật khẩu được HASH bằng bcrypt (salt rounds >= 10) (Bắt buộc)
- [x] KHÔNG lưu mật khẩu plain text trong database (Bắt buộc)
- [x] KHÔNG trả về mật khẩu (kể cả hash) trong response (Bắt buộc)
- [x] Có validation độ mạnh mật khẩu (>= 6 ký tự) (Khuyến khích)

## 2. BẢO MẬT JWT & TOKEN
- [x] JWT_SECRET được lưu trong file .env (Bắt buộc)
- [x] JWT_SECRET đủ dài và phức tạp (Bắt buộc)
- [x] Token có thời hạn (expiresIn) (Bắt buộc)
- [x] KHÔNG lưu thông tin nhạy cảm trong payload (Bắt buộc)
- [x] Có xử lý token hết hạn (401) (Khuyến khích)

## 3. BẢO MẬT FILE & GIT
- [x] File .env đã thêm vào .gitignore (Bắt buộc)
- [x] KHÔNG có API key, secret trong code (Bắt buộc)
- [x] Có file .env.example làm mẫu (Khuyến khích)
- [x] KHÔNG push node_modules lên Git (Bắt buộc)

## 4. BẢO MẬT API
- [x] Các route cần xác thực đã có middleware (Bắt buộc)
- [x] Validate đầu vào từ user (Bắt buộc)
- [x] CORS đã cấu hình đúng origin (Bắt buộc)
- [x] Thông báo lỗi không tiết lộ chi tiết hệ thống (Khuyến khích)
- [ ] Có rate limiting chống brute force (Khuyến khích)

---
**⚠ CẢNH BÁO BẢO MẬT**  
Nếu có bất kỳ mục **BẮT BUỘC** nào chưa được đánh dấu, dự án KHÔNG an toàn để triển khai!
