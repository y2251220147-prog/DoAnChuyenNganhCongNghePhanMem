CREATE DATABASE IF NOT EXISTS event_management;
USE event_management;

-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: event_management
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `attendees`
--

DROP TABLE IF EXISTS `attendees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
  KEY `registered_by` (`registered_by`),
  CONSTRAINT `attendees_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `attendees_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `attendees_ibfk_3` FOREIGN KEY (`registered_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendees`
--

LOCK TABLES `attendees` WRITE;
/*!40000 ALTER TABLE `attendees` DISABLE KEYS */;
/*!40000 ALTER TABLE `attendees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `budgets`
--

DROP TABLE IF EXISTS `budgets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `budgets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `event_id` int DEFAULT NULL,
  `item` varchar(255) DEFAULT NULL,
  `cost` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `event_id` (`event_id`),
  CONSTRAINT `budgets_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `budgets`
--

LOCK TABLES `budgets` WRITE;
/*!40000 ALTER TABLE `budgets` DISABLE KEYS */;
INSERT INTO `budgets` VALUES (1,1,'Decoration',5000000.00,'2026-03-18 19:21:08');
/*!40000 ALTER TABLE `budgets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `event_budget`
--

DROP TABLE IF EXISTS `event_budget`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event_budget` (
  `id` int NOT NULL AUTO_INCREMENT,
  `event_id` int NOT NULL,
  `item` varchar(255) DEFAULT NULL,
  `cost` decimal(10,2) DEFAULT NULL,
  `note` text,
  PRIMARY KEY (`id`),
  KEY `event_id` (`event_id`),
  CONSTRAINT `event_budget_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `event_budget`
--

