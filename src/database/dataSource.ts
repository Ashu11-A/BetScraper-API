import { glob } from 'glob'
import { dirname, join } from 'path'
import { DataSource } from 'typeorm'
import { fileURLToPath } from 'url'

const path = dirname(fileURLToPath(import.meta.url))

export default new DataSource({
  type: 'mysql',
  host: 'node.seventyhost.net',
  port: 3306,
  username: 'u1692_em0uvT22x9',
  password: 'b=74kg@It47Nn2686gwmvMMo',
  database: 's1692_debug',
  synchronize: false,
  logging: true,
  entities: await glob(join(path, 'entity', '**/*.{js,ts}')),
  migrations: await glob(join(path, 'migration', '**/*.{js,ts}')),
  subscribers: [],
})