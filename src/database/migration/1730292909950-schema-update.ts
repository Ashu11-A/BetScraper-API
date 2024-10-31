import { MigrationInterface, QueryRunner } from 'typeorm'

export class SchemaUpdate1730292909950 implements MigrationInterface {
  name = 'SchemaUpdate1730292909950'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE TABLE `tasks` (`id` int NOT NULL AUTO_INCREMENT, `name` varchar(255) NOT NULL, `status` enum (\'completed\', \'pending\', \'inQueue\', \'none\') NOT NULL DEFAULT \'none\', `cron` varchar(255) NOT NULL, `duration` int NOT NULL, `completed` tinyint NOT NULL, `updateAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), `createAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `userId` int NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB')
    await queryRunner.query('ALTER TABLE `infraction` DROP FOREIGN KEY `FK_5ffd257c3b15678a6f17ba7207f`')
    await queryRunner.query('ALTER TABLE `infraction` CHANGE `betsId` `betsId` int NULL')
    await queryRunner.query('ALTER TABLE `tasks` ADD CONSTRAINT `FK_166bd96559cb38595d392f75a35` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION')
    await queryRunner.query('ALTER TABLE `infraction` ADD CONSTRAINT `FK_5ffd257c3b15678a6f17ba7207f` FOREIGN KEY (`betsId`) REFERENCES `bets`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION')
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `infraction` DROP FOREIGN KEY `FK_5ffd257c3b15678a6f17ba7207f`')
    await queryRunner.query('ALTER TABLE `tasks` DROP FOREIGN KEY `FK_166bd96559cb38595d392f75a35`')
    await queryRunner.query('ALTER TABLE `infraction` CHANGE `betsId` `betsId` int NULL DEFAULT \'NULL\'')
    await queryRunner.query('ALTER TABLE `infraction` ADD CONSTRAINT `FK_5ffd257c3b15678a6f17ba7207f` FOREIGN KEY (`betsId`) REFERENCES `bets`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION')
    await queryRunner.query('DROP TABLE `tasks`')
  }

}
