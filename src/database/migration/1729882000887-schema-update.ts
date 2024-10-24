import { MigrationInterface, QueryRunner } from 'typeorm'

export class SchemaUpdate1729882000887 implements MigrationInterface {
  name = 'SchemaUpdate1729882000887'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `bets` ADD `status` enum (\'none\', \'suspect\', \'approved\', \'disapproved\') NOT NULL')
    await queryRunner.query('ALTER TABLE `infraction` DROP FOREIGN KEY `FK_5ffd257c3b15678a6f17ba7207f`')
    await queryRunner.query('ALTER TABLE `infraction` CHANGE `betsId` `betsId` int NULL')
    await queryRunner.query('ALTER TABLE `infraction` ADD CONSTRAINT `FK_5ffd257c3b15678a6f17ba7207f` FOREIGN KEY (`betsId`) REFERENCES `bets`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION')
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `infraction` DROP FOREIGN KEY `FK_5ffd257c3b15678a6f17ba7207f`')
    await queryRunner.query('ALTER TABLE `infraction` CHANGE `betsId` `betsId` int NULL DEFAULT \'NULL\'')
    await queryRunner.query('ALTER TABLE `infraction` ADD CONSTRAINT `FK_5ffd257c3b15678a6f17ba7207f` FOREIGN KEY (`betsId`) REFERENCES `bets`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION')
    await queryRunner.query('ALTER TABLE `bets` DROP COLUMN `status`')
  }

}
