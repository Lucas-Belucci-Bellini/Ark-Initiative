CREATE TABLE `arca_safety_signals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`conversationId` int NOT NULL,
	`messageId` int NOT NULL,
	`areaKey` varchar(80) NOT NULL,
	`riskTier` enum('preventive','review_pending') NOT NULL,
	`status` enum('open','resolved','no_external_action') NOT NULL DEFAULT 'open',
	`reasonCodes` json NOT NULL,
	`reviewedByUserId` int,
	`reviewedAt` timestamp,
	`resolutionNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	CONSTRAINT `arca_safety_signals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `arca_safety_signal_status_idx` ON `arca_safety_signals` (`status`,`riskTier`,`createdAt`);--> statement-breakpoint
CREATE INDEX `arca_safety_signal_expiry_idx` ON `arca_safety_signals` (`expiresAt`);