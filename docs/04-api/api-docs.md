# 04. Tài liệu API (API Documentation)

Middleware `authMiddleware` được áp dụng cho hầu hết các API yêu cầu xác thực người dùng thông qua Token.

## 1. 🔑 Authentication & Users
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/auth/login` | Đăng nhập và nhận JWT Token |
| GET | `/api/auth/profile` | Xem hồ sơ và quyền hạn hiện tại |
| PUT | `/api/users/profile` | Cập nhật thông tin cá nhân |

## 2. 🎪 Events Planning
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/events` | Danh sách sự kiện (theo phân quyền) |
| POST | `/api/events` | Tạo sự kiện (Admin/Organizer) |
| GET | `/api/events/:id` | Chi tiết sự kiện & Deadlines |
| PATCH | `/api/events/:id/status`| Phê duyệt/Thay đổi trạng thái sự kiện |

## 3. 💰 Budget & Logistics
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/budgets/event/:id` | Xem chi phí chi tiết của sự kiện |
| POST | `/api/budgets` | Thêm khoản chi mới |
| GET | `/api/venues` | Danh sách địa điểm hiện có |
| POST | `/api/venues/booking` | Đặt chỗ địa điểm cho sự kiện |

## 4. ✅ Tasks & Team
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/tasks/event/:id` | Bảng công việc Kanban của sự kiện |
| PUT | `/api/tasks/:id` | Cập nhật tiến độ/trạng thái công việc |
| GET | `/api/staff/event/:id` | Danh sách nhân sự phụ trách |

## 5. 👥 Attendees & Check-in
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/guests` | Thêm khách mời & Tự động tạo mã QR |
| GET | `/api/guests/lookup` | Khách tự tra cứu bằng Email |
| POST | `/api/checkin/scan` | Quét QR Code để điểm danh (Mobile App) |

## 6. 📈 Reports & Feedback
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/reports/statistics`| Thống kê tổng quan cho Admin |
| POST | `/api/feedback` | Gửi đánh giá sau sự kiện |

> [!TIP]
> Tất cả các yêu cầu (trừ login/lookup) cần kèm theo Header `Authorization: Bearer <token>`.
