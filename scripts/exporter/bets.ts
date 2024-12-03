import { advisementKeysHeader, legalAgeAdvisementKeyHeader } from './warns.js'

export const betsHeader = [
  { header: 'Id', key: 'id' },
  { header: 'Bet', key: 'bet' },
  { header: 'URL', key: 'url' },
  { header: 'Erro', key: 'error' },
  { header: 'Contém aviso de restrição etária?', key: 'ageRestriction' },
  { header: 'Contém aviso de risco?', key: 'lossWarning' },
  ...legalAgeAdvisementKeyHeader,
  { header: 'Localização', key: 'localization_legalAgeAdvisement' },
  { header: 'Porcentagem de scrollagem', key: 'scrollPercentage_legalAgeAdvisement' },
  { header: 'Ostensividade', key: 'ostentatiousness_legalAgeAdvisement' },
  { header: 'Contraste', key: 'contrast_legalAgeAdvisement' },
  { header: 'Proporção', key: 'proportion_legalAgeAdvisement' },

  ...advisementKeysHeader,
  { header: 'Localização', key: 'localization_advisement' },
  { header: 'Porcentagem de scrollagem', key: 'scrollPercentage_advisement' },
  { header: 'Ostensividade', key: 'ostentatiousness_advisement' },
  { header: 'Contraste', key: 'contrast_advisement' },
  { header: 'Proporção', key: 'proportion_advisement' },
  { header: 'Início da análise', key: 'dateStart' },
  { header: 'Fim da análise', key: 'dateEnd' }
] as const
  