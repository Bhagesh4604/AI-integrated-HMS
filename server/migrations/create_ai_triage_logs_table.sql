-- Table for AI Triage Analysis Logs from Crash Image Analysis
CREATE TABLE IF NOT EXISTS `ai_triage_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `trip_id` varchar(50) NOT NULL,
  `ai_notes` text DEFAULT NULL,
  `recommended_specialist` varchar(255) DEFAULT NULL,
  `severity` enum('CRITICAL', 'HIGH', 'MEDIUM', 'LOW') DEFAULT 'MEDIUM',
  `injury_risk` enum('High', 'Medium', 'Low') DEFAULT 'Medium',
  `analysis_timestamp` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_trip_id` (`trip_id`),
  KEY `idx_analysis_timestamp` (`analysis_timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

