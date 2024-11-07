import { Criteria } from './criteria.js'
import { Properties } from './properties.js'

export class Evidence {
  criteria: Criteria
  properties: Properties
  
  constructor({ criteria, properties }: Evidence) {
    this.criteria = criteria
    this.properties = properties
  }
}
