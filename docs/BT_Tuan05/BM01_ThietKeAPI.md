# BIỂU MẪU 01: TÀI LIỆU THIẾT KẾ API
*(Tuần 05 - Thiết kế hệ thống)*

**Tên dự án:** EventPro Management System  
**Module:** Quản lý Sự kiện & Khách mời  
**Phiên bản:** 1.0  
**Người thực hiện:** Nguyễn Như Ý

---

## DANH SÁCH API ENDPOINTS

| # | Phương thức | Đường dẫn (URL) | Mô tả | Request Body | Response | Mã trạng thái |
|:---:|:---:|:---|:---|:---|:---|:---|
| 1 | **GET** | `/api/events` | Lấy danh sách toàn bộ sự kiện | - | `{ events: [...] }` | 200 |
| 2 | **GET** | `/api/events/:id` | Lấy chi tiết một sự kiện | - | `{ event: {...} }` | 200, 404 |
| 3 | **POST** | `/api/events` | Tạo sự kiện mới | `{ name, start_date, end_date, location, total_budget }` | `{ message: success, eventId: ... }` | 201, 400 |
| 4 | **PUT** | `/api/events/:id` | Cập nhật thông tin sự kiện | `{ name, start_date, location, ... }` | `{ message: updated }` | 200 |
| 5 | **PATCH** | `/api/events/:id/status`| Thay đổi trạng thái sự kiện | `{ status: "approved" }` | `{ message: status_changed }` | 200 |
| 6 | **GET** | `/api/events/:id/deadlines` | Lấy danh sách deadline sự kiện | - | `{ deadlines: [...] }` | 200 |
| 7 | **GET** | `/api/guests/event/:eventId`| Lấy danh sách khách mời theo sự kiện | - | `{ guests: [...] }` | 200 |
| 8 | **POST** | `/api/guests` | Thêm khách mời mới (Admin/Organizer) | `{ event_id, name, email, phone }` | `{ message: guest_added }` | 201 |
| 9 | **GET** | `/api/guests/lookup` | Tra cứu thông tin khách bằng Email | `?email=abc@gmail.com` | `{ guest: {...} }` | 200, 404 |
| 10 | **POST** | `/api/auth/login` | Xác thực đăng nhập hệ thống | `{ email, password }` | `{ token, user: { role, ... } }` | 200, 401 |

**Ghi chú:** GET=Lấy, POST=Tạo, PUT/PATCH=Cập nhật, DELETE=Xóa
