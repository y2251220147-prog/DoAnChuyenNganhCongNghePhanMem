-- ════════════════════════════════════════════════════════════════════════════
-- EventManager — SCHEMA + MIGRATION
-- Tương thích MySQL 5.6, 5.7, 8.0+
-- Chạy trong MySQL Workbench: Ctrl+A → Ctrl+Shift+Enter
-- ════════════════════════════════════════════════════════════════════════════
 
-- Tắt safe update mode tạm thời
SET SQL_SAFE_UPDATES = 0;
 
CREATE DATABASE IF NOT EXISTS event_management
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;
 
USE event_management;
 
-- ────────────────────────────────────────────────────────────────────────────
-- 1. USERS
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(100)  NOT NULL,
    email      VARCHAR(150)  NOT NULL UNIQUE,
    password   VARCHAR(255)  NOT NULL,
    role       ENUM('user','organizer','admin') DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
 
-- ────────────────────────────────────────────────────────────────────────────
-- 2. EVENTS — tạo mới nếu chưa có
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(200) NOT NULL,
    description  TEXT,
    event_type   VARCHAR(100),
    owner_id     INT,
    start_date   DATETIME,
    end_date     DATETIME,
    venue_type   ENUM('online','offline') DEFAULT 'offline',
    location     VARCHAR(300),
    capacity     INT,
    total_budget DECIMAL(18,2) DEFAULT 0,
    status       ENUM('draft','planning','approved','running','completed','cancelled') DEFAULT 'draft',
    approved_by  INT,
    approved_at  DATETIME,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);
 
-- ────────────────────────────────────────────────────────────────────────────
-- 3. MIGRATION: thêm cột mới nếu chưa có
--    Dùng stored procedure — tương thích MySQL 5.6 / 5.7 / 8.0
-- ────────────────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS add_col;
 
DELIMITER $$
CREATE PROCEDURE add_col(IN tbl VARCHAR(64), IN col VARCHAR(64), IN def TEXT)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = tbl
          AND COLUMN_NAME  = col
    ) THEN
        SET @sql = CONCAT('ALTER TABLE `', tbl, '` ADD COLUMN `', col, '` ', def);
        PREPARE s FROM @sql;
        EXECUTE s;
        DEALLOCATE PREPARE s;
    END IF;
END$$
DELIMITER ;
 
CALL add_col('events', 'event_type',   'VARCHAR(100) AFTER description');
CALL add_col('events', 'owner_id',     'INT AFTER event_type');
CALL add_col('events', 'start_date',   'DATETIME AFTER owner_id');
CALL add_col('events', 'end_date',     'DATETIME AFTER start_date');
CALL add_col('events', 'venue_type',   "ENUM('online','offline') DEFAULT 'offline' AFTER end_date");
CALL add_col('events', 'capacity',     'INT AFTER venue_type');
CALL add_col('events', 'total_budget', 'DECIMAL(18,2) DEFAULT 0 AFTER capacity');
CALL add_col('events', 'approved_by',  'INT AFTER total_budget');
CALL add_col('events', 'approved_at',  'DATETIME AFTER approved_by');
 
DROP PROCEDURE IF EXISTS add_col;
 
-- ────────────────────────────────────────────────────────────────────────────
-- 4. Cập nhật data status cũ → mới TRƯỚC khi đổi ENUM
--    Dùng id >= 0 để bypass safe update mode
-- ────────────────────────────────────────────────────────────────────────────
UPDATE events SET status = 'draft'   WHERE status = 'planned'  AND id >= 0;
UPDATE events SET status = 'running' WHERE status = 'active'   AND id >= 0;
UPDATE events SET status = 'draft'
    WHERE id >= 0
      AND status NOT IN ('draft','planning','approved','running','completed','cancelled');
 
-- ────────────────────────────────────────────────────────────────────────────
-- 5. Đổi ENUM status và venue_type
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE events MODIFY COLUMN status
    ENUM('draft','planning','approved','running','completed','cancelled') DEFAULT 'draft';
 
ALTER TABLE events MODIFY COLUMN venue_type
    ENUM('online','offline') DEFAULT 'offline';
 
-- ────────────────────────────────────────────────────────────────────────────
-- 6. Thêm FOREIGN KEY cho events nếu chưa có
-- ────────────────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS add_fk;
 