LOCK TABLES `event_budget` WRITE;
/*!40000 ALTER TABLE `event_budget` DISABLE KEYS */;
INSERT INTO `event_budget` VALUES (1,5,'fsd',10000000.00,NULL),(2,3,'g',23000000.00,NULL),(3,8,'fds',5000000.00,NULL),(4,8,'chi phi ban đau',20000000.00,NULL);
/*!40000 ALTER TABLE `event_budget` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `event_deadlines`
--

DROP TABLE IF EXISTS `event_deadlines`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event_deadlines` (
  `id` int NOT NULL AUTO_INCREMENT,
  `event_id` int NOT NULL,
  `title` varchar(200) NOT NULL,
  `due_date` datetime NOT NULL,
  `done` tinyint(1) DEFAULT '0',
  `note` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `event_id` (`event_id`),
  CONSTRAINT `event_deadlines_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `event_deadlines`
--

LOCK TABLES `event_deadlines` WRITE;
/*!40000 ALTER TABLE `event_deadlines` DISABLE KEYS */;
INSERT INTO `event_deadlines` VALUES (1,3,'Chốt concept','2026-03-13 21:41:00',1,NULL,'2026-03-22 20:41:49'),(2,3,'Chốt địa điểm','2026-03-16 21:41:00',1,NULL,'2026-03-22 20:41:49'),(3,3,'Hoàn thành marketing','2026-03-18 21:41:00',1,NULL,'2026-03-22 20:41:49'),(4,3,'Tổng duyệt','2026-03-22 21:41:00',1,NULL,'2026-03-22 20:41:49'),(9,5,'Chốt concept','2026-03-12 14:08:00',0,NULL,'2026-03-22 22:08:47'),(10,5,'Chốt địa điểm','2026-03-15 14:08:00',0,NULL,'2026-03-22 22:08:47'),(11,5,'Hoàn thành marketing','2026-03-17 14:08:00',0,NULL,'2026-03-22 22:08:47'),(12,5,'Tổng duyệt','2026-03-21 14:08:00',0,NULL,'2026-03-22 22:08:47'),(21,8,'Chốt concept','2026-03-15 19:00:00',1,NULL,'2026-03-24 08:23:37'),(22,8,'Chốt địa điểm','2026-03-18 19:00:00',1,NULL,'2026-03-24 08:23:37'),(23,8,'Hoàn thành marketing','2026-03-20 19:00:00',1,NULL,'2026-03-24 08:23:37'),(24,8,'Tổng duyệt','2026-03-24 19:00:00',1,NULL,'2026-03-24 08:23:37');
/*!40000 ALTER TABLE `event_deadlines` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `event_resource_bookings`
--

DROP TABLE IF EXISTS `event_resource_bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
  CONSTRAINT `event_resource_bookings_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `event_resource_bookings_ibfk_2` FOREIGN KEY (`resource_id`) REFERENCES `resources` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `event_resource_bookings`
--

LOCK TABLES `event_resource_bookings` WRITE;
/*!40000 ALTER TABLE `event_resource_bookings` DISABLE KEYS */;
/*!40000 ALTER TABLE `event_resource_bookings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `event_staff`
--

DROP TABLE IF EXISTS `event_staff`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `event_staff`
--

LOCK TABLES `event_staff` WRITE;
/*!40000 ALTER TABLE `event_staff` DISABLE KEYS */;
INSERT INTO `event_staff` VALUES (1,1,8,'volunteer'),(2,3,2,'technical'),(3,5,2,'support'),(4,8,5,'support'),(5,8,7,'manager');
/*!40000 ALTER TABLE `event_staff` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `event_tasks`
--

DROP TABLE IF EXISTS `event_tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event_tasks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `event_id` int NOT NULL,
  `phase_id` int DEFAULT NULL,
  `parent_id` int DEFAULT NULL,
  `title` varchar(300) NOT NULL,
  `description` text,
  `assigned_to` int DEFAULT NULL,
  `supporters` json DEFAULT NULL,
  `status` enum('todo','in_progress','review','done','cancelled') DEFAULT 'todo',
  `priority` enum('low','medium','high') DEFAULT 'medium',
  `due_date` datetime DEFAULT NULL,
  `start_date` datetime DEFAULT NULL,
  `position` int DEFAULT '0',
  `progress` int DEFAULT '0',
  `estimated_h` decimal(6,2) DEFAULT NULL,
  `actual_h` decimal(6,2) DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_milestone` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `event_id` (`event_id`),
  KEY `assigned_to` (`assigned_to`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `event_tasks_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `event_tasks_ibfk_2` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `event_tasks_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `event_tasks`
--

LOCK TABLES `event_tasks` WRITE;
/*!40000 ALTER TABLE `event_tasks` DISABLE KEYS */;
/*!40000 ALTER TABLE `event_tasks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `event_timeline`
--

DROP TABLE IF EXISTS `event_timeline`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event_timeline` (
  `id` int NOT NULL AUTO_INCREMENT,
  `event_id` int NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `start_time` datetime DEFAULT NULL,
  `end_time` datetime DEFAULT NULL,
  `description` text,
  PRIMARY KEY (`id`),
  KEY `event_id` (`event_id`),
  CONSTRAINT `event_timeline_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `event_timeline`
--

LOCK TABLES `event_timeline` WRITE;
/*!40000 ALTER TABLE `event_timeline` DISABLE KEYS */;
INSERT INTO `event_timeline` VALUES (1,1,'Opening','18:00:00','18:30:00','Opening ceremony'),(2,1,'Opening','18:00:00','18:30:00','Opening ceremony'),(3,1,'Opening','18:00:00','18:30:00','Opening ceremony'),(8,8,'fsd','17:26:00','18:00:00','dọn đồ ăn ');
/*!40000 ALTER TABLE `event_timeline` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `event_venue_bookings`
--

DROP TABLE IF EXISTS `event_venue_bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event_venue_bookings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `event_id` int NOT NULL,
  `venue_id` int NOT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `note` text,
  `status` enum('pending','confirmed','cancelled') DEFAULT 'pending',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `event_id` (`event_id`),
  KEY `venue_id` (`venue_id`),
  CONSTRAINT `event_venue_bookings_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `event_venue_bookings_ibfk_2` FOREIGN KEY (`venue_id`) REFERENCES `venues` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `event_venue_bookings`
--

LOCK TABLES `event_venue_bookings` WRITE;
/*!40000 ALTER TABLE `event_venue_bookings` DISABLE KEYS */;
/*!40000 ALTER TABLE `event_venue_bookings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `events`
--

DROP TABLE IF EXISTS `events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `events` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `date` date DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `description` text,
  `event_type` varchar(100) DEFAULT NULL,
  `owner_id` int DEFAULT NULL,
  `start_date` datetime DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  `venue_type` enum('online','offline') DEFAULT 'offline',
  `capacity` int DEFAULT NULL,
  `total_budget` decimal(18,2) DEFAULT '0.00',
  `approved_by` int DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `status` enum('draft','planning','approved','running','completed','cancelled') DEFAULT 'draft',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_events_owner` (`owner_id`),
  KEY `fk_events_approver` (`approved_by`),
  CONSTRAINT `fk_events_approver` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_events_owner` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `events`
--

LOCK TABLES `events` WRITE;
/*!40000 ALTER TABLE `events` DISABLE KEYS */;
INSERT INTO `events` VALUES (1,'Wedding Party','2026-05-18','Da Nang','Wedding event',NULL,NULL,NULL,NULL,'offline',NULL,0.00,NULL,NULL,'completed','2026-03-17 03:58:17'),(3,'Hội thảo AI 2026',NULL,'fsdf','Những công nghệ mới năm 2026','Hội thảo',6,'2026-03-23 21:41:00','2026-03-23 22:41:00','offline',1000,5000000.00,6,'2026-03-22 20:42:04','completed','2026-03-22 13:41:49'),(5,'fdsfds',NULL,'fdsfs','gdgdrf','Hội nghị',6,'2026-03-22 14:08:00','2026-03-23 13:08:00','offline',NULL,31233123.00,6,'2026-03-22 22:30:46','completed','2026-03-22 15:08:46'),(8,'huyduc',NULL,'123 Núi  Thành','tiệc cuối tháng','Tiệc nội bộ',6,'2026-03-25 19:00:00','2026-03-25 23:22:00','offline',200,20000000.00,6,'2026-03-24 08:30:30','completed','2026-03-24 01:23:37');
/*!40000 ALTER TABLE `events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `feedback`
--

DROP TABLE IF EXISTS `feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `feedback`
--

LOCK TABLES `feedback` WRITE;
/*!40000 ALTER TABLE `feedback` DISABLE KEYS */;
/*!40000 ALTER TABLE `feedback` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `guests`
--

DROP TABLE IF EXISTS `guests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `guests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `event_id` int NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `qr_code` varchar(255) DEFAULT NULL,
  `checked_in` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `event_id` (`event_id`),
  CONSTRAINT `guests_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `guests`
--

LOCK TABLES `guests` WRITE;
/*!40000 ALTER TABLE `guests` DISABLE KEYS */;
INSERT INTO `guests` VALUES (1,1,'Nguyen Van A','guest@gmail.com',NULL,NULL,0),(8,8,'NGUYỄN HUY ĐỨC','duc_2251220120@dau.edu.vn',NULL,'EP-8-NGUY-MN3XP0DK-0DCE06-C633F4C9',1),(9,8,'NGUYỄN HUY ĐỨC','duc_2251220120@dau.edu.vn',NULL,'EP-8-NGUY-MN3XRGID-57BBF6-E037DDA7',0);
/*!40000 ALTER TABLE `guests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `resources`
--

DROP TABLE IF EXISTS `resources`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `resources`
--

LOCK TABLES `resources` WRITE;
/*!40000 ALTER TABLE `resources` DISABLE KEYS */;
INSERT INTO `resources` VALUES (2,'fsdf','Ánh sáng',5,'cái',NULL,'available','2026-03-24 08:27:58');
/*!40000 ALTER TABLE `resources` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `task_comments`
--

DROP TABLE IF EXISTS `task_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task_comments`
--

LOCK TABLES `task_comments` WRITE;
/*!40000 ALTER TABLE `task_comments` DISABLE KEYS */;
/*!40000 ALTER TABLE `task_comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `task_history`
--

DROP TABLE IF EXISTS `task_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task_history`
--

LOCK TABLES `task_history` WRITE;
/*!40000 ALTER TABLE `task_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `task_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `task_phases`
--

DROP TABLE IF EXISTS `task_phases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task_phases`
--

LOCK TABLES `task_phases` WRITE;
/*!40000 ALTER TABLE `task_phases` DISABLE KEYS */;
/*!40000 ALTER TABLE `task_phases` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `task_reminders`
--

DROP TABLE IF EXISTS `task_reminders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_reminders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `task_id` int NOT NULL,
  `remind_at` datetime NOT NULL,
  `sent` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `task_id` (`task_id`),
  KEY `idx_remind_pending` (`sent`,`remind_at`),
  CONSTRAINT `task_reminders_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `event_tasks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task_reminders`
--

LOCK TABLES `task_reminders` WRITE;
/*!40000 ALTER TABLE `task_reminders` DISABLE KEYS */;
/*!40000 ALTER TABLE `task_reminders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `role` enum('admin','organizer','user') DEFAULT 'user',
  `department` varchar(100) DEFAULT NULL,
  `position` varchar(100) DEFAULT NULL,
  `avatar` varchar(300) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `gender` enum('male','female', 'other') DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `resetToken` varchar(255) DEFAULT NULL,
  `resetTokenExpire` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (2,'duc','duc@gmail.com','$2b$10$O8tLvuKTdjfNCIj/RSt9g.W/BNGIlXJZ9XuquGf.NpDpTKBghOG22','user',NULL,NULL,NULL,NULL,'2026-03-17 03:21:56',NULL,NULL),(3,'Nguyễn Huy Đức','huyduc@gmail.com','$2b$10$xU9esLocmhl0ZPORL/9mD.65cJlA.uRPp4etGkm/Y9TDkFvEAI/Zy','user',NULL,NULL,NULL,NULL,'2026-03-18 12:45:39',NULL,NULL),(4,'nguyenhuyduc','duc1@gmail.com','$2b$10$zBlm2r4QieF5iWhEjmQYxOM/YbMzatT1VBZ8rVOJWpkl7eK4D7PZu','user',NULL,NULL,NULL,NULL,'2026-03-18 19:47:41','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwiaWF0IjoxNzczODcwMTUwLCJleHAiOjE3NzM4NzEwNTB9.GIV0_4RmCJxTR2024h-tqIGE3g0U3TY8z6IcML1f_ek','2026-03-19 04:57:31'),(5,'dd','huyduc12@gmail.com','$2b$10$qvh0XDSqjHU0Jknpq/rLpe90LEPdudufWy1tGIRjiYvlKJXyNP4B2','organizer',NULL,NULL,NULL,NULL,'2026-03-20 01:30:13',NULL,NULL),(6,'Super Admin','admin@eventpro.com','$2b$10$FB5o8rQZbp9tzPXMKlh/Rukfllf.i7vR1ADQe6A4C9jiQjLUdaYgC','admin',NULL,NULL,NULL,NULL,'2026-03-21 01:22:47',NULL,NULL),(7,'Organizer Demo','organizer@eventpro.com','$2b$10$fYHL7uyfykAoiDEMP5SQ4epCE0am5JI4H9ABNkk6G4l5zcKQTc.rm','organizer',NULL,NULL,NULL,NULL,'2026-03-21 01:22:47',NULL,NULL),(8,'User Demo','user@eventpro.com','$2b$10$.oVZIekG4HvvemwCGUEytuL3Z9iSM.NGgkFzcVJ0/OBApNaB0PRmG','user',NULL,NULL,NULL,NULL,'2026-03-21 01:22:47',NULL,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `venues`
--

DROP TABLE IF EXISTS `venues`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
ALTER TABLE users ADD COLUMN gender ENUM('male', 'female', 'other') DEFAULT NULL AFTER phone;
ALTER TABLE users ADD COLUMN address VARCHAR(255) DEFAULT NULL AFTER gender;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `venues`
--

LOCK TABLES `venues` WRITE;
/*!40000 ALTER TABLE `venues` DISABLE KEYS */;
INSERT INTO `venues` VALUES (2,'123 Núi Thành','hall','tầng1',200,NULL,'[\"Máy chiếu\", \"Màn hình LED\", \"Âm thanh\", \"Wifi\", \"Điều hòa\", \"Webcam\", \"Micro\", \"Bảng trắng\"]','available',6,'2026-03-24 08:27:48');
/*!40000 ALTER TABLE `venues` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-26 21:38:17

