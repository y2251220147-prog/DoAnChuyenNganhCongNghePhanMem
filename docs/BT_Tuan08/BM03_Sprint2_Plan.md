# BM03: KẾ HOẠCH SPRINT 2

**Dự án:** EventPro - Hệ thống quản lý sự kiện chuyên nghiệp
**Sprint:** 02
**Thời gian:** 01/02/2026 – 02/02/2026
**Trạng thái:** Hoàn tất kế hoạch

---

## 1. Mục tiêu Sprint (Sprint Goal)

Hoàn thiện bộ tính năng cốt lõi về quản lý vòng đời sự kiện (CRUD) và tích hợp hệ thống tìm kiếm thông minh, nâng cao trải nghiệm người dùng trong việc tương tác với dữ liệu sự kiện.

## 2. Danh sách User Stories (Sprint Backlog)

Dựa trên ưu tiên từ Product Backlog:

| ID | Tên User Story | Ưu tiên | Người thực hiện | Ghi chú |
| :--- | :--- | :---: | :--- | :--- |
| **US-005** | Tạo sự kiện mới | Must | Phạm Thanh Nhất | Cho phép Organizer tạo sự kiện |
| **US-008** | Xem danh sách sự kiện | Must | Bùi Vạn Đạt, Phạm Thanh Nhất | Hiển thị bảng dữ liệu tổng quát |
| **US-022** | Xem chi tiết sự kiện | Must | Huỳnh Trần Sơn Sanh | Trang thông tin đầy đủ về sự kiện |
| **US-006** | Chỉnh sửa thông tin sự kiện | Should | Nguyễn Như Ý | Cập nhật thông tin đã có |
| **US-023** | Tìm kiếm sự kiện | Should | Team | Tìm kiếm theo tên, địa điểm, ngày |
| **US-007** | Xóa sự kiện | Could | Nguyễn Huy Đức | Xóa các sự kiện không còn cần thiết |

## 3. Phân công công việc (Task Breakdown)

### 3.1. Nhóm Backend

- **Task 1**: Phát triển API CRUD cho Event (Get All, Get Detail, Post, Put, Delete).
- **Task 2**: Phát triển API Search nâng cao với tham số lọc (Type, Status, Date range) và phân trang.
- **Task 3**: Cập nhật Database Schema (Bảng Events).

### 3.2. Nhóm Frontend

- **Task 1**: Xây dựng UI danh sách sự kiện (EventList) và các Modals thêm/sửa.
- **Task 2**: Tích hợp gọi API Search, xử lý Debounce và Pagination.
- **Task 3**: Xây dựng trang Kết quả tìm kiếm toàn cục (SearchPage).

## 4. Ước lượng (Estimation)

- **Tổng Story Points dự kiến:** 24 SP
- **Vận tốc (Velocity) mục tiêu:** 24 SP/Sprint

## 5. Rủi ro & Giải pháp

- **Rủi ro:** Tìm kiếm dữ liệu lớn bị chậm.
- **Giải pháp:** Sử dụng Indexing trong Database và triển khai Search phía Server thay vì Client.
