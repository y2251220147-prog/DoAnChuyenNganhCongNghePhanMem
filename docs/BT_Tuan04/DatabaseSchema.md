# Database Schema
Project: Website Quản lý tổ chức sự kiện nội bộ
Tech stack: React.js + Node.js (Express) + MySQL

## 1. Overview

Hệ thống quản lý các sự kiện nội bộ trong tổ chức, cho phép:

- Admin tạo và quản lý sự kiện
- Nhân viên đăng ký tham gia
- Theo dõi danh sách người tham gia
- Gửi thông báo sự kiện

Database sử dụng MySQL.

---

# 2. Tables

## 2.1 Users

Lưu thông tin người dùng.

| Field | Type | Description |
|-----|-----|-----|
| id | INT (PK) | ID người dùng |
| name | VARCHAR(100) | Họ tên |
| email | VARCHAR(100) | Email đăng nhập |
| password | VARCHAR(255) | Mật khẩu đã mã hóa |
| role | ENUM('admin','user') | Quyền |
| created_at | DATETIME | Ngày tạo |

---

## 2.2 Events

Lưu thông tin sự kiện.

| Field | Type | Description |
|-----|-----|-----|
| id | INT (PK) | ID sự kiện |
| title | VARCHAR(200) | Tên sự kiện |
| description | TEXT | Mô tả |
| location | VARCHAR(255) | Địa điểm |
| start_time | DATETIME | Thời gian bắt đầu |
| end_time | DATETIME | Thời gian kết thúc |
| created_by | INT (FK) | Người tạo |
| created_at | DATETIME | Ngày tạo |

---

## 2.3 EventRegistrations

Danh sách người đăng ký sự kiện.

| Field | Type | Description |
|-----|-----|-----|
| id | INT (PK) | ID đăng ký |
| user_id | INT (FK) | Người tham gia |
| event_id | INT (FK) | Sự kiện |
| status | ENUM('registered','cancelled') | Trạng thái |
| registered_at | DATETIME | Ngày đăng ký |

---

## 2.4 Notifications

Thông báo gửi cho người dùng.

| Field | Type | Description |
|-----|-----|-----|
| id | INT (PK) | ID thông báo |
| user_id | INT (FK) | Người nhận |
| message | TEXT | Nội dung |
| is_read | BOOLEAN | Đã đọc |
| created_at | DATETIME | Thời gian |

---

# 3. Relationships

Users 1 --- N Events
Users 1 --- N EventRegistrations
Events 1 --- N EventRegistrations
Users 1 --- N Notifications

---

# 4. ERD Summary

Users
|
|----< Events
|
|----< EventRegistrations >---- Events
|
|----< Notifications

---

# 5. Future Extensions

- Event categories
- Event images
- Attendance tracking