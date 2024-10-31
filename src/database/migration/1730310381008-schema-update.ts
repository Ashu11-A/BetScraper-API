import { MigrationInterface, QueryRunner } from 'typeorm'

export class SchemaUpdate1730310381008 implements MigrationInterface {
  name = 'SchemaUpdate1730310381008'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE TABLE `crons` (`id` int NOT NULL AUTO_INCREMENT, `expression` varchar(255) NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB')
    await queryRunner.query('ALTER TABLE `tasks` DROP COLUMN `name`')
    await queryRunner.query('ALTER TABLE `tasks` DROP COLUMN `cron`')
    await queryRunner.query('ALTER TABLE `tasks` DROP COLUMN `completed`')
    await queryRunner.query('ALTER TABLE `users` ADD `lastExecutedAt` date NULL')
    await queryRunner.query('ALTER TABLE `users` ADD `nextExecutionAt` date NULL')
    await queryRunner.query('ALTER TABLE `tasks` ADD `betId` int NULL')
    await queryRunner.query('ALTER TABLE `tasks` ADD `cronId` int NULL')
    await queryRunner.query('ALTER TABLE `infraction` DROP FOREIGN KEY `FK_5ffd257c3b15678a6f17ba7207f`')
    await queryRunner.query('ALTER TABLE `infraction` CHANGE `betsId` `betsId` int NULL')
    await queryRunner.query('ALTER TABLE `bets` CHANGE `status` `status` enum (\'none\', \'suspect\', \'approved\', \'disapproved\') NOT NULL DEFAULT \'none\'')
    await queryRunner.query('ALTER TABLE `tasks` DROP FOREIGN KEY `FK_166bd96559cb38595d392f75a35`')
    await queryRunner.query('ALTER TABLE `tasks` CHANGE `status` `status` enum (\'scheduled\', \'running\', \'paused\', \'failed\', \'completed\') NOT NULL DEFAULT \'scheduled\'')
    await queryRunner.query('ALTER TABLE `tasks` CHANGE `duration` `duration` int NULL')
    await queryRunner.query('ALTER TABLE `tasks` CHANGE `finishedAt` `finishedAt` date NULL')
    await queryRunner.query('ALTER TABLE `tasks` CHANGE `userId` `userId` int NULL')
    await queryRunner.query('ALTER TABLE `infraction` ADD CONSTRAINT `FK_5ffd257c3b15678a6f17ba7207f` FOREIGN KEY (`betsId`) REFERENCES `bets`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION')
    await queryRunner.query('ALTER TABLE `tasks` ADD CONSTRAINT `FK_e4bcf0bf21c7ceb459f67c42193` FOREIGN KEY (`betId`) REFERENCES `bets`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION')
    await queryRunner.query('ALTER TABLE `tasks` ADD CONSTRAINT `FK_166bd96559cb38595d392f75a35` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION')
    await queryRunner.query('ALTER TABLE `tasks` ADD CONSTRAINT `FK_985b3a08f36589f12e23647c07d` FOREIGN KEY (`cronId`) REFERENCES `crons`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION')
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `tasks` DROP FOREIGN KEY `FK_985b3a08f36589f12e23647c07d`')
    await queryRunner.query('ALTER TABLE `tasks` DROP FOREIGN KEY `FK_166bd96559cb38595d392f75a35`')
    await queryRunner.query('ALTER TABLE `tasks` DROP FOREIGN KEY `FK_e4bcf0bf21c7ceb459f67c42193`')
    await queryRunner.query('ALTER TABLE `infraction` DROP FOREIGN KEY `FK_5ffd257c3b15678a6f17ba7207f`')
    await queryRunner.query('ALTER TABLE `tasks` CHANGE `userId` `userId` int NULL DEFAULT \'NULL\'')
    await queryRunner.query('ALTER TABLE `tasks` CHANGE `finishedAt` `finishedAt` date NOT NULL')
    await queryRunner.query('ALTER TABLE `tasks` CHANGE `duration` `duration` int NOT NULL')
    await queryRunner.query('ALTER TABLE `tasks` CHANGE `status` `status` enum (\'completed\', \'pending\', \'inQueue\', \'none\') NOT NULL DEFAULT \'\'none\'\'')
    await queryRunner.query('ALTER TABLE `tasks` ADD CONSTRAINT `FK_166bd96559cb38595d392f75a35` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION')
    await queryRunner.query('ALTER TABLE `bets` CHANGE `status` `status` enum (\'none\', \'suspect\', \'approved\', \'disapproved\') NOT NULL')
    await queryRunner.query('ALTER TABLE `infraction` CHANGE `betsId` `betsId` int NULL DEFAULT \'NULL\'')
    await queryRunner.query('ALTER TABLE `infraction` ADD CONSTRAINT `FK_5ffd257c3b15678a6f17ba7207f` FOREIGN KEY (`betsId`) REFERENCES `bets`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION')
    await queryRunner.query('ALTER TABLE `tasks` DROP COLUMN `cronId`')
    await queryRunner.query('ALTER TABLE `tasks` DROP COLUMN `betId`')
    await queryRunner.query('ALTER TABLE `users` DROP COLUMN `nextExecutionAt`')
    await queryRunner.query('ALTER TABLE `users` DROP COLUMN `lastExecutedAt`')
    await queryRunner.query('ALTER TABLE `tasks` ADD `completed` tinyint NOT NULL')
    await queryRunner.query('ALTER TABLE `tasks` ADD `cron` varchar(255) NOT NULL')
    await queryRunner.query('ALTER TABLE `tasks` ADD `name` varchar(255) NOT NULL')
    await queryRunner.query('DROP TABLE `crons`')
  }

}
