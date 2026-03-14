# ARCHITECTURE DECISION RECORD
## ADR-001: Database Technology Selection

### 1. BỐI CẢNH (Context)
Hệ thống quản lý sự kiện nội bộ cần một cơ sở dữ liệu lưu trữ thông tin người dùng, sự kiện, đăng ký và check-in. Hệ thống áp dụng kiến trúc phân tầng và sử dụng Node.js cho backend.

### 2. CÁC PHƯƠNG ÁN XEM XÉT (Options Considered)
- MySQL
- PostgreSQL
- MongoDB

### 3. QUYẾT ĐỊNH (Decision)
Nhóm quyết định sử dụng MySQL vì đây là hệ quản trị CSDL quan hệ phổ biến, dễ triển khai, phù hợp với mô hình dữ liệu có quan hệ rõ ràng và đáp ứng yêu cầu môn học.

### 4. HẬU QUẢ (Consequences)
- Thuận lợi trong thiết kế ERD và truy vấn
- Dễ tích hợp với Node.js
- Khả năng mở rộng ngang hạn chế hơn NoSQL

### 5. LIÊN QUAN (Related)
- ERD Database Schema
- System Architecture Document
