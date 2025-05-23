import Compliance, { ComplianceType } from '@/database/entity/Compliance.js'
import { advisementRulesKeywords, bonusKeywords, legalAgeAdvisementKeywords } from '@/shared/consts/keywords/index.js'

async function existsBy (compliance: string) {
  return await Compliance.existsBy({ value: compliance })
}
async function register(rules: string[], type: ComplianceType) {
  for (const rule of rules) {
    if (!(await existsBy(rule))) {
      await Compliance.create({
        type,
        value: rule
      }).save()
    }
  }
}

export async function registerCompliances() {
  await Promise.all([
    register(bonusKeywords, ComplianceType.Bunus),
    register(advisementRulesKeywords, ComplianceType.Advisement),
    register(legalAgeAdvisementKeywords, ComplianceType.LegalAgeAdvisement)
  ])
}
