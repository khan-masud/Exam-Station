-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Dec 08, 2025 at 12:38 AM
-- Server version: 11.4.8-MariaDB-cll-lve
-- PHP Version: 8.3.27

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `nationa1_exam`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin_settings`
--

CREATE TABLE `admin_settings` (
  `id` char(36) NOT NULL,
  `setting_key` varchar(255) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admin_settings`
--

INSERT INTO `admin_settings` (`id`, `setting_key`, `setting_value`, `created_at`, `updated_at`) VALUES
('aa639733-db22-48a5-bd8f-b51854a32898', 'general.siteName', '\"Exam Systemfgrs\"', '2025-12-07 18:34:40', '2025-12-07 18:34:40'),
('d4bf3a1b-be4e-11f0-b928-40c2ba1a0099', 'payments.manualPaymentEnabled', 'true', '2025-11-10 16:03:43', '2025-11-10 16:03:43'),
('d4bfcd8b-be4e-11f0-b928-40c2ba1a0099', 'payments.allowCash', 'false', '2025-11-10 16:03:43', '2025-11-10 17:49:45'),
('d4bfd7e0-be4e-11f0-b928-40c2ba1a0099', 'payments.allowBankTransfer', 'false', '2025-11-10 16:03:43', '2025-11-10 17:49:45'),
('d4bfd8d9-be4e-11f0-b928-40c2ba1a0099', 'payments.allowMobileMoney', 'true', '2025-11-10 16:03:43', '2025-11-10 16:03:43'),
('d4bfd983-be4e-11f0-b928-40c2ba1a0099', 'payments.allowCheque', 'false', '2025-11-10 16:03:43', '2025-11-10 16:21:00'),
('d4bfdae7-be4e-11f0-b928-40c2ba1a0099', 'payments.allowOther', 'false', '2025-11-10 16:03:43', '2025-11-10 17:49:45'),
('d4bfdba7-be4e-11f0-b928-40c2ba1a0099', 'payments.bankName', '\"\"', '2025-11-10 16:03:43', '2025-11-10 16:03:43'),
('d4bfdc49-be4e-11f0-b928-40c2ba1a0099', 'payments.bankAccountName', '\"\"', '2025-11-10 16:03:43', '2025-11-10 16:03:43'),
('d4bfdd3d-be4e-11f0-b928-40c2ba1a0099', 'payments.bankAccountNumber', '\"\"', '2025-11-10 16:03:43', '2025-11-10 16:03:43'),
('d4bfddee-be4e-11f0-b928-40c2ba1a0099', 'payments.bankRoutingNumber', '\"\"', '2025-11-10 16:03:43', '2025-11-10 16:03:43'),
('d4bfdea6-be4e-11f0-b928-40c2ba1a0099', 'payments.bankSwiftCode', '\"\"', '2025-11-10 16:03:43', '2025-11-10 16:03:43'),
('d4bfdf92-be4e-11f0-b928-40c2ba1a0099', 'payments.bankBranch', '\"\"', '2025-11-10 16:03:43', '2025-11-10 16:03:43'),
('d4bfe036-be4e-11f0-b928-40c2ba1a0099', 'payments.mobileMoneyProvider', '\"\"', '2025-11-10 16:03:43', '2025-11-10 16:23:33'),
('d4bfe0e6-be4e-11f0-b928-40c2ba1a0099', 'payments.mobileMoneyNumber', '\"\"', '2025-11-10 16:03:43', '2025-11-10 16:23:33'),
('d4bfe199-be4e-11f0-b928-40c2ba1a0099', 'payments.mobileMoneyAccountName', '\"\"', '2025-11-10 16:03:43', '2025-11-10 16:23:33'),
('d4bfe26e-be4e-11f0-b928-40c2ba1a0099', 'payments.cashPaymentInstructions', '\"Please visit our office during business hours to make cash payments.\"', '2025-11-10 16:03:43', '2025-11-10 16:03:43'),
('d4bfe31f-be4e-11f0-b928-40c2ba1a0099', 'payments.requirePaymentProof', 'true', '2025-11-10 16:03:43', '2025-11-10 17:49:30'),
('f640e20c-8799-4135-9318-bcc47ff31803', 'general.siteTagline', '\"Your assessment platformeawfer\"', '2025-12-07 18:34:40', '2025-12-07 18:34:40'),
('f897aa89-bcac-11f0-819b-40c2ba1a0099', 'userManagement.allowSelfRegistration', 'true', '2025-11-08 14:12:33', '2025-11-08 14:12:33'),
('f897b6ec-bcac-11f0-819b-40c2ba1a0099', 'userManagement.requireEmailVerification', 'false', '2025-11-08 14:12:33', '2025-11-10 17:37:52'),
('f897b7aa-bcac-11f0-819b-40c2ba1a0099', 'userManagement.requireAdminApproval', 'false', '2025-11-08 14:12:33', '2025-11-08 14:12:33'),
('f897b7f7-bcac-11f0-819b-40c2ba1a0099', 'userManagement.minPasswordLength', '8', '2025-11-08 14:12:33', '2025-11-08 14:12:33'),
('f897b845-bcac-11f0-819b-40c2ba1a0099', 'userManagement.requireStrongPassword', 'true', '2025-11-08 14:12:33', '2025-11-08 14:12:33'),
('f897b892-bcac-11f0-819b-40c2ba1a0099', 'userManagement.maxLoginAttempts', '5', '2025-11-08 14:12:33', '2025-11-08 14:12:33'),
('f897b8d9-bcac-11f0-819b-40c2ba1a0099', 'userManagement.lockoutDuration', '30', '2025-11-08 14:12:33', '2025-11-08 14:12:33'),
('f897b920-bcac-11f0-819b-40c2ba1a0099', 'payments.allowManualPayments', 'true', '2025-11-08 14:12:33', '2025-11-10 16:03:43'),
('f897b964-bcac-11f0-819b-40c2ba1a0099', 'payments.autoApprovePayments', 'false', '2025-11-08 14:12:33', '2025-11-10 16:03:43'),
('f897b9a9-bcac-11f0-819b-40c2ba1a0099', 'payments.paymentCurrency', '\"BDT\"', '2025-11-08 14:12:33', '2025-11-10 17:49:45'),
('f897b9e9-bcac-11f0-819b-40c2ba1a0099', 'antiCheat.proctoringEnabled', 'true', '2025-11-08 14:12:33', '2025-11-08 14:12:33'),
('f897ba65-bcac-11f0-819b-40c2ba1a0099', 'antiCheat.faceDetectionEnabled', 'true', '2025-11-08 14:12:33', '2025-11-08 14:12:33'),
('f897baa8-bcac-11f0-819b-40c2ba1a0099', 'antiCheat.tabSwitchDetection', 'true', '2025-11-08 14:12:33', '2025-11-08 14:12:33'),
('f897bb64-bcac-11f0-819b-40c2ba1a0099', 'antiCheat.copyPasteDisabled', 'true', '2025-11-08 14:12:33', '2025-11-08 14:12:33'),
('f897bba4-bcac-11f0-819b-40c2ba1a0099', 'antiCheat.autoSubmitOnViolation', 'false', '2025-11-08 14:12:33', '2025-11-08 14:12:33'),
('f897bbe3-bcac-11f0-819b-40c2ba1a0099', 'antiCheat.maxViolations', '5', '2025-11-08 14:12:33', '2025-11-08 14:12:33'),
('f897bc2a-bcac-11f0-819b-40c2ba1a0099', 'userPermissions.studentsCanDownloadCertificates', 'true', '2025-11-08 14:12:33', '2025-11-08 14:12:33'),
('f897bc7a-bcac-11f0-819b-40c2ba1a0099', 'userPermissions.maxExamAttemptsPerStudent', '3', '2025-11-08 14:12:33', '2025-11-08 14:12:33'),
('f897bcc9-bcac-11f0-819b-40c2ba1a0099', 'userPermissions.allowExamRetake', 'true', '2025-11-08 14:12:33', '2025-11-08 14:12:33'),
('f897bd0a-bcac-11f0-819b-40c2ba1a0099', 'userPermissions.retakeCooldownDays', '7', '2025-11-08 14:12:33', '2025-11-08 14:12:33'),
('f897bd40-bcac-11f0-819b-40c2ba1a0099', 'examSettings.shuffleQuestions', 'true', '2025-11-08 14:12:33', '2025-11-08 14:12:33'),
('f897bd6b-bcac-11f0-819b-40c2ba1a0099', 'examSettings.showResultsImmediately', 'false', '2025-11-08 14:12:33', '2025-11-08 14:12:33'),
('f897bd9b-bcac-11f0-819b-40c2ba1a0099', 'examSettings.allowReviewAfterSubmission', 'true', '2025-11-08 14:12:33', '2025-11-08 14:12:33'),
('f897bdc5-bcac-11f0-819b-40c2ba1a0099', 'security.enableRateLimiting', 'true', '2025-11-08 14:12:33', '2025-11-08 14:12:33'),
('f897bdee-bcac-11f0-819b-40c2ba1a0099', 'security.maxRequestsPerMinute', '60', '2025-11-08 14:12:33', '2025-11-08 14:12:33'),
('f897be21-bcac-11f0-819b-40c2ba1a0099', 'general.organizationName', '\"Exam System\"', '2025-11-08 14:12:33', '2025-11-08 14:12:33'),
('f897be51-bcac-11f0-819b-40c2ba1a0099', 'general.sessionTimeout', '30', '2025-11-08 14:12:33', '2025-11-08 14:12:33');

-- --------------------------------------------------------

--
-- Table structure for table `answer_drafts`
--

