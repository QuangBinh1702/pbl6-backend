CREATE TABLE `staff_profile` (
	`id` BIGINT AUTO_INCREMENT,
	`user_id` CHAR(36) NOT NULL,
	`staff_number` VARCHAR(50) NOT NULL UNIQUE,
	`full_name` VARCHAR(255),
	`date_of_birth` DATE,
	`gender` VARCHAR(20),
	`email` VARCHAR(255),
	`phone` VARCHAR(255),
	`org_unit_id` BIGINT,
	`contact_address` TEXT,
	PRIMARY KEY(`id`)
);


CREATE INDEX `idx_student_student_number`
ON `staff_profile` (`student_number`);
CREATE TABLE `student_profile` (
	`id` BIGINT AUTO_INCREMENT,
	`user_id` CHAR(36) NOT NULL,
	`student_number` VARCHAR(50) NOT NULL UNIQUE,
	`full_name` VARCHAR(255),
	`date_of_birth` DATE,
	`gender` VARCHAR(20),
	`email` VARCHAR(255),
	`phone` VARCHAR(255),
	`enrollment_year` BIGINT,
	`class_id` BIGINT,
	`contact_address` TEXT,
	`isClassMonitor` BOOLEAN,
	PRIMARY KEY(`id`)
);


CREATE INDEX `idx_student_student_number`
ON `student_profile` (`student_number`);
CREATE TABLE `role` (
	`id` BIGINT AUTO_INCREMENT,
	`name` VARCHAR(255) NOT NULL UNIQUE,
	`description` TEXT,
	PRIMARY KEY(`id`)
);


CREATE TABLE `permission` (
	`id` BIGINT AUTO_INCREMENT,
	`resource` VARCHAR(255),
	`action` VARCHAR(255),
	`name` VARCHAR(255),
	`description` TEXT(65535),
	PRIMARY KEY(`id`)
);


CREATE TABLE `role_permission` (
	`id` BIGINT AUTO_INCREMENT,
	`role_id` BIGINT NOT NULL,
	`permission_id` BIGINT NOT NULL,
	PRIMARY KEY(`id`)
);


CREATE TABLE `user` (
	`id` CHAR(36),
	`username` VARCHAR(255) NOT NULL UNIQUE,
	`password_hash` VARCHAR(255) NOT NULL,
	`active` BOOLEAN NOT NULL DEFAULT true,
	PRIMARY KEY(`id`)
);


CREATE TABLE `user_role` (
	`id` BIGINT AUTO_INCREMENT,
	`user_id` CHAR(36) NOT NULL,
	`role_id` BIGINT NOT NULL,
	`org_unit_id` BIGINT,
	PRIMARY KEY(`id`)
);


CREATE TABLE `org_unit` (
	`id` BIGINT AUTO_INCREMENT,
	`name` VARCHAR(255) NOT NULL,
	`type` VARCHAR(100) NOT NULL,
	`leader_id` BIGINT,
	PRIMARY KEY(`id`)
);


CREATE INDEX `idx_org_unit_parent`
ON `org_unit` ();
CREATE INDEX `org_unit_index_1`
ON `org_unit` ();
CREATE TABLE `activity` (
	`id` BIGINT AUTO_INCREMENT,
	`org_unit_id` BIGINT,
	`field_id` BIGINT,
	`title` VARCHAR(255) NOT NULL,
	`description` TEXT,
	`location` VARCHAR(255),
	`start_time` TIMESTAMP,
	`end_time` TIMESTAMP,
	`start_time_updated` DATETIME,
	`end_time_updated` DATETIME,
	`capacity` INTEGER,
	`qr_code` VARCHAR(255),
	`registration_open` TIMESTAMP,
	`registration_close` TIMESTAMP,
	`requires_approval` BOOLEAN NOT NULL DEFAULT true,
	PRIMARY KEY(`id`)
);


CREATE INDEX `idx_activity_org_time`
ON `activity` (`org_unit_id`, `start_time`);
CREATE TABLE `activity_registration` (
	`id` BIGINT AUTO_INCREMENT,
	`activity_id` BIGINT NOT NULL,
	`student_id` CHAR(36) NOT NULL,
	`registered_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY(`id`)
);


CREATE INDEX `idx_registration_user`
ON `activity_registration` (`user_id`);
CREATE TABLE `attendance` (
	`id` BIGINT AUTO_INCREMENT,
	`student_id` BIGINT NOT NULL,
	`activity_id` BIGINT NOT NULL,
	`scanned_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`status` VARCHAR(50) NOT NULL DEFAULT 'present',
	`verified` BOOLEAN NOT NULL DEFAULT false,
	`verified_at` TIMESTAMP,
	`points` BIGINT,
	`feedback` VARCHAR(255),
	`feedback_time` DATETIME,
	PRIMARY KEY(`id`)
);


