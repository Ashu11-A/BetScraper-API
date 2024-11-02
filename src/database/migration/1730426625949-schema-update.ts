import { MigrationInterface, QueryRunner } from 'typeorm'

export class SchemaUpdate1730426625949 implements MigrationInterface {
  name = 'SchemaUpdate1730426625949'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE TABLE `infraction` (`id` int NOT NULL AUTO_INCREMENT, `value` varchar(255) NOT NULL, `betsId` int NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB')
    await queryRunner.query('CREATE TABLE `bets` (`id` int NOT NULL AUTO_INCREMENT, `name` varchar(255) NOT NULL, `url` varchar(255) NOT NULL, `status` enum (\'none\', \'suspect\', \'approved\', \'disapproved\') NOT NULL DEFAULT \'none\', `score` int NOT NULL, `updatedAt` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), `createdAt` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (`id`)) ENGINE=InnoDB')
    await queryRunner.query('CREATE TABLE `crons` (`id` int NOT NULL AUTO_INCREMENT, `expression` varchar(255) NOT NULL, `lastExecutedAt` timestamp NULL, `nextExecutionAt` timestamp NULL, `updatedAt` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), `createdAt` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (`id`)) ENGINE=InnoDB')
    await queryRunner.query('CREATE TABLE `users` (`id` int NOT NULL AUTO_INCREMENT, `uuid` varchar(36) NOT NULL, `name` text NOT NULL, `username` text NOT NULL, `email` varchar(255) NOT NULL, `language` varchar(255) NOT NULL, `password` text NOT NULL, `updatedAt` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), `createdAt` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (`id`)) ENGINE=InnoDB')
    await queryRunner.query('CREATE TABLE `tasks` (`id` int NOT NULL AUTO_INCREMENT, `status` enum (\'scheduled\', \'running\', \'paused\', \'failed\', \'completed\') NOT NULL DEFAULT \'scheduled\', `errorMessage` text NULL, `duration` int NULL, `scheduledAt` timestamp NULL, `finishedAt` timestamp NULL, `updatedAt` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), `createdAt` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), `betId` int NULL, `userId` int NULL, `cronId` int NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB')
    await queryRunner.query('ALTER TABLE `infraction` ADD CONSTRAINT `FK_5ffd257c3b15678a6f17ba7207f` FOREIGN KEY (`betsId`) REFERENCES `bets`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION')
    await queryRunner.query('ALTER TABLE `tasks` ADD CONSTRAINT `FK_e4bcf0bf21c7ceb459f67c42193` FOREIGN KEY (`betId`) REFERENCES `bets`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION')
    await queryRunner.query('ALTER TABLE `tasks` ADD CONSTRAINT `FK_166bd96559cb38595d392f75a35` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION')
    await queryRunner.query('ALTER TABLE `tasks` ADD CONSTRAINT `FK_985b3a08f36589f12e23647c07d` FOREIGN KEY (`cronId`) REFERENCES `crons`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION')
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `tasks` DROP FOREIGN KEY `FK_985b3a08f36589f12e23647c07d`')
    await queryRunner.query('ALTER TABLE `tasks` DROP FOREIGN KEY `FK_166bd96559cb38595d392f75a35`')
    await queryRunner.query('ALTER TABLE `tasks` DROP FOREIGN KEY `FK_e4bcf0bf21c7ceb459f67c42193`')
    await queryRunner.query('ALTER TABLE `infraction` DROP FOREIGN KEY `FK_5ffd257c3b15678a6f17ba7207f`')
    await queryRunner.query('DROP TABLE `tasks`')
    await queryRunner.query('DROP TABLE `users`')
    await queryRunner.query('DROP TABLE `crons`')
    await queryRunner.query('DROP TABLE `bets`')
    await queryRunner.query('DROP TABLE `infraction`')
  }

}
