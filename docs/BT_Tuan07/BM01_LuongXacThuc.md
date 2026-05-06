# BIỂU MẪU 01: THIẾT KẾ LUỒNG XÁC THỰC NGƯỜI DÙNG

**Tên dự án:** EventPro Management System  
**Nhóm:** [Tên nhóm]  
**Người thực hiện:** Nguyễn Như Ý

---

## 1. THÔNG TIN API XÁC THỰC

| Endpoint | Method | Mô tả | Request Body | Response |
|:---|:---:|:---|:---|:---|
| `/api/auth/register` | POST | Đăng ký tài khoản mới | `{name, email, password}` | `201 Created` |
| `/api/auth/login` | POST | Đăng nhập hệ thống | `{email, password}` | `200 OK + JWT Token` |
| `/api/auth/verify` | GET | Lấy thông tin người dùng | (Header: Authorization) | `User Profile Info` |
| `/api/auth/reset-password`| PUT | Đổi mật khẩu | `{oldPass, newPass}` | `Success message` |
| `/api/auth/seed` | POST | Khởi tạo tài khoản Admin | (None) | `Admin credentials` |

## 2. CẤU TRÚC TOKEN JWT

- **Payload chứa:** [x] userId | [x] email | [x] hoTen | [x] vaiTro | [ ] Khác: ________
- **Thời hạn token:** [ ] 1 ngày | [ ] 7 ngày | [ ] 30 ngày | [x] Khác: 2 giờ
- **Lưu trữ token:** [x] localStorage | [ ] sessionStorage | [ ] Cookie | [ ] Khác: ________

## 3. PHÂN QUYỀN NGƯỜI DÙNG

| Vai trò | Quyền hạn | Trang được truy cập |
|:---|:---|:---|
| **Admin** | Toàn quyền hệ thống, quản lý tài khoản người dùng | Toàn bộ hệ thống, `/admin/users` |
| **Organizer** | Quản lý sự kiện, khách mời, nhân sự, ngân sách | `/dashboard`, `/events`, `/guests`, `/staff`, `/budget` |
| **User** | Đăng ký tham gia, xem lịch, nhận vé QR cá nhân | `/my-portal`, `/calendar`, `/profile`, `/events/:id` |
| **Khách (chưa login)**| Xem thông tin sự kiện công khai | Trang chủ, `/guest-portal` |

## 4. SƠ ĐỒ LUỒNG XÁC THỰC
*(Đăng nhập → Lưu token → Gọi API → Xác minh → Response)*

```mermaid
sequenceDiagram
    participant FE as Frontend (React)
    participant BE as Backend (NodeJS)
    participant DB as Database (MySQL)

    Note over FE: 1. Đăng nhập
    FE->>BE: POST /api/auth/login {creds}
    BE->>DB: Kiểm tra Email & Pass (Bcrypt)
    DB-->>BE: Hợp lệ
    BE->>BE: Tạo JWT (Payload + Secret)
    BE-->>FE: Response {token, user}
    
    Note over FE: 2. Lưu token
    FE->>FE: localStorage.setItem('token', token)
    
    Note over FE: 3. Gọi API xác thực
    FE->>BE: GET /api/auth/verify (Header Bearer Token)
    
    Note over BE: 4. Xác minh
    BE->>BE: jwt.verify(token, Secret)
    
    Note over BE: 5. Response
    BE-->>FE: 200 OK {userData}
    FE->>FE: Cập nhật AuthContext
```
