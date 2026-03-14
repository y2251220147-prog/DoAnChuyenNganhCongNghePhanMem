# ADR-001: Database Selection

## Status
Accepted

## Context

Hệ thống cần lưu trữ dữ liệu cho website quản lý tổ chức sự kiện nội bộ.
Các dữ liệu chính gồm:

- người dùng
- sự kiện
- đăng ký tham gia sự kiện
- thông báo

Hệ thống yêu cầu:

- quản lý dữ liệu có cấu trúc
- hỗ trợ quan hệ giữa nhiều bảng
- dễ triển khai với Node.js
- dễ mở rộng trong tương lai

---

## Decision

Nhóm quyết định sử dụng **MySQL** làm hệ quản trị cơ sở dữ liệu.

MySQL sẽ được kết nối với backend Node.js thông qua thư viện:

mysql2

---

## Consequences

### Ưu điểm

- Cơ sở dữ liệu quan hệ mạnh
- hỗ trợ tốt cho Node.js
- phổ biến và dễ triển khai
- hỗ trợ transaction
- phù hợp cho hệ thống quản lý dữ liệu

### Nhược điểm

- cần thiết kế schema rõ ràng
- khó thay đổi structure khi hệ thống lớn

---

## Database Structure

Các bảng chính:

- Users
- Events
- EventRegistrations
- Notifications

Các bảng được liên kết bằng khóa ngoại.

---

## Alternatives Considered

MongoDB:

- linh hoạt hơn
- nhưng không phù hợp với dữ liệu có quan hệ chặt chẽ

SQLite:

- nhẹ
- nhưng không phù hợp khi hệ thống mở rộng