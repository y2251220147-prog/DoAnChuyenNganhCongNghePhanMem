# 🎪 EventPro - Professional Event Management System

**EventPro** là giải pháp quản lý sự kiện toàn diện được xây dựng trên nền tảng **MERN-like Stack** (MySQL, Express, React, Node.js). Hệ thống hỗ trợ nhà tổ chức quản lý toàn bộ quy trình từ lập kế hoạch, tài chính, nhân sự cho đến vận hành thực tế và check-in khách mời bằng công nghệ QR Code.

---

## 🚀 Tính năng nổi bật (Key Features)

- **🔐 Bảo mật đa tầng**: Xác thực JWT (Stateless), mã hóa mật khẩu Bcrypt và phân quyền 3 vai trò (`Admin`, `Organizer`, `User`).
- **📅 Quản lý Sự kiện**: Lập kế hoạch sự kiện với đầy đủ thông tin: Địa điểm (Venues), Thời gian (Timeline), Ngân sách (Budgets) và Công việc (Tasks).
- **📸 QR Check-in**: Tự động tạo mã QR định danh cho từng khách mời, hỗ trợ quét điểm danh qua Web/Mobile App.
- **💰 Quản lý Tài chính**: Theo dõi thu chi chi tiết theo từng hạng mục, báo cáo chênh lệch ngân sách thực tế.
- **🔔 Hệ thống Thông báo**: Tự động gửi thông báo Real-time khi có task mới hoặc thay đổi trạng thái sự kiện.
- **📊 Báo cáo & Thống kê**: Tổng hợp dữ liệu người tham gia và hiệu quả sự kiện qua biểu đồ trực quan.

---

## 🛠 Công nghệ sử dụng (Tech Stack)

### **Backend**
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: MySQL (v8.0)
- **Library**: `mysql2`, `jsonwebtoken`, `bcrypt`, `cors`, `dotenv`.

### **Frontend**
- **Framework**: React.js (Vite)
- **State Management**: React Context API
- **HTTP Client**: Axios (với Request/Response Interceptors)
- **Styling**: Vanilla CSS (Custom UI).

---

## 💡 Cấu trúc dự án (Project Structure)

```text
├── server/                     # API Backend (Node.js & Express)
│   ├── config/                 # Cấu hình kết nối MySQL Pool
│   ├── controllers/            # Xử lý Logic chính (Auth, Event, Guest,...)
│   ├── middlewares/            # Auth & Role-based Authorization
│   ├── models/                 # Chứa các phương thức truy vấn Database
│   ├── routes/                 # Định nghĩa 14 nhóm API Endpoints
│   ├── services/               # Dịch vụ Token, QR, Email, Upload
│   ├── tests/                  # Bộ Test Case (auth, event,...)
│   ├── .env                    # Biến môi trường (Mật khẩu, Secret Key)
│   └── schema.sql              # Cấu trúc 20 bảng cơ sở dữ liệu
├── frontend/                   # Giao diện người dùng (React/Vite)
│   ├── src/
│   │   ├── components/         # UI Components dùng chung (Header, Sidebar,...)
│   │   ├── context/            # AuthContext quản lý Login/Logout
│   │   ├── pages/              # Các trang chính (Dashboard, Auth, Events,...)
│   │   ├── services/           # Cấu hình Axios & API Interceptors
│   │   ├── styles/             # Toàn bộ file CSS định dạng giao diện
│   │   ├── App.jsx             # Cấu hình Router & Protected Routes
│   │   └── main.jsx            # Entry point của ứng dụng
│   └── package.json            # Thư viện Frontend (Vite, React, Axios)
└── docs/                       # Hồ sơ dự án chi tiết
    ├── 01-tong-quan/           # Giới thiệu & Phạm vi dự án
    ├── 02-phan-tich/           # Yêu cầu chức năng & Role Matrix
    ├── 03-database/            # Schema & ERD
    ├── 04-api/                 # Tài liệu API Full Endpoints
    ├── 05-huong-dan/           # HD Cài đặt & Sử dụng
    ├── 06-deployment/          # HD Triển khai Build/Deploy
    ├── 07-algorithms/          # Logic Smart Routing & QR
    ├── BT_Tuan05/              # Bài tập Tuần 5 (BM01, BM05)
    └── BT_Tuan07/              # Bài tập Tuần 7 (BM01, BM02, BM04)
```

---

## ⚙️ Cài đặt nhanh (Quick Start)

### **1. Yêu cầu hệ thống**
- Cài đặt Node.js và MySQL Server.

### **2. Cấu hình Backend**
```bash
cd server
npm install
cp .env.example .env    # Điền thông tin Database & JWT_SECRET vào file .env
npm run dev
```
*Lưu ý: Import file `schema.sql` vào MySQL trước khi chạy.*

### **3. Cấu hình Frontend**
```bash
cd frontend
npm install
npm run dev
```
*Truy cập tại: `http://localhost:5173`*

---

## 👥 Tài khoản dùng thử (Demo Accounts)
Tất cả mật khẩu mặc định là: `123456`

- **Admin**: `admin@eventpro.com`
- **Organizer**: `organizer@eventpro.com`
- **User**: `user@eventpro.com`

---

## 📄 Tài liệu chi tiết (Documentation)
Để hiểu rõ hơn về kiến trúc, database và thuật toán của dự án, vui lòng tham khảo thư mục:
- [01. Tổng quan dự án](./docs/01-tong-quan/gioi-thieu.md)
- [03. Thiết kế Database](./docs/03-database/schema.md)
- [04. Tài liệu API](./docs/04-api/api-docs.md)

---
**Người thực hiện:** Nguyễn Như Ý
**Bản quyền:** © 2026 EventPro Team
