-- ════════════════════════════════════════════════════════════════════════════
-- EventManager — FULL CONSOLIDATED SCHEMA (v1.0.0)
-- Tương thích MySQL 5.6, 5.7, 8.0+
-- ════════════════════════════════════════════════════════════════════════════

SET SQL_SAFE_UPDATES = 0;

CREATE DATABASE IF NOT EXISTS event_management
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE event_management;

-- ────────────────────────────────────────────────────────────────────────────
-- 1. USERS
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100)  NOT NULL,
    email       VARCHAR(150)  NOT NULL UNIQUE,
    password    VARCHAR(255)  NOT NULL,
    role        ENUM('user','organizer','admin') DEFAULT 'user',
    department  VARCHAR(100) DEFAULT NULL,
    position    VARCHAR(100) DEFAULT NULL,
    avatar      VARCHAR(300) DEFAULT NULL,
    phone       VARCHAR(20)  DEFAULT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ────────────────────────────────────────────────────────────────────────────
-- 2. EVENTS
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
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id)    REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ────────────────────────────────────────────────────────────────────────────
-- 3. VENUES (Địa điểm)
-- ────────────────────────────────────────────────────────────────────────────
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

-- ────────────────────────────────────────────────────────────────────────────
-- 4. RESOURCES (Tài nguyên / thiết bị)
-- ────────────────────────────────────────────────────────────────────────────
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

-- ────────────────────────────────────────────────────────────────────────────
-- 5. EVENT_DEADLINES
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
-- 6. GUESTS & ATTENDEES
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

-- ────────────────────────────────────────────────────────────────────────────
-- 7. EVENT_STAFF
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

-- ────────────────────────────────────────────────────────────────────────────
-- 8. EVENT_TIMELINE & BUDGET
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
-- 9. BOOKINGS (Địa điểm & Thiết bị)
-- ────────────────────────────────────────────────────────────────────────────
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

-- ────────────────────────────────────────────────────────────────────────────
-- 10. TASK PHASES & MANAGEMENT
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS task_phases (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    event_id    INT NOT NULL,
    name        VARCHAR(200) NOT NULL,
    color       VARCHAR(20) DEFAULT '#6366f1',
    position    INT DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS event_tasks (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    event_id     INT NOT NULL,
    phase_id     INT DEFAULT NULL,
    parent_id    INT DEFAULT NULL,
    title        VARCHAR(300) NOT NULL,
    description  TEXT,
    assigned_to  INT DEFAULT NULL,
    supporters   JSON DEFAULT NULL,
    status       ENUM('todo','in_progress', 'review', 'done','cancelled') DEFAULT 'todo',
    priority     ENUM('low','medium','high') DEFAULT 'medium',
    due_date     DATETIME DEFAULT NULL,
    start_date   DATETIME DEFAULT NULL,
    is_milestone TINYINT(1) DEFAULT 0,
    position     INT DEFAULT 0,
    progress     INT DEFAULT 0,
    estimated_h  DECIMAL(6,2) DEFAULT NULL,
    actual_h     DECIMAL(6,2) DEFAULT NULL,
    created_by   INT,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id)    REFERENCES events(id)   ON DELETE CASCADE,
    FOREIGN KEY (phase_id)    REFERENCES task_phases(id) ON DELETE SET NULL,
    FOREIGN KEY (parent_id)   REFERENCES event_tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id)    ON DELETE SET NULL,
    FOREIGN KEY (created_by)  REFERENCES users(id)    ON DELETE SET NULL
);

