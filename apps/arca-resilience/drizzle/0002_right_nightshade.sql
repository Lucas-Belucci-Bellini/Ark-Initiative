CREATE TABLE `arca_evidence_cases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`evidenceKey` varchar(80) NOT NULL,
	`title` varchar(240) NOT NULL,
	`environment` varchar(120) NOT NULL,
	`sourceOrganization` varchar(180) NOT NULL,
	`sourceUrl` varchar(1000) NOT NULL,
	`sourcePublishedAt` timestamp,
	`factualSummary` text NOT NULL,
	`operationalLesson` text NOT NULL,
	`evidenceTier` enum('official','peer_reviewed','institutional') NOT NULL DEFAULT 'official',
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`createdByUserId` int,
	`reviewedByUserId` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `arca_evidence_cases_id` PRIMARY KEY(`id`),
	CONSTRAINT `arca_evidence_cases_evidenceKey_unique` UNIQUE(`evidenceKey`)
);
--> statement-breakpoint
CREATE INDEX `arca_evidence_status_environment_idx` ON `arca_evidence_cases` (`status`,`environment`);