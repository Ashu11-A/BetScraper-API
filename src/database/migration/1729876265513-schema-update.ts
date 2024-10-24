import { MigrationInterface, QueryRunner } from 'typeorm'

export class SchemaUpdate1729876265513 implements MigrationInterface {
  name = 'SchemaUpdate1729876265513'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE TABLE `bets` (`id` int NOT NULL AUTO_INCREMENT, `name` varchar(255) NOT NULL, `url` varchar(255) NOT NULL, `score` int NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB')
    await queryRunner.query('CREATE TABLE `infraction` (`id` int NOT NULL AUTO_INCREMENT, `name` varchar(255) NOT NULL, `betsId` int NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB')
    await queryRunner.query('ALTER TABLE `infraction` ADD CONSTRAINT `FK_5ffd257c3b15678a6f17ba7207f` FOREIGN KEY (`betsId`) REFERENCES `bets`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION')
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `infraction` DROP FOREIGN KEY `FK_5ffd257c3b15678a6f17ba7207f`')
    await queryRunner.query('DROP TABLE `infraction`')
    await queryRunner.query('DROP TABLE `bets`')
  }

}
