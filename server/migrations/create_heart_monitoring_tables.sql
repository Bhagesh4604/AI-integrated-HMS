-- Table for Wearable Devices for Patients
CREATE TABLE IF NOT EXISTS `patient_health_devices` (
  `device_id` int(11) NOT NULL AUTO_INCREMENT,
  `patient_id` int(11) NOT NULL,
  `device_type` varchar(50) DEFAULT 'SmartWatch',
  `device_name` varchar(100) DEFAULT NULL,
  `mac_address` varchar(50) DEFAULT NULL,
  `status` enum('active', 'inactive', 'disconnected') DEFAULT 'active',
  `last_sync` datetime DEFAULT NULL,
  PRIMARY KEY (`device_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table for High-Frequency Vitals Log (Heart Rate, SpO2)
CREATE TABLE IF NOT EXISTS `patient_vitals_log` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `patient_id` int(11) NOT NULL,
  `device_id` int(11) DEFAULT NULL,
  `heart_rate` int(11) NOT NULL,
  `spo2` int(11) DEFAULT NULL,
  `timestamp` datetime DEFAULT CURRENT_TIMESTAMP,
  `risk_score` int(11) DEFAULT 0, -- 0-100 score calculated by AI/Algorithm
  PRIMARY KEY (`id`),
  INDEX `idx_patient_time` (`patient_id`, `timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table for Cardiac Alerts triggered by AI or Thresholds
CREATE TABLE IF NOT EXISTS `cardiac_risk_alerts` (
  `alert_id` int(11) NOT NULL AUTO_INCREMENT,
  `patient_id` int(11) NOT NULL,
  `alert_type` enum('Tachycardia', 'Bradycardia', 'Arrhythmia', 'Pre_Event_Warning', 'SpO2_Drop') NOT NULL,
  `severity` enum('Low', 'Medium', 'High', 'Critical') NOT NULL,
  `message` text NOT NULL,
  `timestamp` datetime DEFAULT CURRENT_TIMESTAMP,
  `is_resolved` tinyint(1) DEFAULT 0,
  `resolved_at` datetime DEFAULT NULL,
  PRIMARY KEY (`alert_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
