import { MigrationInterface, QueryRunner } from "typeorm";

export class SchemaUpdate1732797549464 implements MigrationInterface {
    name = 'SchemaUpdate1732797549464'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`ocrs\` (\`id\` int NOT NULL AUTO_INCREMENT, \`proportionPercentage\` float NOT NULL, \`scrollPercentage\` float NOT NULL, \`distanceToTop\` float NOT NULL, \`isInViewport\` tinyint NOT NULL, \`viewport\` text NOT NULL, \`pageDimensions\` text NOT NULL, \`elementBox\` text NOT NULL, \`taskId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`ocrs_compliances_compliances\` (\`ocrsId\` int NOT NULL, \`compliancesId\` int NOT NULL, INDEX \`IDX_553c62ed9380c6a390329c7b53\` (\`ocrsId\`), INDEX \`IDX_27f5d6da5c588aebe8c4247ae9\` (\`compliancesId\`), PRIMARY KEY (\`ocrsId\`, \`compliancesId\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`crons\` CHANGE \`lastExecutedAt\` \`lastExecutedAt\` timestamp NULL`);
        await queryRunner.query(`ALTER TABLE \`crons\` CHANGE \`nextExecutionAt\` \`nextExecutionAt\` timestamp NULL`);
        await queryRunner.query(`ALTER TABLE \`bets\` DROP FOREIGN KEY \`FK_804634d04da8e115c137860f04b\``);
        await queryRunner.query(`ALTER TABLE \`bets\` CHANGE \`cronId\` \`cronId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`properties\` DROP FOREIGN KEY \`FK_2256c34c6f602b4675cadd55c6e\``);
        await queryRunner.query(`ALTER TABLE \`properties\` CHANGE \`taskId\` \`taskId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`tasks\` DROP FOREIGN KEY \`FK_e4bcf0bf21c7ceb459f67c42193\``);
        await queryRunner.query(`ALTER TABLE \`tasks\` DROP FOREIGN KEY \`FK_166bd96559cb38595d392f75a35\``);
        await queryRunner.query(`ALTER TABLE \`tasks\` CHANGE \`errorMessage\` \`errorMessage\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`tasks\` CHANGE \`duration\` \`duration\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`tasks\` CHANGE \`scheduledAt\` \`scheduledAt\` timestamp NULL`);
        await queryRunner.query(`ALTER TABLE \`tasks\` CHANGE \`finishedAt\` \`finishedAt\` timestamp NULL`);
        await queryRunner.query(`ALTER TABLE \`tasks\` CHANGE \`betId\` \`betId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`tasks\` CHANGE \`userId\` \`userId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`bets\` ADD CONSTRAINT \`FK_804634d04da8e115c137860f04b\` FOREIGN KEY (\`cronId\`) REFERENCES \`crons\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`properties\` ADD CONSTRAINT \`FK_2256c34c6f602b4675cadd55c6e\` FOREIGN KEY (\`taskId\`) REFERENCES \`tasks\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tasks\` ADD CONSTRAINT \`FK_e4bcf0bf21c7ceb459f67c42193\` FOREIGN KEY (\`betId\`) REFERENCES \`bets\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tasks\` ADD CONSTRAINT \`FK_166bd96559cb38595d392f75a35\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`ocrs\` ADD CONSTRAINT \`FK_143d11277ac776f636c8f6c3c1c\` FOREIGN KEY (\`taskId\`) REFERENCES \`tasks\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`ocrs_compliances_compliances\` ADD CONSTRAINT \`FK_553c62ed9380c6a390329c7b536\` FOREIGN KEY (\`ocrsId\`) REFERENCES \`ocrs\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`ocrs_compliances_compliances\` ADD CONSTRAINT \`FK_27f5d6da5c588aebe8c4247ae92\` FOREIGN KEY (\`compliancesId\`) REFERENCES \`compliances\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`ocrs_compliances_compliances\` DROP FOREIGN KEY \`FK_27f5d6da5c588aebe8c4247ae92\``);
        await queryRunner.query(`ALTER TABLE \`ocrs_compliances_compliances\` DROP FOREIGN KEY \`FK_553c62ed9380c6a390329c7b536\``);
        await queryRunner.query(`ALTER TABLE \`ocrs\` DROP FOREIGN KEY \`FK_143d11277ac776f636c8f6c3c1c\``);
        await queryRunner.query(`ALTER TABLE \`tasks\` DROP FOREIGN KEY \`FK_166bd96559cb38595d392f75a35\``);
        await queryRunner.query(`ALTER TABLE \`tasks\` DROP FOREIGN KEY \`FK_e4bcf0bf21c7ceb459f67c42193\``);
        await queryRunner.query(`ALTER TABLE \`properties\` DROP FOREIGN KEY \`FK_2256c34c6f602b4675cadd55c6e\``);
        await queryRunner.query(`ALTER TABLE \`bets\` DROP FOREIGN KEY \`FK_804634d04da8e115c137860f04b\``);
        await queryRunner.query(`ALTER TABLE \`tasks\` CHANGE \`userId\` \`userId\` int NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`tasks\` CHANGE \`betId\` \`betId\` int NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`tasks\` CHANGE \`finishedAt\` \`finishedAt\` timestamp NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`tasks\` CHANGE \`scheduledAt\` \`scheduledAt\` timestamp NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`tasks\` CHANGE \`duration\` \`duration\` int NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`tasks\` CHANGE \`errorMessage\` \`errorMessage\` text NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`tasks\` ADD CONSTRAINT \`FK_166bd96559cb38595d392f75a35\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tasks\` ADD CONSTRAINT \`FK_e4bcf0bf21c7ceb459f67c42193\` FOREIGN KEY (\`betId\`) REFERENCES \`bets\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`properties\` CHANGE \`taskId\` \`taskId\` int NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`properties\` ADD CONSTRAINT \`FK_2256c34c6f602b4675cadd55c6e\` FOREIGN KEY (\`taskId\`) REFERENCES \`tasks\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`bets\` CHANGE \`cronId\` \`cronId\` int NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`bets\` ADD CONSTRAINT \`FK_804634d04da8e115c137860f04b\` FOREIGN KEY (\`cronId\`) REFERENCES \`crons\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`crons\` CHANGE \`nextExecutionAt\` \`nextExecutionAt\` timestamp NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`crons\` CHANGE \`lastExecutedAt\` \`lastExecutedAt\` timestamp NULL DEFAULT 'NULL'`);
        await queryRunner.query(`DROP INDEX \`IDX_27f5d6da5c588aebe8c4247ae9\` ON \`ocrs_compliances_compliances\``);
        await queryRunner.query(`DROP INDEX \`IDX_553c62ed9380c6a390329c7b53\` ON \`ocrs_compliances_compliances\``);
        await queryRunner.query(`DROP TABLE \`ocrs_compliances_compliances\``);
        await queryRunner.query(`DROP TABLE \`ocrs\``);
    }

}
