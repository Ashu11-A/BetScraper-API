import dataSource from './dataSource.js'
import Bet from './entity/Bet.js'
import { Task } from './entity/Task.js'
import { User } from './entity/User.js'

export const tasksRepository = dataSource.getRepository(Task)
export const userRepository = dataSource.getRepository(User)
export const betRepository = dataSource.getRepository(Bet)