DELIMITER $$
CREATE PROCEDURE add_fk(IN tbl VARCHAR(64), IN fk_name VARCHAR(64), IN fk_def TEXT)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
        WHERE TABLE_SCHEMA    = DATABASE()
          AND TABLE_NAME      = tbl
          AND CONSTRAINT_NAME = fk_name
    ) THEN
        SET @sql = CONCAT('ALTER TABLE `', tbl, '` ADD CONSTRAINT `', fk_name, '` ', fk_def);
        PREPARE s FROM @sql;
        EXECUTE s;
        DEALLOCATE PREPARE s;
    END IF;
END$$
DELIMITER ;
 
CALL add_fk('events', 'fk_events_owner',
    'FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL');
CALL add_fk('events', 'fk_events_approver',
    'FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL');
 
DROP PROCEDURE IF EXISTS add_fk;
 
-- ────────────────────────────────────────────────────────────────────────────
-- 7. EVENT_DEADLINES — bảng mới
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_deadlines (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    event_id   INT NOT NULL,
    title      VARCHAR(200) NOT NULL,
    due_date   DATETIME NOT NULL,
    done       TINYINT(1) DEFAULT 0,
    note       TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);
 
-- ────────────────────────────────────────────────────────────────────────────
-- 8. GUESTS
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS guests (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    event_id   INT NOT NULL,
    name       VARCHAR(100) NOT NULL,
    email      VARCHAR(150) NOT NULL,
    phone      VARCHAR(20),
    qr_code    VARCHAR(255) UNIQUE,
    checked_in TINYINT(1) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);
 
-- ────────────────────────────────────────────────────────────────────────────
-- 9. EVENT_STAFF
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_staff (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    event_id   INT NOT NULL,
    user_id    INT NOT NULL,
    role       ENUM('manager','marketing','technical','support','volunteer') DEFAULT 'volunteer',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
    UNIQUE KEY unique_staff_event (event_id, user_id)
);
 
ALTER TABLE event_staff MODIFY COLUMN role
    ENUM('manager','marketing','technical','support','volunteer') DEFAULT 'volunteer';
 
-- ────────────────────────────────────────────────────────────────────────────
-- 10. EVENT_TIMELINE
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_timeline (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    event_id    INT NOT NULL,
    title       VARCHAR(200) NOT NULL,
    start_time  DATETIME NOT NULL,
    end_time    DATETIME,
    description TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);
 
-- ────────────────────────────────────────────────────────────────────────────
-- 11. EVENT_BUDGET
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_budget (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    event_id   INT NOT NULL,
    item       VARCHAR(200) NOT NULL,
    cost       DECIMAL(15,2) NOT NULL DEFAULT 0,
    note       TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);
 
-- ────────────────────────────────────────────────────────────────────────────
-- 12. FEEDBACK
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feedback (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    event_id   INT,
    name       VARCHAR(100),
    email      VARCHAR(150),
    rating     TINYINT DEFAULT 5,
    message    TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL
);
 
-- ════════════════════════════════════════════════════════════════════════════
-- KIỂM TRA KẾT QUẢ
-- ════════════════════════════════════════════════════════════════════════════
SHOW TABLES;
DESCRIBE events;
DESCRIBE event_deadlines;
SELECT CONCAT('So su kien: ', COUNT(*)) AS ket_qua FROM events;
SELECT CONCAT('So users: ',   COUNT(*)) AS ket_qua FROM users;
 
-- Bật lại safe update mode
SET SQL_SAFE_UPDATES = 1;
-- ════════════════════════════════════════════════════════════════════════════
-- PHẦN MỞ RỘNG v3: Venue, Tasks, Marketing, Notifications, Attendees
-- ════════════════════════════════════════════════════════════════════════════

