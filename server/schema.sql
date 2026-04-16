-- ==========================================================
-- CƠ SỞ DỮ LIỆU: HỆ THỐNG QUẢN LÝ SỰ KIỆN (EVENTCORE)
-- TỔNG HỢP VÀ LÀM SẠCH (SYNTHESIZED & CLEANED)
-- ==========================================================

CREATE DATABASE IF NOT EXISTS event_management;
USE event_management;

SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------
-- 1. BẢNG NGƯỜI DÙNG (USERS)
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','organizer','user') DEFAULT 'user',
  `department` varchar(100) DEFAULT NULL,
  `position` varchar(100) DEFAULT NULL,
  `avatar` varchar(300) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `gender` enum('male','female','other') DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `resetToken` varchar(255) DEFAULT NULL,
  `resetTokenExpire` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ----------------------------------------------------------
-- 2. BẢNG ĐỊA ĐIỂM (VENUES)
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `venues`;
CREATE TABLE `venues` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `type` enum('room','hall','outdoor','online') DEFAULT 'room',
  `location` varchar(300) DEFAULT NULL,
  `capacity` int DEFAULT '0',
  `description` text,
  `facilities` json DEFAULT NULL,
  `status` enum('available','unavailable','maintenance') DEFAULT 'available',
  `created_by` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `venues_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ----------------------------------------------------------
-- 3. BẢNG SỰ KIỆN (EVENTS)
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `events`;
CREATE TABLE `events` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  `event_type` varchar(100) DEFAULT NULL,
  `owner_id` int DEFAULT NULL,
  `organizer_id` int DEFAULT NULL,
  `manager_id` int DEFAULT NULL,
  `tracker_id` int DEFAULT NULL,
  `coordination_unit` text,
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `venue_type` enum('online','offline') DEFAULT 'offline',
  `location` varchar(255) DEFAULT NULL,
  `capacity` int DEFAULT NULL,
  `total_budget` decimal(18,2) DEFAULT '0.00',
  `status` enum('draft','planning','approved','running','completed','cancelled') DEFAULT 'draft',
  `approved_by` int DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `owner_id` (`owner_id`),
  KEY `approved_by` (`approved_by`),
  KEY `organizer_id` (`organizer_id`),
  KEY `manager_id` (`manager_id`),
  KEY `tracker_id` (`tracker_id`),
  CONSTRAINT `events_ibfk_owner` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `events_ibfk_approver` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `events_ibfk_organizer` FOREIGN KEY (`organizer_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `events_ibfk_manager` FOREIGN KEY (`manager_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `events_ibfk_tracker` FOREIGN KEY (`tracker_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ----------------------------------------------------------
-- 4. BẢNG DEADLINE (EVENT_DEADLINES)
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `event_deadlines`;
CREATE TABLE `event_deadlines` (
  `id` int NOT NULL AUTO_INCREMENT,
  `event_id` int NOT NULL,
  `title` varchar(200) NOT NULL,
  `due_date` datetime NOT NULL,
  `assigned_to` int DEFAULT NULL,
  `status` enum('pending','working','completed','done','problem') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `note` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `event_id` (`event_id`),
  KEY `assigned_to` (`assigned_to`),
  CONSTRAINT `event_deadlines_ibfk_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `event_deadlines_ibfk_user` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ----------------------------------------------------------
-- 5. BẢNG GIAI ĐOẠN NHIỆM VỤ (TASK_PHASES)
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `task_phases`;
CREATE TABLE `task_phases` (
  `id` int NOT NULL AUTO_INCREMENT,
  `event_id` int NOT NULL,
  `name` varchar(200) NOT NULL,
  `color` varchar(20) DEFAULT '#6366f1',
  `position` int DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `event_id` (`event_id`),
  CONSTRAINT `task_phases_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ----------------------------------------------------------
-- 6. BẢNG NHIỆM VỤ CHI TIẾT (EVENT_TASKS)
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `event_tasks`;
CREATE TABLE `event_tasks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `event_id` int NOT NULL,
  `phase_id` int DEFAULT NULL,
  `parent_id` int DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `assigned_to` int DEFAULT NULL,
  `supporters` json DEFAULT NULL,
  `status` enum('todo','in_progress','review','done','cancelled') DEFAULT 'todo',
  `priority` enum('low','medium','high') DEFAULT 'medium',
  `start_date` datetime DEFAULT NULL,
  `due_date` datetime DEFAULT NULL,
  `is_milestone` tinyint(1) DEFAULT '0',
  `position` int DEFAULT '0',
  `progress` int DEFAULT '0',
  `estimated_h` decimal(5,2) DEFAULT NULL,
  `actual_h` decimal(5,2) DEFAULT NULL,
  `estimated_budget` decimal(18,2) DEFAULT '0.00',
  `feedback_status` enum('none','approved','rejected') DEFAULT 'none',
  `feedback_note` text,
  `created_by` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `event_id` (`event_id`),
  KEY `phase_id` (`phase_id`),
  KEY `parent_id` (`parent_id`),
  KEY `assigned_to` (`assigned_to`),
  CONSTRAINT `event_tasks_ibfk_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `event_tasks_ibfk_phase` FOREIGN KEY (`phase_id`) REFERENCES `task_phases` (`id`) ON DELETE SET NULL,
  CONSTRAINT `event_tasks_ibfk_parent` FOREIGN KEY (`parent_id`) REFERENCES `event_tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `event_tasks_ibfk_user` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ----------------------------------------------------------
-- 7. BẢNG BÌNH LUẬN NHIỆM VỤ (TASK_COMMENTS)
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `task_comments`;
CREATE TABLE `task_comments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `task_id` int NOT NULL,
  `user_id` int NOT NULL,
  `content` text NOT NULL,
  `type` enum('comment','progress_update','status_change') DEFAULT 'comment',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `task_id` (`task_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `task_comments_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `event_tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `task_comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ----------------------------------------------------------
-- 8. BẢNG LỊCH SỬ NHIỆM VỤ (TASK_HISTORY)
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `task_history`;
CREATE TABLE `task_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `task_id` int NOT NULL,
  `user_id` int NOT NULL,
  `action` varchar(50) NOT NULL,
  `old_value` text,
  `new_value` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `task_id` (`task_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `task_history_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `event_tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `task_history_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ----------------------------------------------------------
-- 9. BẢNG KHÁCH MỜI (GUESTS)
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `guests`;
CREATE TABLE `guests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `event_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `qr_code` varchar(255) DEFAULT NULL,
  `checked_in` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `event_id` (`event_id`),
  CONSTRAINT `guests_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ----------------------------------------------------------
-- 10. BẢNG NGƯỜI THAM GIA ĐĂNG KÝ (ATTENDEES)
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `attendees`;
CREATE TABLE `attendees` (
  `id` int NOT NULL AUTO_INCREMENT,
  `event_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `attendee_type` enum('internal','external') DEFAULT 'external',
  `qr_code` varchar(255) DEFAULT NULL,
  `checked_in` tinyint(1) DEFAULT '0',
  `checked_in_at` datetime DEFAULT NULL,
  `registered_by` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `qr_code` (`qr_code`),
  UNIQUE KEY `unique_user_event` (`user_id`,`event_id`),
  KEY `event_id` (`event_id`),
  CONSTRAINT `attendees_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `attendees_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ----------------------------------------------------------
-- 11. BẢNG CHI PHÍ SỰ KIỆN (EVENT_BUDGET)
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `event_budget`;
CREATE TABLE `event_budget` (
  `id` int NOT NULL AUTO_INCREMENT,
  `event_id` int NOT NULL,
  `item` varchar(255) NOT NULL,
  `cost` decimal(18,2) NOT NULL,
  `note` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `event_id` (`event_id`),
  CONSTRAINT `event_budget_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ----------------------------------------------------------
-- 12. BẢNG TÀI SẢN / NGUỒN LỰC (RESOURCES)
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `resources`;
CREATE TABLE `resources` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `quantity` int DEFAULT '1',
  `unit` varchar(50) DEFAULT NULL,
  `description` text,
  `status` enum('available','in_use','maintenance') DEFAULT 'available',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ----------------------------------------------------------
-- 13. BẢNG ĐẶT TÀI SẢN (EVENT_RESOURCE_BOOKINGS)
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `event_resource_bookings`;
CREATE TABLE `event_resource_bookings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `event_id` int NOT NULL,
  `resource_id` int NOT NULL,
  `quantity` int DEFAULT '1',
  `note` text,
  `status` enum('pending','confirmed','returned') DEFAULT 'pending',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `event_id` (`event_id`),
  KEY `resource_id` (`resource_id`),
  CONSTRAINT `resource_bookings_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `resource_bookings_ibfk_2` FOREIGN KEY (`resource_id`) REFERENCES `resources` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ----------------------------------------------------------
-- 14. BẢNG NHÂN SỰ SỰ KIỆN (EVENT_STAFF)
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `event_staff`;
CREATE TABLE `event_staff` (
  `id` int NOT NULL AUTO_INCREMENT,
  `event_id` int NOT NULL,
  `user_id` int NOT NULL,
  `role` enum('manager','marketing','technical','support','volunteer') DEFAULT 'volunteer',
  PRIMARY KEY (`id`),
  KEY `event_id` (`event_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `event_staff_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `event_staff_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ----------------------------------------------------------
-- 15. BẢNG LỊCH TRÌNH / CHƯƠNG TRÌNH (EVENT_TIMELINE)
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `event_timeline`;
CREATE TABLE `event_timeline` (
  `id` int NOT NULL AUTO_INCREMENT,
  `event_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `start_time` datetime DEFAULT NULL,
  `end_time` datetime DEFAULT NULL,
  `description` text,
  PRIMARY KEY (`id`),
  KEY `event_id` (`event_id`),
  CONSTRAINT `event_timeline_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ----------------------------------------------------------
-- 16. BẢNG PHẢN HỒI (FEEDBACK)
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `feedback`;
CREATE TABLE `feedback` (
  `id` int NOT NULL AUTO_INCREMENT,
  `event_id` int DEFAULT NULL,
  `name` varchar(100) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `rating` tinyint DEFAULT '5',
  `message` text NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `event_id` (`event_id`),
  CONSTRAINT `feedback_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ----------------------------------------------------------
-- 17. BẢNG THÔNG BÁO (NOTIFICATIONS)
-- ----------------------------------------------------------
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `type` varchar(50) NOT NULL,
  `title` varchar(200) NOT NULL,
  `message` text,
  `link` varchar(300) DEFAULT NULL,
  `read_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_read` (`user_id`,`read_at`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ==========================================================
-- DỮ LIỆU MẪU (SEED DATA)
-- ==========================================================

-- Mật khẩu mặc định đều là: admin123 / organizer123 / user123 (đã bcrypt)
INSERT INTO `users` (`name`, `email`, `password`, `role`) VALUES 
('Super Admin', 'admin@eventpro.com', '$2b$10$FB5o8rQZbp9tzPXMKlh/Rukfllf.i7vR1ADQe6A4C9jiQjLUdaYgC', 'admin'),
('Organizer Demo', 'organizer@eventpro.com', '$2b$10$fYHL7uyfykAoiDEMP5SQ4epCE0am5JI4H9ABNkk6G4l5zcKQTc.rm', 'organizer'),
('User Demo', 'user@eventpro.com', '$2b$10$.oVZIekG4HvvemwCGUEytuL3Z9iSM.NGgkFzcVJ0/OBApNaB0PRmG', 'user');

-- Thêm một địa điểm mẫu
INSERT INTO `venues` (`name`, `type`, `location`, `capacity`, `description`, `status`) VALUES 
('Hội trường A1', 'hall', 'Tầng 1, Tòa nhà trung tâm', 200, 'Hội trường lớn với đầy đủ thiết bị âm thanh, ánh sáng', 'available');
