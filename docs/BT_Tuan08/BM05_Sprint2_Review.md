# BM05: BÁO CÁO REVIEW SPRINT 2

**Dự án:** EventPro - Hệ thống quản lý sự kiện chuyên nghiệp
**Sprint:** 02
**Họp Review ngày:** 03/02/2026
**Trạng thái Sprint:** HOÀN THÀNH (100%)

---

## 1. Kết quả thực hiện (Done vs. Planned)

Tất cả các User Stories cam kết trong Kế hoạch Sprint (BM03) đều đã được hoàn thành và nghiệm thu nội bộ.

| ID | User Story | Người thực hiện | Kết quả | Ghi chú |
| :--- | :--- | :---: | :---: | :--- |
| **US-005** | Tạo sự kiện mới | Phạm Thanh Nhất | Đạt | Modal hoạt động tốt, validate dữ liệu đầy đủ. |
| **US-008** | Xem danh sách sự kiện | Bùi Vạn Đạt, Phạm Thanh Nhất | Đạt | Load dữ liệu nhanh, giao diện Responsive. |
| **US-022** | Xem chi tiết sự kiện | Huỳnh Trần Sơn Sanh | Đạt | Đầy đủ thông tin về venue, budget, timeline. |
| **US-006** | Chỉnh sửa thông tin sự kiện | Nguyễn Như Ý | Đạt | Cập nhật real-time vào database. |
| **US-023** | Tìm kiếm sự kiện | Team | Đạt | Tích hợp Search Server-side, có Debounce & Phân trang. |
| **US-007** | Xóa sự kiện | Nguyễn Huy Đức | Đạt | Có hỏi xác nhận trước khi xóa, xóa triệt để liên kết. |

## 2. Demo sản phẩm (Screenshots)

*(Nhóm đã thực hiện demo trực tiếp các tính năng trên môi trường staging)*

- **Hình 1: Danh sách sự kiện tích hợp bộ lọc tìm kiếm nâng cao**
  > ![Placeholder for EventList Search](https://via.placeholder.com/800x400?text=Event+List+Search+Demo)
- **Hình 2: Chức năng Tìm kiếm toàn cục trên Header**
  > ![Placeholder for Global Search](https://via.placeholder.com/800x400?text=Global+Search+Demo)


## 3. Đánh giá kỹ thuật (Technical Review)

- **Điểm mạnh:** 
    - Chuyển đổi thành công Tìm kiếm từ Client sang Server, đảm bảo khả năng mở rộng (Scalability).
    - Sử dụng `useCallback` và `useEffect` tối ưu hiệu năng Frontend.
    - API thiết kế theo chuẩn RESTful.
- **Vấn đề tồn tại:** Giao diện trên thiết bị di động cực nhỏ cần được căn chỉnh thêm ở một số modal.

## 4. Retrospective (Họp cải tiến)
- **Cái gì làm tốt (Start):** Phối hợp giữa Frontend và Backend trong việc thiết kế API Search rất mượt mà.
- **Cái gì chưa tốt (Stop):** Cần viết Unit Test cho các controller sớm hơn thay vì để đến cuối Sprint.
- **Hành động cải tiến (Change):** Bắt đầu áp dụng TDD (Test Driven Development) cho các module của Sprint 3.

---
**Chữ ký xác nhận (Scrum Master):** [Đã duyệt]
