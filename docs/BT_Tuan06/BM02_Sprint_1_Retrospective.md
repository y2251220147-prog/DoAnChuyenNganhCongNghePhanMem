# BÁO CÁO NHÌN LẠI CHẠY NƯỚC RÚT (BM02)
*(Sprint Retrospective Report)*

| Trường thông tin | Nội dung |
| :--- | :--- |
| **Tên dự án** | Đồ án Chuyên ngành Công nghệ Phần mềm |
| **Nhóm** | [Tên nhóm của bạn] |
| **Sprint số** | 01 |
| **Ngày** | 21/03/2026 |

---

### 1. BẮT ĐẦU LÀM (Start Doing)
*Việc chưa làm nhưng nên bắt đầu*
1. Viết Unit Test cho các module quan trọng ngay sau khi hoàn thành code.
2. Xây dựng tài liệu API (Swagger) để Frontend dễ dàng tích hợp.
3. Tổ chức họp Daily Standup ngắn (10p) để cập nhật tiến độ mỗi ngày.
4. Sử dụng công cụ kiểm tra bảo mật tự động cho các route Auth.

### 2. DỪNG LÀM (Stop Doing)
*Việc đang làm nhưng không hiệu quả*
1. Dừng việc code trực tiếp trên nhánh `main` mà không thông qua Pull Request.
2. Dừng việc sửa lỗi (hotfix) mà không ghi chú vào file log hoặc issue tracker.
3. Hạn chế việc thảo luận các vấn đề kỹ thuật phức tạp qua tin nhắn nháy mắt, nên trao đổi trực tiếp.
4. Dừng việc để các biến môi trường (ENV) trực tiếp trong mã nguồn.

### 3. TIẾP TỤC LÀM (Continue Doing)
*Việc đang làm tốt, cần duy trì*
1. Duy trì phong cách thiết kế Dark Mode sang trọng và đồng bộ.
2. Đảm bảo quy trình Review Code chéo giữa các thành viên.
3. Sử dụng Git Flow một cách nghiêm túc (nhánh feature, dev, main).
4. Viết comment Code rõ ràng và súc tích bằng tiếng Việt.

---

### CAM KẾT HÀNH ĐỘNG CHO SPRINT 2
*(Chọn 1-2 cải tiến CỤ THỂ và KHẢ THI để áp dụng)*

| # | Cam kết cải tiến | Người chịu trách nhiệm | Cách đo lường |
| :--- | :--- | :--- | :--- |
| 1 | Tối ưu hóa API Response | [Tên Trưởng nhóm] | Thời gian phản hồi < 200ms (kiểm tra qua Postman) |
| 2 | Nâng cao tỷ lệ phủ của Unit Test | [Tên Thành viên] | Đạt mức > 70% coverage (báo cáo bởi Jest) |

---
**Trưởng nhóm ký:** *(Đã ký)*  
**Thành viên xác nhận:** *(Tất cả thành viên đã xác nhận)*
