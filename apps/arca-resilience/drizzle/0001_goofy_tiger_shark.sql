ALTER TABLE `arca_messages` MODIFY COLUMN `safetyStatus` enum('normal','needs_review','reviewed','blocked') NOT NULL DEFAULT 'normal';--> statement-breakpoint
ALTER TABLE `arca_conversations` ADD `expiresAt` timestamp NOT NULL;--> statement-breakpoint
CREATE INDEX `arca_conversation_expiry_idx` ON `arca_conversations` (`expiresAt`);