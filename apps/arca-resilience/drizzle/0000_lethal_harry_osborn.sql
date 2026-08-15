CREATE TABLE `arca_audit_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`eventType` varchar(80) NOT NULL,
	`resourceType` varchar(80) NOT NULL,
	`resourceId` varchar(80),
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `arca_audit_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `arca_consent_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`policyVersion` varchar(48) NOT NULL,
	`acceptedAt` timestamp NOT NULL DEFAULT (now()),
	`revokedAt` timestamp,
	`scope` enum('private_assistance','aggregate_insights') NOT NULL DEFAULT 'private_assistance',
	CONSTRAINT `arca_consent_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `arca_conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(140) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastMessageAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `arca_conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `arca_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('user','assistant','system') NOT NULL,
	`content` text NOT NULL,
	`safetyStatus` enum('normal','needs_review','blocked') NOT NULL DEFAULT 'normal',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `arca_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `arca_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`displayName` varchar(120),
	`operationalRole` enum('member','operator','steward') NOT NULL DEFAULT 'member',
	`dataSharing` enum('private','aggregate_opt_in') NOT NULL DEFAULT 'private',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `arca_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `arca_profiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE INDEX `arca_audit_event_idx` ON `arca_audit_events` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `arca_consent_user_idx` ON `arca_consent_records` (`userId`,`acceptedAt`);--> statement-breakpoint
CREATE INDEX `arca_conversation_user_idx` ON `arca_conversations` (`userId`,`lastMessageAt`);--> statement-breakpoint
CREATE INDEX `arca_message_conversation_idx` ON `arca_messages` (`conversationId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `arca_message_user_idx` ON `arca_messages` (`userId`,`createdAt`);