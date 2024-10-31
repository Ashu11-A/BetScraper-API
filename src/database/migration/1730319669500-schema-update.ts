import { MigrationInterface, QueryRunner } from 'typeorm'

export class SchemaUpdate1730319669500 implements MigrationInterface {
  name = 'SchemaUpdate1730319669500'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `infraction` DROP FOREIGN KEY `FK_5ffd257c3b15678a6f17ba7207f`')
    await queryRunner.query('ALTER TABLE `infraction` CHANGE `betsId` `betsId` int NULL')
    await queryRunner.query('ALTER TABLE `users` CHANGE `lastExecutedAt` `lastExecutedAt` date NULL')
    await queryRunner.query('ALTER TABLE `users` CHANGE `nextExecutionAt` `nextExecutionAt` date NULL')
    await queryRunner.query('ALTER TABLE `tasks` DROP FOREIGN KEY `FK_e4bcf0bf21c7ceb459f67c42193`')
    await queryRunner.query('ALTER TABLE `tasks` DROP FOREIGN KEY `FK_166bd96559cb38595d392f75a35`')
    await queryRunner.query('ALTER TABLE `tasks` DROP FOREIGN KEY `FK_985b3a08f36589f12e23647c07d`')
    await queryRunner.query('ALTER TABLE `tasks` CHANGE `duration` `duration` int NULL')
    await queryRunner.query('ALTER TABLE `tasks` CHANGE `finishedAt` `finishedAt` date NULL')
    await queryRunner.query('ALTER TABLE `tasks` CHANGE `betId` `betId` int NULL')
    await queryRunner.query('ALTER TABLE `tasks` CHANGE `userId` `userId` int NULL')
    await queryRunner.query('ALTER TABLE `tasks` CHANGE `cronId` `cronId` int NULL')
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
    await queryRunner.query('ALTER TABLE `tasks` CHANGE `cronId` `cronId` int NULL DEFAULT \'NULL\'')
    await queryRunner.query('ALTER TABLE `tasks` CHANGE `userId` `userId` int NULL DEFAULT \'NULL\'')
    await queryRunner.query('ALTER TABLE `tasks` CHANGE `betId` `betId` int NULL DEFAULT \'NULL\'')
    await queryRunner.query('ALTER TABLE `tasks` CHANGE `finishedAt` `finishedAt` date NULL DEFAULT \'NULL\'')
    await queryRunner.query('ALTER TABLE `tasks` CHANGE `duration` `duration` int NULL DEFAULT \'NULL\'')
    await queryRunner.query('ALTER TABLE `tasks` ADD CONSTRAINT `FK_985b3a08f36589f12e23647c07d` FOREIGN KEY (`cronId`) REFERENCES `crons`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION')
    await queryRunner.query('ALTER TABLE `tasks` ADD CONSTRAINT `FK_166bd96559cb38595d392f75a35` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION')
    await queryRunner.query('ALTER TABLE `tasks` ADD CONSTRAINT `FK_e4bcf0bf21c7ceb459f67c42193` FOREIGN KEY (`betId`) REFERENCES `bets`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION')
    await queryRunner.query('ALTER TABLE `users` CHANGE `nextExecutionAt` `nextExecutionAt` date NULL DEFAULT \'NULL\'')
    await queryRunner.query('ALTER TABLE `users` CHANGE `lastExecutedAt` `lastExecutedAt` date NULL DEFAULT \'NULL\'')
    await queryRunner.query('ALTER TABLE `infraction` CHANGE `betsId` `betsId` int NULL DEFAULT \'NULL\'')
    await queryRunner.query('ALTER TABLE `infraction` ADD CONSTRAINT `FK_5ffd257c3b15678a6f17ba7207f` FOREIGN KEY (`betsId`) REFERENCES `bets`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION')
  }

}
