CREATE TABLE IF NOT EXISTS `options` (
	`pollId` text NOT NULL,
	`idx` integer NOT NULL,
	`text` text NOT NULL,
	`votes` integer DEFAULT 0 NOT NULL,
	`isCorrect` integer DEFAULT false NOT NULL,
	PRIMARY KEY(`pollId`, `idx`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `polls` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`createdAt` text NOT NULL,
	`isActive` integer DEFAULT true NOT NULL,
	`winnersCount` integer,
	`endDate` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`passwordHash` text NOT NULL,
	`createdAt` text NOT NULL,
	`isActive` integer DEFAULT true NOT NULL,
	`score` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `votes` (
	`pollId` text NOT NULL,
	`userId` text NOT NULL,
	`optionIndex` integer NOT NULL,
	PRIMARY KEY(`pollId`, `userId`)
);
