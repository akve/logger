CREATE TABLE `logger`.`logs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` VARCHAR(45) NULL,
  `session_id` VARCHAR(45) NULL,
  `status` VARCHAR(45) NULL,
  `start_at` DATETIME NULL,
  `end_at` DATETIME NULL,
  `data` TEXT NULL,
  `task_id` VARCHAR(45) NULL,

  PRIMARY KEY (`id`));

CREATE TABLE `logger`.`shots` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `session_id` VARCHAR(45) NULL,
  `shot_at` DATETIME NULL,
  `user_id` VARCHAR(45) NULL,
  `path` VARCHAR(255) NULL,
  `thumb_path` VARCHAR(255) NULL,
  `task_id` VARCHAR(45) NULL,

  PRIMARY KEY (`id`));

CREATE TABLE `requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` VARCHAR(45) NULL,
  `guid` varchar(45) DEFAULT NULL,
  `taskId` varchar(45) DEFAULT NULL,
  `isScreenshot` binary(1) DEFAULT NULL,
  `forceWorkingStatus` binary(1) DEFAULT NULL,
  `isStartLog` binary(1) DEFAULT NULL,
  `inactivityAlert` binary(1) DEFAULT NULL,
  `stats` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
