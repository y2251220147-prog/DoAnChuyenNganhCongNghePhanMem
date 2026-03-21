-- 1. Tạo Database và sử dụng
CREATE DATABASE IF NOT EXISTS event_management;
USE event_management;

-- 2. Bảng Người dùng (Đã xóa các cột xác thực email)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255),
  role ENUM('admin','organizer','user') DEFAULT 'user',
  phone VARCHAR(20),
  address TEXT,
  gender VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Bảng Sự kiện (Đã gộp đầy đủ các cột thông tin chiến lược)
CREATE TABLE IF NOT EXISTS events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  date DATE,
  start_time TIME,
  location VARCHAR(255),
  capacity INT,
  organizer_id INT,
  description TEXT,
  status VARCHAR(50) DEFAULT 'planned',
  goal TEXT,
  event_type VARCHAR(100),
  theme TEXT,
  message TEXT,
  design_notes TEXT,
  contingency_plans TEXT,
  contingency_percent DECIMAL(5,2) DEFAULT 15.00,
  event_code VARCHAR(10) UNIQUE,
  qr_code_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 4. Bảng Nhân sự sự kiện (Staff)
CREATE TABLE IF NOT EXISTS event_staff (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  user_id INT NOT NULL,
  role VARCHAR(100),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Bảng Khách mời (Guests)
CREATE TABLE IF NOT EXISTS guests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  qr_code VARCHAR(255),
  checked_in BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- 6. Bảng Lịch trình (Timeline)
CREATE TABLE IF NOT EXISTS event_timeline (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  title VARCHAR(255),
  start_time TIME,
  end_time TIME,
  description TEXT,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- 7. Bảng Ngân sách (Budgets)
CREATE TABLE IF NOT EXISTS budgets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  item VARCHAR(255),
  cost DECIMAL(10,2),
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- 8. Bảng Đối tác & Nhà tài trợ (Partners & Sponsors)
CREATE TABLE IF NOT EXISTS event_partners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  name VARCHAR(255),
  type VARCHAR(255) DEFAULT 'Sponsor',
  value VARCHAR(255),
  contact_info TEXT,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- 9. Bảng Kế hoạch truyền thông (Communication)
CREATE TABLE IF NOT EXISTS event_communication (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    channel VARCHAR(255),
    activity TEXT,
    date DATE,
    status VARCHAR(255) DEFAULT 'Planned',
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- 10. Bảng Đánh giá & Kết quả (Evaluation & KPIs)
CREATE TABLE IF NOT EXISTS event_evaluation (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    metric VARCHAR(255),
    target VARCHAR(100),
    actual VARCHAR(100),
    invited_count INT DEFAULT 0,
    attended_count INT DEFAULT 0,
    conversion_count INT DEFAULT 0,
    brand_recall_score INT DEFAULT 0,
    lesson_learned TEXT,
    notes TEXT,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- 11. Bảng Người dùng tham gia (Participants)
CREATE TABLE IF NOT EXISTS event_participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    user_id INT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY (event_id, user_id)
);

-- 12. Bảng Task triển khai (Checklist)
CREATE TABLE IF NOT EXISTS event_execution_tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    task_name VARCHAR(255) NOT NULL,
    phase ENUM('Before', 'During', 'After') DEFAULT 'Before',
    assigned_to INT,
    due_date DATE,
    is_completed BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

-- 13. Cập nhật quyền Admin mặc định (Thay đổi email nếu cần)
UPDATE users SET role = 'admin' WHERE email = 'admin@gmail.com';

-- Hoàn tất!