-- ────────────────────────────────────────────────────────────────────────────
-- 11. TASK INTERACTION (Comments, History, Reminders)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS task_comments (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    task_id     INT NOT NULL,
    user_id     INT NOT NULL,
    content     TEXT NOT NULL,
    type        ENUM('comment','progress_update','status_change') DEFAULT 'comment',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES event_tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS task_history (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    task_id     INT NOT NULL,
    user_id     INT NOT NULL,
    action      VARCHAR(50) NOT NULL,
    old_value   TEXT,
    new_value   TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES event_tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS task_reminders (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    task_id     INT NOT NULL,
    remind_at   DATETIME NOT NULL,
    sent        TINYINT(1) DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES event_tasks(id) ON DELETE CASCADE,
    INDEX idx_remind_pending (sent, remind_at)
);

-- ────────────────────────────────────────────────────────────────────────────
-- 12. NOTIFICATIONS & FEEDBACK
-- ────────────────────────────────────────────────────────────────────────────
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

-- ────────────────────────────────────────────────────────────────────────────
-- 13. MIGRATION PROCEDURES (For patching existing databases)
-- ────────────────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS add_col_idempotent;
DELIMITER $$
CREATE PROCEDURE add_col_idempotent(IN tbl VARCHAR(64), IN col VARCHAR(64), IN def TEXT)
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

-- Patching USERS (v3)
CALL add_col_idempotent('users', 'department', "VARCHAR(100) DEFAULT NULL AFTER role");
CALL add_col_idempotent('users', 'position',   "VARCHAR(100) DEFAULT NULL AFTER department");
CALL add_col_idempotent('users', 'avatar',     "VARCHAR(300) DEFAULT NULL AFTER position");
CALL add_col_idempotent('users', 'phone',      "VARCHAR(20)  DEFAULT NULL AFTER avatar");

-- Patching EVENTS (v1/v2)
CALL add_col_idempotent('events', 'event_type',   'VARCHAR(100) AFTER description');
CALL add_col_idempotent('events', 'owner_id',     'INT AFTER event_type');
CALL add_col_idempotent('events', 'start_date',   'DATETIME AFTER owner_id');
CALL add_col_idempotent('events', 'end_date',     'DATETIME AFTER start_date');
CALL add_col_idempotent('events', 'venue_type',   "ENUM('online','offline') DEFAULT 'offline' AFTER end_date");
CALL add_col_idempotent('events', 'capacity',     'INT AFTER venue_type');
CALL add_col_idempotent('events', 'total_budget', 'DECIMAL(18,2) DEFAULT 0 AFTER capacity');
CALL add_col_idempotent('events', 'approved_by',  'INT AFTER total_budget');
CALL add_col_idempotent('events', 'approved_at',  'DATETIME AFTER approved_by');

-- Patching EVENT_TASKS (v4)
CALL add_col_idempotent('event_tasks', 'phase_id',     'INT DEFAULT NULL AFTER event_id');
CALL add_col_idempotent('event_tasks', 'parent_id',    'INT DEFAULT NULL AFTER phase_id');
CALL add_col_idempotent('event_tasks', 'supporters',   'JSON DEFAULT NULL AFTER assigned_to');
CALL add_col_idempotent('event_tasks', 'start_date',   'DATETIME DEFAULT NULL AFTER due_date');
CALL add_col_idempotent('event_tasks', 'is_milestone', 'TINYINT(1) DEFAULT 0');
CALL add_col_idempotent('event_tasks', 'progress',     'INT DEFAULT 0 AFTER position');
CALL add_col_idempotent('event_tasks', 'estimated_h',  'DECIMAL(6,2) DEFAULT NULL AFTER progress');
CALL add_col_idempotent('event_tasks', 'actual_h',     'DECIMAL(6,2) DEFAULT NULL AFTER estimated_h');

-- Fix ENUMs for existing tables
ALTER TABLE event_tasks MODIFY COLUMN status
    ENUM('todo','in_progress','review','done','cancelled') DEFAULT 'todo';

DROP PROCEDURE IF EXISTS add_col_idempotent;

-- ════════════════════════════════════════════════════════════════════════════
-- KIỂM TRA HỆ THỐNG
-- ════════════════════════════════════════════════════════════════════════════
SHOW TABLES;
DESCRIBE events;
DESCRIBE event_tasks;

SET SQL_SAFE_UPDATES = 1;


-- set tk admin ---
UPDATE event_management.users 
SET role = 'admin' 
WHERE email = 'yadmin@gmail.com';