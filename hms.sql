-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 12, 2025 at 11:32 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `hms`
--

-- --------------------------------------------------------

--
-- Table structure for table `accounts_payable`
--

CREATE TABLE `accounts_payable` (
  `id` int(11) NOT NULL,
  `invoiceNumber` varchar(50) NOT NULL,
  `vendorName` varchar(255) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `dueDate` date NOT NULL,
  `paymentStatus` enum('pending','paid','overdue','partial') DEFAULT 'pending',
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `accounts_payable`
--

INSERT INTO `accounts_payable` (`id`, `invoiceNumber`, `vendorName`, `amount`, `dueDate`, `paymentStatus`, `description`) VALUES
(1, 'INV-AP-001', 'Medical Supplies Co.', 5420.00, '2025-10-15', 'pending', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `accounts_receivable`
--

CREATE TABLE `accounts_receivable` (
  `id` int(11) NOT NULL,
  `invoiceNumber` varchar(50) NOT NULL,
  `patientId` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `dueDate` date NOT NULL,
  `paymentStatus` enum('pending','paid','overdue','partial') DEFAULT 'pending',
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `accounts_receivable`
--

INSERT INTO `accounts_receivable` (`id`, `invoiceNumber`, `patientId`, `amount`, `dueDate`, `paymentStatus`, `description`) VALUES
(1, 'INV-AR-001', 1, 1200.50, '2025-10-20', 'paid', NULL),
(2, 'INV-5208', 7, 23456.00, '2025-11-04', 'paid', NULL),
(3, 'INV-4194', 58, 1234.00, '2025-11-08', 'pending', NULL),
(4, 'INV-1213', 98, 1234.00, '2025-11-10', 'pending', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `id` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`id`, `username`, `password`) VALUES
(1, 'admin', 'admin');

-- --------------------------------------------------------

--
-- Table structure for table `admissions`
--

CREATE TABLE `admissions` (
  `id` int(11) NOT NULL,
  `patientId` int(11) NOT NULL,
  `admissionDate` datetime NOT NULL,
  `dischargeDate` datetime DEFAULT NULL,
  `wardId` int(11) DEFAULT NULL,
  `bedId` int(11) DEFAULT NULL,
  `notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admissions`
--

INSERT INTO `admissions` (`id`, `patientId`, `admissionDate`, `dischargeDate`, `wardId`, `bedId`, `notes`) VALUES
(1, 5, '2025-11-01 16:09:09', NULL, 2, 3, 'Assigned to bed'),
(2, 4, '2025-11-01 16:14:08', NULL, 1, 2, 'Assigned to bed'),
(3, 7, '2025-11-03 19:59:27', '2025-11-03 19:59:31', 3, 30, 'Assigned to bed'),
(4, 8, '2025-11-04 00:22:09', NULL, 3, 30, 'Assigned to bed'),
(5, 7, '2025-11-04 00:25:47', NULL, 2, 5, 'Assigned to bed'),
(6, 3, '2025-11-04 02:22:33', NULL, 2, 4, 'Assigned to bed'),
(9, 15, '2025-11-06 17:37:49', NULL, 2, 11, 'Assigned to bed'),
(11, 99, '2025-11-10 04:44:33', NULL, 2, 21, 'Assigned to bed'),
(12, 98, '2025-11-10 06:49:04', '2025-11-10 06:49:10', 2, 36, 'Assigned to bed');

-- --------------------------------------------------------

--
-- Table structure for table `ambulancecrews`
--

CREATE TABLE `ambulancecrews` (
  `shift_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `ambulance_id` int(11) NOT NULL,
  `shift_start_time` datetime NOT NULL,
  `shift_end_time` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ambulancecrews`
--

INSERT INTO `ambulancecrews` (`shift_id`, `user_id`, `ambulance_id`, `shift_start_time`, `shift_end_time`, `created_at`, `updated_at`) VALUES
(1, 8, 1, '2025-11-12 10:39:09', '2025-11-12 14:53:44', '2025-11-12 05:09:09', '2025-11-12 09:23:44'),
(2, 10, 2, '2025-11-12 11:10:13', '2025-11-12 14:52:57', '2025-11-12 05:40:13', '2025-11-12 09:22:57'),
(3, 8, 1, '2025-11-12 14:54:08', '2025-11-12 14:54:56', '2025-11-12 09:24:08', '2025-11-12 09:24:56'),
(4, 8, 2, '2025-11-12 14:54:59', '2025-11-12 14:55:39', '2025-11-12 09:24:59', '2025-11-12 09:25:39'),
(5, 8, 1, '2025-11-12 14:56:00', '2025-11-12 15:03:09', '2025-11-12 09:26:00', '2025-11-12 09:33:09'),
(6, 8, 1, '2025-11-12 09:33:27', '2025-11-12 15:12:12', '2025-11-12 09:33:27', '2025-11-12 09:42:12');

-- --------------------------------------------------------

--
-- Table structure for table `ambulancelocationhistory`
--

CREATE TABLE `ambulancelocationhistory` (
  `location_id` int(11) NOT NULL,
  `ambulance_id` int(11) NOT NULL,
  `latitude` decimal(10,7) NOT NULL,
  `longitude` decimal(10,7) NOT NULL,
  `timestamp` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ambulancelocationhistory`
--

INSERT INTO `ambulancelocationhistory` (`location_id`, `ambulance_id`, `latitude`, `longitude`, `timestamp`, `created_at`) VALUES
(1, 1, 28.7041000, 77.1025000, '2025-11-12 03:28:17', '2025-11-12 03:28:19'),
(2, 1, 12.9433600, 77.5946240, '2025-11-12 03:30:11', '2025-11-12 03:30:14'),
(3, 1, 12.9438600, 77.5951240, '2025-11-12 03:32:02', '2025-11-12 03:32:04'),
(4, 1, 12.9443600, 77.5956240, '2025-11-12 03:32:07', '2025-11-12 03:32:07'),
(5, 1, 12.9448600, 77.5961240, '2025-11-12 03:32:10', '2025-11-12 03:32:10'),
(6, 1, 12.9453600, 77.5966240, '2025-11-12 03:32:13', '2025-11-12 03:32:13'),
(7, 1, 12.9458600, 77.5971240, '2025-11-12 03:32:16', '2025-11-12 03:32:16'),
(8, 1, 12.9463600, 77.5976240, '2025-11-12 03:32:19', '2025-11-12 03:32:19'),
(9, 1, 12.9468600, 77.5981240, '2025-11-12 03:32:22', '2025-11-12 03:32:22'),
(10, 1, 12.9473600, 77.5986240, '2025-11-12 03:32:25', '2025-11-12 03:32:25'),
(11, 1, 12.9478600, 77.5991240, '2025-11-12 03:32:28', '2025-11-12 03:32:28'),
(12, 1, 12.9483600, 77.5996240, '2025-11-12 03:32:31', '2025-11-12 03:32:31'),
(13, 2, 12.9433600, 77.5946240, '2025-11-12 04:38:31', '2025-11-12 04:38:33');

-- --------------------------------------------------------

--
-- Table structure for table `ambulances`
--

CREATE TABLE `ambulances` (
  `ambulance_id` int(11) NOT NULL,
  `vehicle_name` varchar(255) NOT NULL,
  `license_plate` varchar(50) NOT NULL,
  `current_status` enum('Available','On_Trip','Off_Duty','Maintenance') DEFAULT 'Available',
  `current_trip_id` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ambulances`
--

INSERT INTO `ambulances` (`ambulance_id`, `vehicle_name`, `license_plate`, `current_status`, `current_trip_id`, `created_at`, `updated_at`) VALUES
(1, 'Ambulance 01', 'KA01EM0001', 'Available', NULL, '2025-11-10 08:30:00', '2025-11-12 09:42:09'),
(2, 'Ambulance 02', 'KA01EM0002', 'Available', NULL, '2025-11-10 08:30:00', '2025-11-12 07:24:07');

-- --------------------------------------------------------

--
-- Table structure for table `appointments`
--

CREATE TABLE `appointments` (
  `id` int(11) NOT NULL,
  `patientId` int(11) NOT NULL,
  `doctorId` int(11) NOT NULL,
  `appointmentDate` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `notes` text DEFAULT NULL,
  `status` varchar(50) DEFAULT 'scheduled',
  `consultationType` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `appointments`
--

INSERT INTO `appointments` (`id`, `patientId`, `doctorId`, `appointmentDate`, `notes`, `status`, `consultationType`) VALUES
(53, 94, 5, '2025-11-10 03:30:00', '', 'scheduled', 'virtual'),
(54, 94, 5, '2025-11-10 03:30:00', '', 'scheduled', 'virtual'),
(55, 94, 5, '2025-11-11 03:30:00', '', 'scheduled', 'virtual'),
(56, 97, 5, '2025-11-11 03:30:00', 'Fever and cold ', 'scheduled', 'virtual'),
(57, 98, 4, '2025-11-11 04:00:00', 'Fever ', 'scheduled', 'virtual'),
(58, 99, 5, '2025-11-14 05:30:00', ' Bangalore ', 'scheduled', 'in-person'),
(59, 94, 5, '2025-11-10 08:30:00', '', 'scheduled', 'virtual'),
(60, 98, 5, '2025-11-10 07:30:00', '', 'scheduled', 'in-person'),
(61, 98, 5, '2025-11-10 09:30:00', '', 'scheduled', 'virtual');

-- --------------------------------------------------------

--
-- Table structure for table `beds`
--

CREATE TABLE `beds` (
  `id` int(11) NOT NULL,
  `bedNumber` varchar(50) NOT NULL,
  `wardId` int(11) DEFAULT NULL,
  `status` enum('available','occupied','maintenance','reserved','cleaning') DEFAULT 'available',
  `patientId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `beds`
--

INSERT INTO `beds` (`id`, `bedNumber`, `wardId`, `status`, `patientId`) VALUES
(1, 'ICU-001', 1, 'occupied', 1),
(2, 'ICU-002', 1, 'occupied', 4),
(3, 'GA-001', 2, 'occupied', 5),
(4, 'GA-002', 2, 'occupied', 3),
(5, 'GA-003', 2, 'occupied', 7),
(6, 'GA-004', 2, 'available', NULL),
(7, 'GA-005', 2, 'available', NULL),
(8, 'GA-006', 2, 'available', NULL),
(9, 'GA-007', 2, 'available', NULL),
(10, 'GA-008', 2, 'available', NULL),
(11, 'GA-009', 2, 'occupied', 15),
(12, 'GA-010', 2, 'available', NULL),
(13, 'GA-011', 2, 'available', NULL),
(14, 'GA-012', 2, 'available', NULL),
(15, 'GA-013', 2, 'available', NULL),
(16, 'GA-014', 2, 'available', NULL),
(17, 'GA-015', 2, 'available', NULL),
(18, 'GA-016', 2, 'available', NULL),
(19, 'GA-017', 2, 'reserved', NULL),
(20, 'GA-018', 2, 'available', NULL),
(21, 'GA-019', 2, 'occupied', 99),
(22, 'GA-020', 2, 'available', NULL),
(23, 'GA-021', 2, 'available', NULL),
(24, 'GA-022', 2, 'available', NULL),
(25, 'GA-023', 2, 'available', NULL),
(26, 'GA-024', 2, 'occupied', NULL),
(27, 'GA-025', 2, 'available', NULL),
(28, 'CW-001', 3, 'occupied', NULL),
(29, 'CW-002', 3, 'maintenance', NULL),
(30, 'CW-003', 3, 'cleaning', 8),
(31, 'CW-004', 3, 'available', NULL),
(32, 'CW-005', 3, 'cleaning', NULL),
(33, 'CW-006', 3, 'reserved', NULL),
(34, 'CW-007', 3, 'available', NULL),
(35, 'CW-008', 3, 'available', NULL),
(36, 'CW-009', 2, 'available', NULL),
(37, 'CW-010', 3, 'available', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `bill_items`
--

CREATE TABLE `bill_items` (
  `id` int(11) NOT NULL,
  `billId` int(11) NOT NULL,
  `description` text NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `serviceReference` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `bill_items`
--

INSERT INTO `bill_items` (`id`, `billId`, `description`, `amount`, `serviceReference`) VALUES
(1, 1, 'ZerodalSp', 200.00, NULL),
(3, 3, 'sdfgh', 123.00, NULL),
(4, 4, 'sdfgh', -0.01, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `departments`
--

CREATE TABLE `departments` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `departments`
--

INSERT INTO `departments` (`id`, `name`, `description`) VALUES
(1, 'Emergency', 'Emergency care and trauma'),
(2, 'Cardiology', 'Heart and cardiovascular care'),
(3, 'Pediatrics', 'Child healthcare'),
(4, 'Orthopedics', 'Bone and joint care'),
(5, 'Pharmacy', 'Medication dispensary');

-- --------------------------------------------------------

--
-- Table structure for table `doctors`
--

CREATE TABLE `doctors` (
  `id` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `doctors`
--

INSERT INTO `doctors` (`id`, `username`, `password`) VALUES
(1, 'doctor', 'doctor');

-- --------------------------------------------------------

--
-- Table structure for table `doctor_schedules`
--

CREATE TABLE `doctor_schedules` (
  `id` int(11) NOT NULL,
  `doctorId` int(11) NOT NULL,
  `dayOfWeek` int(11) NOT NULL COMMENT '0=Sunday, 1=Monday, ..., 6=Saturday',
  `startTime` time NOT NULL,
  `endTime` time NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `doctor_schedules`
--

INSERT INTO `doctor_schedules` (`id`, `doctorId`, `dayOfWeek`, `startTime`, `endTime`) VALUES
(5, 4, 0, '09:00:00', '17:00:00'),
(6, 4, 1, '09:00:00', '17:00:00'),
(7, 4, 2, '09:00:00', '17:00:00'),
(8, 4, 3, '09:00:00', '17:00:00'),
(9, 4, 4, '09:00:00', '17:00:00'),
(10, 4, 5, '09:00:00', '17:00:00'),
(11, 4, 6, '09:00:00', '17:00:00'),
(21, 5, 0, '09:00:00', '18:00:00'),
(22, 5, 1, '09:00:00', '18:00:00'),
(23, 5, 2, '09:00:00', '17:00:00'),
(24, 5, 3, '09:00:00', '17:00:00'),
(25, 5, 4, '09:00:00', '17:00:00'),
(26, 5, 5, '09:00:00', '17:00:00'),
(27, 5, 6, '09:00:00', '17:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `emergencytrips`
--

CREATE TABLE `emergencytrips` (
  `trip_id` varchar(50) NOT NULL,
  `status` enum('New_Alert','Assigned','En_Route_To_Scene','At_Scene','Transporting','At_Hospital','Completed','Cancelled') DEFAULT 'New_Alert',
  `alert_source` enum('AcciRadar','Manual_Entry','Patient_App') NOT NULL,
  `scene_location_lat` decimal(10,7) NOT NULL,
  `scene_location_lon` decimal(10,7) NOT NULL,
  `alert_timestamp` datetime NOT NULL,
  `assigned_ambulance_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `patient_name` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `eta_minutes` int(11) DEFAULT NULL,
  `patient_id` int(11) DEFAULT NULL,
  `booked_by_patient_id` int(11) DEFAULT NULL,
  `assignment_timestamp` datetime DEFAULT NULL,
  `completion_timestamp` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `emergencytrips`
--

INSERT INTO `emergencytrips` (`trip_id`, `status`, `alert_source`, `scene_location_lat`, `scene_location_lon`, `alert_timestamp`, `assigned_ambulance_id`, `created_at`, `updated_at`, `patient_name`, `notes`, `eta_minutes`, `patient_id`, `booked_by_patient_id`, `assignment_timestamp`, `completion_timestamp`) VALUES
('ER-1762784116456-15411', 'Completed', 'Manual_Entry', 13.0491431, 77.5770453, '2025-11-10 14:15:16', 1, '2025-11-10 14:15:16', '2025-11-12 03:49:35', 'Bhagesh', 'Accident', NULL, NULL, NULL, NULL, NULL),
('ER-1762792556241-96702', 'Completed', 'Manual_Entry', 13.0490416, 77.5768769, '2025-11-10 16:35:56', 2, '2025-11-10 16:35:56', '2025-11-12 03:49:28', 'dsfwed', 'asd', NULL, NULL, NULL, NULL, NULL),
('ER-1762874079359-40417', 'Completed', 'Manual_Entry', 12.9433600, 12.9433678, '2025-11-11 15:14:39', 1, '2025-11-11 15:14:39', '2025-11-12 03:50:24', 'Bhagesh', 'qwe', NULL, NULL, NULL, NULL, NULL),
('ER-1762874405167-33442', 'Completed', 'Manual_Entry', 12.9433600, 77.5946240, '2025-11-11 15:20:05', 1, '2025-11-11 15:20:05', '2025-11-12 04:06:24', 'qwsdfvg', 'asd', NULL, NULL, NULL, NULL, NULL),
('ER-1762920704808-56754', 'Completed', 'Manual_Entry', 12.9448273, 77.5969198, '2025-11-12 04:11:44', 1, '2025-11-12 04:11:44', '2025-11-12 04:28:57', 'qwsdfvg', 'asdfg', NULL, NULL, NULL, NULL, NULL),
('ER-1762921416866-44045', 'Completed', 'Manual_Entry', 13.0640560, 77.5899043, '2025-11-12 04:23:36', 2, '2025-11-12 04:23:36', '2025-11-12 04:28:55', '', '', NULL, NULL, NULL, NULL, NULL),
('ER-1762922442372-85964', 'Completed', 'Manual_Entry', 13.0655414, 77.5937294, '2025-11-12 04:40:42', 1, '2025-11-12 04:40:42', '2025-11-12 05:00:54', '', '', NULL, NULL, NULL, NULL, NULL),
('ER-1762922505937-79934', 'Completed', 'Manual_Entry', 13.0642632, 77.5899206, '2025-11-12 04:41:45', 2, '2025-11-12 04:41:45', '2025-11-12 05:00:52', '', '', NULL, NULL, NULL, NULL, NULL),
('ER-1762923708439-15858', 'Completed', 'Manual_Entry', 13.0642632, 77.5899206, '2025-11-12 05:01:48', 1, '2025-11-12 05:01:48', '2025-11-12 07:39:56', 'bhagesh', '', NULL, NULL, NULL, NULL, NULL),
('ER-1762923766555-62410', 'Completed', 'Manual_Entry', 13.0669305, 77.5859251, '2025-11-12 05:02:46', 2, '2025-11-12 05:02:46', '2025-11-12 05:15:00', '', '', NULL, NULL, NULL, NULL, NULL),
('ER-1762924643717-91444', 'Completed', 'Manual_Entry', 13.0669305, 77.5859251, '2025-11-12 05:17:23', 2, '2025-11-12 05:17:23', '2025-11-12 05:22:39', '', '', NULL, NULL, NULL, NULL, NULL),
('ER-1762926073021-32534', 'Completed', 'Manual_Entry', 13.0669305, 77.5859251, '2025-11-12 05:41:13', 2, '2025-11-12 05:41:13', '2025-11-12 05:56:08', '', '', NULL, NULL, NULL, NULL, NULL),
('ER-1762926395499-25893', 'Completed', 'Manual_Entry', 13.0687978, 77.5804924, '2025-11-12 05:46:35', 1, '2025-11-12 05:46:35', '2025-11-12 07:06:26', '', '', NULL, NULL, NULL, NULL, NULL),
('ER-1762927353291-7646', 'Completed', 'Manual_Entry', 13.0687978, 77.5804924, '2025-11-12 06:02:33', 2, '2025-11-12 06:02:33', '2025-11-12 06:03:16', '', '', NULL, NULL, NULL, NULL, NULL),
('ER-1762927684065-34591', 'Completed', 'Manual_Entry', 13.0687978, 77.5804924, '2025-11-12 06:08:04', 2, '2025-11-12 06:08:04', '2025-11-12 06:43:12', '', '', NULL, NULL, NULL, NULL, NULL),
('ER-1762928501191-12423', 'Completed', 'Manual_Entry', 13.0687978, 77.5804924, '2025-11-12 06:21:41', 1, '2025-11-12 06:21:41', '2025-11-12 06:43:13', '', '', NULL, NULL, NULL, NULL, NULL),
('ER-1762929813368-61173', 'Completed', 'Manual_Entry', 12.9433600, 77.5946240, '2025-11-12 06:43:33', 2, '2025-11-12 06:43:33', '2025-11-12 07:05:15', '', '', NULL, NULL, NULL, NULL, NULL),
('ER-1762931046013-26003', 'Completed', 'Manual_Entry', 13.0687978, 77.5804924, '2025-11-12 07:04:06', 1, '2025-11-12 07:04:06', '2025-11-12 07:04:59', '', '', 23, NULL, NULL, NULL, NULL),
('ER-1762931138029-92646', 'Completed', 'Manual_Entry', 13.0687978, 77.5804924, '2025-11-12 07:05:38', 2, '2025-11-12 07:05:38', '2025-11-12 07:06:42', '', '', 22, NULL, NULL, NULL, NULL),
('ER-1762931268364-17328', 'Completed', 'Manual_Entry', 13.0687978, 77.5804924, '2025-11-12 07:07:48', 1, '2025-11-12 07:07:48', '2025-11-12 07:19:45', '', '', 23, NULL, NULL, NULL, NULL),
('ER-1762932003961-32824', 'Completed', 'Manual_Entry', 13.0687978, 77.5804924, '2025-11-12 07:20:03', 2, '2025-11-12 07:20:03', '2025-11-12 07:24:07', '', '', 22, NULL, NULL, NULL, NULL),
('ER-1762932262258-86128', 'Completed', 'Manual_Entry', 13.0687978, 77.5804924, '2025-11-12 07:24:22', 1, '2025-11-12 07:24:22', '2025-11-12 07:28:56', '', '', 23, NULL, NULL, NULL, NULL),
('ER-1762932551359-25039', 'Completed', 'Manual_Entry', 13.0687978, 77.5804924, '2025-11-12 07:29:11', 1, '2025-11-12 07:29:11', '2025-11-12 07:34:58', '', '', 23, NULL, NULL, NULL, NULL),
('ER-1762932913872-77990', 'Completed', 'Manual_Entry', 13.0687978, 77.5804924, '2025-11-12 07:35:13', 1, '2025-11-12 07:35:13', '2025-11-12 07:35:43', '', '', 23, NULL, NULL, NULL, NULL),
('ER-1762933218863-79383', 'Completed', 'Manual_Entry', 13.0687978, 77.5804924, '2025-11-12 07:40:18', 1, '2025-11-12 07:40:18', '2025-11-12 07:40:43', '', '', 23, NULL, NULL, NULL, NULL),
('ER-1762933258480-34442', 'Completed', 'Manual_Entry', 13.0687978, 77.5804924, '2025-11-12 07:40:58', 1, '2025-11-12 07:40:58', '2025-11-12 08:58:02', '', '', 23, NULL, NULL, NULL, NULL),
('ER-1762937951422-17197', 'Completed', 'Manual_Entry', 13.0687978, 77.5804924, '2025-11-12 08:59:11', 1, '2025-11-12 08:59:11', '2025-11-12 09:23:18', 'Bhagesh Biradar.', '', 23, 4, NULL, NULL, NULL),
('ER-1762940276606-20714', 'Completed', 'Manual_Entry', 13.0687978, 77.5804924, '2025-11-12 09:37:56', 1, '2025-11-12 09:37:56', '2025-11-12 09:42:09', 'Bhagesh Biradar.', '', 23, 4, NULL, NULL, NULL),
('ER-1762942875985-66395', 'New_Alert', '', 13.0561963, 77.5770275, '2025-11-12 10:21:15', NULL, '2025-11-12 10:21:15', '2025-11-12 10:21:15', 'Bhagesh Biradar.', 'near GR Mart', NULL, 100, 100, NULL, NULL),
('ER-1762943238043-84533', 'New_Alert', '', 13.0561963, 77.5770275, '2025-11-12 10:27:18', NULL, '2025-11-12 10:27:18', '2025-11-12 10:27:18', 'Bhagesh Biradar.', 'near gr mart', NULL, 100, 100, NULL, NULL),
('ER-1762943445406-33327', 'New_Alert', '', 13.0561963, 77.5770275, '2025-11-12 10:30:45', NULL, '2025-11-12 10:30:45', '2025-11-12 10:30:45', 'Bhagesh Biradar.', '', NULL, 100, 100, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `employees`
--

CREATE TABLE `employees` (
  `id` int(11) NOT NULL,
  `employeeId` varchar(50) NOT NULL,
  `firstName` varchar(100) NOT NULL,
  `lastName` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `departmentId` int(11) DEFAULT NULL,
  `position` varchar(100) DEFAULT NULL,
  `role` enum('staff','doctor','admin','ROLE_DISPATCHER','ROLE_PARAMEDIC','ROLE_ER_STAFF') DEFAULT 'staff',
  `status` enum('active','inactive','on_leave') DEFAULT 'active',
  `hireDate` date DEFAULT NULL,
  `salary` decimal(10,2) DEFAULT NULL,
  `profileImageUrl` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `employees`
--

INSERT INTO `employees` (`id`, `employeeId`, `firstName`, `lastName`, `email`, `password`, `phone`, `departmentId`, `position`, `role`, `status`, `hireDate`, `salary`, `profileImageUrl`) VALUES
(1, 'EMP001', 'Dr. Sarah', 'Johnson', 'sarah.j@hospital.com', NULL, '555-0101', 1, 'Chief Emergency Physician', 'doctor', 'active', '2020-01-15', 150000.00, NULL),
(2, 'EMP002', 'Dr. Michael', 'Chen', 'michael.c@hospital.com', NULL, '555-0102', 2, 'Cardiologist', 'doctor', 'active', '2019-03-20', 180000.00, NULL),
(3, 'EMP003', 'Admin', 'User', 'admin@hospital.com', '$2b$10$CJw5CCOKWCimEFN2jNh6Zumhm2cdlCFUkBmLRcfZc8U1j.taO3mI2', '555-0103', NULL, 'Administrator', 'admin', 'active', '2023-01-01', 70000.00, '/uploads/profilePhoto-1762203389968-620913514.jpg'),
(4, 'EMP2520', 'b', 'b', 'bhagesh2@gmail.com', '$2b$10$Hox1OIL2h2ln7lDUFarL4ezEFPzjVVRAtouB6PewYTdDTT5hzmnVq', '7483159830', 2, 'surgen', 'doctor', 'active', '2025-11-01', 50000.00, '/uploads/profilePhoto-1762203467826-857676115.jpg'),
(5, 'EMP6401', 'Bhagesh', 'Biradar.', 'bhageshbiradar820@gmail.com', '$2b$10$0AyyaC43cFCHr.Jrgg0qDu7E/OClpZBV6VV66HHjKpxbm7mzVGg/G', '07483159830', 1, 'surgon', 'doctor', 'active', '2025-11-06', 40000.00, '/uploads/profilePhoto-1762740944744-306302942.jpg'),
(6, 'EMP9059', 'Bhagesh', 'Biradar', 'bhageshbiradar7@gmail.com', '$2b$10$p0acemN5xO/KfnB1h3G6juxD./AwjNHZH73KGqyaH93P/inO9gx8S', '+917483159830', 4, 'surgon', 'doctor', 'active', '2025-11-08', 50000.00, NULL),
(7, 'EMP3456', 'Pradeep', 'Ishwar', 'bhagesh@gmail.com', '$2b$10$MWOTrsb5vz8MEGOS6KWcXuM3D5bn/nCwXSLUTCIOqu6Q/QvwfKYEa', '+917483159830', 1, 'surgon', 'ROLE_DISPATCHER', 'active', '2025-11-10', 40000.00, NULL),
(8, 'EMP5224', 'ram', 'a', 'bhagesh1@gmail.com', '$2b$10$WeRXZhhVjy/WNrvRbXHkfeb3s086N3kAekoAju8yFTbs7SGtCmmDy', '+917483159830', 1, 'cashier', 'ROLE_PARAMEDIC', 'active', '2025-11-10', 40000.00, NULL),
(10, 'EMP8525', 'Bhagesh', 'Biradar.', 'bhagesh11@gmail.com', '$2b$10$P3.qSHiHYlZB6hDX3YkUzuzew8fM3NT2nuNJB.KBXb6bROa35pbsS', '+917483159830', 1, 'surgon', 'ROLE_PARAMEDIC', 'active', '2025-11-12', 40000.00, NULL),
(11, 'EMP9253', 'shree', 'unnad', 'bhageshbiradar1@gmail.com', '$2b$10$d66DN7wq22JVoeIB.Ej.1eIdZYBj3IcnnCGth5vC2qpAk/OjV.Jsu', '07483159830', 1, 'surgon', 'ROLE_ER_STAFF', 'active', '2025-11-12', 40000.00, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `immunizations`
--

CREATE TABLE `immunizations` (
  `id` int(11) NOT NULL,
  `patientId` int(11) NOT NULL,
  `vaccineName` varchar(255) NOT NULL,
  `vaccinationDate` date NOT NULL,
  `doseNumber` int(11) DEFAULT 1,
  `administeredByDoctorId` int(11) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `nextDueDate` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `immunizations`
--

INSERT INTO `immunizations` (`id`, `patientId`, `vaccineName`, `vaccinationDate`, `doseNumber`, `administeredByDoctorId`, `notes`, `nextDueDate`) VALUES
(1, 28, 'Covid ', '2025-11-08', 1, 6, NULL, '2025-11-08');

-- --------------------------------------------------------

--
-- Table structure for table `lab_tests`
--

CREATE TABLE `lab_tests` (
  `id` int(11) NOT NULL,
  `testNumber` varchar(50) NOT NULL,
  `patientId` int(11) NOT NULL,
  `doctorId` int(11) NOT NULL,
  `testName` varchar(255) NOT NULL,
  `testDate` date NOT NULL,
  `status` varchar(50) DEFAULT 'pending',
  `result_text` text DEFAULT NULL,
  `result_file_url` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `lab_tests`
--

INSERT INTO `lab_tests` (`id`, `testNumber`, `patientId`, `doctorId`, `testName`, `testDate`, `status`, `result_text`, `result_file_url`) VALUES
(1, 'LAB-001', 1, 1, 'Complete Blood Count', '2025-10-01', 'completed', NULL, NULL),
(2, 'LAB-002', 2, 1, 'Lipid Panel', '2025-10-01', 'pending', NULL, NULL),
(3, 'LAB2446', 7, 1, 'CT scan', '2025-11-04', 'completed', 'Disc bulg', NULL),
(4, 'LAB5890', 7, 1, 'MRI', '2025-11-04', 'completed', 'disc bulg', NULL),
(5, 'LAB3362', 7, 1, 'blood', '2025-11-05', 'completed', 'thjnbvffdfrtghn', NULL),
(6, 'LAB8184', 7, 1, 'CT scan', '2025-11-04', 'pending', NULL, NULL),
(7, 'LAB5261', 28, 1, 'CT scan', '2025-11-06', 'completed', 'wsedfrg', NULL),
(8, 'LAB9383', 28, 1, 'CT scan', '2025-11-06', 'pending', NULL, NULL),
(9, 'LAB4372', 28, 1, 'MRI', '2025-11-09', 'pending', NULL, NULL),
(10, 'LAB2590', 98, 1, 'CT scan', '2025-11-10', 'completed', 'tredsfghjkh', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `medical_equipment`
--

CREATE TABLE `medical_equipment` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `quantity` int(11) NOT NULL,
  `status` varchar(50) DEFAULT 'available'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `medical_equipment`
--

INSERT INTO `medical_equipment` (`id`, `name`, `quantity`, `status`) VALUES
(1, 'Ventilator', 20, 'available'),
(2, 'X-Ray Machine', 5, 'in-use'),
(3, 'Ultrasound Machine', 10, 'available'),
(4, 'Defibrillator', 30, 'available');

-- --------------------------------------------------------

--
-- Table structure for table `medical_records`
--

CREATE TABLE `medical_records` (
  `id` int(11) NOT NULL,
  `patientId` int(11) NOT NULL,
  `doctorId` int(11) NOT NULL,
  `recordDate` date NOT NULL,
  `diagnosis` varchar(255) NOT NULL,
  `treatment` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `medical_records`
--

INSERT INTO `medical_records` (`id`, `patientId`, `doctorId`, `recordDate`, `diagnosis`, `treatment`) VALUES
(1, 1, 1, '2025-09-28', 'Hypertension', 'Prescribed Lisinopril.'),
(2, 5, 4, '2025-11-01', 'Virtual Consultation E-Prescription', 'Issued during virtual consult: ID 1'),
(3, 7, 4, '2025-11-04', 'Disc Bulge in C2 and D4', 'surgery'),
(4, 7, 4, '2025-11-04', 'Disc Bulge in C2 and D4', 'surgery'),
(5, 7, 4, '2025-11-04', 'Disc Bulge in C2 and D4', 'Surgery'),
(6, 7, 4, '2025-11-06', 'Abnormal Heart Beat', 'qwsd'),
(7, 7, 4, '2025-11-07', 'Abnormal Heart Beat', 'aaa'),
(9, 28, 5, '2025-11-06', 'Disc Bulge in C2 and D4', 'edrftgh'),
(10, 28, 5, '2025-11-06', 'Disc Bulge in C2 and D4', 'qwer'),
(11, 98, 6, '2025-11-10', 'Disc Bulge in C2 and D4', 'sdfgh');

-- --------------------------------------------------------

--
-- Table structure for table `medication_adherence`
--

CREATE TABLE `medication_adherence` (
  `id` int(11) NOT NULL,
  `patientId` int(11) NOT NULL,
  `prescriptionId` int(11) NOT NULL,
  `doseTime` datetime NOT NULL,
  `status` enum('taken','skipped','scheduled') NOT NULL DEFAULT 'scheduled',
  `recordedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `medication_adherence`
--

INSERT INTO `medication_adherence` (`id`, `patientId`, `prescriptionId`, `doseTime`, `status`, `recordedAt`) VALUES
(1, 7, 2, '2025-11-03 04:30:00', 'taken', '2025-11-03 19:27:17'),
(2, 7, 3, '2025-11-03 04:30:00', 'skipped', '2025-11-03 19:27:20'),
(3, 7, 4, '2025-11-03 04:30:00', 'taken', '2025-11-03 19:45:21'),
(4, 7, 4, '2025-11-03 04:30:00', 'taken', '2025-11-03 20:51:41'),
(5, 7, 5, '2025-11-03 04:30:00', 'skipped', '2025-11-03 20:51:42');

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `id` int(11) NOT NULL,
  `senderId` int(11) NOT NULL,
  `senderType` enum('patient','employee') NOT NULL,
  `receiverId` int(11) NOT NULL,
  `receiverType` enum('patient','employee') NOT NULL,
  `message` text NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  `read` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `messages`
--

INSERT INTO `messages` (`id`, `senderId`, `senderType`, `receiverId`, `receiverType`, `message`, `timestamp`, `read`) VALUES
(1, 4, 'employee', 0, 'patient', 'hi', '2025-11-01 11:49:55', 0);

-- --------------------------------------------------------

--
-- Table structure for table `paramedicdevicetokens`
--

CREATE TABLE `paramedicdevicetokens` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `device_token` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `password_resets`
--

CREATE TABLE `password_resets` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `expires` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `password_resets`
--

INSERT INTO `password_resets` (`email`, `token`, `expires`) VALUES
('bhageshbiradar820@gmail.com', 'd64216f32ffae4736d199d513ddeeebb53a9e975', 1762447183886),
('shrikantbiradar69@gmail.com', 'b436aea935cf534e10d83b4b0c1f137a24a4af7f', 1762616898268);

-- --------------------------------------------------------

--
-- Table structure for table `patients`
--

CREATE TABLE `patients` (
  `id` int(11) NOT NULL,
  `patientId` varchar(50) NOT NULL,
  `firstName` varchar(100) NOT NULL,
  `lastName` varchar(100) NOT NULL,
  `dateOfBirth` date DEFAULT NULL,
  `gender` varchar(10) DEFAULT NULL,
  `bloodGroup` varchar(5) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `emergencyContact` varchar(200) DEFAULT NULL,
  `emergencyPhone` varchar(20) DEFAULT NULL,
  `status` enum('active','discharged','transferred') DEFAULT 'active',
  `profileImageUrl` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `patients`
--

INSERT INTO `patients` (`id`, `patientId`, `firstName`, `lastName`, `dateOfBirth`, `gender`, `bloodGroup`, `phone`, `email`, `address`, `emergencyContact`, `emergencyPhone`, `status`, `profileImageUrl`) VALUES
(1, 'PAT001', 'John', 'Doe', '1985-05-15', 'Male', 'O+', '555-1001', 'john.doe@email.com', '123 Main St, City', 'Jane Doe', '555-1002', 'active', NULL),
(2, 'PAT002', 'Emma', 'Wilson', '1990-08-22', 'Female', 'A+', '555-1003', 'emma.w@email.com', '456 Oak Ave, City', 'Tom Wilson', '555-1004', 'active', NULL),
(3, 'PAT003', 'James', 'Brown', '1978-11-30', 'Male', 'B+', '555-1005', 'james.b@email.com', '789 Pine St, City', 'Susan Brown', '555-1006', 'active', NULL),
(4, 'PAT1498', 'Bhagesh', 'Biradar.', NULL, NULL, NULL, NULL, 'bhagesh@gmail.com', NULL, NULL, NULL, 'active', NULL),
(5, 'PAT3644', 'Bhagesh', 'B', NULL, NULL, NULL, NULL, 'bhagesh1@gmail.com', NULL, NULL, NULL, 'active', '/uploads/profilePhoto-1761998109058-143418986.jpg'),
(7, 'PAT6853', 'Bhagesh', 'Biradar.', NULL, NULL, NULL, '+917483159830', 'bhagesh11@gmail.com', NULL, NULL, NULL, 'active', '/uploads/profilePhoto-1762203116075-947610701.jpg'),
(8, 'PAT7178', 'B', 'B', NULL, NULL, NULL, NULL, 'bhagesh3@gmail.com', NULL, NULL, NULL, 'active', NULL),
(11, 'PAT5107', 'Bhagesh', 'Bbb', NULL, NULL, NULL, NULL, 'bhagesh22@gmail.com', NULL, NULL, NULL, 'active', NULL),
(12, 'PAT5647', 'Siddeshwar ', 'Shinde ', NULL, NULL, NULL, '+917483159830', 'shindesiddeshwar74@gmail.com', NULL, NULL, NULL, 'active', '/uploads/profilePhoto-1762274102307-163863191.jpg'),
(13, 'PAT2601', 'bhagesh', '123er', NULL, '', '', 'sdfgh', 'sdfvghn@gmail.com', '', '', '', 'active', NULL),
(15, 'PAT5075', 'Bhagesh', 'Biradar.1', NULL, NULL, NULL, NULL, 'bhageshbiradar789@gmail.com', NULL, NULL, NULL, 'active', NULL),
(17, 'PAT5170', 'Bhagesh', 'Biradar.', NULL, NULL, NULL, NULL, 'bhageshbiradar123456789@gmail.com', NULL, NULL, NULL, 'active', NULL),
(28, 'PAT2609', 'Bhagesh', 'Biradar.', NULL, NULL, NULL, '+917483159830', 'bhageshbiradar820@gmail.com', NULL, NULL, NULL, 'discharged', NULL),
(41, 'PAT-1762582175320-40', 'Ramesh', 'Biradar', NULL, '', '', '7483159830', 'ramesh@gmail.com', '', '', '', 'active', NULL),
(50, 'PAT-1762582580551-584', 'sdfghj', 'sdfgh', NULL, '', '', '1234567890', 'sdfghj@gmail.com', '', '', '', 'active', NULL),
(51, 'PAT-1762582611819-929', 'asdfgh', 'asdfg', NULL, '', '', '7483159830', 'sdfgdf@gmail.com', '', '', '', 'active', NULL),
(56, 'PAT-1762585626446-61', 'Bhagesh', 'Biradar1', NULL, '', '', '7483159830', 'bhageshbiradar8201@gmail.com', '', '', '', 'active', NULL),
(58, 'PAT-1762585729349-331', 'Bhagesh', 'Biradar.', NULL, '', '', '7483159830', 'bhagesh11123@gmail.com', '', '', '', 'active', NULL),
(59, 'PAT-1762586165805-754', 'Bhagesh', 'Biradar.', NULL, '', '', '+917483159830', 'bha@gmail.com', '', '', '', 'active', NULL),
(74, 'PAT1762618976259620', 'Vasudev ', 'R', NULL, NULL, NULL, '+917483159830', 'vasudevramoji7@gmail.com', NULL, NULL, NULL, 'active', NULL),
(94, 'PAT1762628182054188', 'bhagesh', 'bbb', NULL, NULL, NULL, '+917483159830', 'bhageshbiradar7@gmail.com', NULL, NULL, NULL, 'active', '/uploads/profilePhoto-1762741236412-987510984.jpg'),
(95, 'PAT1762656226634206', 'Vasudev', 'R', NULL, NULL, NULL, '+917349130820', 'vasudevramoji@gmail.com', NULL, NULL, NULL, 'active', NULL),
(96, 'PAT1762695397762379', 'Sagar', 'Shinde', NULL, NULL, NULL, '+917483159830', 'sagarshinded45@gmail.com', NULL, NULL, NULL, 'active', NULL),
(97, 'PAT1762749390383328', 'Manjunath', 'Khot', NULL, NULL, NULL, '+917483159830', '7410khot@gmail.com', NULL, NULL, NULL, 'active', NULL),
(98, 'PAT1762749428465798', 'Hemanth ', 'Gowda ss', NULL, NULL, NULL, '+917483159830', 'hemanthgowdass14@gmail.com', NULL, NULL, NULL, 'active', NULL),
(99, 'PAT1762749541889318', 'Pradeep ', 'Hongal', NULL, NULL, NULL, '+917483159830', 'pradeephongal17@gmail.com', NULL, NULL, NULL, 'active', NULL),
(100, 'PAT1762942513432388', 'Bhagesh', 'Biradar.', NULL, NULL, NULL, '+917483159830', 'bhagesh.23cd004@iceas.ac.in', NULL, NULL, NULL, 'active', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `patients_auth`
--

CREATE TABLE `patients_auth` (
  `id` int(11) NOT NULL,
  `patientId` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `verificationToken` varchar(255) DEFAULT NULL,
  `isVerified` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `patients_auth`
--

INSERT INTO `patients_auth` (`id`, `patientId`, `email`, `password`, `verificationToken`, `isVerified`) VALUES
(1, 4, 'bhagesh@gmail.com', '$2b$10$j9ySvZOMQ/YAGfXZ5s2h6.cyf2c/GP1kVx9xfSQa0fx6DVGJDTatu', NULL, 0),
(2, 5, 'bhagesh1@gmail.com', '$2b$10$E9jafC0BC8W6/bj5lFf.0.5DAnVFTOq/tnEHyzsiMOnnW/g9EoOQO', NULL, 0),
(3, 7, 'bhagesh11@gmail.com', '$2b$10$VstsZTOfgZ3w5lgkUM/5oeELw48CQs34Pt9M19F2BbXMsjZkTtMra', NULL, 0),
(4, 8, 'bhagesh3@gmail.com', '$2b$10$4NHjyNeXjrWND3WzptplJu/i/6fFHoe94HZdUueoWDqqvN9xjmCAy', NULL, 0),
(5, 11, 'bhagesh22@gmail.com', '$2b$10$tKPe5vanuV3eMoQQBVXOaukXp3pE52eBYJhwutYFhPJoWKFUclSl.', NULL, 0),
(6, 12, 'shindesiddeshwar74@gmail.com', '$2b$10$GQvWXA63HU/iVx23yuXvXu2n9VaHXD1GUBvRIGdlxMha65JD10ZLO', NULL, 0),
(8, 15, 'bhageshbiradar789@gmail.com', '$2b$10$MKqWuFuS5kQ5A0RrwADEYugEfrm7g6KE63Dhhg5Jj7VHXZIl6Oi0W', NULL, 0),
(9, 17, 'bhageshbiradar123456789@gmail.com', '$2b$10$GzuO7jKN7UVaAY9ekOoy3OrD5eqydVwkrYGNJ9u8R1u5Atcx9Dgym', NULL, 0),
(13, 28, 'bhageshbiradar820@gmail.com', '$2b$10$QDidRN5Cefufeo6dSt7p3uPyCoYZH75YytJM/tI9Q6PJvZ7dkxhI.', NULL, 1),
(20, 74, 'vasudevramoji7@gmail.com', '$2b$10$MMpWNPZnQjJDMSZPZmITd.8X1xtAJETvITrRDOEiiLrubKl.v/Fiy', 'fa0a0824424f7e0d56bc92208f96061b06689f27', 0),
(39, 94, 'bhageshbiradar7@gmail.com', '$2b$10$E7y2.owjM53dEsgNNgxc6OpDs21SHsQUyjFwershr70KipnTB3aiW', NULL, 1),
(40, 95, 'vasudevramoji@gmail.com', '$2b$10$K/T3oq3f1cdewP47PoUDNe2b0N/gt6//g68Xf93.w9cDjYrav3p0y', NULL, 1),
(41, 96, 'sagarshinded45@gmail.com', '$2b$10$iRE0o0wUmoi8mpOdIY0CEe1F7LfcYrnWpJadXA283TgP9df3KEwNu', NULL, 1),
(42, 97, '7410khot@gmail.com', '$2b$10$wDkIba4NXbKV164tjsKd3ejEE4iMVcBIaagA0Pfm7HSrLoCQe5pZm', NULL, 1),
(43, 98, 'hemanthgowdass14@gmail.com', '$2b$10$e.ecaZwIDe2vXuXz8YSteeR9hvgzn2PqMNlx2Q4xsAkDLo7rCOBsK', NULL, 1),
(44, 99, 'pradeephongal17@gmail.com', '$2b$10$zygdsQVwr9tV39yzR8q7xuUdkDwS23L86zdS0DF.u0mk1BLn/L88G', NULL, 1),
(45, 100, 'bhagesh.23cd004@iceas.ac.in', '$2b$10$Qi6fGFaWa5QMIXyF3bs0v.7WFrA8wikQ0ow.Vo9EWogF/HlsVOsUC', NULL, 1);

-- --------------------------------------------------------

--
-- Table structure for table `patient_bills`
--

CREATE TABLE `patient_bills` (
  `id` int(11) NOT NULL,
  `billNumber` varchar(50) NOT NULL,
  `patientId` int(11) NOT NULL,
  `billDate` datetime NOT NULL,
  `dueDate` date NOT NULL,
  `totalAmount` decimal(10,2) NOT NULL,
  `amountPaid` decimal(10,2) DEFAULT 0.00,
  `balanceDue` decimal(10,2) NOT NULL,
  `status` enum('pending','paid','partial','overdue') DEFAULT 'pending',
  `notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `patient_bills`
--

INSERT INTO `patient_bills` (`id`, `billNumber`, `patientId`, `billDate`, `dueDate`, `totalAmount`, `amountPaid`, `balanceDue`, `status`, `notes`) VALUES
(1, 'BILL-1762272821647-348', 11, '2025-11-04 16:13:41', '2025-11-04', 200.00, 200.00, 0.00, 'paid', NULL),
(3, 'BILL-1762758848262-889', 98, '2025-11-10 07:14:08', '2025-11-10', 123.00, 123.00, 0.00, 'paid', 'sdfgh'),
(4, 'BILL-1762759142261-557', 98, '2025-11-10 07:19:02', '2025-11-10', -0.01, 0.00, -0.01, 'pending', 'erty');

-- --------------------------------------------------------

--
-- Table structure for table `payroll_records`
--

CREATE TABLE `payroll_records` (
  `id` int(11) NOT NULL,
  `employeeId` int(11) NOT NULL,
  `payPeriodStart` date NOT NULL,
  `payPeriodEnd` date NOT NULL,
  `basicSalary` decimal(10,2) NOT NULL,
  `allowances` decimal(10,2) DEFAULT NULL,
  `deductions` decimal(10,2) DEFAULT NULL,
  `netSalary` decimal(10,2) DEFAULT NULL,
  `paymentDate` date DEFAULT NULL,
  `status` varchar(50) DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payroll_records`
--

INSERT INTO `payroll_records` (`id`, `employeeId`, `payPeriodStart`, `payPeriodEnd`, `basicSalary`, `allowances`, `deductions`, `netSalary`, `paymentDate`, `status`) VALUES
(1, 1, '2025-09-01', '2025-09-30', 0.00, NULL, NULL, NULL, NULL, 'pending');

-- --------------------------------------------------------

--
-- Table structure for table `pharmaceuticals`
--

CREATE TABLE `pharmaceuticals` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `categoryId` int(11) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `dosageForm` varchar(50) DEFAULT NULL,
  `strength` varchar(50) DEFAULT NULL,
  `unitPrice` decimal(10,2) NOT NULL,
  `stockQuantity` int(11) NOT NULL,
  `reorderLevel` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `pharmaceuticals`
--

INSERT INTO `pharmaceuticals` (`id`, `name`, `categoryId`, `description`, `dosageForm`, `strength`, `unitPrice`, `stockQuantity`, `reorderLevel`) VALUES
(1, 'Amoxicillin', 1, 'Broad-spectrum antibiotic', 'Capsule', '500mg', 15.99, 0, 100),
(2, 'Ibuprofen', 2, 'Pain and inflammation relief', 'Tablet', '200mg', 8.99, 0, 200),
(3, 'Amoxicillin', 1, '', '', '500mg', 0.00, 12345, 0),
(4, 'Amoxicillin', 1, '', '', '500mg', 0.00, 1234, 0);

-- --------------------------------------------------------

--
-- Table structure for table `pharmaceutical_categories`
--

CREATE TABLE `pharmaceutical_categories` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `pharmaceutical_categories`
--

INSERT INTO `pharmaceutical_categories` (`id`, `name`, `description`) VALUES
(1, 'Antibiotics', 'Bacterial infection treatment'),
(2, 'Analgesics', 'Pain relief medications'),
(3, 'Cardiovascular', 'Heart and blood pressure medications'),
(4, 'Vitamins', 'Nutritional supplements');

-- --------------------------------------------------------

--
-- Table structure for table `prescriptions`
--

CREATE TABLE `prescriptions` (
  `id` int(11) NOT NULL,
  `prescriptionNumber` varchar(50) NOT NULL,
  `patientId` int(11) NOT NULL,
  `doctorId` int(11) NOT NULL,
  `prescriptionDate` date NOT NULL,
  `status` varchar(50) DEFAULT NULL,
  `medicationName` varchar(255) NOT NULL,
  `dosage` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `prescriptions`
--

INSERT INTO `prescriptions` (`id`, `prescriptionNumber`, `patientId`, `doctorId`, `prescriptionDate`, `status`, `medicationName`, `dosage`) VALUES
(1, 'PRES-1761997785668', 5, 4, '2025-11-01', 'active', '', NULL),
(2, 'PRES-1762180693473', 7, 4, '2025-11-04', 'active', '', NULL),
(3, 'PRES-1762197729720', 7, 4, '2025-11-04', 'active', '', NULL),
(4, 'PRES-1762199094326', 7, 4, '2025-11-04', 'filled', 'Zerodal Sp', '1'),
(5, 'PRES-1762199780269', 7, 4, '2025-11-06', 'canceled', 'sdcf', 'wsd'),
(6, 'PRES-1762200004350', 7, 4, '2025-11-07', 'canceled', 'asdf', '1'),
(7, 'PRES-1762404858431', 28, 5, '2025-11-06', 'canceled', 'Zerodal Sp', '1'),
(8, 'PRES-1762405320867', 28, 5, '2025-11-06', 'active', 'qw', '1'),
(9, 'PRES-1762758535560', 98, 6, '2025-11-10', 'canceled', 'Zerodal Sp', '1');

-- --------------------------------------------------------

--
-- Table structure for table `prescription_schedules`
--

CREATE TABLE `prescription_schedules` (
  `id` int(11) NOT NULL,
  `prescriptionId` int(11) NOT NULL,
  `scheduledTime` time NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `prescription_schedules`
--

INSERT INTO `prescription_schedules` (`id`, `prescriptionId`, `scheduledTime`) VALUES
(1, 4, '10:00:00'),
(2, 5, '10:00:00'),
(3, 6, '01:30:00'),
(4, 7, '10:00:00'),
(5, 8, '10:00:00'),
(6, 9, '20:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `surgery_records`
--

CREATE TABLE `surgery_records` (
  `id` int(11) NOT NULL,
  `surgeryNumber` varchar(50) NOT NULL,
  `patientId` int(11) NOT NULL,
  `surgeonId` int(11) NOT NULL,
  `surgeryType` varchar(255) NOT NULL,
  `surgeryDate` datetime NOT NULL,
  `notes` text DEFAULT NULL,
  `status` enum('scheduled','completed','canceled') DEFAULT 'scheduled'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `surgery_records`
--

INSERT INTO `surgery_records` (`id`, `surgeryNumber`, `patientId`, `surgeonId`, `surgeryType`, `surgeryDate`, `notes`, `status`) VALUES
(1, 'SURG-001', 2, 2, 'Appendectomy', '2025-10-10 09:00:00', NULL, 'canceled'),
(2, 'SURG-6172', 7, 4, 'disc ', '2025-11-05 20:08:00', 'qwerf', 'completed'),
(3, 'SURG-3406', 7, 4, 'Bypass surgery', '2025-11-04 02:28:00', 'sdfgh', 'scheduled'),
(4, 'SURG-1645', 28, 5, 'Bypass surgery', '2025-11-06 10:05:00', '', 'scheduled'),
(5, 'SURG-2667', 28, 5, 'Bypass surgery', '2025-11-06 10:32:00', '', 'completed'),
(6, 'SURG-2667', 98, 6, 'Bypass surgery', '2025-11-10 12:39:00', '', 'scheduled');

-- --------------------------------------------------------

--
-- Table structure for table `tripvitals`
--

CREATE TABLE `tripvitals` (
  `vitals_id` int(11) NOT NULL,
  `trip_id` varchar(50) NOT NULL,
  `timestamp` datetime NOT NULL,
  `heart_rate` int(11) DEFAULT NULL,
  `blood_pressure_systolic` int(11) DEFAULT NULL,
  `blood_pressure_diastolic` int(11) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tripvitals`
--

INSERT INTO `tripvitals` (`vitals_id`, `trip_id`, `timestamp`, `heart_rate`, `blood_pressure_systolic`, `blood_pressure_diastolic`, `notes`, `created_at`, `updated_at`) VALUES
(1, 'ER-1762926073021-32534', '2025-11-12 05:42:03', 80, 100, 120, 'sdfgh', '2025-11-12 05:42:03', '2025-11-12 05:42:03'),
(2, 'ER-1762926395499-25893', '2025-11-12 05:49:13', 90, 122, 13, 'sdfgh', '2025-11-12 05:49:13', '2025-11-12 05:49:13'),
(3, 'ER-1762927684065-34591', '2025-11-12 06:11:12', 345, 2345, 234, 'wesdfgh', '2025-11-12 06:11:12', '2025-11-12 06:11:12'),
(4, 'ER-1762928501191-12423', '2025-11-12 06:22:36', 2134, 2345, NULL, '234t', '2025-11-12 06:22:36', '2025-11-12 06:22:36'),
(5, 'ER-1762929813368-61173', '2025-11-12 06:44:04', 12345, 21345, 2343, 'asdfgh', '2025-11-12 06:44:04', '2025-11-12 06:44:04'),
(6, 'ER-1762931268364-17328', '2025-11-12 07:13:38', 234, 123, 34, '1234', '2025-11-12 07:13:38', '2025-11-12 07:13:38'),
(7, 'ER-1762932003961-32824', '2025-11-12 07:20:49', 123, 123, NULL, 'sdfgh', '2025-11-12 07:20:49', '2025-11-12 07:20:49'),
(8, 'ER-1762932262258-86128', '2025-11-12 07:25:13', 123, 1234, 12345, 'fghj', '2025-11-12 07:25:13', '2025-11-12 07:25:13');

-- --------------------------------------------------------

--
-- Table structure for table `vendors`
--

CREATE TABLE `vendors` (
  `id` int(11) NOT NULL,
  `vendorName` varchar(255) NOT NULL,
  `contactPerson` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `vendorType` varchar(100) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `vendors`
--

INSERT INTO `vendors` (`id`, `vendorName`, `contactPerson`, `email`, `phone`, `address`, `vendorType`, `status`) VALUES
(1, 'Medical Supplies Co.', 'John Smith', 'contact@medsupplies.com', '555-9090', '789 Supply Rd', 'Supplies', 'active'),
(2, 'PharmaCorp', 'Jane Doe', 'jane@pharmacorp.com', '555-9091', '321 Pharma Ave', 'Pharmaceuticals', 'active');

-- --------------------------------------------------------

--
-- Table structure for table `virtual_consultation_rooms`
--

CREATE TABLE `virtual_consultation_rooms` (
  `id` int(11) NOT NULL,
  `appointmentId` int(11) NOT NULL,
  `roomUrl` varchar(255) NOT NULL,
  `startTime` datetime NOT NULL,
  `endTime` datetime NOT NULL,
  `status` enum('scheduled','active','completed','canceled') DEFAULT 'scheduled'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `virtual_consultation_rooms`
--

INSERT INTO `virtual_consultation_rooms` (`id`, `appointmentId`, `roomUrl`, `startTime`, `endTime`, `status`) VALUES
(21, 53, 'https://meet.jit.si/HMSConsultation-53-1762743403441', '2025-11-10 03:30:00', '2025-11-10 04:00:00', 'scheduled'),
(22, 54, 'https://meet.jit.si/HMSConsultation-54-1762743405863', '2025-11-10 03:30:00', '2025-11-10 04:00:00', 'scheduled'),
(23, 55, 'https://meet.jit.si/HMSConsultation-55-1762743892621', '2025-11-11 03:30:00', '2025-11-11 04:00:00', 'scheduled'),
(24, 56, 'https://meet.jit.si/HMSConsultation-56-1762749594472', '2025-11-11 03:30:00', '2025-11-11 04:00:00', 'scheduled'),
(25, 57, 'https://meet.jit.si/HMSConsultation-57-1762749621920', '2025-11-11 04:00:00', '2025-11-11 04:30:00', 'scheduled'),
(26, 59, 'https://meet.jit.si/HMSConsultation-59-1762757912731', '2025-11-10 08:30:00', '2025-11-10 09:00:00', 'scheduled'),
(27, 61, 'https://meet.jit.si/HMSConsultation-61-1762759479145', '2025-11-10 09:30:00', '2025-11-10 10:00:00', 'scheduled');

-- --------------------------------------------------------

--
-- Table structure for table `wards`
--

CREATE TABLE `wards` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `departmentId` int(11) DEFAULT NULL,
  `floorNumber` int(11) DEFAULT NULL,
  `capacity` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `wards`
--

INSERT INTO `wards` (`id`, `name`, `departmentId`, `floorNumber`, `capacity`) VALUES
(1, 'ICU Ward', 1, 2, 20),
(2, 'General Ward A', 1, 3, 50),
(3, 'Cardiac Ward', 2, 4, 10);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `accounts_payable`
--
ALTER TABLE `accounts_payable`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `accounts_receivable`
--
ALTER TABLE `accounts_receivable`
  ADD PRIMARY KEY (`id`),
  ADD KEY `patientId_ar` (`patientId`);

--
-- Indexes for table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `admissions`
--
ALTER TABLE `admissions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `patientId_adm` (`patientId`),
  ADD KEY `wardId_adm` (`wardId`),
  ADD KEY `bedId_adm` (`bedId`);

--
-- Indexes for table `ambulancecrews`
--
ALTER TABLE `ambulancecrews`
  ADD PRIMARY KEY (`shift_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `ambulance_id` (`ambulance_id`);

--
-- Indexes for table `ambulancelocationhistory`
--
ALTER TABLE `ambulancelocationhistory`
  ADD PRIMARY KEY (`location_id`),
  ADD KEY `ambulance_id` (`ambulance_id`);

--
-- Indexes for table `ambulances`
--
ALTER TABLE `ambulances`
  ADD PRIMARY KEY (`ambulance_id`),
  ADD UNIQUE KEY `license_plate` (`license_plate`),
  ADD KEY `fk_current_trip` (`current_trip_id`);

--
-- Indexes for table `appointments`
--
ALTER TABLE `appointments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `patientId_appt` (`patientId`),
  ADD KEY `doctorId_appt` (`doctorId`);

--
-- Indexes for table `beds`
--
ALTER TABLE `beds`
  ADD PRIMARY KEY (`id`),
  ADD KEY `wardId` (`wardId`),
  ADD KEY `patientId_bed` (`patientId`);

--
-- Indexes for table `bill_items`
--
ALTER TABLE `bill_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `billId_bi` (`billId`);

--
-- Indexes for table `departments`
--
ALTER TABLE `departments`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `doctors`
--
ALTER TABLE `doctors`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `doctor_schedules`
--
ALTER TABLE `doctor_schedules`
  ADD PRIMARY KEY (`id`),
  ADD KEY `doctorId` (`doctorId`);

--
-- Indexes for table `emergencytrips`
--
ALTER TABLE `emergencytrips`
  ADD PRIMARY KEY (`trip_id`),
  ADD KEY `assigned_ambulance_id` (`assigned_ambulance_id`),
  ADD KEY `fk_trip_patient` (`patient_id`),
  ADD KEY `fk_trip_booked_by_patient` (`booked_by_patient_id`);

--
-- Indexes for table `employees`
--
ALTER TABLE `employees`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `employeeId` (`employeeId`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `departmentId` (`departmentId`);

--
-- Indexes for table `immunizations`
--
ALTER TABLE `immunizations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `patientId_imm` (`patientId`),
  ADD KEY `administeredByDoctorId_imm` (`administeredByDoctorId`);

--
-- Indexes for table `lab_tests`
--
ALTER TABLE `lab_tests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `patientId_lab` (`patientId`),
  ADD KEY `doctorId_lab` (`doctorId`);

--
-- Indexes for table `medical_equipment`
--
ALTER TABLE `medical_equipment`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `medical_records`
--
ALTER TABLE `medical_records`
  ADD PRIMARY KEY (`id`),
  ADD KEY `patientId_mr` (`patientId`),
  ADD KEY `doctorId_mr` (`doctorId`);

--
-- Indexes for table `medication_adherence`
--
ALTER TABLE `medication_adherence`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `patientId_prescriptionId_doseTime` (`patientId`,`prescriptionId`,`doseTime`),
  ADD KEY `prescriptionId` (`prescriptionId`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `paramedicdevicetokens`
--
ALTER TABLE `paramedicdevicetokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `device_token` (`device_token`),
  ADD KEY `employee_id` (`employee_id`);

--
-- Indexes for table `password_resets`
--
ALTER TABLE `password_resets`
  ADD PRIMARY KEY (`email`);

--
-- Indexes for table `patients`
--
ALTER TABLE `patients`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `patientId` (`patientId`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `patients_auth`
--
ALTER TABLE `patients_auth`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `patientId_auth` (`patientId`);

--
-- Indexes for table `patient_bills`
--
ALTER TABLE `patient_bills`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `billNumber` (`billNumber`),
  ADD KEY `patientId_bill` (`patientId`);

--
-- Indexes for table `payroll_records`
--
ALTER TABLE `payroll_records`
  ADD PRIMARY KEY (`id`),
  ADD KEY `employeeId` (`employeeId`);

--
-- Indexes for table `pharmaceuticals`
--
ALTER TABLE `pharmaceuticals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `categoryId` (`categoryId`);

--
-- Indexes for table `pharmaceutical_categories`
--
ALTER TABLE `pharmaceutical_categories`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `prescriptions`
--
ALTER TABLE `prescriptions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `patientId` (`patientId`);

--
-- Indexes for table `prescription_schedules`
--
ALTER TABLE `prescription_schedules`
  ADD PRIMARY KEY (`id`),
  ADD KEY `prescriptionId` (`prescriptionId`);

--
-- Indexes for table `surgery_records`
--
ALTER TABLE `surgery_records`
  ADD PRIMARY KEY (`id`),
  ADD KEY `patientId_surgery` (`patientId`);

--
-- Indexes for table `tripvitals`
--
ALTER TABLE `tripvitals`
  ADD PRIMARY KEY (`vitals_id`),
  ADD KEY `trip_id` (`trip_id`);

--
-- Indexes for table `vendors`
--
ALTER TABLE `vendors`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `virtual_consultation_rooms`
--
ALTER TABLE `virtual_consultation_rooms`
  ADD PRIMARY KEY (`id`),
  ADD KEY `appointmentId` (`appointmentId`);

--
-- Indexes for table `wards`
--
ALTER TABLE `wards`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ward_departmentId` (`departmentId`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `accounts_payable`
--
ALTER TABLE `accounts_payable`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `accounts_receivable`
--
ALTER TABLE `accounts_receivable`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `admins`
--
ALTER TABLE `admins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `admissions`
--
ALTER TABLE `admissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `ambulancecrews`
--
ALTER TABLE `ambulancecrews`
  MODIFY `shift_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `ambulancelocationhistory`
--
ALTER TABLE `ambulancelocationhistory`
  MODIFY `location_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `ambulances`
--
ALTER TABLE `ambulances`
  MODIFY `ambulance_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `appointments`
--
ALTER TABLE `appointments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=62;

--
-- AUTO_INCREMENT for table `beds`
--
ALTER TABLE `beds`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- AUTO_INCREMENT for table `bill_items`
--
ALTER TABLE `bill_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `departments`
--
ALTER TABLE `departments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `doctors`
--
ALTER TABLE `doctors`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `doctor_schedules`
--
ALTER TABLE `doctor_schedules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT for table `employees`
--
ALTER TABLE `employees`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `immunizations`
--
ALTER TABLE `immunizations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `lab_tests`
--
ALTER TABLE `lab_tests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `medical_equipment`
--
ALTER TABLE `medical_equipment`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `medical_records`
--
ALTER TABLE `medical_records`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `medication_adherence`
--
ALTER TABLE `medication_adherence`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `paramedicdevicetokens`
--
ALTER TABLE `paramedicdevicetokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `patients`
--
ALTER TABLE `patients`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=101;

--
-- AUTO_INCREMENT for table `patients_auth`
--
ALTER TABLE `patients_auth`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=46;

--
-- AUTO_INCREMENT for table `patient_bills`
--
ALTER TABLE `patient_bills`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `payroll_records`
--
ALTER TABLE `payroll_records`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `pharmaceuticals`
--
ALTER TABLE `pharmaceuticals`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `pharmaceutical_categories`
--
ALTER TABLE `pharmaceutical_categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `prescriptions`
--
ALTER TABLE `prescriptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `prescription_schedules`
--
ALTER TABLE `prescription_schedules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `surgery_records`
--
ALTER TABLE `surgery_records`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `tripvitals`
--
ALTER TABLE `tripvitals`
  MODIFY `vitals_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `vendors`
--
ALTER TABLE `vendors`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `virtual_consultation_rooms`
--
ALTER TABLE `virtual_consultation_rooms`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT for table `wards`
--
ALTER TABLE `wards`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `accounts_receivable`
--
ALTER TABLE `accounts_receivable`
  ADD CONSTRAINT `ar_ibfk_1` FOREIGN KEY (`patientId`) REFERENCES `patients` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `admissions`
--
ALTER TABLE `admissions`
  ADD CONSTRAINT `adm_ibfk_1` FOREIGN KEY (`patientId`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `adm_ibfk_2` FOREIGN KEY (`wardId`) REFERENCES `wards` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `adm_ibfk_3` FOREIGN KEY (`bedId`) REFERENCES `beds` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `ambulancecrews`
--
ALTER TABLE `ambulancecrews`
  ADD CONSTRAINT `ambulancecrews_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `ambulancecrews_ibfk_2` FOREIGN KEY (`ambulance_id`) REFERENCES `ambulances` (`ambulance_id`) ON DELETE CASCADE;

--
-- Constraints for table `ambulancelocationhistory`
--
ALTER TABLE `ambulancelocationhistory`
  ADD CONSTRAINT `ambulancelocationhistory_ibfk_1` FOREIGN KEY (`ambulance_id`) REFERENCES `ambulances` (`ambulance_id`) ON DELETE CASCADE;

--
-- Constraints for table `ambulances`
--
ALTER TABLE `ambulances`
  ADD CONSTRAINT `fk_current_trip` FOREIGN KEY (`current_trip_id`) REFERENCES `emergencytrips` (`trip_id`) ON DELETE SET NULL;

--
-- Constraints for table `appointments`
--
ALTER TABLE `appointments`
  ADD CONSTRAINT `appt_ibfk_1` FOREIGN KEY (`patientId`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `appt_ibfk_2` FOREIGN KEY (`doctorId`) REFERENCES `employees` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `beds`
--
ALTER TABLE `beds`
  ADD CONSTRAINT `beds_ibfk_1` FOREIGN KEY (`wardId`) REFERENCES `wards` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `beds_ibfk_2` FOREIGN KEY (`patientId`) REFERENCES `patients` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `bill_items`
--
ALTER TABLE `bill_items`
  ADD CONSTRAINT `bi_ibfk_1` FOREIGN KEY (`billId`) REFERENCES `patient_bills` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `doctor_schedules`
--
ALTER TABLE `doctor_schedules`
  ADD CONSTRAINT `ds_ibfk_1` FOREIGN KEY (`doctorId`) REFERENCES `employees` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `emergencytrips`
--
ALTER TABLE `emergencytrips`
  ADD CONSTRAINT `emergencytrips_ibfk_1` FOREIGN KEY (`assigned_ambulance_id`) REFERENCES `ambulances` (`ambulance_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_trip_booked_by_patient` FOREIGN KEY (`booked_by_patient_id`) REFERENCES `patients` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_trip_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `employees`
--
ALTER TABLE `employees`
  ADD CONSTRAINT `employees_ibfk_1` FOREIGN KEY (`departmentId`) REFERENCES `departments` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `immunizations`
--
ALTER TABLE `immunizations`
  ADD CONSTRAINT `imm_ibfk_1` FOREIGN KEY (`patientId`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `imm_ibfk_2` FOREIGN KEY (`administeredByDoctorId`) REFERENCES `employees` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `lab_tests`
--
ALTER TABLE `lab_tests`
  ADD CONSTRAINT `lt_ibfk_1` FOREIGN KEY (`patientId`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `lt_ibfk_2` FOREIGN KEY (`doctorId`) REFERENCES `employees` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `medical_records`
--
ALTER TABLE `medical_records`
  ADD CONSTRAINT `mr_ibfk_1` FOREIGN KEY (`patientId`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `mr_ibfk_2` FOREIGN KEY (`doctorId`) REFERENCES `employees` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `medication_adherence`
--
ALTER TABLE `medication_adherence`
  ADD CONSTRAINT `medication_adherence_ibfk_1` FOREIGN KEY (`patientId`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `medication_adherence_ibfk_2` FOREIGN KEY (`prescriptionId`) REFERENCES `prescriptions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `paramedicdevicetokens`
--
ALTER TABLE `paramedicdevicetokens`
  ADD CONSTRAINT `paramedicdevicetokens_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `patients_auth`
--
ALTER TABLE `patients_auth`
  ADD CONSTRAINT `pa_ibfk_1` FOREIGN KEY (`patientId`) REFERENCES `patients` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `patient_bills`
--
ALTER TABLE `patient_bills`
  ADD CONSTRAINT `pb_ibfk_1` FOREIGN KEY (`patientId`) REFERENCES `patients` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `payroll_records`
--
ALTER TABLE `payroll_records`
  ADD CONSTRAINT `pr_ibfk_1` FOREIGN KEY (`employeeId`) REFERENCES `employees` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `pharmaceuticals`
--
ALTER TABLE `pharmaceuticals`
  ADD CONSTRAINT `pharmaceuticals_ibfk_1` FOREIGN KEY (`categoryId`) REFERENCES `pharmaceutical_categories` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `prescriptions`
--
ALTER TABLE `prescriptions`
  ADD CONSTRAINT `p_ibfk_1` FOREIGN KEY (`patientId`) REFERENCES `patients` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `prescription_schedules`
--
ALTER TABLE `prescription_schedules`
  ADD CONSTRAINT `prescription_schedules_ibfk_1` FOREIGN KEY (`prescriptionId`) REFERENCES `prescriptions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `surgery_records`
--
ALTER TABLE `surgery_records`
  ADD CONSTRAINT `sr_ibfk_1` FOREIGN KEY (`patientId`) REFERENCES `patients` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tripvitals`
--
ALTER TABLE `tripvitals`
  ADD CONSTRAINT `tripvitals_ibfk_1` FOREIGN KEY (`trip_id`) REFERENCES `emergencytrips` (`trip_id`) ON DELETE CASCADE;

--
-- Constraints for table `virtual_consultation_rooms`
--
ALTER TABLE `virtual_consultation_rooms`
  ADD CONSTRAINT `vcr_ibfk_1` FOREIGN KEY (`appointmentId`) REFERENCES `appointments` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `wards`
--
ALTER TABLE `wards`
  ADD CONSTRAINT `wards_ibfk_1` FOREIGN KEY (`departmentId`) REFERENCES `departments` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;