import { MigrationInterface, QueryRunner } from 'typeorm'

export class SchemaUpdate1731385546356 implements MigrationInterface {
  name = 'SchemaUpdate1731385546356'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `properties` ADD `pageDimensions` text NOT NULL')
    await queryRunner.query('ALTER TABLE `properties` ADD `elementBox` text NOT NULL')
    await queryRunner.query('ALTER TABLE `crons` CHANGE `lastExecutedAt` `lastExecutedAt` timestamp NULL')
    await queryRunner.query('ALTER TABLE `crons` CHANGE `nextExecutionAt` `nextExecutionAt` timestamp NULL')
    await queryRunner.query('ALTER TABLE `bets` DROP FOREIGN KEY `FK_804634d04da8e115c137860f04b`')
    await queryRunner.query('ALTER TABLE `bets` CHANGE `cronId` `cronId` int NULL')
    await queryRunner.query('ALTER TABLE `properties` DROP FOREIGN KEY `FK_2256c34c6f602b4675cadd55c6e`')
    await queryRunner.query('ALTER TABLE `properties` CHANGE `taskId` `taskId` int NULL')
    await queryRunner.query('ALTER TABLE `tasks` DROP FOREIGN KEY `FK_e4bcf0bf21c7ceb459f67c42193`')
    await queryRunner.query('ALTER TABLE `tasks` DROP FOREIGN KEY `FK_166bd96559cb38595d392f75a35`')
    await queryRunner.query('ALTER TABLE `tasks` CHANGE `errorMessage` `errorMessage` text NULL')
    await queryRunner.query('ALTER TABLE `tasks` CHANGE `duration` `duration` int NULL')
    await queryRunner.query('ALTER TABLE `tasks` CHANGE `scheduledAt` `scheduledAt` timestamp NULL')
    await queryRunner.query('ALTER TABLE `tasks` CHANGE `finishedAt` `finishedAt` timestamp NULL')
    await queryRunner.query('ALTER TABLE `tasks` CHANGE `betId` `betId` int NULL')
    await queryRunner.query('ALTER TABLE `tasks` CHANGE `userId` `userId` int NULL')
    await queryRunner.query('ALTER TABLE `bets` ADD CONSTRAINT `FK_804634d04da8e115c137860f04b` FOREIGN KEY (`cronId`) REFERENCES `crons`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION')
    await queryRunner.query('ALTER TABLE `properties` ADD CONSTRAINT `FK_2256c34c6f602b4675cadd55c6e` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION')
    await queryRunner.query('ALTER TABLE `tasks` ADD CONSTRAINT `FK_e4bcf0bf21c7ceb459f67c42193` FOREIGN KEY (`betId`) REFERENCES `bets`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION')
    await queryRunner.query('ALTER TABLE `tasks` ADD CONSTRAINT `FK_166bd96559cb38595d392f75a35` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION')
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `tasks` DROP FOREIGN KEY `FK_166bd96559cb38595d392f75a35`')
    await queryRunner.query('ALTER TABLE `tasks` DROP FOREIGN KEY `FK_e4bcf0bf21c7ceb459f67c42193`')
    await queryRunner.query('ALTER TABLE `properties` DROP FOREIGN KEY `FK_2256c34c6f602b4675cadd55c6e`')
    await queryRunner.query('ALTER TABLE `bets` DROP FOREIGN KEY `FK_804634d04da8e115c137860f04b`')
    await queryRunner.query('ALTER TABLE `tasks` CHANGE `userId` `userId` int NULL DEFAULT \'NULL\'')
    await queryRunner.query('ALTER TABLE `tasks` CHANGE `betId` `betId` int NULL DEFAULT \'NULL\'')
    await queryRunner.query('ALTER TABLE `tasks` CHANGE `finishedAt` `finishedAt` timestamp NULL DEFAULT \'NULL\'')
    await queryRunner.query('ALTER TABLE `tasks` CHANGE `scheduledAt` `scheduledAt` timestamp NULL DEFAULT \'NULL\'')
    await queryRunner.query('ALTER TABLE `tasks` CHANGE `duration` `duration` int NULL DEFAULT \'NULL\'')
    await queryRunner.query('ALTER TABLE `tasks` CHANGE `errorMessage` `errorMessage` text NULL DEFAULT \'NULL\'')
    await queryRunner.query('ALTER TABLE `tasks` ADD CONSTRAINT `FK_166bd96559cb38595d392f75a35` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION')
    await queryRunner.query('ALTER TABLE `tasks` ADD CONSTRAINT `FK_e4bcf0bf21c7ceb459f67c42193` FOREIGN KEY (`betId`) REFERENCES `bets`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION')
    await queryRunner.query('ALTER TABLE `properties` CHANGE `taskId` `taskId` int NULL DEFAULT \'NULL\'')
    await queryRunner.query('ALTER TABLE `properties` ADD CONSTRAINT `FK_2256c34c6f602b4675cadd55c6e` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION')
    await queryRunner.query('ALTER TABLE `bets` CHANGE `cronId` `cronId` int NULL DEFAULT \'NULL\'')
    await queryRunner.query('ALTER TABLE `bets` ADD CONSTRAINT `FK_804634d04da8e115c137860f04b` FOREIGN KEY (`cronId`) REFERENCES `crons`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION')
    await queryRunner.query('ALTER TABLE `crons` CHANGE `nextExecutionAt` `nextExecutionAt` timestamp NULL DEFAULT \'NULL\'')
    await queryRunner.query('ALTER TABLE `crons` CHANGE `lastExecutedAt` `lastExecutedAt` timestamp NULL DEFAULT \'NULL\'')
    await queryRunner.query('ALTER TABLE `properties` DROP COLUMN `elementBox`')
    await queryRunner.query('ALTER TABLE `properties` DROP COLUMN `pageDimensions`')
  }

}