CREATE INDEX `idx_attendance_user_activity`
ON `attendance` (`user_id`, `activity_id`);
CREATE TABLE `evidence` (
	`id` BIGINT AUTO_INCREMENT,
	`student_id` BIGINT NOT NULL,
	`title` VARCHAR(255),
	`file_url` VARCHAR(500),
	`submitted_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`status` VARCHAR(50) NOT NULL DEFAULT 'pending',
	`verified_at` TIMESTAMP,
	`points` BIGINT,
	PRIMARY KEY(`id`)
);


CREATE TABLE `pvcd_record` (
	`student_id` BIGINT NOT NULL,
	`year` DATETIME NOT NULL,
	`total_point` DECIMAL(6,2) NOT NULL DEFAULT 0,
	PRIMARY KEY(`student_id`, `year`)
);


CREATE INDEX `idx_pvcd_user_term`
ON `pvcd_record` (`user_id`, `term_id`);
CREATE TABLE `field` (
	`id` BIGINT NOT NULL AUTO_INCREMENT UNIQUE,
	`name` VARCHAR(255),
	PRIMARY KEY(`id`)
);


CREATE TABLE `class` (
	`id` BIGINT NOT NULL AUTO_INCREMENT UNIQUE,
	`name` VARCHAR(255),
	`falcuty_id` BIGINT,
	`cohort_id` BIGINT,
	PRIMARY KEY(`id`)
);


CREATE TABLE `falcuty` (
	`id` BIGINT NOT NULL AUTO_INCREMENT UNIQUE,
	`name` VARCHAR(255),
	PRIMARY KEY(`id`)
);


CREATE TABLE `cohort` (
	`id` BIGINT NOT NULL AUTO_INCREMENT UNIQUE,
	`year` BIGINT,
	PRIMARY KEY(`id`)
);


CREATE TABLE `student_cohort` (
	`id` BIGINT AUTO_INCREMENT,
	`student_id` BIGINT NOT NULL,
	`cohort_id` BIGINT NOT NULL,
	`type` ENUM('official', 'actual') DEFAULT 'official',
	PRIMARY KEY(`id`)
) COMMENT='type enum: official, actual
';


CREATE TABLE `post` (
	`id` BIGINT NOT NULL AUTO_INCREMENT UNIQUE,
	`activity_id` BIGINT,
	`description` TEXT(65535),
	`created_at` TIMESTAMP,
	PRIMARY KEY(`id`)
);


CREATE TABLE `activity_eligiblity` (
	`id` BIGINT NOT NULL AUTO_INCREMENT UNIQUE,
	`activity_id` BIGINT,
	`type` ENUM(),
	`reference_id` BIGINT,
	PRIMARY KEY(`id`)
) COMMENT='type enum: falcuty, cohort';


ALTER TABLE `role_permission`
ADD FOREIGN KEY(`role_id`) REFERENCES `role`(`id`)
ON UPDATE NO ACTION ON DELETE CASCADE;
ALTER TABLE `role_permission`
ADD FOREIGN KEY(`permission_id`) REFERENCES `permission`(`id`)
ON UPDATE NO ACTION ON DELETE CASCADE;
ALTER TABLE `user_role`
ADD FOREIGN KEY(`user_id`) REFERENCES `user`(`id`)
ON UPDATE NO ACTION ON DELETE CASCADE;
ALTER TABLE `user_role`
ADD FOREIGN KEY(`role_id`) REFERENCES `role`(`id`)
ON UPDATE NO ACTION ON DELETE CASCADE;
ALTER TABLE `student_profile`
ADD FOREIGN KEY(`user_id`) REFERENCES `user`(`id`)
ON UPDATE NO ACTION ON DELETE CASCADE;
ALTER TABLE `activity`
ADD FOREIGN KEY(`org_unit_id`) REFERENCES `org_unit`(`id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `activity_registration`
ADD FOREIGN KEY(`activity_id`) REFERENCES `activity`(`id`)
ON UPDATE NO ACTION ON DELETE CASCADE;
ALTER TABLE `activity_registration`
ADD FOREIGN KEY(`student_id`) REFERENCES `user`(`id`)
ON UPDATE NO ACTION ON DELETE CASCADE;
ALTER TABLE `attendance`
ADD FOREIGN KEY(`activity_id`) REFERENCES `activity`(`id`)
ON UPDATE NO ACTION ON DELETE CASCADE;
ALTER TABLE `evidence`
ADD FOREIGN KEY(`student_id`) REFERENCES `student_profile`(`id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `attendance`
ADD FOREIGN KEY(`student_id`) REFERENCES `student_profile`(`id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `field`
ADD FOREIGN KEY(`id`) REFERENCES `activity`(`field_id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `pvcd_record`
ADD FOREIGN KEY(`student_id`) REFERENCES `student_profile`(`id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `class`
ADD FOREIGN KEY(`falcuty_id`) REFERENCES `falcuty`(`id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `student_profile`
ADD FOREIGN KEY(`class_id`) REFERENCES `class`(`id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `staff_profile`
ADD FOREIGN KEY(`user_id`) REFERENCES `user`(`id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `cohort`
ADD FOREIGN KEY(`id`) REFERENCES `class`(`cohort_id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `student_cohort`
ADD FOREIGN KEY(`student_id`) REFERENCES `student_profile`(`id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `student_cohort`
ADD FOREIGN KEY(`cohort_id`) REFERENCES `cohort`(`id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `post`
ADD FOREIGN KEY(`id`) REFERENCES `activity`(`id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `activity_eligiblity`
ADD FOREIGN KEY(`activity_id`) REFERENCES `activity`(`id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `staff_profile`
ADD FOREIGN KEY(`org_unit_id`) REFERENCES `org_unit`(`id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `staff_profile`
ADD FOREIGN KEY(`id`) REFERENCES `org_unit`(`leader_id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;