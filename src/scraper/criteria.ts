import { advisementRulesKeywords } from '@/shared/consts/keywords/advisement-rules.js'
import { bonusKeywords } from '@/shared/consts/keywords/bonuses.js'
import { legalAgeAdvisementKeywords } from '@/shared/consts/keywords/legal-age-advisement.js'

export class Criteria {
  gambleAdictAdvisement?: boolean = false
  legalAgeAdvisement?: boolean = false
  hasIrregularity?: boolean = false
  hasBonuses?: boolean = false
    
  constructor({ gambleAdictAdvisement, hasBonuses, hasIrregularity, legalAgeAdvisement }: Omit<Criteria, 'setCriterias'>) {
    this.hasBonuses = hasBonuses
    this.hasIrregularity = hasIrregularity
    this.legalAgeAdvisement= legalAgeAdvisement
    this.gambleAdictAdvisement = gambleAdictAdvisement
  }

  setCriterias(text: string) {
    text = text.toLowerCase()

    if (legalAgeAdvisementKeywords.some(keyword => text.includes(keyword.toLowerCase()))) {
      this.legalAgeAdvisement = true
      this.hasIrregularity = true
    }
    if (advisementRulesKeywords.some(keyword => text.includes(keyword.toLowerCase()))) {
      this.gambleAdictAdvisement = true
      this.hasIrregularity = true
    }
    if (bonusKeywords.some(keyword => text.includes(keyword.toLowerCase()))) {
      this.hasBonuses = true
      this.hasIrregularity = true
    }
    return this
  }
}