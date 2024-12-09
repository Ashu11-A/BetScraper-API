import { advisementRulesKeywords } from '@/shared/consts/keywords/advisement-rules.js'
import { bonusKeywords } from '@/shared/consts/keywords/bonuses.js'
import { legalAgeAdvisementKeywords } from '@/shared/consts/keywords/legal-age-advisement.js'

export class Criteria {
  gambleAdictAdvisement?: boolean = false
  legalAgeAdvisement?: boolean = false
  hasIrregularity?: boolean = false
  hasBonuses?: boolean = false
    
  constructor({ gambleAdictAdvisement, hasBonuses, hasIrregularity, legalAgeAdvisement }: Omit<Criteria, 'setCriterias' | 'normalizeText'>) {
    this.hasBonuses = hasBonuses
    this.hasIrregularity = hasIrregularity
    this.legalAgeAdvisement= legalAgeAdvisement
    this.gambleAdictAdvisement = gambleAdictAdvisement
  }

  normalizeText<T extends string | undefined>(text: T): T {
    if (!text) return text

    return text
      .normalize('NFD') // Remove diacríticos
      .replace(/[\u0300-\u036f]/g, '') // Remove os acentos
      .replace(/\s+/g, ' ') // Substitui múltiplos espaços por um único espaço
      .trim() // Remove espaços no início e no fim
      .toLowerCase() as T // Converte para minúsculas
  }

  setCriterias(text: string | string[]) {
    text = this.normalizeText(Array.isArray(text) ? text.join(' ') : text)

    if (legalAgeAdvisementKeywords.some(keyword => text.includes(this.normalizeText(keyword)))) {
      this.legalAgeAdvisement = true
      this.hasIrregularity = true
    }
    if (advisementRulesKeywords.some(keyword => text.includes(this.normalizeText(keyword)))) {
      this.gambleAdictAdvisement = true
      this.hasIrregularity = true
    }
    if (bonusKeywords.some(keyword => text.includes(this.normalizeText(keyword)))) {
      this.hasBonuses = true
      this.hasIrregularity = true
    }
    return this
  }
}