CREATE TABLE `answer_drafts` (
  `id` char(36) NOT NULL,
  `exam_attempt_id` char(36) NOT NULL,
  `question_id` char(36) NOT NULL,
  `student_id` char(36) NOT NULL,
  `draft_answer` text DEFAULT NULL,
  `selected_options` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Array of selected option IDs for MCQ' CHECK (json_valid(`selected_options`)),
  `last_saved_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `anti_cheat_events`
--

CREATE TABLE `anti_cheat_events` (
  `id` char(36) NOT NULL,
  `attempt_id` char(36) NOT NULL,
  `event_type` enum('tab_switch','window_blur','copy_attempt','paste_attempt','right_click','fullscreen_exit','face_not_detected','multiple_faces','suspicious_object','audio_detected','screenshot_attempt') NOT NULL,
  `severity` enum('low','medium','high','critical') DEFAULT 'medium',
  `description` text DEFAULT NULL,
  `screenshot_url` varchar(500) DEFAULT NULL,
  `timestamp` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `anti_cheat_logs`
--

CREATE TABLE `anti_cheat_logs` (
  `id` char(36) NOT NULL,
  `exam_attempt_id` char(36) NOT NULL,
  `activity_type` enum('tab_switch','window_minimize','copy_paste','screenshot_attempt','suspicious_movement','multiple_faces','face_not_detected') NOT NULL,
  `severity` enum('low','medium','high') DEFAULT 'medium',
  `description` text DEFAULT NULL,
  `screenshot_url` varchar(500) DEFAULT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `anti_cheat_logs_enhanced`
--

CREATE TABLE `anti_cheat_logs_enhanced` (
  `id` char(36) NOT NULL DEFAULT uuid(),
  `exam_attempt_id` char(36) DEFAULT NULL,
  `student_id` char(36) DEFAULT NULL,
  `event_type` varchar(100) DEFAULT NULL,
  `severity` enum('low','medium','high') DEFAULT 'low',
  `description` text DEFAULT NULL,
  `evidence` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`evidence`)),
  `timestamp` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `api_logs`
--

CREATE TABLE `api_logs` (
  `id` char(36) NOT NULL DEFAULT uuid(),
  `session_id` varchar(255) DEFAULT NULL,
  `endpoint` varchar(255) NOT NULL,
  `method` varchar(10) NOT NULL,
  `status_code` int(11) DEFAULT 200,
  `response_time` int(11) DEFAULT 0,
  `user_id` char(36) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `request_body` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`request_body`)),
  `response_body` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`response_body`)),
  `timestamp` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cohort_analysis`
--

CREATE TABLE `cohort_analysis` (
  `id` char(36) NOT NULL DEFAULT uuid(),
  `cohort_date` date DEFAULT NULL,
  `cohort_week` int(11) DEFAULT NULL,
  `cohort_month` int(11) DEFAULT NULL,
  `age_days` int(11) DEFAULT NULL,
  `user_count` int(11) DEFAULT NULL,
  `active_users` int(11) DEFAULT NULL,
  `revenue` decimal(10,2) DEFAULT NULL,
  `avg_engagement_score` decimal(5,2) DEFAULT NULL,
  `churn_rate` decimal(5,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `coupons`
--

CREATE TABLE `coupons` (
  `id` int(11) NOT NULL,
  `code` varchar(50) NOT NULL,
  `discount_type` enum('percentage','fixed') NOT NULL,
  `discount_value` decimal(10,2) NOT NULL,
  `min_amount` decimal(10,2) DEFAULT 0.00,
  `max_discount` decimal(10,2) DEFAULT NULL,
  `usage_limit` int(11) DEFAULT NULL,
  `per_user_limit` int(11) DEFAULT 1,
  `used_count` int(11) DEFAULT 0,
  `valid_from` timestamp NULL DEFAULT NULL,
  `valid_until` timestamp NULL DEFAULT NULL,
  `applicable_to` enum('all','programs','exams','specific_items') DEFAULT 'all',
  `applicable_items` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`applicable_items`)),
  `is_active` tinyint(1) DEFAULT 1,
  `created_by` char(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `coupon_usage`
--

CREATE TABLE `coupon_usage` (
  `id` int(11) NOT NULL,
  `coupon_id` int(11) NOT NULL,
  `user_id` char(36) NOT NULL,
  `transaction_id` varchar(255) DEFAULT NULL,
  `original_amount` decimal(10,2) NOT NULL,
  `discount_amount` decimal(10,2) NOT NULL,
  `final_amount` decimal(10,2) NOT NULL,
  `used_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `evaluations`
--

CREATE TABLE `evaluations` (
  `id` char(36) NOT NULL,
  `exam_attempt_id` char(36) NOT NULL,
  `evaluated_by` char(36) DEFAULT NULL,
  `total_obtained_marks` int(11) DEFAULT NULL,
  `percentage` decimal(5,2) DEFAULT NULL,
  `grade` varchar(10) DEFAULT NULL,
  `status` enum('pending','evaluated','appeal') DEFAULT 'pending',
  `remarks` text DEFAULT NULL,
  `evaluated_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `exams`
--

CREATE TABLE `exams` (
  `id` char(36) NOT NULL,
  `organization_id` char(36) NOT NULL,
  `program_id` char(36) DEFAULT NULL,
  `created_by` char(36) NOT NULL,
  `subject_id` char(36) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `instructions` longtext DEFAULT NULL,
  `exam_type` enum('online','offline','hybrid') DEFAULT 'online',
  `duration_minutes` int(11) NOT NULL,
  `total_questions` int(11) NOT NULL,
  `total_marks` int(11) NOT NULL,
  `passing_percentage` int(11) DEFAULT 40,
  `difficulty_level` enum('easy','medium','hard') DEFAULT 'medium',
  `show_results` enum('immediate','scheduled','never') DEFAULT 'immediate',
  `result_publish_date` datetime DEFAULT NULL,
  `show_answers` tinyint(1) DEFAULT 0,
  `show_explanations` tinyint(1) DEFAULT 0,
  `randomize_questions` tinyint(1) DEFAULT 0,
  `randomize_options` tinyint(1) DEFAULT 0,
  `allow_review` tinyint(1) DEFAULT 1,
  `exam_date` date NOT NULL,
  `exam_start_time` time NOT NULL,
  `exam_end_time` time NOT NULL,
  `allow_multiple_attempts` tinyint(1) DEFAULT 0,
  `max_attempts` int(11) DEFAULT NULL,
  `status` enum('draft','published') DEFAULT 'draft',
  `proctoring_enabled` tinyint(1) DEFAULT 0,
  `allow_answer_change` tinyint(1) DEFAULT 1 COMMENT 'Allow students to change their selected answers',
  `show_question_counter` tinyint(1) DEFAULT 1 COMMENT 'Show question number indicator',
  `allow_answer_review` tinyint(1) DEFAULT 1 COMMENT 'Allow students to review all answers before submission',
  `anti_cheat_enabled` tinyint(1) DEFAULT 1,
  `negative_marking` decimal(5,2) DEFAULT 0.25 COMMENT 'Marks deducted per wrong answer',
  `passing_marks` int(11) DEFAULT 40 COMMENT 'Minimum marks required to pass the exam',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_public` tinyint(1) DEFAULT 1 COMMENT 'Show on public landing page',
  `featured` tinyint(1) DEFAULT 0 COMMENT 'Featured exam on homepage',
  `thumbnail_url` varchar(500) DEFAULT NULL COMMENT 'Exam thumbnail image',
  `video_url` varchar(500) DEFAULT NULL COMMENT 'Promotional video URL',
  `prerequisites` text DEFAULT NULL COMMENT 'Required knowledge/exams',
  `learning_outcomes` text DEFAULT NULL COMMENT 'What students will learn'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `exams`
--

INSERT INTO `exams` (`id`, `organization_id`, `program_id`, `created_by`, `subject_id`, `title`, `description`, `instructions`, `exam_type`, `duration_minutes`, `total_questions`, `total_marks`, `passing_percentage`, `difficulty_level`, `show_results`, `result_publish_date`, `show_answers`, `show_explanations`, `randomize_questions`, `randomize_options`, `allow_review`, `exam_date`, `exam_start_time`, `exam_end_time`, `allow_multiple_attempts`, `max_attempts`, `status`, `proctoring_enabled`, `allow_answer_change`, `show_question_counter`, `allow_answer_review`, `anti_cheat_enabled`, `negative_marking`, `passing_marks`, `created_at`, `updated_at`, `is_public`, `featured`, `thumbnail_url`, `video_url`, `prerequisites`, `learning_outcomes`) VALUES
('fdd0240b-8cd7-4f67-9d18-7c9276eb33e7', '85dc9a2f-230b-4e29-9d4f-1e154e8b1c0a', NULL, '70840684-bc72-4922-820d-2e6961a5ef2f', NULL, 'rdtr', NULL, NULL, 'online', 30, 30, 30, 40, 'medium', 'immediate', NULL, 0, 0, 0, 0, 1, '2025-12-09', '09:00:00', '11:00:00', 0, NULL, 'published', 0, 1, 1, 1, 1, 0.25, 40, '2025-12-07 18:35:24', '2025-12-07 18:35:24', 1, 0, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `exam_answers`
--

CREATE TABLE `exam_answers` (
  `id` char(36) NOT NULL,
  `attempt_id` char(36) NOT NULL,
  `question_id` char(36) NOT NULL,
  `answer_text` longtext DEFAULT NULL,
  `selected_option` int(11) DEFAULT NULL,
  `is_correct` tinyint(1) DEFAULT NULL,
  `marks_obtained` decimal(5,2) DEFAULT 0.00,
  `is_flagged` tinyint(1) DEFAULT 0,
  `time_spent_seconds` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `exam_attempts`
--

CREATE TABLE `exam_attempts` (
  `id` char(36) NOT NULL,
  `exam_id` char(36) DEFAULT NULL,
  `student_id` char(36) DEFAULT NULL,
  `exam_registration_id` char(36) NOT NULL,
  `attempt_number` int(11) NOT NULL,
  `start_time` datetime NOT NULL,
  `duration_minutes` int(11) NOT NULL DEFAULT 60,
  `end_time` datetime DEFAULT NULL,
  `submitted_at` datetime DEFAULT NULL,
  `total_time_spent` int(11) DEFAULT NULL COMMENT 'in seconds',
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `status` enum('ongoing','submitted','evaluated','abandoned') DEFAULT 'ongoing',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `exam_programs`
--

CREATE TABLE `exam_programs` (
  `id` char(36) NOT NULL,
  `exam_id` char(36) NOT NULL,
  `program_id` char(36) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `exam_progress`
--

CREATE TABLE `exam_progress` (
  `id` char(36) NOT NULL,
  `attempt_id` char(36) NOT NULL,
  `current_question_index` int(11) DEFAULT 0,
  `answers_json` longtext DEFAULT NULL,
  `flagged_questions_json` text DEFAULT NULL,
  `last_saved_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `exam_questions`
--

CREATE TABLE `exam_questions` (
  `id` char(36) NOT NULL,
  `exam_id` char(36) NOT NULL,
  `question_id` char(36) NOT NULL,
  `sequence` int(11) NOT NULL,
  `marks` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `exam_question_selections`
--

CREATE TABLE `exam_question_selections` (
  `id` varchar(36) NOT NULL,
  `exam_id` varchar(36) NOT NULL,
  `question_id` varchar(36) NOT NULL,
  `question_order` int(11) DEFAULT 0,
  `marks` int(11) DEFAULT 1,
  `is_required` tinyint(1) DEFAULT 1,
  `added_at` datetime DEFAULT current_timestamp(),
  `added_by` varchar(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `exam_registrations`
--

CREATE TABLE `exam_registrations` (
  `id` char(36) NOT NULL,
  `exam_id` char(36) NOT NULL,
  `student_id` char(36) NOT NULL,
  `registered_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('registered','started','completed','absent','cancelled') DEFAULT 'registered'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `exam_results`
--

CREATE TABLE `exam_results` (
  `id` char(36) NOT NULL,
  `exam_id` char(36) NOT NULL,
  `student_id` char(36) NOT NULL,
  `attempt_id` char(36) DEFAULT NULL,
  `attempt_number` int(11) DEFAULT NULL,
  `total_marks` int(11) DEFAULT NULL,
  `obtained_marks` int(11) DEFAULT NULL,
  `percentage` decimal(5,2) DEFAULT NULL,
  `sections_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Store section-wise timing and completion data' CHECK (json_valid(`sections_data`)),
  `grade` varchar(10) DEFAULT NULL,
  `correct_answers` int(11) DEFAULT NULL,
  `incorrect_answers` int(11) DEFAULT NULL,
  `unanswered` int(11) DEFAULT NULL,
  `time_spent` int(11) DEFAULT NULL COMMENT 'in seconds',
  `status` enum('pass','fail','pending') DEFAULT 'pending',
  `negative_marking_applied` decimal(5,2) DEFAULT 0.25 COMMENT 'Marks deducted per wrong answer for this result',
  `result_date` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `landing_config`
--

CREATE TABLE `landing_config` (
  `id` varchar(36) NOT NULL,
  `site_name` varchar(255) DEFAULT 'Exam System',
  `site_tagline` text DEFAULT 'Your assessment platform',
  `site_description` text DEFAULT NULL,
  `meta_title` varchar(255) DEFAULT NULL,
  `meta_description` text DEFAULT NULL,
  `meta_keywords` text DEFAULT NULL,
  `logo_url` text DEFAULT NULL,
  `logo_width` int(11) DEFAULT 40,
  `logo_height` int(11) DEFAULT 40,
  `favicon_url` text DEFAULT NULL,
  `background_type` varchar(50) DEFAULT 'gradient',
  `background_color` varchar(7) DEFAULT '#ffffff',
  `background_gradient` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`background_gradient`)),
  `background_image_url` text DEFAULT NULL,
  `background_image_fixed` tinyint(1) DEFAULT 0,
  `enable_animated_blobs` tinyint(1) DEFAULT 1,
  `blob_colors` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`blob_colors`)),
  `nav_sticky` tinyint(1) DEFAULT 1,
  `nav_transparent` tinyint(1) DEFAULT 1,
  `nav_blur` tinyint(1) DEFAULT 1,
  `contact_email` varchar(255) DEFAULT NULL,
  `contact_phone` varchar(50) DEFAULT NULL,
  `contact_address` text DEFAULT NULL,
  `facebook_url` text DEFAULT NULL,
  `twitter_url` text DEFAULT NULL,
  `instagram_url` text DEFAULT NULL,
  `linkedin_url` text DEFAULT NULL,
  `youtube_url` text DEFAULT NULL,
  `copyright_text` text DEFAULT NULL,
  `show_powered_by` tinyint(1) DEFAULT 1,
  `is_active` tinyint(1) DEFAULT 1,
  `version` int(11) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` varchar(36) DEFAULT NULL,
  `updated_by` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `landing_config`
--

-- --------------------------------------------------------

--
-- Table structure for table `landing_gradient_presets`
--

CREATE TABLE `landing_gradient_presets` (
  `id` varchar(36) NOT NULL,
  `preset_name` varchar(255) NOT NULL,
  `gradient_config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`gradient_config`)),
  `preview_css` text DEFAULT NULL,
  `is_system` tinyint(1) DEFAULT 0,
  `usage_count` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `created_by` varchar(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `landing_gradient_presets`
--

INSERT INTO `landing_gradient_presets` (`id`, `preset_name`, `gradient_config`, `preview_css`, `is_system`, `usage_count`, `created_at`, `created_by`) VALUES
('lg-preset-001', 'Blue to Purple', '{\"from\": \"#3b82f6\", \"to\": \"#8b5cf6\", \"direction\": \"r\"}', 'linear-gradient(to right, #3b82f6, #8b5cf6)', 1, 0, '2025-12-07 18:34:39', NULL),
('lg-preset-002', 'Purple to Pink', '{\"from\": \"#8b5cf6\", \"to\": \"#ec4899\", \"direction\": \"r\"}', 'linear-gradient(to right, #8b5cf6, #ec4899)', 1, 0, '2025-12-07 18:34:39', NULL),
('lg-preset-003', 'Blue to Cyan', '{\"from\": \"#3b82f6\", \"to\": \"#06b6d4\", \"direction\": \"r\"}', 'linear-gradient(to right, #3b82f6, #06b6d4)', 1, 0, '2025-12-07 18:34:39', NULL),
('lg-preset-004', 'Sunset', '{\"from\": \"#f59e0b\", \"via\": \"#f97316\", \"to\": \"#ef4444\", \"direction\": \"r\"}', 'linear-gradient(to right, #f59e0b, #f97316, #ef4444)', 1, 0, '2025-12-07 18:34:39', NULL),
('lg-preset-005', 'Ocean', '{\"from\": \"#0ea5e9\", \"via\": \"#06b6d4\", \"to\": \"#14b8a6\", \"direction\": \"br\"}', 'linear-gradient(to bottom right, #0ea5e9, #06b6d4, #14b8a6)', 1, 0, '2025-12-07 18:34:39', NULL),
('lg-preset-006', 'Forest', '{\"from\": \"#10b981\", \"to\": \"#059669\", \"direction\": \"r\"}', 'linear-gradient(to right, #10b981, #059669)', 1, 0, '2025-12-07 18:34:39', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `landing_images`
--

CREATE TABLE `landing_images` (
  `id` varchar(36) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` text NOT NULL,
  `file_url` text NOT NULL,
  `file_size` int(11) DEFAULT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `width` int(11) DEFAULT NULL,
  `height` int(11) DEFAULT NULL,
  `alt_text` text DEFAULT NULL,
  `caption` text DEFAULT NULL,
  `usage_count` int(11) DEFAULT 0,
  `used_in_sections` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`used_in_sections`)),
  `uploaded_by` varchar(36) DEFAULT NULL,
  `uploaded_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `landing_menu_items`
--

CREATE TABLE `landing_menu_items` (
  `id` varchar(36) NOT NULL,
  `config_id` varchar(36) NOT NULL,
  `menu_location` varchar(50) NOT NULL,
  `label` varchar(255) NOT NULL,
  `url` varchar(500) DEFAULT NULL,
  `link_type` varchar(50) DEFAULT 'internal',
  `icon` varchar(100) DEFAULT NULL,
  `parent_id` varchar(36) DEFAULT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_visible` tinyint(1) DEFAULT 1,
  `visible_for_roles` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`visible_for_roles`)),
  `show_when_logged_in` tinyint(1) DEFAULT NULL,
  `custom_classes` text DEFAULT NULL,
  `badge_text` varchar(50) DEFAULT NULL,
  `badge_color` varchar(50) DEFAULT 'blue',
  `open_in_new_tab` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `landing_menu_items`
--

-- --------------------------------------------------------

--
-- Table structure for table `landing_sections`
--

CREATE TABLE `landing_sections` (
  `id` varchar(36) NOT NULL,
  `config_id` varchar(36) NOT NULL,
  `section_key` varchar(100) NOT NULL,
  `section_name` varchar(255) NOT NULL,
  `section_type` varchar(50) NOT NULL,
  `is_visible` tinyint(1) DEFAULT 1,
  `display_order` int(11) DEFAULT 0,
  `container_width` varchar(50) DEFAULT 'container',
  `padding_top` varchar(50) DEFAULT 'py-20',
  `padding_bottom` varchar(50) DEFAULT 'py-20',
  `min_height` varchar(50) DEFAULT NULL,
  `background_type` varchar(50) DEFAULT 'transparent',
  `background_color` varchar(7) DEFAULT NULL,
  `background_gradient` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`background_gradient`)),
  `background_image_url` text DEFAULT NULL,
  `background_image_position` varchar(50) DEFAULT 'center',
  `background_image_size` varchar(50) DEFAULT 'cover',
  `background_opacity` decimal(3,2) DEFAULT 1.00,
  `background_overlay` varchar(7) DEFAULT NULL,
  `background_overlay_opacity` decimal(3,2) DEFAULT 0.50,
  `content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`content`)),
  `custom_classes` text DEFAULT NULL,
  `enable_animations` tinyint(1) DEFAULT 1,
  `animation_type` varchar(50) DEFAULT 'fade-in',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `landing_sections`
--

-- --------------------------------------------------------

--
-- Table structure for table `landing_section_templates`
--

CREATE TABLE `landing_section_templates` (
  `id` varchar(36) NOT NULL,
  `template_name` varchar(255) NOT NULL,
  `template_type` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `preview_image_url` text DEFAULT NULL,
  `template_config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`template_config`)),
  `default_background` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`default_background`)),
  `default_layout` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`default_layout`)),
  `is_active` tinyint(1) DEFAULT 1,
  `is_system` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `created_by` varchar(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `landing_version_history`
--

CREATE TABLE `landing_version_history` (
  `id` varchar(36) NOT NULL,
  `config_id` varchar(36) NOT NULL,
  `version_number` int(11) NOT NULL,
  `version_name` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `config_snapshot` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`config_snapshot`)),
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `created_by` varchar(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `login_attempts`
--

CREATE TABLE `login_attempts` (
  `id` char(36) NOT NULL DEFAULT uuid(),
  `user_id` char(36) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `success` tinyint(1) DEFAULT 0,
  `failure_reason` varchar(255) DEFAULT NULL,
  `timestamp` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `newsletter_subscribers`
--

CREATE TABLE `newsletter_subscribers` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `status` enum('active','unsubscribed') DEFAULT 'active',
  `subscribed_at` timestamp NULL DEFAULT current_timestamp(),
  `unsubscribed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` char(36) NOT NULL,
  `type` varchar(50) NOT NULL,
  `category` varchar(50) DEFAULT 'general',
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `description` text DEFAULT NULL,
  `link` varchar(500) DEFAULT NULL,
  `action_url` varchar(500) DEFAULT NULL,
  `action_label` varchar(100) DEFAULT NULL,
  `priority` enum('low','normal','high','urgent') DEFAULT 'normal',
  `send_email` tinyint(1) DEFAULT 0,
  `send_sms` tinyint(1) DEFAULT 0,
  `send_push` tinyint(1) DEFAULT 1,
  `related_entity_type` varchar(50) DEFAULT NULL,
  `related_entity_id` varchar(255) DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `is_archived` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notification_preferences`
--

CREATE TABLE `notification_preferences` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `email_exam_results` tinyint(1) DEFAULT 1,
  `email_exam_reminders` tinyint(1) DEFAULT 1,
  `email_system_updates` tinyint(1) DEFAULT 1,
  `email_support_responses` tinyint(1) DEFAULT 1,
  `email_announcements` tinyint(1) DEFAULT 1,
  `email_marketing` tinyint(1) DEFAULT 0,
  `inapp_exam_results` tinyint(1) DEFAULT 1,
  `inapp_exam_reminders` tinyint(1) DEFAULT 1,
  `inapp_system_updates` tinyint(1) DEFAULT 1,
  `inapp_support_responses` tinyint(1) DEFAULT 1,
  `inapp_announcements` tinyint(1) DEFAULT 1,
  `sms_exam_results` tinyint(1) DEFAULT 0,
  `sms_exam_reminders` tinyint(1) DEFAULT 0,
  `sms_urgent_alerts` tinyint(1) DEFAULT 1,
  `push_exam_results` tinyint(1) DEFAULT 1,
  `push_exam_reminders` tinyint(1) DEFAULT 1,
  `push_support_responses` tinyint(1) DEFAULT 1,
  `push_announcements` tinyint(1) DEFAULT 1,
  `quiet_hours_enabled` tinyint(1) DEFAULT 0,
  `quiet_hours_start` time DEFAULT '22:00:00',
  `quiet_hours_end` time DEFAULT '08:00:00',
  `digest_frequency` enum('none','daily','weekly','monthly') DEFAULT 'none',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `oauth_accounts`
--

CREATE TABLE `oauth_accounts` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `provider_name` varchar(50) NOT NULL,
  `provider_user_id` varchar(255) NOT NULL,
  `provider_email` varchar(255) DEFAULT NULL,
  `provider_name_full` varchar(255) DEFAULT NULL,
  `provider_avatar_url` varchar(500) DEFAULT NULL,
  `access_token` text DEFAULT NULL,
  `refresh_token` text DEFAULT NULL,
  `token_expires_at` datetime DEFAULT NULL,
  `last_synced_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `oauth_providers`
--

CREATE TABLE `oauth_providers` (
  `id` char(36) NOT NULL,
  `provider_name` varchar(50) NOT NULL,
  `provider_type` varchar(20) DEFAULT 'oauth2',
  `client_id` varchar(500) DEFAULT NULL,
  `client_secret` varchar(500) DEFAULT NULL,
  `authorization_url` varchar(500) DEFAULT NULL,
  `token_url` varchar(500) DEFAULT NULL,
  `userinfo_url` varchar(500) DEFAULT NULL,
  `redirect_uri` varchar(500) DEFAULT NULL,
  `scopes` varchar(255) DEFAULT NULL,
  `is_enabled` tinyint(1) DEFAULT 0,
  `button_color` varchar(7) DEFAULT '#000000',
  `icon_url` varchar(500) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `oauth_providers`
--

INSERT INTO `oauth_providers` (`id`, `provider_name`, `provider_type`, `client_id`, `client_secret`, `authorization_url`, `token_url`, `userinfo_url`, `redirect_uri`, `scopes`, `is_enabled`, `button_color`, `icon_url`, `created_at`, `updated_at`) VALUES
('245d1c72-8c12-45d3-9580-fe99428ae9b8', 'facebook', 'oauth2', NULL, NULL, 'https://www.facebook.com/v18.0/dialog/oauth', 'https://graph.facebook.com/v18.0/oauth/access_token', 'https://graph.facebook.com/me?fields=id,name,email,picture', NULL, 'public_profile email', 0, '#1877f2', 'https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg', '2025-12-08 00:34:40', '2025-12-08 00:34:40'),
('e2367611-b4f2-4856-8c6a-3db71c4121be', 'google', 'oauth2', NULL, NULL, 'https://accounts.google.com/o/oauth2/v2/auth', 'https://oauth2.googleapis.com/token', 'https://www.googleapis.com/oauth2/v2/userinfo', NULL, 'openid email profile', 0, '#4285f4', 'https://www.gstatic.com/images/branding/product/1x/googleg_standard_color_128dp.png', '2025-12-08 00:34:40', '2025-12-08 00:34:40');

-- --------------------------------------------------------

--
-- Table structure for table `oauth_tokens`
--

CREATE TABLE `oauth_tokens` (
  `id` char(36) NOT NULL,
  `provider_name` varchar(50) NOT NULL,
  `state` varchar(255) NOT NULL,
  `nonce` varchar(255) DEFAULT NULL,
  `user_id` char(36) DEFAULT NULL,
  `is_used` tinyint(1) DEFAULT 0,
  `expires_at` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `organizations`
--

CREATE TABLE `organizations` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `logo_url` varchar(500) DEFAULT NULL,
  `contact_email` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `subscription_plan` enum('free','starter','professional','enterprise') DEFAULT 'free',
  `subscription_status` enum('active','inactive','suspended') DEFAULT 'active',
  `max_exams` int(11) DEFAULT 10,
  `max_students` int(11) DEFAULT 100,
  `max_questions` int(11) DEFAULT 500,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `organizations`
--

INSERT INTO `organizations` (`id`, `name`, `slug`, `description`, `logo_url`, `contact_email`, `phone`, `address`, `city`, `country`, `subscription_plan`, `subscription_status`, `max_exams`, `max_students`, `max_questions`, `created_at`, `updated_at`) VALUES
('85dc9a2f-230b-4e29-9d4f-1e154e8b1c0a', 'Abdullah Al Masud\'s Organization', 'abdullah-al-masud', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'enterprise', 'active', 10, 100, 500, '2025-12-07 18:34:40', '2025-12-07 18:34:40');

-- --------------------------------------------------------

--
-- Table structure for table `organization_members`
--

CREATE TABLE `organization_members` (
  `id` char(36) NOT NULL,
  `organization_id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `role` enum('owner','admin','teacher','proctor') NOT NULL,
  `joined_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `organization_members`
--

INSERT INTO `organization_members` (`id`, `organization_id`, `user_id`, `role`, `joined_at`) VALUES
('777adc77-c223-4077-91b9-a2426d9ae8f8', '85dc9a2f-230b-4e29-9d4f-1e154e8b1c0a', '70840684-bc72-4922-820d-2e6961a5ef2f', 'owner', '2025-12-07 18:34:40');

-- --------------------------------------------------------

--
-- Table structure for table `page_visits`
--

CREATE TABLE `page_visits` (
  `id` int(11) NOT NULL,
  `page_path` varchar(500) NOT NULL,
  `user_id` char(36) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `referrer` varchar(500) DEFAULT NULL,
  `visited_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `password_resets`
--

CREATE TABLE `password_resets` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) DEFAULT 0,
  `used_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payment_transactions`
--

CREATE TABLE `payment_transactions` (
  `id` char(36) NOT NULL,
  `organization_id` char(36) NOT NULL,
  `user_id` char(36) DEFAULT NULL,
  `exam_id` char(36) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(3) DEFAULT 'USD',
  `payment_gateway` enum('sslcommerz','bkash','stripe','other') NOT NULL,
  `transaction_reference` varchar(255) DEFAULT NULL,
  `status` enum('pending','completed','failed','refunded') DEFAULT 'pending',
  `payment_date` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `proctoring_sessions`
--

CREATE TABLE `proctoring_sessions` (
  `id` char(36) NOT NULL,
  `exam_attempt_id` char(36) NOT NULL,
  `proctor_id` char(36) NOT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime DEFAULT NULL,
  `status` enum('scheduled','ongoing','completed') DEFAULT 'scheduled',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `programs`
--

CREATE TABLE `programs` (
  `id` char(36) NOT NULL,
  `organization_id` char(36) DEFAULT NULL,
  `created_by` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `instructions` longtext DEFAULT NULL COMMENT 'Default instructions for all exams under this program',
  `cover_image` varchar(500) DEFAULT NULL,
  `enrollment_fee` decimal(10,2) DEFAULT 0.00,
  `max_students` int(11) DEFAULT NULL,
  `status` enum('draft','published','archived') DEFAULT 'draft',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `proctoring_enabled` tinyint(1) DEFAULT 0 COMMENT 'Default proctoring setting for all exams',
  `allow_answer_change` tinyint(1) DEFAULT 1 COMMENT 'Default: allow students to change answers',
  `show_question_counter` tinyint(1) DEFAULT 1 COMMENT 'Default: show question counter',
  `allow_answer_review` tinyint(1) DEFAULT 1 COMMENT 'Default: allow answer review',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `program_enrollments`
--

CREATE TABLE `program_enrollments` (
  `id` char(36) NOT NULL,
  `program_id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `enrolled_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('active','completed','cancelled','suspended') DEFAULT 'active',
  `payment_status` enum('pending','completed','failed','refunded') DEFAULT 'pending',
  `transaction_id` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `questions`
--

CREATE TABLE `questions` (
  `id` char(36) NOT NULL,
  `organization_id` char(36) DEFAULT NULL,
  `subject_id` char(36) DEFAULT NULL,
  `created_by` char(36) NOT NULL,
  `question_type_id` int(11) NOT NULL,
  `question_text` longtext NOT NULL,
  `difficulty_level` enum('easy','medium','hard') DEFAULT 'medium',
  `question_difficulty` enum('beginner','easy','medium','hard','expert') DEFAULT 'medium',
  `marks` int(11) DEFAULT 1,
  `negative_marks` int(11) DEFAULT 0,
  `is_mandatory` tinyint(1) DEFAULT 0,
  `allow_multiple_answers` tinyint(1) DEFAULT 0,
  `randomize_options` tinyint(1) DEFAULT 0,
  `explanation` text DEFAULT NULL,
  `time_limit` int(11) DEFAULT NULL COMMENT 'Time limit in seconds for this question',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `tags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Quick search tags' CHECK (json_valid(`tags`)),
  `estimated_time` int(11) DEFAULT 60 COMMENT 'Estimated time in seconds',
  `usage_count` int(11) DEFAULT 0 COMMENT 'How many times used in exams',
  `average_score` decimal(5,2) DEFAULT NULL COMMENT 'Average score on this question',
  `topics` text DEFAULT NULL COMMENT 'Comma-separated topic names for categorization',
  `question_image` longtext DEFAULT NULL COMMENT 'Base64 encoded image or image URL for mathematical/diagram questions'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `question_evaluations`
--

CREATE TABLE `question_evaluations` (
  `id` char(36) NOT NULL,
  `student_answer_id` char(36) NOT NULL,
  `evaluated_by` char(36) DEFAULT NULL,
  `marks_obtained` int(11) DEFAULT NULL,
  `feedback` text DEFAULT NULL,
  `evaluated_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `question_feedback`
--

CREATE TABLE `question_feedback` (
  `id` char(36) NOT NULL,
  `question_id` char(36) NOT NULL,
  `correct_explanation` text DEFAULT NULL COMMENT 'Explanation shown when answer is correct',
  `incorrect_explanation` text DEFAULT NULL COMMENT 'Explanation shown when answer is incorrect',
  `hints` text DEFAULT NULL COMMENT 'Hints for students',
  `reference_links` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Array of reference URLs' CHECK (json_valid(`reference_links`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `question_options`
--

CREATE TABLE `question_options` (
  `id` char(36) NOT NULL,
  `question_id` char(36) NOT NULL,
  `option_text` varchar(500) NOT NULL,
  `option_label` varchar(10) DEFAULT NULL,
  `is_correct` tinyint(1) DEFAULT 0,
  `sequence` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `question_topics`
--

CREATE TABLE `question_topics` (
  `id` varchar(36) NOT NULL,
  `question_id` varchar(36) NOT NULL,
  `topic_id` varchar(36) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `question_types`
--

CREATE TABLE `question_types` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `question_types`
--

INSERT INTO `question_types` (`id`, `name`, `description`) VALUES
(1, 'MCQ', 'Multiple Choice Question'),
(2, 'True/False', 'True or False question'),
(3, 'Dropdown', 'Dropdown selection question'),
(4, 'Short Answer', 'Short text answer'),
(5, 'Essay', 'Long text essay');

-- --------------------------------------------------------

--
-- Table structure for table `revenue_metrics`
--

CREATE TABLE `revenue_metrics` (
  `id` char(36) NOT NULL DEFAULT uuid(),
  `transaction_id` char(36) DEFAULT NULL,
  `user_id` char(36) DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `currency` varchar(3) DEFAULT 'USD',
  `payment_method` varchar(50) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `month` int(11) DEFAULT NULL,
  `year` int(11) DEFAULT NULL,
  `timestamp` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `site_settings`
--

CREATE TABLE `site_settings` (
  `id` char(36) NOT NULL,
  `site_name` varchar(255) DEFAULT 'Exam System',
  `site_logo` varchar(500) DEFAULT NULL,
  `primary_color` varchar(7) DEFAULT '#3b82f6',
  `secondary_color` varchar(7) DEFAULT '#8b5cf6',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `student_answers`
--

CREATE TABLE `student_answers` (
  `id` char(36) NOT NULL,
  `exam_attempt_id` char(36) NOT NULL,
  `question_id` char(36) NOT NULL,
  `exam_question_id` char(36) NOT NULL,
  `answer_text` longtext DEFAULT NULL,
  `selected_option_id` char(36) DEFAULT NULL,
  `is_marked_for_review` tinyint(1) DEFAULT 0,
  `visited` tinyint(1) DEFAULT 0,
  `time_spent` int(11) DEFAULT NULL COMMENT 'in seconds',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `subjects`
--

CREATE TABLE `subjects` (
  `id` char(36) NOT NULL,
  `organization_id` char(36) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `subjects`
--

INSERT INTO `subjects` (`id`, `organization_id`, `name`, `description`, `created_at`) VALUES
('c48b794f-e8a3-463e-9c99-2cc050d5fd18', '85dc9a2f-230b-4e29-9d4f-1e154e8b1c0a', 'zewfsef', NULL, '2025-12-07 18:35:43');

-- --------------------------------------------------------

--
-- Table structure for table `support_tickets`
--

CREATE TABLE `support_tickets` (
  `id` varchar(36) NOT NULL,
  `student_id` varchar(36) NOT NULL,
  `admin_id` varchar(36) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `category` varchar(50) NOT NULL DEFAULT 'other',
  `priority` varchar(20) NOT NULL DEFAULT 'medium',
  `status` varchar(50) NOT NULL DEFAULT 'open',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `resolved_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `support_ticket_attachments`
--

CREATE TABLE `support_ticket_attachments` (
  `id` varchar(36) NOT NULL,
  `ticket_id` varchar(36) NOT NULL,
  `message_id` varchar(36) DEFAULT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `size` bigint(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `support_ticket_custom_fields`
--

CREATE TABLE `support_ticket_custom_fields` (
  `id` varchar(36) NOT NULL,
  `ticket_id` varchar(36) NOT NULL,
  `field_name` varchar(255) NOT NULL,
  `field_value` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `support_ticket_messages`
--

CREATE TABLE `support_ticket_messages` (
  `id` varchar(36) NOT NULL,
  `ticket_id` varchar(36) NOT NULL,
  `sender_id` varchar(36) NOT NULL,
  `message_text` text NOT NULL,
  `is_admin_response` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `system_metrics`
--

CREATE TABLE `system_metrics` (
  `id` char(36) NOT NULL DEFAULT uuid(),
  `metric_name` varchar(100) NOT NULL,
  `metric_value` decimal(10,2) DEFAULT NULL,
  `metric_unit` varchar(50) DEFAULT NULL,
  `cpu_usage` decimal(5,2) DEFAULT NULL,
  `memory_usage` decimal(5,2) DEFAULT NULL,
  `disk_usage` decimal(5,2) DEFAULT NULL,
  `database_connections` int(11) DEFAULT NULL,
  `active_users` int(11) DEFAULT NULL,
  `avg_response_time` int(11) DEFAULT NULL,
  `error_rate` decimal(5,2) DEFAULT NULL,
  `timestamp` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `theme_audit_log`
--

CREATE TABLE `theme_audit_log` (
  `id` varchar(36) NOT NULL,
  `theme_id` varchar(36) DEFAULT NULL,
  `action` varchar(50) NOT NULL,
  `changed_fields` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`changed_fields`)),
  `changed_by` varchar(36) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `theme_custom_css`
--

CREATE TABLE `theme_custom_css` (
  `id` varchar(36) NOT NULL,
  `theme_id` varchar(36) NOT NULL,
  `custom_css` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `theme_menu_items`
--

CREATE TABLE `theme_menu_items` (
  `id` varchar(36) NOT NULL,
  `theme_id` varchar(36) NOT NULL,
  `menu_location` varchar(50) NOT NULL,
  `menu_key` varchar(255) NOT NULL,
  `label` varchar(255) NOT NULL,
  `url` varchar(500) DEFAULT NULL,
  `icon` varchar(255) DEFAULT NULL,
  `parent_id` varchar(36) DEFAULT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_visible` tinyint(1) DEFAULT 1,
  `visible_for_role` varchar(100) DEFAULT 'all',
  `badge_text` varchar(100) DEFAULT NULL,
  `badge_color` varchar(7) DEFAULT NULL,
  `custom_class` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `theme_page_sections`
--

CREATE TABLE `theme_page_sections` (
  `id` varchar(36) NOT NULL,
  `theme_id` varchar(36) NOT NULL,
  `page_path` varchar(255) NOT NULL,
  `section_key` varchar(255) NOT NULL,
  `section_name` varchar(255) NOT NULL,
  `section_type` varchar(50) NOT NULL DEFAULT 'custom',
  `title` varchar(255) DEFAULT NULL,
  `subtitle` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`content`)),
  `is_visible` tinyint(1) DEFAULT 1,
  `display_order` int(11) DEFAULT 0,
  `background_color` varchar(7) DEFAULT NULL,
  `text_color` varchar(7) DEFAULT NULL,
  `padding_top` int(11) DEFAULT NULL,
  `padding_bottom` int(11) DEFAULT NULL,
  `min_height` int(11) DEFAULT NULL,
  `background_image_url` text DEFAULT NULL,
  `background_image_position` varchar(50) DEFAULT 'center',
  `background_image_repeat` tinyint(1) DEFAULT 0,
  `background_image_overlay` varchar(7) DEFAULT NULL,
  `background_image_opacity` decimal(3,2) DEFAULT NULL,
  `cta_text` varchar(255) DEFAULT NULL,
  `cta_link` varchar(500) DEFAULT NULL,
  `cta_variant` varchar(50) DEFAULT 'primary',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `theme_presets`
--

CREATE TABLE `theme_presets` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `preview_image_url` text DEFAULT NULL,
  `theme_config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`theme_config`)),
  `is_default` tinyint(1) DEFAULT 0,
  `is_published` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `theme_settings`
--

CREATE TABLE `theme_settings` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 0,
  `primary_color` varchar(7) DEFAULT '#3b82f6',
  `secondary_color` varchar(7) DEFAULT '#8b5cf6',
  `accent_color` varchar(7) DEFAULT '#ec4899',
  `background_color` varchar(7) DEFAULT '#ffffff',
  `text_color` varchar(7) DEFAULT '#1f2937',
  `border_color` varchar(7) DEFAULT '#e5e7eb',
  `success_color` varchar(7) DEFAULT '#10b981',
  `warning_color` varchar(7) DEFAULT '#f59e0b',
  `danger_color` varchar(7) DEFAULT '#ef4444',
  `muted_color` varchar(7) DEFAULT '#6b7280',
  `font_family_heading` varchar(255) DEFAULT 'system-ui, -apple-system, sans-serif',
  `font_family_body` varchar(255) DEFAULT 'system-ui, -apple-system, sans-serif',
  `font_size_base` int(11) DEFAULT 16,
  `font_weight_regular` int(11) DEFAULT 400,
  `font_weight_medium` int(11) DEFAULT 500,
  `font_weight_bold` int(11) DEFAULT 700,
  `line_height_normal` decimal(3,2) DEFAULT 1.50,
  `border_radius` int(11) DEFAULT 6,
  `container_max_width` int(11) DEFAULT 1280,
  `sidebar_width` int(11) DEFAULT 256,
  `header_height` int(11) DEFAULT 64,
  `spacing_unit` int(11) DEFAULT 4,
  `shadow_sm` varchar(255) DEFAULT '0 1px 2px 0 rgba(0,0,0,0.05)',
  `shadow_md` varchar(255) DEFAULT '0 4px 6px -1px rgba(0,0,0,0.1)',
  `shadow_lg` varchar(255) DEFAULT '0 10px 15px -3px rgba(0,0,0,0.1)',
  `logo_url` text DEFAULT NULL,
  `favicon_url` text DEFAULT NULL,
  `site_name` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` varchar(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `theme_settings`
--

INSERT INTO `theme_settings` (`id`, `name`, `description`, `is_active`, `primary_color`, `secondary_color`, `accent_color`, `background_color`, `text_color`, `border_color`, `success_color`, `warning_color`, `danger_color`, `muted_color`, `font_family_heading`, `font_family_body`, `font_size_base`, `font_weight_regular`, `font_weight_medium`, `font_weight_bold`, `line_height_normal`, `border_radius`, `container_max_width`, `sidebar_width`, `header_height`, `spacing_unit`, `shadow_sm`, `shadow_md`, `shadow_lg`, `logo_url`, `favicon_url`, `site_name`, `created_at`, `updated_at`, `created_by`) VALUES
('00000000-0000-0000-0000-000000000001', 'Default Theme', 'Default system theme', 1, '#3b82f6', '#8b5cf6', '#ec4899', '#ffffff', '#1f2937', '#e5e7eb', '#10b981', '#f59e0b', '#ef4444', '#6b7280', 'system-ui, -apple-system, sans-serif', 'system-ui, -apple-system, sans-serif', 16, 400, 500, 700, 1.50, 6, 1280, 256, 64, 4, '0 1px 2px 0 rgba(0,0,0,0.05)', '0 4px 6px -1px rgba(0,0,0,0.1)', '0 10px 15px -3px rgba(0,0,0,0.1)', NULL, NULL, 'Exam System', '2025-12-07 18:34:38', '2025-12-07 18:34:38', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `topics`
--

CREATE TABLE `topics` (
  `id` varchar(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `parent_id` varchar(36) DEFAULT NULL,
  `color` varchar(7) DEFAULT '#3b82f6',
  `icon` varchar(50) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `traffic_analytics`
--

CREATE TABLE `traffic_analytics` (
  `id` char(36) NOT NULL DEFAULT uuid(),
  `date` date DEFAULT NULL,
  `total_visits` int(11) DEFAULT NULL,
  `unique_visitors` int(11) DEFAULT NULL,
  `new_visitors` int(11) DEFAULT NULL,
  `returning_visitors` int(11) DEFAULT NULL,
  `bounce_rate` decimal(5,2) DEFAULT NULL,
  `avg_session_duration` int(11) DEFAULT NULL,
  `avg_pages_per_session` decimal(5,2) DEFAULT NULL,
  `conversion_rate` decimal(5,2) DEFAULT NULL,
  `device_type` varchar(50) DEFAULT NULL,
  `browser` varchar(50) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `transactions`
--

CREATE TABLE `transactions` (
  `id` char(36) NOT NULL,
  `user_id` char(36) DEFAULT NULL,
  `exam_id` char(36) DEFAULT NULL,
  `program_id` char(36) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(3) DEFAULT 'USD',
  `payment_gateway` enum('stripe','paypal','razorpay','sslcommerz','bkash','manual','other') NOT NULL DEFAULT 'other',
  `payment_status` enum('pending','approved','cancelled','refunded','failed','completed','pending_approval','rejected') DEFAULT 'pending',
  `transaction_reference` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `payment_method` varchar(50) DEFAULT NULL,
  `payment_details` text DEFAULT NULL,
  `payment_proof` varchar(500) DEFAULT NULL COMMENT 'URL/path to payment proof image or document',
  `admin_notes` longtext DEFAULT NULL COMMENT 'Admin notes and status change history',
  `approved_by` varchar(36) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` char(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `role` enum('admin','student','proctor','teacher') NOT NULL DEFAULT 'student',
  `profile_visibility` enum('public','private') DEFAULT 'public',
  `status` enum('active','inactive','suspended') NOT NULL DEFAULT 'active',
  `email_verified` tinyint(1) DEFAULT 0,
  `phone_verified` tinyint(1) DEFAULT 0,
  `is_verified` tinyint(1) DEFAULT 0,
  `is_blocked` tinyint(1) DEFAULT 0,
  `blocked_until` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `last_login_at` timestamp NULL DEFAULT NULL,
  `last_login_ip` varchar(45) DEFAULT NULL,
  `last_login` timestamp NULL DEFAULT NULL,
  `suspension_reason` text DEFAULT NULL,
  `suspended_until` datetime DEFAULT NULL,
  `suspended_by` varchar(36) DEFAULT NULL,
  `two_factor_enabled` tinyint(1) DEFAULT 0,
  `two_factor_secret` varchar(255) DEFAULT NULL,
  `failed_login_attempts` int(11) DEFAULT 0,
  `last_failed_login` datetime DEFAULT NULL,
  `profile_picture` varchar(500) DEFAULT NULL,
  `notification_preference` enum('all','important','none') DEFAULT 'all',
  `max_attempts` int(11) DEFAULT NULL,
  `time_limit_hours` int(11) DEFAULT NULL,
  `admin_notes` longtext DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password_hash`, `full_name`, `phone`, `role`, `profile_visibility`, `status`, `email_verified`, `phone_verified`, `is_verified`, `is_blocked`, `blocked_until`, `created_at`, `updated_at`, `last_login_at`, `last_login_ip`, `last_login`, `suspension_reason`, `suspended_until`, `suspended_by`, `two_factor_enabled`, `two_factor_secret`, `failed_login_attempts`, `last_failed_login`, `profile_picture`, `notification_preference`, `max_attempts`, `time_limit_hours`, `admin_notes`) VALUES
('70840684-bc72-4922-820d-2e6961a5ef2f', 'abdullahalmasudkhan@gmail.com', '$2b$10$NoK8LuOWpMg2yHYN3zRdpeyOnV2A8lJDs3KcpK3jnxT3oof0rM6Mu', 'Abdullah Al Masud', NULL, 'admin', 'public', 'active', 0, 0, 0, 0, NULL, '2025-12-07 18:34:40', '2025-12-07 18:34:59', '2025-12-07 18:34:59', '103.110.217.46', NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, 'all', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user_activity_log`
--

CREATE TABLE `user_activity_log` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `activity_type` varchar(50) NOT NULL,
  `activity_description` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_blocks`
--

CREATE TABLE `user_blocks` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `blocked_by` char(36) DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `blocked_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `expires_at` timestamp NULL DEFAULT NULL,
  `is_permanent` tinyint(1) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `unblocked_at` timestamp NULL DEFAULT NULL,
  `unblocked_by` char(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_engagement_metrics`
--

CREATE TABLE `user_engagement_metrics` (
  `id` char(36) NOT NULL DEFAULT uuid(),
  `user_id` char(36) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `exams_attempted` int(11) DEFAULT 0,
  `exams_completed` int(11) DEFAULT 0,
  `exams_passed` int(11) DEFAULT 0,
  `avg_score` decimal(5,2) DEFAULT NULL,
  `time_spent_minutes` int(11) DEFAULT NULL,
  `topics_studied` int(11) DEFAULT NULL,
  `pages_visited` int(11) DEFAULT NULL,
  `session_count` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_permissions`
--

CREATE TABLE `user_permissions` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `can_take_exams` tinyint(1) DEFAULT 1,
  `can_view_results` tinyint(1) DEFAULT 1,
  `can_download_certificate` tinyint(1) DEFAULT 1,
  `can_access_analytics` tinyint(1) DEFAULT 1,
  `can_message_admin` tinyint(1) DEFAULT 1,
  `can_join_forums` tinyint(1) DEFAULT 0,
  `can_create_exams` tinyint(1) DEFAULT 0,
  `can_edit_exams` tinyint(1) DEFAULT 0,
  `can_delete_exams` tinyint(1) DEFAULT 0,
  `can_manage_users` tinyint(1) DEFAULT 0,
  `can_approve_payments` tinyint(1) DEFAULT 0,
  `can_view_reports` tinyint(1) DEFAULT 0,
  `can_manage_settings` tinyint(1) DEFAULT 0,
  `max_exam_attempts` int(11) DEFAULT NULL,
  `max_concurrent_exams` int(11) DEFAULT 1,
  `exam_time_limit_multiplier` decimal(3,2) DEFAULT 1.00,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_preferences`
--

CREATE TABLE `user_preferences` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `email_notifications` tinyint(1) DEFAULT 1,
  `sms_notifications` tinyint(1) DEFAULT 0,
  `push_notifications` tinyint(1) DEFAULT 1,
  `notify_exam_results` tinyint(1) DEFAULT 1,
  `notify_new_exams` tinyint(1) DEFAULT 1,
  `notify_exam_reminders` tinyint(1) DEFAULT 1,
  `notify_payment_status` tinyint(1) DEFAULT 1,
  `theme` varchar(20) DEFAULT 'light',
  `language` varchar(10) DEFAULT 'en',
  `timezone` varchar(50) DEFAULT 'UTC',
  `items_per_page` int(11) DEFAULT 10,
  `show_profile_publicly` tinyint(1) DEFAULT 0,
  `show_in_leaderboard` tinyint(1) DEFAULT 1,
  `show_achievements` tinyint(1) DEFAULT 1,
  `allow_peer_messaging` tinyint(1) DEFAULT 0,
  `auto_save_answers` tinyint(1) DEFAULT 1,
  `confirm_before_submit` tinyint(1) DEFAULT 1,
  `show_question_palette` tinyint(1) DEFAULT 1,
  `enable_calculator` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_role_assignments`
--

CREATE TABLE `user_role_assignments` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `role_name` varchar(50) NOT NULL,
  `assigned_by` varchar(36) DEFAULT NULL,
  `assigned_at` datetime DEFAULT current_timestamp(),
  `expires_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_sessions`
--

CREATE TABLE `user_sessions` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `session_token` varchar(255) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `device_info` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `expires_at` datetime NOT NULL,
  `last_activity` datetime DEFAULT current_timestamp(),
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_sessions`
--

INSERT INTO `user_sessions` (`id`, `user_id`, `session_token`, `ip_address`, `user_agent`, `device_info`, `is_active`, `expires_at`, `last_activity`, `created_at`) VALUES
('f93cc65a-a58b-45cd-8f96-cdeb4a345a6f', '70840684-bc72-4922-820d-2e6961a5ef2f', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3MDg0MDY4NC1iYzcyLTQ5MjItODIwZC0yZTY5NjFhNWVmMmYiLCJlbWFpbCI6ImFiZHVsbGFoYWxtYXN1ZGtoYW5AZ21haWwuY29tIiwicm9sZSI6ImFkbWluIiwib3JnYW5pemF0aW9uSWQiOiI4NWRjOWEyZi0yMzBiLTRlMjktOWQ0Zi0xZTE1NGU4YjFjMGEiLCJpYX', '103.110.217.46', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:145.0) Gecko/20100101 Firefox/145.0', NULL, 1, '2026-01-07 00:34:59', '2025-12-08 00:34:59', '2025-12-08 00:34:59');

-- --------------------------------------------------------

--
-- Table structure for table `verification_codes`
--

CREATE TABLE `verification_codes` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `code` varchar(6) NOT NULL,
  `type` enum('email','phone') NOT NULL,
  `verified` tinyint(1) DEFAULT 0,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin_settings`
--
ALTER TABLE `admin_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `setting_key` (`setting_key`),
  ADD KEY `idx_setting_key` (`setting_key`);

--
-- Indexes for table `answer_drafts`
--
ALTER TABLE `answer_drafts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_draft` (`exam_attempt_id`,`question_id`),
  ADD KEY `idx_exam_attempt` (`exam_attempt_id`),
  ADD KEY `idx_student` (`student_id`);

--
-- Indexes for table `anti_cheat_events`
--
ALTER TABLE `anti_cheat_events`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_attempt` (`attempt_id`),
  ADD KEY `idx_severity` (`severity`),
  ADD KEY `idx_type` (`event_type`),
  ADD KEY `idx_anti_cheat_events_attempt_id` (`attempt_id`);

--
-- Indexes for table `anti_cheat_logs`
--
ALTER TABLE `anti_cheat_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_exam_attempt_id` (`exam_attempt_id`),
  ADD KEY `idx_timestamp` (`timestamp`);

--
-- Indexes for table `anti_cheat_logs_enhanced`
--
ALTER TABLE `anti_cheat_logs_enhanced`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_timestamp` (`timestamp`),
  ADD KEY `idx_student_id` (`student_id`),
  ADD KEY `idx_severity` (`severity`),
  ADD KEY `idx_exam_attempt_id` (`exam_attempt_id`);

--
-- Indexes for table `api_logs`
--
ALTER TABLE `api_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_timestamp` (`timestamp`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_session_id` (`session_id`),
  ADD KEY `idx_endpoint` (`endpoint`),
  ADD KEY `idx_status_code` (`status_code`);

--
-- Indexes for table `cohort_analysis`
--
ALTER TABLE `cohort_analysis`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_cohort_date` (`cohort_date`),
  ADD KEY `idx_age_days` (`age_days`);

--
-- Indexes for table `coupons`
--
ALTER TABLE `coupons`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `idx_code` (`code`),
  ADD KEY `idx_is_active` (`is_active`),
  ADD KEY `idx_valid_dates` (`valid_from`,`valid_until`);

--
-- Indexes for table `coupon_usage`
--
ALTER TABLE `coupon_usage`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_coupon_id` (`coupon_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_used_at` (`used_at`);

--
-- Indexes for table `evaluations`
--
ALTER TABLE `evaluations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `evaluated_by` (`evaluated_by`),
  ADD KEY `idx_exam_attempt_id` (`exam_attempt_id`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `exams`
--
ALTER TABLE `exams`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `subject_id` (`subject_id`),
  ADD KEY `idx_organization_id` (`organization_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_exam_date` (`exam_date`),
  ADD KEY `idx_exams_public` (`is_public`,`status`),
  ADD KEY `idx_exams_featured` (`featured`,`is_public`),
  ADD KEY `idx_program` (`program_id`),
  ADD KEY `idx_exam_controls` (`proctoring_enabled`,`allow_answer_change`);

--
-- Indexes for table `exam_answers`
--
ALTER TABLE `exam_answers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_attempt` (`attempt_id`),
  ADD KEY `idx_question` (`question_id`),
  ADD KEY `idx_flagged` (`is_flagged`),
  ADD KEY `idx_exam_answers_attempt_id` (`attempt_id`);

--
-- Indexes for table `exam_attempts`
--
ALTER TABLE `exam_attempts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_exam_registration_id` (`exam_registration_id`),
  ADD KEY `idx_exam_student` (`exam_id`,`student_id`),
  ADD KEY `idx_exam_attempts_student_id` (`student_id`),
  ADD KEY `idx_exam_attempts_exam_student` (`exam_id`,`student_id`),
  ADD KEY `idx_exam_attempts_status` (`status`);

--
-- Indexes for table `exam_programs`
--
ALTER TABLE `exam_programs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_exam_program` (`exam_id`,`program_id`);

--
-- Indexes for table `exam_progress`
--
ALTER TABLE `exam_progress`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `attempt_id` (`attempt_id`),
  ADD KEY `idx_attempt` (`attempt_id`),
  ADD KEY `idx_exam_progress_attempt_id` (`attempt_id`);

--
-- Indexes for table `exam_questions`
--
ALTER TABLE `exam_questions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_exam_question` (`exam_id`,`question_id`),
  ADD KEY `question_id` (`question_id`),
  ADD KEY `idx_exam_id` (`exam_id`),
  ADD KEY `idx_exam_questions_exam_id` (`exam_id`);

--
-- Indexes for table `exam_question_selections`
--
ALTER TABLE `exam_question_selections`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_exam_question` (`exam_id`,`question_id`),
  ADD KEY `question_id` (`question_id`),
  ADD KEY `idx_exam_questions` (`exam_id`,`question_order`);

--
-- Indexes for table `exam_registrations`
--
ALTER TABLE `exam_registrations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_exam_student` (`exam_id`,`student_id`),
  ADD KEY `idx_exam_id` (`exam_id`),
  ADD KEY `idx_student_id` (`student_id`);

--
-- Indexes for table `exam_results`
--
ALTER TABLE `exam_results`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_exam_id` (`exam_id`),
  ADD KEY `idx_student_id` (`student_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_exam_results_student_exam` (`student_id`,`exam_id`),
  ADD KEY `idx_attempt_id` (`attempt_id`),
  ADD KEY `idx_exam_results_student_id` (`student_id`),
  ADD KEY `idx_exam_results_exam_student` (`exam_id`,`student_id`),
  ADD KEY `idx_exam_results_result_date` (`result_date`);

--
-- Indexes for table `landing_config`
--
ALTER TABLE `landing_config`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_is_active` (`is_active`);

--
-- Indexes for table `landing_gradient_presets`
--
ALTER TABLE `landing_gradient_presets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `preset_name` (`preset_name`),
  ADD KEY `idx_usage_count` (`usage_count`);

--
-- Indexes for table `landing_images`
--
ALTER TABLE `landing_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_file_name` (`file_name`),
  ADD KEY `idx_uploaded_at` (`uploaded_at`);

--
-- Indexes for table `landing_menu_items`
--
ALTER TABLE `landing_menu_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_config_id` (`config_id`),
  ADD KEY `idx_menu_location` (`menu_location`),
  ADD KEY `idx_display_order` (`display_order`),
  ADD KEY `idx_is_visible` (`is_visible`),
  ADD KEY `idx_parent_id` (`parent_id`);

--
-- Indexes for table `landing_sections`
--
ALTER TABLE `landing_sections`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_section` (`config_id`,`section_key`),
  ADD KEY `idx_config_id` (`config_id`),
  ADD KEY `idx_display_order` (`display_order`),
  ADD KEY `idx_is_visible` (`is_visible`),
  ADD KEY `idx_section_type` (`section_type`);

--
-- Indexes for table `landing_section_templates`
--
ALTER TABLE `landing_section_templates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_template_type` (`template_type`),
  ADD KEY `idx_is_active` (`is_active`);

--
-- Indexes for table `landing_version_history`
--
ALTER TABLE `landing_version_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_config_id` (`config_id`),
  ADD KEY `idx_config_version` (`config_id`,`version_number`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `login_attempts`
--
ALTER TABLE `login_attempts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_timestamp` (`timestamp`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_ip_address` (`ip_address`),
  ADD KEY `idx_success` (`success`);

--
-- Indexes for table `newsletter_subscribers`
--
ALTER TABLE `newsletter_subscribers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_subscribed_at` (`subscribed_at`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_is_read` (`is_read`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_category` (`category`),
  ADD KEY `idx_priority` (`priority`);

--
-- Indexes for table `notification_preferences`
--
ALTER TABLE `notification_preferences`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD KEY `idx_user_id` (`user_id`);

--
-- Indexes for table `oauth_accounts`
--
ALTER TABLE `oauth_accounts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_provider_user` (`provider_name`,`provider_user_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_provider_name` (`provider_name`);

--
-- Indexes for table `oauth_providers`
--
ALTER TABLE `oauth_providers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `provider_name` (`provider_name`),
  ADD KEY `idx_provider_name` (`provider_name`);

--
-- Indexes for table `oauth_tokens`
--
ALTER TABLE `oauth_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `state` (`state`),
  ADD KEY `idx_state` (`state`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_expires_at` (`expires_at`);

--
-- Indexes for table `organizations`
--
ALTER TABLE `organizations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `idx_slug` (`slug`);

--
-- Indexes for table `organization_members`
--
ALTER TABLE `organization_members`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_org_user` (`organization_id`,`user_id`),
  ADD KEY `idx_organization_id` (`organization_id`),
  ADD KEY `idx_user_id` (`user_id`);

--
-- Indexes for table `page_visits`
--
ALTER TABLE `page_visits`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_page_path` (`page_path`(255)),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_visited_at` (`visited_at`);

--
-- Indexes for table `password_resets`
--
ALTER TABLE `password_resets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token` (`token`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_token` (`token`),
  ADD KEY `idx_expires_at` (`expires_at`);

--
-- Indexes for table `payment_transactions`
--
ALTER TABLE `payment_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `exam_id` (`exam_id`),
  ADD KEY `idx_organization_id` (`organization_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_transaction_reference` (`transaction_reference`);

--
-- Indexes for table `proctoring_sessions`
--
ALTER TABLE `proctoring_sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `proctor_id` (`proctor_id`),
  ADD KEY `idx_exam_attempt_id` (`exam_attempt_id`);

--
-- Indexes for table `programs`
--
ALTER TABLE `programs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_organization` (`organization_id`),
  ADD KEY `idx_created_by` (`created_by`),
  ADD KEY `idx_program_exam_controls` (`proctoring_enabled`,`allow_answer_change`);

--
-- Indexes for table `program_enrollments`
--
ALTER TABLE `program_enrollments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_program_enrollment` (`program_id`,`user_id`),
  ADD KEY `idx_program` (`program_id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_payment_status` (`payment_status`);

--
-- Indexes for table `questions`
--
ALTER TABLE `questions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_organization_id` (`organization_id`),
  ADD KEY `idx_subject_id` (`subject_id`),
  ADD KEY `idx_question_type` (`question_type_id`),
  ADD KEY `idx_randomize` (`randomize_options`),
  ADD KEY `idx_allow_multiple` (`allow_multiple_answers`),
  ADD KEY `idx_questions_difficulty` (`difficulty_level`),
  ADD KEY `idx_questions_subject` (`subject_id`),
  ADD KEY `idx_questions_type` (`question_type_id`);
ALTER TABLE `questions` ADD FULLTEXT KEY `ft_topics` (`topics`);

--
-- Indexes for table `question_evaluations`
--
ALTER TABLE `question_evaluations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `evaluated_by` (`evaluated_by`),
  ADD KEY `idx_student_answer_id` (`student_answer_id`);

--
-- Indexes for table `question_feedback`
--
ALTER TABLE `question_feedback`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_question_feedback` (`question_id`),
  ADD KEY `idx_question` (`question_id`);

--
-- Indexes for table `question_options`
--
ALTER TABLE `question_options`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_question_id` (`question_id`);

--
-- Indexes for table `question_topics`
--
ALTER TABLE `question_topics`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_question_topic` (`question_id`,`topic_id`),
  ADD KEY `idx_question_topics` (`question_id`),
  ADD KEY `idx_topic_questions` (`topic_id`);

--
-- Indexes for table `question_types`
--
ALTER TABLE `question_types`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `revenue_metrics`
--
ALTER TABLE `revenue_metrics`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_date` (`date`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_month` (`month`),
  ADD KEY `idx_year` (`year`),
  ADD KEY `idx_timestamp` (`timestamp`);

--
-- Indexes for table `site_settings`
--
ALTER TABLE `site_settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `student_answers`
--
ALTER TABLE `student_answers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_attempt_question` (`exam_attempt_id`,`question_id`),
  ADD KEY `exam_question_id` (`exam_question_id`),
  ADD KEY `selected_option_id` (`selected_option_id`),
  ADD KEY `idx_exam_attempt_id` (`exam_attempt_id`),
  ADD KEY `idx_question_id` (`question_id`);

--
-- Indexes for table `subjects`
--
ALTER TABLE `subjects`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_organization_id` (`organization_id`);

--
-- Indexes for table `support_tickets`
--
ALTER TABLE `support_tickets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_student_id` (`student_id`),
  ADD KEY `idx_admin_id` (`admin_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_priority` (`priority`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `support_ticket_attachments`
--
ALTER TABLE `support_ticket_attachments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_ticket_id` (`ticket_id`),
  ADD KEY `idx_message_id` (`message_id`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `support_ticket_custom_fields`
--
ALTER TABLE `support_ticket_custom_fields`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_ticket_id` (`ticket_id`);

--
-- Indexes for table `support_ticket_messages`
--
ALTER TABLE `support_ticket_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_ticket_id` (`ticket_id`),
  ADD KEY `idx_sender_id` (`sender_id`),
  ADD KEY `idx_is_admin_response` (`is_admin_response`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `system_metrics`
--
ALTER TABLE `system_metrics`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_timestamp` (`timestamp`),
  ADD KEY `idx_metric_name` (`metric_name`);

--
-- Indexes for table `theme_audit_log`
--
ALTER TABLE `theme_audit_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `changed_by` (`changed_by`),
  ADD KEY `idx_theme_id` (`theme_id`),
  ADD KEY `idx_action` (`action`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `theme_custom_css`
--
ALTER TABLE `theme_custom_css`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `theme_id` (`theme_id`);

--
-- Indexes for table `theme_menu_items`
--
ALTER TABLE `theme_menu_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `theme_id` (`theme_id`),
  ADD KEY `parent_id` (`parent_id`),
  ADD KEY `idx_menu_location` (`menu_location`),
  ADD KEY `idx_display_order` (`display_order`),
  ADD KEY `idx_visible_for_role` (`visible_for_role`);

--
-- Indexes for table `theme_page_sections`
--
ALTER TABLE `theme_page_sections`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_page_section` (`theme_id`,`page_path`,`section_key`),
  ADD KEY `idx_page_path` (`page_path`),
  ADD KEY `idx_display_order` (`display_order`),
  ADD KEY `idx_is_visible` (`is_visible`);

--
-- Indexes for table `theme_presets`
--
ALTER TABLE `theme_presets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD KEY `idx_is_default` (`is_default`),
  ADD KEY `idx_is_published` (`is_published`);

--
-- Indexes for table `theme_settings`
--
ALTER TABLE `theme_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_is_active` (`is_active`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `topics`
--
ALTER TABLE `topics`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_topic_slug` (`slug`),
  ADD KEY `idx_topic_active` (`is_active`),
  ADD KEY `idx_topic_parent` (`parent_id`);

--
-- Indexes for table `traffic_analytics`
--
ALTER TABLE `traffic_analytics`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_date_device` (`date`,`device_type`),
  ADD KEY `idx_date` (`date`),
  ADD KEY `idx_device_type` (`device_type`);

--
-- Indexes for table `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `exam_id` (`exam_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_payment_status` (`payment_status`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_role` (`role`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_profile_visibility` (`profile_visibility`),
  ADD KEY `idx_email_verified` (`email_verified`),
  ADD KEY `idx_failed_attempts` (`failed_login_attempts`),
  ADD KEY `idx_last_login` (`last_login_at`);

--
-- Indexes for table `user_activity_log`
--
ALTER TABLE `user_activity_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_activity` (`user_id`,`created_at`),
  ADD KEY `idx_activity_type` (`activity_type`);

--
-- Indexes for table `user_blocks`
--
ALTER TABLE `user_blocks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `blocked_by` (`blocked_by`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_is_active` (`is_active`),
  ADD KEY `idx_expires_at` (`expires_at`);

--
-- Indexes for table `user_engagement_metrics`
--
ALTER TABLE `user_engagement_metrics`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_date` (`user_id`,`date`),
  ADD KEY `idx_date` (`date`),
  ADD KEY `idx_user_id` (`user_id`);

--
-- Indexes for table `user_permissions`
--
ALTER TABLE `user_permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_permission` (`user_id`);

--
-- Indexes for table `user_preferences`
--
ALTER TABLE `user_preferences`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_preference` (`user_id`);

--
-- Indexes for table `user_role_assignments`
--
ALTER TABLE `user_role_assignments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_roles` (`user_id`),
  ADD KEY `idx_role_assignments` (`role_name`);

--
-- Indexes for table `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_session_token` (`session_token`),
  ADD KEY `idx_user_sessions` (`user_id`,`is_active`),
  ADD KEY `idx_session_expiry` (`expires_at`);

--
-- Indexes for table `verification_codes`
--
ALTER TABLE `verification_codes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_type` (`user_id`,`type`),
  ADD KEY `idx_code` (`code`),
  ADD KEY `idx_expires` (`expires_at`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `coupons`
--
ALTER TABLE `coupons`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `coupon_usage`
--
ALTER TABLE `coupon_usage`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `newsletter_subscribers`
--
ALTER TABLE `newsletter_subscribers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `page_visits`
--
ALTER TABLE `page_visits`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `question_types`
--
ALTER TABLE `question_types`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `answer_drafts`
--
ALTER TABLE `answer_drafts`
  ADD CONSTRAINT `answer_drafts_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `anti_cheat_events`
--
ALTER TABLE `anti_cheat_events`
  ADD CONSTRAINT `anti_cheat_events_ibfk_1` FOREIGN KEY (`attempt_id`) REFERENCES `exam_attempts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_anti_cheat_attempt` FOREIGN KEY (`attempt_id`) REFERENCES `exam_attempts` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `anti_cheat_logs`
--
ALTER TABLE `anti_cheat_logs`
  ADD CONSTRAINT `anti_cheat_logs_ibfk_1` FOREIGN KEY (`exam_attempt_id`) REFERENCES `exam_attempts` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `evaluations`
--
ALTER TABLE `evaluations`
  ADD CONSTRAINT `evaluations_ibfk_1` FOREIGN KEY (`exam_attempt_id`) REFERENCES `exam_attempts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `evaluations_ibfk_2` FOREIGN KEY (`evaluated_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `exams`
--
ALTER TABLE `exams`
  ADD CONSTRAINT `exams_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `exams_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `exams_ibfk_3` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`);

--
-- Constraints for table `exam_answers`
--
ALTER TABLE `exam_answers`
  ADD CONSTRAINT `exam_answers_ibfk_1` FOREIGN KEY (`attempt_id`) REFERENCES `exam_attempts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `exam_answers_ibfk_2` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_exam_answers_attempt` FOREIGN KEY (`attempt_id`) REFERENCES `exam_attempts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_exam_answers_question` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `exam_attempts`
--
ALTER TABLE `exam_attempts`
  ADD CONSTRAINT `exam_attempts_ibfk_1` FOREIGN KEY (`exam_registration_id`) REFERENCES `exam_registrations` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `exam_progress`
--
ALTER TABLE `exam_progress`
  ADD CONSTRAINT `exam_progress_ibfk_1` FOREIGN KEY (`attempt_id`) REFERENCES `exam_attempts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_exam_progress_attempt` FOREIGN KEY (`attempt_id`) REFERENCES `exam_attempts` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `exam_questions`
--
ALTER TABLE `exam_questions`
  ADD CONSTRAINT `exam_questions_ibfk_1` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `exam_questions_ibfk_2` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `exam_question_selections`
--
ALTER TABLE `exam_question_selections`
  ADD CONSTRAINT `exam_question_selections_ibfk_1` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `exam_question_selections_ibfk_2` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `exam_registrations`
--
ALTER TABLE `exam_registrations`
  ADD CONSTRAINT `exam_registrations_ibfk_1` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `exam_registrations_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `exam_results`
--
ALTER TABLE `exam_results`
  ADD CONSTRAINT `exam_results_ibfk_1` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `exam_results_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notification_preferences`
--
ALTER TABLE `notification_preferences`
  ADD CONSTRAINT `notification_preferences_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `organization_members`
--
ALTER TABLE `organization_members`
  ADD CONSTRAINT `organization_members_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `organization_members_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `payment_transactions`
--
ALTER TABLE `payment_transactions`
  ADD CONSTRAINT `payment_transactions_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `payment_transactions_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `payment_transactions_ibfk_3` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`id`);

--
-- Constraints for table `proctoring_sessions`
--
ALTER TABLE `proctoring_sessions`
  ADD CONSTRAINT `proctoring_sessions_ibfk_1` FOREIGN KEY (`exam_attempt_id`) REFERENCES `exam_attempts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `proctoring_sessions_ibfk_2` FOREIGN KEY (`proctor_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `questions`
--
ALTER TABLE `questions`
  ADD CONSTRAINT `questions_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `questions_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `questions_ibfk_4` FOREIGN KEY (`question_type_id`) REFERENCES `question_types` (`id`);

--
-- Constraints for table `question_evaluations`
--
ALTER TABLE `question_evaluations`
  ADD CONSTRAINT `question_evaluations_ibfk_1` FOREIGN KEY (`student_answer_id`) REFERENCES `student_answers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `question_evaluations_ibfk_2` FOREIGN KEY (`evaluated_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `question_feedback`
--
ALTER TABLE `question_feedback`
  ADD CONSTRAINT `question_feedback_ibfk_1` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `question_options`
--
ALTER TABLE `question_options`
  ADD CONSTRAINT `question_options_ibfk_1` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `question_topics`
--
ALTER TABLE `question_topics`
  ADD CONSTRAINT `question_topics_ibfk_1` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `question_topics_ibfk_2` FOREIGN KEY (`topic_id`) REFERENCES `topics` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `student_answers`
--
ALTER TABLE `student_answers`
  ADD CONSTRAINT `student_answers_ibfk_1` FOREIGN KEY (`exam_attempt_id`) REFERENCES `exam_attempts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `student_answers_ibfk_2` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`),
  ADD CONSTRAINT `student_answers_ibfk_3` FOREIGN KEY (`exam_question_id`) REFERENCES `exam_questions` (`id`),
  ADD CONSTRAINT `student_answers_ibfk_4` FOREIGN KEY (`selected_option_id`) REFERENCES `question_options` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `support_tickets`
--
ALTER TABLE `support_tickets`
  ADD CONSTRAINT `support_tickets_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `support_tickets_ibfk_2` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `support_ticket_attachments`
--
ALTER TABLE `support_ticket_attachments`
  ADD CONSTRAINT `support_ticket_attachments_ibfk_1` FOREIGN KEY (`ticket_id`) REFERENCES `support_tickets` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `support_ticket_custom_fields`
--
ALTER TABLE `support_ticket_custom_fields`
  ADD CONSTRAINT `support_ticket_custom_fields_ibfk_1` FOREIGN KEY (`ticket_id`) REFERENCES `support_tickets` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `support_ticket_messages`
--
ALTER TABLE `support_ticket_messages`
  ADD CONSTRAINT `support_ticket_messages_ibfk_1` FOREIGN KEY (`ticket_id`) REFERENCES `support_tickets` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `support_ticket_messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `theme_audit_log`
--
ALTER TABLE `theme_audit_log`
  ADD CONSTRAINT `theme_audit_log_ibfk_1` FOREIGN KEY (`theme_id`) REFERENCES `theme_settings` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `theme_audit_log_ibfk_2` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `theme_custom_css`
--
ALTER TABLE `theme_custom_css`
  ADD CONSTRAINT `theme_custom_css_ibfk_1` FOREIGN KEY (`theme_id`) REFERENCES `theme_settings` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `theme_menu_items`
--
ALTER TABLE `theme_menu_items`
  ADD CONSTRAINT `theme_menu_items_ibfk_1` FOREIGN KEY (`theme_id`) REFERENCES `theme_settings` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `theme_menu_items_ibfk_2` FOREIGN KEY (`parent_id`) REFERENCES `theme_menu_items` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `theme_page_sections`
--
ALTER TABLE `theme_page_sections`
  ADD CONSTRAINT `theme_page_sections_ibfk_1` FOREIGN KEY (`theme_id`) REFERENCES `theme_settings` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `theme_settings`
--
ALTER TABLE `theme_settings`
  ADD CONSTRAINT `theme_settings_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `topics`
--
ALTER TABLE `topics`
  ADD CONSTRAINT `topics_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `topics` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `transactions`
--
ALTER TABLE `transactions`
  ADD CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `transactions_ibfk_2` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `user_activity_log`
--
ALTER TABLE `user_activity_log`
  ADD CONSTRAINT `user_activity_log_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_blocks`
--
ALTER TABLE `user_blocks`
  ADD CONSTRAINT `user_blocks_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_blocks_ibfk_2` FOREIGN KEY (`blocked_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `user_permissions`
--
ALTER TABLE `user_permissions`
  ADD CONSTRAINT `user_permissions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_preferences`
--
ALTER TABLE `user_preferences`
  ADD CONSTRAINT `user_preferences_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_role_assignments`
--
ALTER TABLE `user_role_assignments`
  ADD CONSTRAINT `user_role_assignments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD CONSTRAINT `user_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `verification_codes`
--
ALTER TABLE `verification_codes`
  ADD CONSTRAINT `verification_codes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Note: landing_config, landing_sections, and landing_menu_items tables are already defined earlier in the schema
-- The following definitions are commented out to avoid conflicts
--

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
