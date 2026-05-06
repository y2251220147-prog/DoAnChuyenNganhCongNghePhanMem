# 01. Tổng quan dự án (Project Overview)

## 1. Giới thiệu hệ thống
**EventPro** là hệ thống quản lý sự kiện toàn diện, hỗ trợ nhà tổ chức (Organizers) từ khâu lập kế hoạch, quản lý ngân sách, điều phối nhân sự, đến vận hành sự kiện và thu thập phản hồi. Hệ thống hướng đến việc tối ưu hóa hiệu suất làm việc và minh bạch hóa dữ liệu tài nguyên.

## 2. Các phân hệ chức năng (Features)
Hệ thống được xây dựng với các module chuyên sâu:
- **Xác thực & Phân quyền (Auth)**: Sử dụng JWT & Bcrypt để bảo mật 3 vai trò: `Admin` (Cấu hình hệ thống), `Organizer` (Quản lý dự án), và `User` (Nhân viên thực hiện/Người tham dự).
- **Quản lý Sự kiện & Quy trình**: Lập kế hoạch sự kiện, phê duyệt trạng thái (Draft → Planning → Approved → Running).
- **Ngân sách & Tài chính**: Theo dõi thu chi chi tiết (Event Budget) cho từng hạng mục công việc.
- **Quản lý Công việc & Timeline**: Hệ thống Deadlines và lịch trình chi tiết (Event Timeline) đảm bảo tiến độ.
- **Quản lý Địa điểm & Tài nguyên**: Đặt hội trường (Venues) và thiết bị (Resources), kiểm tra xung đột thời gian.
- **Khách mời & QR Check-in**: Quản lý danh sách khách (Guests), phát hành mã QR định danh và quét điểm danh tự động qua mobile/web.
- **Báo cáo & Thống kê**: Tổng hợp dữ liệu người tham gia, chi phí và hiệu quả tổ chức.

## 3. Công nghệ sử dụng (Tech Stack)
### Backend
- **Ngôn ngữ**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: MySQL (v8.0)
- **Xác thực**: JSON Web Token (JWT) & Bcrypt
- **Thư viện chính**: `mysql2`, `dotenv`, `cors`, `express-validator`

### Frontend
- **Framework**: React.js (Vite)
- **Quản lý trạng thái**: React Context API
- **Giao tiếp API**: Axios
- **Thiết kế**: Vanilla CSS (Custom UI Components)
