import { glob } from 'glob'
import { dirname, join } from 'path'
import { DataSource } from 'typeorm'
import { fileURLToPath } from 'url'

const path = dirname(fileURLToPath(import.meta.url))

export default new DataSource({
  type: 'mysql',
  host: process.env['DATABASE_HOST'],
  port: Number(process.env['DATABASE_PORT']),
  username: process.env['DATABASE_USERNAME'],
  password: process.env['DATABASE_PASSWORD'],
  database: process.env['DATABASE_NAME'],
  synchronize: false,
  logging: true,
  entities: await glob(join(path, 'entity', '**/*.{js,ts}')),
  migrations: await glob(join(path, 'migration', '**/*.{js,ts}')),
  subscribers: [],
})