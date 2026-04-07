# BIỂU MẪU 05: BÁO CÁO ĐÁNH GIÁ SPRINT
*(Sprint Review Report)*

**Tên dự án:** EventPro Management System  
**Nhóm:** [Tên nhóm]  
**Sprint số:** 01  
**Ngày báo cáo:** 02/04/2026

---

## 1. MỤC TIÊU SPRINT
Xây dựng nền tảng quản lý sự kiện cốt lõi: CRUD Sự kiện, quản lý danh sách khách mời và thiết lập Schema database v1.0.

## 2. CÁC TÍNH NĂNG ĐÃ HOÀN THÀNH

| # | Tính năng / Công việc | Demo? | Ghi chú |
|:---:|:---|:---:|:---|
| 1 | Module Quản lý Sự kiện (Events) | [x] | Full CRUD & Detail |
| 2 | Module Quản lý Khách mời (Guests) | [x] | Thêm/Sửa/Liệt kê |
| 3 | Tra cứu Khách hàng bằng Email | [x] | Không cần đăng nhập |
| 4 | Thiết lập Database MySQL | [x] | Toàn bộ 15 bảng thiết kế |
| 5 | Giao diện Dashboard tổng quan | [x] | Thống kê số lượng ban đầu |

## 3. CÁC CÔNG VIỆC CHƯA HOÀN THÀNH

| # | Công việc | Lý do chưa hoàn thành | Kế hoạch |
|:---:|:---|:---|:---|
| 1 | Xác thực JWT & Phân quyền | Cần nghiên cứu thêm middleware | Thực hiện trong Sprint 2 |
| 2 | QR Code check-in | Chuyển sang module nâng cao | Thực hiện sau khi có Authentication |

## 4. BÀI HỌC KINH NGHIỆM

| 🙂 Điều làm tốt | 😟 Điều cần cải thiện |
|:---|:---|
| Thiết kế Database chuẩn, dễ mở rộng. | Một số Query SQL Join 4-5 bảng còn chậm. |
| Giao diện React Component dễ tái sử dụng. | Cần bổ sung validate form chặt chẽ hơn. |

## 5. KẾ HOẠCH SPRINT TIẾP THEO
Nâng cấp bảo mật bằng Passport/JWT, phân quyền 3 Role (Admin, Organizer, User) và tích hợp các module Ngân sách, Deadline cho từng sự kiện.

## 6. ĐÁNH GIÁ TỔNG THỂ
**Mục tiêu Sprint:** [x] Đạt hoàn toàn | [ ] Đạt một phần | [ ] Không đạt

---
**Người báo cáo:** Nguyễn Như Ý
