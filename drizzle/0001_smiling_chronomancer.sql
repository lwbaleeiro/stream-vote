ALTER TABLE `options` ADD `teamId` text;--> statement-breakpoint
ALTER TABLE `options` ADD `teamLogo` text;--> statement-breakpoint
ALTER TABLE `polls` ADD `type` text DEFAULT 'custom' NOT NULL;--> statement-breakpoint
ALTER TABLE `polls` ADD `sportKey` text;--> statement-breakpoint
ALTER TABLE `polls` ADD `sportEventId` text;--> statement-breakpoint
ALTER TABLE `polls` ADD `resolved` integer DEFAULT false NOT NULL;