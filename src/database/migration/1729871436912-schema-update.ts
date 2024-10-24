import { MigrationInterface, QueryRunner } from 'typeorm'

export class SchemaUpdate1729871436912 implements MigrationInterface {
  name = 'SchemaUpdate1729871436912'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE TABLE `users` (`id` int NOT NULL AUTO_INCREMENT, `uuid` varchar(36) NOT NULL, `name` text NOT NULL, `username` text NOT NULL, `email` varchar(255) NOT NULL, `language` varchar(255) NOT NULL, `password` text NOT NULL, `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (`id`)) ENGINE=InnoDB')
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `users`')
  }

}
