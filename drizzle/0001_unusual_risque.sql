CREATE TABLE `auth_limits` (
	`bucket` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `private_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`login_hash` text NOT NULL,
	`owner` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `private_accounts_login_hash_unique` ON `private_accounts` (`login_hash`);--> statement-breakpoint
CREATE UNIQUE INDEX `private_accounts_owner_unique` ON `private_accounts` (`owner`);--> statement-breakpoint
CREATE TABLE `private_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`account` text NOT NULL,
	`expires` integer NOT NULL,
	FOREIGN KEY (`account`) REFERENCES `private_accounts`(`id`) ON UPDATE no action ON DELETE no action
);
