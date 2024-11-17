import { advisementKeysHeader, legalAgeAdvisementKeyHeader } from './warns.js'

export const betsHeader = [
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
  ...advisementKeysHeader,
  { header: 'Localização', key: 'localization_advisement' },
  { header: 'Porcentagem de scrollagem', key: 'scrollPercentage_advisement' },
  { header: 'Ostensividade', key: 'ostentatiousness_advisement' },
  { header: 'Contraste', key: 'contrast_advisement' },
  /*
    { header: 'Proporção', key: 'proportion' },
    { header: 'Proporção', key: 'proportion' },
    { header: 'Avisos no topo da página', key: 'pageTop' },
    { header: 'Avisos na página rederizada', key: 'pageRendered' },
    { header: 'Avisos na página não rederizada', key: 'pageNotRendered' },
    { header: 'Avisos no final da página', key: 'pageEnd' },
    { header: 'Início da análise', key: 'analysisStart' },
    { header: 'Fim da análise', key: 'analysisEnd' }
  */
] as const
  