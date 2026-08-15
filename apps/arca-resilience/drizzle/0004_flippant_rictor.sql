CREATE TABLE `arca_public_hazard_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`source` enum('gdacs','usgs') NOT NULL,
	`sourceEventId` varchar(160) NOT NULL,
	`title` varchar(320) NOT NULL,
	`hazardType` varchar(80) NOT NULL,
	`alertLevel` enum('green','orange','red','unknown') NOT NULL DEFAULT 'unknown',
	`magnitude` double,
	`depthKm` double,
	`latitude` double NOT NULL,
	`longitude` double NOT NULL,
	`geometry` json,
	`countryOrPlace` varchar(240),
	`observedAt` timestamp NOT NULL,
	`sourceUpdatedAt` timestamp NOT NULL,
	`sourceUrl` varchar(1000) NOT NULL,
	`isCurrent` int NOT NULL DEFAULT 1,
	`ingestedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `arca_public_hazard_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `arca_public_hazard_source_event_unq` UNIQUE(`source`,`sourceEventId`)
);
--> statement-breakpoint
CREATE TABLE `arca_rescue_incident_aggregates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`aggregateKey` varchar(120) NOT NULL,
	`sourceOrganization` varchar(180) NOT NULL,
	`sourceUrl` varchar(1000) NOT NULL,
	`scopeLabel` varchar(240) NOT NULL,
	`incidentCategory` varchar(120) NOT NULL,
	`incidentCount` int NOT NULL,
	`coverageStart` timestamp NOT NULL,
	`coverageEnd` timestamp NOT NULL,
	`status` enum('published','archived') NOT NULL DEFAULT 'published',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `arca_rescue_incident_aggregates_id` PRIMARY KEY(`id`),
	CONSTRAINT `arca_rescue_incident_aggregates_aggregateKey_unique` UNIQUE(`aggregateKey`)
);
--> statement-breakpoint
CREATE INDEX `arca_public_hazard_observed_idx` ON `arca_public_hazard_events` (`observedAt`);--> statement-breakpoint
CREATE INDEX `arca_public_hazard_alert_idx` ON `arca_public_hazard_events` (`alertLevel`,`sourceUpdatedAt`);--> statement-breakpoint
CREATE INDEX `arca_rescue_aggregate_status_idx` ON `arca_rescue_incident_aggregates` (`status`,`incidentCategory`);