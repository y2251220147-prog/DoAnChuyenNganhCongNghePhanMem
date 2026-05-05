-- ==========================================================
-- CƠ SỞ DỮ LIỆU: HỆ THỐNG QUẢN LÝ SỰ KIỆN (EVENTCORE v2.0)
-- Cập nhật: 5 ràng buộc nghiệp vụ then chốt
-- ==========================================================

CREATE DATABASE IF NOT EXISTS event_management;
USE event_management;

SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------
-- 1. BẢNG PHÒNG BAN (DEPARTMENTS) [MỚI]
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `departments`;
CREATE TABLE `departments` (
  `id`          INT NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(150) NOT NULL,
  `code`        VARCHAR(20)  NOT NULL COMMENT 'Mã phòng ban, vd: HR, IT, MKT',
  `manager_id`  INT DEFAULT NULL COMMENT 'Trưởng phòng',
  `description` TEXT DEFAULT NULL,
  `created_at`  DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_dept_code` (`code`),
  KEY `fk_dept_manager` (`manager_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ----------------------------------------------------------
-- 2. BẢNG NGƯỜI DÙNG (USERS) [SỬA: department_id FK]
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id`               INT NOT NULL AUTO_INCREMENT,
  `name`             VARCHAR(100) NOT NULL,
  `email`            VARCHAR(100) NOT NULL,
  `password`         VARCHAR(255) NOT NULL,
  `role`             ENUM('admin','organizer','user') DEFAULT 'user',
  `department_id`    INT DEFAULT NULL COMMENT 'Phòng ban trực thuộc (FK → departments)',
  `position`         VARCHAR(100) DEFAULT NULL,
  `avatar`           VARCHAR(300) DEFAULT NULL,
  `phone`            VARCHAR(20) DEFAULT NULL,
  `gender`           ENUM('male','female','other') DEFAULT NULL,
  `address`          VARCHAR(255) DEFAULT NULL,
  `resetToken`       VARCHAR(255) DEFAULT NULL,
  `resetTokenExpire` DATETIME DEFAULT NULL,
  `created_at`       TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `fk_user_dept` (`department_id`),
  CONSTRAINT `users_ibfk_dept` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sau khi tạo users, thêm FK manager_id cho departments
ALTER TABLE `departments`
  ADD CONSTRAINT `dept_ibfk_manager` FOREIGN KEY (`manager_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;


-- ----------------------------------------------------------
-- 3. BẢNG ĐỊA ĐIỂM (VENUES)
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `venues`;
CREATE TABLE `venues` (
  `id`          INT NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(200) NOT NULL,
  `type`        ENUM('room','hall','outdoor','online') DEFAULT 'room',
  `location`    VARCHAR(300) DEFAULT NULL,
  `capacity`    INT DEFAULT '0',
  `description` TEXT,
  `facilities`  JSON DEFAULT NULL,
  `status`      ENUM('available','unavailable','maintenance') DEFAULT 'available',
  `created_by`  INT DEFAULT NULL,
  `created_at`  DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `venues_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ----------------------------------------------------------
-- 4. BẢNG SỰ KIỆN (EVENTS)
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `events`;
CREATE TABLE `events` (
  `id`                INT NOT NULL AUTO_INCREMENT,
  `name`              VARCHAR(255) NOT NULL,
  `description`       TEXT,
  `event_type`        VARCHAR(100) DEFAULT NULL,
  `owner_id`          INT DEFAULT NULL,
  `organizer_id`      INT DEFAULT NULL,
  `manager_id`        INT DEFAULT NULL,
  `tracker_id`        INT DEFAULT NULL,
  `coordination_unit` VARCHAR(255) DEFAULT NULL,
  `venue_id`          INT DEFAULT NULL,
  `start_date`        DATETIME NOT NULL,
  `end_date`          DATETIME NOT NULL,
  `venue_type`        ENUM('online','offline') DEFAULT 'offline',
  `location`          VARCHAR(255) DEFAULT NULL,
  `capacity`          INT DEFAULT NULL,
  `total_budget`      DECIMAL(18,2) DEFAULT '0.00',
  `status`            ENUM('draft','planning','approved','running','completed','cancelled') DEFAULT 'draft',
  `approved_by`       INT DEFAULT NULL,
  `approved_at`       DATETIME DEFAULT NULL,
  `created_at`        TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `owner_id` (`owner_id`),
  KEY `approved_by` (`approved_by`),
  KEY `organizer_id` (`organizer_id`),
  KEY `manager_id` (`manager_id`),
  KEY `tracker_id` (`tracker_id`),
  KEY `venue_id` (`venue_id`),
  CONSTRAINT `events_ibfk_owner`     FOREIGN KEY (`owner_id`)     REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `events_ibfk_approver`  FOREIGN KEY (`approved_by`)  REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `events_ibfk_organizer` FOREIGN KEY (`organizer_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `events_ibfk_manager`   FOREIGN KEY (`manager_id`)   REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `events_ibfk_tracker`   FOREIGN KEY (`tracker_id`)   REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `events_ibfk_venue`     FOREIGN KEY (`venue_id`)     REFERENCES `venues` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ----------------------------------------------------------
-- 5. BẢNG GIAI ĐOẠN NHIỆM VỤ (TASK_PHASES)
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `task_phases`;
CREATE TABLE `task_phases` (
  `id`         INT NOT NULL AUTO_INCREMENT,
  `event_id`   INT NOT NULL,
  `name`       VARCHAR(200) NOT NULL,
  `color`      VARCHAR(20) DEFAULT '#6366f1',
  `position`   INT DEFAULT '0',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `event_id` (`event_id`),
  CONSTRAINT `task_phases_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ----------------------------------------------------------
-- 6. BẢNG NHIỆM VỤ CHI TIẾT (EVENT_TASKS)
-- SỬA: due_date NOT NULL (deadline bắt buộc)
--      + assigned_dept_id (gán cho phòng ban)
--      + status Kanban 3 cột: todo / in_progress / done
--      + is_cancelled flag riêng biệt
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `event_tasks`;
CREATE TABLE `event_tasks` (
  `id`               INT NOT NULL AUTO_INCREMENT,
  `event_id`         INT NOT NULL,
  `phase_id`         INT DEFAULT NULL,
  `parent_id`        INT DEFAULT NULL,
  `title`            VARCHAR(255) NOT NULL,
  `description`      TEXT,
  -- Phân bổ: chỉ 1 trong 2 được set (individual hoặc department)
  `assigned_to`      INT DEFAULT NULL     COMMENT 'Gán cho cá nhân nhân viên',
  `assigned_dept_id` INT DEFAULT NULL     COMMENT 'Gán cho phòng ban phụ trách',
  `supporters`       JSON DEFAULT NULL,
  -- Kanban 3 cột chuẩn
  `status`           ENUM('todo','in_progress','done') DEFAULT 'todo'
                     COMMENT 'Chuẩn bị | Đang làm | Hoàn thành',
  `is_cancelled`     TINYINT(1) DEFAULT '0' COMMENT 'Đã huỷ (không ảnh hưởng luồng Kanban)',
  `priority`         ENUM('low','medium','high') DEFAULT 'medium',
  `start_date`       DATETIME DEFAULT NULL,
  -- DEADLINE BẮT BUỘC — NOT NULL
  `due_date`         DATETIME NOT NULL    COMMENT 'Deadline bắt buộc phải nhập khi tạo task',
  `is_milestone`     TINYINT(1) DEFAULT '0',
  `position`         INT DEFAULT '0',
  `progress`         INT DEFAULT '0',
  `estimated_h`      DECIMAL(5,2) DEFAULT NULL,
  `actual_h`         DECIMAL(5,2) DEFAULT NULL,
  `estimated_budget` DECIMAL(18,2) DEFAULT '0.00',
  `feedback_status`  ENUM('none','approved','rejected') DEFAULT 'none',
  `feedback_note`    TEXT,
  `created_by`       INT DEFAULT NULL,
  `created_at`       DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `event_id` (`event_id`),
  KEY `phase_id` (`phase_id`),
  KEY `parent_id` (`parent_id`),
  KEY `assigned_to` (`assigned_to`),
  KEY `assigned_dept_id` (`assigned_dept_id`),
  -- NOTE: ràng buộc assigned_to ⊕ assigned_dept_id được enforce bằng TRIGGER (xem phần Triggers bên dưới)
  CONSTRAINT `event_tasks_ibfk_event`  FOREIGN KEY (`event_id`)         REFERENCES `events` (`id`)      ON DELETE CASCADE,
  CONSTRAINT `event_tasks_ibfk_phase`  FOREIGN KEY (`phase_id`)         REFERENCES `task_phases` (`id`) ON DELETE SET NULL,
  CONSTRAINT `event_tasks_ibfk_parent` FOREIGN KEY (`parent_id`)        REFERENCES `event_tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `event_tasks_ibfk_user`   FOREIGN KEY (`assigned_to`)      REFERENCES `users` (`id`)       ON DELETE SET NULL,
  CONSTRAINT `event_tasks_ibfk_dept`   FOREIGN KEY (`assigned_dept_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ----------------------------------------------------------
-- 7. BẢNG NGƯỜI THAM GIA (ATTENDEES) — SINGLE SOURCE OF TRUTH
-- Hợp nhất bảng guests (external) + attendees (internal)
-- attendee_type = 'internal' : Nhân viên tự đăng ký (user_id bắt buộc)
-- attendee_type = 'external' : Khách mời bên ngoài  (user_id = NULL)
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `attendees`;
CREATE TABLE `attendees` (
  `id`            INT NOT NULL AUTO_INCREMENT,
  `event_id`      INT NOT NULL,
  -- Nhân viên nội bộ: bắt buộc có user_id
  -- Khách mời ngoài:  user_id = NULL
  `user_id`       INT DEFAULT NULL,
  -- Thông tin cá nhân (dùng cho external, hoặc override cho internal)
  `name`          VARCHAR(100) NOT NULL,
  `email`         VARCHAR(150) NOT NULL,
  `phone`         VARCHAR(20) DEFAULT NULL,
  `organization`  VARCHAR(200) DEFAULT NULL COMMENT 'Tổ chức/Công ty (chủ yếu cho external)',
  `title`         VARCHAR(100) DEFAULT NULL COMMENT 'Chức danh',
  `note`          TEXT DEFAULT NULL,
  -- Phân loại người tham gia
  `attendee_type` ENUM('internal','external') DEFAULT 'external'
                  COMMENT 'internal=Nhân viên đăng ký | external=Khách mời ngoài',
  -- Check-in
  `qr_code`       VARCHAR(255) DEFAULT NULL,
  `checked_in`    TINYINT(1) DEFAULT '0',
  `checked_in_at` DATETIME DEFAULT NULL,
  -- Ai thêm record này vào
  `registered_by` INT DEFAULT NULL COMMENT 'Nhân viên tự đăng ký / Admin nhập hộ',
  `invited_by`    INT DEFAULT NULL COMMENT 'Ai mời khách này (cho external)',
  `created_at`    DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `qr_code` (`qr_code`),
  -- Mỗi nhân viên chỉ đăng ký 1 lần / sự kiện
  UNIQUE KEY `uq_user_event` (`user_id`, `event_id`),
  KEY `event_id` (`event_id`),
  -- NOTE: ràng buộc internal phải có user_id được enforce bằng TRIGGER (xem phần Triggers bên dưới)
  CONSTRAINT `attendees_ibfk_event`    FOREIGN KEY (`event_id`)      REFERENCES `events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `attendees_ibfk_user`     FOREIGN KEY (`user_id`)       REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `attendees_ibfk_reg`      FOREIGN KEY (`registered_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `attendees_ibfk_invited`  FOREIGN KEY (`invited_by`)    REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ----------------------------------------------------------
-- 8. TRIGGERS
-- [A] Nghiệp vụ #1: assigned_to ⊕ assigned_dept_id (mutually exclusive)
-- [B] Nghiệp vụ #3: internal attendee phải có user_id
-- [C] Nghiệp vụ #4: Khi nhân viên đăng ký tham gia sự kiện →
--       - Tự động hủy gán task đang có của họ trong sự kiện
--       - Chặn gán task mới cho họ trong sự kiện đó
-- ----------------------------------------------------------
DELIMITER $$

-- [A1] Chặn INSERT task gán đồng thời cả người lẫn phòng ban
CREATE TRIGGER `trg_task_assignment_check_insert`
BEFORE INSERT ON `event_tasks`
FOR EACH ROW
BEGIN
  IF NEW.assigned_to IS NOT NULL AND NEW.assigned_dept_id IS NOT NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'CONFLICT: Không thể gán task đồng thời cho cả cá nhân lẫn phòng ban.';
  END IF;
END$$

-- [A2] Chặn UPDATE task gán đồng thời cả người lẫn phòng ban
CREATE TRIGGER `trg_task_assignment_check_update`
BEFORE UPDATE ON `event_tasks`
FOR EACH ROW
BEGIN
  IF NEW.assigned_to IS NOT NULL AND NEW.assigned_dept_id IS NOT NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'CONFLICT: Không thể gán task đồng thời cho cả cá nhân lẫn phòng ban.';
  END IF;
END$$

-- [B1] Chặn INSERT attendee internal mà không có user_id
CREATE TRIGGER `trg_attendee_internal_check_insert`
BEFORE INSERT ON `attendees`
FOR EACH ROW
BEGIN
  IF NEW.attendee_type = 'internal' AND NEW.user_id IS NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'CONFLICT: Attendee loại internal bắt buộc phải có user_id.';
  END IF;
END$$

-- [B2] Chặn UPDATE attendee thành internal mà không có user_id
CREATE TRIGGER `trg_attendee_internal_check_update`
BEFORE UPDATE ON `attendees`
FOR EACH ROW
BEGIN
  IF NEW.attendee_type = 'internal' AND NEW.user_id IS NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'CONFLICT: Attendee loại internal bắt buộc phải có user_id.';
  END IF;
END$$

-- Trigger A: Khi INSERT vào attendees (nhân viên đăng ký)
-- → Tự động hủy gán task đang có của nhân viên đó trong sự kiện
CREATE TRIGGER `trg_remove_task_on_register`
AFTER INSERT ON `attendees`
FOR EACH ROW
BEGIN
  IF NEW.attendee_type = 'internal' AND NEW.user_id IS NOT NULL THEN
    UPDATE `event_tasks`
    SET `assigned_to` = NULL
    WHERE `event_id`    = NEW.event_id
      AND `assigned_to` = NEW.user_id;
  END IF;
END$$

-- Trigger B: Chặn INSERT task gán cho người đã là attendee
CREATE TRIGGER `trg_block_task_assign_insert`
BEFORE INSERT ON `event_tasks`
FOR EACH ROW
BEGIN
  IF NEW.assigned_to IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM `attendees`
      WHERE `user_id`       = NEW.assigned_to
        AND `event_id`      = NEW.event_id
        AND `attendee_type` = 'internal'
      LIMIT 1
    ) THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'CONFLICT: Nhân viên đã đăng ký tham gia sự kiện, không thể gán nhiệm vụ tổ chức.';
    END IF;
  END IF;
END$$

-- Trigger C: Chặn UPDATE task gán cho người đã là attendee
CREATE TRIGGER `trg_block_task_assign_update`
BEFORE UPDATE ON `event_tasks`
FOR EACH ROW
BEGIN
  IF NEW.assigned_to IS NOT NULL AND (OLD.assigned_to IS NULL OR NEW.assigned_to != OLD.assigned_to) THEN
    IF EXISTS (
      SELECT 1 FROM `attendees`
      WHERE `user_id`       = NEW.assigned_to
        AND `event_id`      = NEW.event_id
        AND `attendee_type` = 'internal'
      LIMIT 1
    ) THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'CONFLICT: Nhân viên đã đăng ký tham gia sự kiện, không thể gán nhiệm vụ tổ chức.';
    END IF;
  END IF;
END$$

DELIMITER ;


-- ----------------------------------------------------------
-- 9. BẢNG BÌNH LUẬN NHIỆM VỤ (TASK_COMMENTS)
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `task_comments`;
CREATE TABLE `task_comments` (
  `id`         INT NOT NULL AUTO_INCREMENT,
  `task_id`    INT NOT NULL,
  `user_id`    INT NOT NULL,
  `content`    TEXT NOT NULL,
  `type`       ENUM('comment','progress_update','status_change') DEFAULT 'comment',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `task_id` (`task_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `task_comments_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `event_tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `task_comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ----------------------------------------------------------
-- 10. BẢNG LỊCH SỬ NHIỆM VỤ (TASK_HISTORY)
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `task_history`;
CREATE TABLE `task_history` (
  `id`         INT NOT NULL AUTO_INCREMENT,
  `task_id`    INT NOT NULL,
  `user_id`    INT NOT NULL,
  `action`     VARCHAR(50) NOT NULL,
  `old_value`  TEXT,
  `new_value`  TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `task_id` (`task_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `task_history_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `event_tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `task_history_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ----------------------------------------------------------
-- 11. BẢNG CHI PHÍ SỰ KIỆN (EVENT_BUDGET)
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `event_budget`;
CREATE TABLE `event_budget` (
  `id`         INT NOT NULL AUTO_INCREMENT,
  `event_id`   INT NOT NULL,
  `item`       VARCHAR(255) NOT NULL,
  `cost`       DECIMAL(18,2) NOT NULL,
  `note`       TEXT,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `event_id` (`event_id`),
  CONSTRAINT `event_budget_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ----------------------------------------------------------
-- 12. BẢNG TÀI SẢN / NGUỒN LỰC (RESOURCES)
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `resources`;
CREATE TABLE `resources` (
  `id`          INT NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(200) NOT NULL,
  `category`    VARCHAR(100) DEFAULT NULL,
  `quantity`    INT DEFAULT '1',
  `unit`        VARCHAR(50) DEFAULT NULL,
  `description` TEXT,
  `status`      ENUM('available','in_use','maintenance') DEFAULT 'available',
  `created_at`  DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ----------------------------------------------------------
-- 13. BẢNG ĐẶT TÀI SẢN (EVENT_RESOURCE_BOOKINGS)
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `event_resource_bookings`;
CREATE TABLE `event_resource_bookings` (
  `id`          INT NOT NULL AUTO_INCREMENT,
  `event_id`    INT NOT NULL,
  `resource_id` INT NOT NULL,
  `quantity`    INT DEFAULT '1',
  `note`        TEXT,
  `status`      ENUM('pending','confirmed','returned') DEFAULT 'pending',
  `created_at`  DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `event_id` (`event_id`),
  KEY `resource_id` (`resource_id`),
  CONSTRAINT `resource_bookings_ibfk_1` FOREIGN KEY (`event_id`)    REFERENCES `events` (`id`)    ON DELETE CASCADE,
  CONSTRAINT `resource_bookings_ibfk_2` FOREIGN KEY (`resource_id`) REFERENCES `resources` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ----------------------------------------------------------
-- 14. BẢNG NHÂN SỰ SỰ KIỆN (EVENT_STAFF)
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `event_staff`;
CREATE TABLE `event_staff` (
  `id`       INT NOT NULL AUTO_INCREMENT,
  `event_id` INT NOT NULL,
  `user_id`  INT NOT NULL,
  `role`     ENUM('manager','marketing','technical','support','volunteer') DEFAULT 'volunteer',
  PRIMARY KEY (`id`),
  KEY `event_id` (`event_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `event_staff_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `event_staff_ibfk_2` FOREIGN KEY (`user_id`)  REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ----------------------------------------------------------
-- 15. BẢNG LỊCH TRÌNH (EVENT_TIMELINE)
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `event_timeline`;
CREATE TABLE `event_timeline` (
  `id`          INT NOT NULL AUTO_INCREMENT,
  `event_id`    INT NOT NULL,
  `title`       VARCHAR(255) NOT NULL,
  `start_time`  DATETIME DEFAULT NULL,
  `end_time`    DATETIME DEFAULT NULL,
  `description` TEXT,
  PRIMARY KEY (`id`),
  KEY `event_id` (`event_id`),
  CONSTRAINT `event_timeline_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ----------------------------------------------------------
-- 16. BẢNG PHẢN HỒI (FEEDBACK)
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `feedback`;
CREATE TABLE `feedback` (
  `id`         INT NOT NULL AUTO_INCREMENT,
  `event_id`   INT DEFAULT NULL,
  `user_id`    INT DEFAULT NULL,
  `name`       VARCHAR(100) DEFAULT NULL,
  `email`      VARCHAR(150) DEFAULT NULL,
  `rating`     TINYINT DEFAULT '5',
  `message`    TEXT NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `event_id` (`event_id`),
  KEY `user_id`  (`user_id`),
  CONSTRAINT `feedback_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE SET NULL,
  CONSTRAINT `feedback_ibfk_2` FOREIGN KEY (`user_id`)  REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ----------------------------------------------------------
-- 17. BẢNG THÔNG BÁO (NOTIFICATIONS)
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id`         INT NOT NULL AUTO_INCREMENT,
  `user_id`    INT NOT NULL,
  `type`       VARCHAR(50) NOT NULL,
  `title`      VARCHAR(200) NOT NULL,
  `message`    TEXT,
  `link`       VARCHAR(300) DEFAULT NULL,
  `read_at`    DATETIME DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_read` (`user_id`, `read_at`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


SET FOREIGN_KEY_CHECKS = 1;

-- ==========================================================
-- DỮ LIỆU MẪU (SEED DATA)
-- ==========================================================

-- Phòng ban mẫu
INSERT INTO `departments` (`name`, `code`, `description`) VALUES
('Ban Giám đốc',        'BOD', 'Ban lãnh đạo cấp cao'),
('Phòng Nhân sự',       'HR',  'Quản lý nhân sự và tuyển dụng'),
('Phòng Công nghệ',     'IT',  'Phát triển và vận hành hệ thống'),
('Phòng Marketing',     'MKT', 'Truyền thông và sự kiện'),
('Phòng Hành chính',    'ADM', 'Hành chính và hậu cần');

-- Người dùng mẫu (mật khẩu: admin123 / organizer123 / user123 — đã bcrypt)
INSERT INTO `users` (`name`, `email`, `password`, `role`, `department_id`) VALUES
('Super Admin',    'admin@eventpro.com',     '$2b$10$FB5o8rQZbp9tzPXMKlh/Rukfllf.i7vR1ADQe6A4C9jiQjLUdaYgC', 'admin',     1),
('Organizer Demo', 'organizer@eventpro.com', '$2b$10$fYHL7uyfykAoiDEMP5SQ4epCE0am5JI4H9ABNkk6G4l5zcKQTc.rm', 'organizer', 4),
('User Demo',      'user@eventpro.com',      '$2b$10$.oVZIekG4HvvemwCGUEytuL3Z9iSM.NGgkFzcVJ0/OBApNaB0PRmG', 'user',      3);

-- Cập nhật trưởng phòng mẫu
UPDATE `departments` SET `manager_id` = 1 WHERE `code` = 'BOD';
UPDATE `departments` SET `manager_id` = 2 WHERE `code` = 'MKT';

-- Địa điểm mẫu
INSERT INTO `venues` (`name`, `type`, `location`, `capacity`, `description`, `status`) VALUES
('Hội trường A1', 'hall', 'Tầng 1, Tòa nhà trung tâm', 200, 'Hội trường lớn với đầy đủ thiết bị âm thanh, ánh sáng', 'available');