-- ─── VENUES (Địa điểm) ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS venues (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(200) NOT NULL,
    type         ENUM('room','hall','outdoor','online') DEFAULT 'room',
    location     VARCHAR(300),
    capacity     INT DEFAULT 0,
    description  TEXT,
    facilities   JSON,          -- ["projector","sound","ac","whiteboard"]
    status       ENUM('available','unavailable','maintenance') DEFAULT 'available',
    created_by   INT,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ─── RESOURCES (Tài nguyên / thiết bị) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS resources (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(200) NOT NULL,
    category     VARCHAR(100),      -- "AV", "Furniture", "IT", "Catering"
    quantity     INT DEFAULT 1,
    unit         VARCHAR(50),       -- "cái", "bộ", "m"
    description  TEXT,
    status       ENUM('available','in_use','maintenance') DEFAULT 'available',
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ─── EVENT_VENUE_BOOKING (Đặt địa điểm cho event) ───────────────────────────
CREATE TABLE IF NOT EXISTS event_venue_bookings (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    event_id     INT NOT NULL,
    venue_id     INT NOT NULL,
    start_time   DATETIME NOT NULL,
    end_time     DATETIME NOT NULL,
    note         TEXT,
    status       ENUM('pending','confirmed','cancelled') DEFAULT 'pending',
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE
);

-- ─── EVENT_RESOURCE_BOOKINGS (Đặt thiết bị cho event) ──────────────────────
CREATE TABLE IF NOT EXISTS event_resource_bookings (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    event_id     INT NOT NULL,
    resource_id  INT NOT NULL,
    quantity     INT DEFAULT 1,
    note         TEXT,
    status       ENUM('pending','confirmed','returned') DEFAULT 'pending',
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id)    REFERENCES events(id)    ON DELETE CASCADE,
    FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE
);

-- ─── EVENT_TASKS (Kanban tasks trong event) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS event_tasks (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    event_id     INT NOT NULL,
    title        VARCHAR(300) NOT NULL,
    description  TEXT,
    assigned_to  INT DEFAULT NULL,
    status       ENUM('todo','in_progress','done','cancelled') DEFAULT 'todo',
    priority     ENUM('low','medium','high') DEFAULT 'medium',
    due_date     DATETIME DEFAULT NULL,
    position     INT DEFAULT 0,           -- Thứ tự trong column
    created_by   INT,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id)    REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id)  ON DELETE SET NULL,
    FOREIGN KEY (created_by)  REFERENCES users(id)  ON DELETE SET NULL
);

-- ─── NOTIFICATIONS (Thông báo hệ thống) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    user_id      INT NOT NULL,
    type         VARCHAR(50) NOT NULL,   -- 'event_reminder','task_assigned','status_change',...
    title        VARCHAR(200) NOT NULL,
    message      TEXT,
    link         VARCHAR(300),           -- URL để điều hướng khi click
    read_at      DATETIME DEFAULT NULL,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_read (user_id, read_at)
);

-- ─── ATTENDEES (Người tham dự — internal + external) ────────────────────────
CREATE TABLE IF NOT EXISTS attendees (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    event_id        INT NOT NULL,
    user_id         INT DEFAULT NULL,     -- NULL = khách ngoài
    name            VARCHAR(100) NOT NULL,
    email           VARCHAR(150) NOT NULL,
    phone           VARCHAR(20),
    attendee_type   ENUM('internal','external') DEFAULT 'external',
    qr_code         VARCHAR(255) UNIQUE,
    checked_in      TINYINT(1) DEFAULT 0,
    checked_in_at   DATETIME DEFAULT NULL,
    registered_by   INT DEFAULT NULL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id)      REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)       REFERENCES users(id)  ON DELETE SET NULL,
    FOREIGN KEY (registered_by) REFERENCES users(id)  ON DELETE SET NULL,
    UNIQUE KEY unique_user_event (user_id, event_id)
);

-- ─── Migration: thêm department vào users nếu chưa có ──────────────────────
DROP PROCEDURE IF EXISTS add_col_v3;
DELIMITER $$
CREATE PROCEDURE add_col_v3(IN tbl VARCHAR(64), IN col VARCHAR(64), IN def TEXT)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = tbl AND COLUMN_NAME = col
    ) THEN
        SET @sq = CONCAT('ALTER TABLE `', tbl, '` ADD COLUMN `', col, '` ', def);
        PREPARE st FROM @sq; EXECUTE st; DEALLOCATE PREPARE st;
    END IF;
END$$
DELIMITER ;

CALL add_col_v3('users', 'department', "VARCHAR(100) DEFAULT NULL AFTER role");
CALL add_col_v3('users', 'position',   "VARCHAR(100) DEFAULT NULL AFTER department");
CALL add_col_v3('users', 'avatar',     "VARCHAR(300) DEFAULT NULL AFTER position");
CALL add_col_v3('users', 'phone',      "VARCHAR(20)  DEFAULT NULL AFTER avatar");

DROP PROCEDURE IF EXISTS add_col_v3;
