export const advisementKeysHeader = [
  { header: 'Jogue com responsabilidade', key: 'playResponsibly' },
  { header: 'Apostas são atividades com riscos de perdas financeiras', key: 'gamblingFinancialRisk' },
  { header: 'Apostar pode levar à perda de dinheiro', key: 'bettingCanCauseLoss' },
  { header: 'As chances são de que você está prestes a perder', key: 'likelyToLose' },
  { header: 'Aposta não é investimento', key: 'bettingNotInvestment' },
  { header: 'Apostar pode causar dependência', key: 'bettingCanCauseDependency' },
  { header: 'Apostas esportivas: pratique o jogo seguro', key: 'sportsBettingPlaySafe' },
  { header: 'Apostar não deixa ninguém rico', key: 'bettingNoGetRich' },
  { header: 'Saiba quando apostar e quando parar', key: 'knowWhenToBetStop' },
  { header: 'Aposta é assunto para adultos', key: 'bettingForAdultsOnly' }
] as const

export const legalAgeAdvisementKeyHeader = [
  { header: '18+', key: 'eighteenPlus' },
  { header: 'Proibido para menores de 18 anos', key: 'prohibitedUnderEighteen' },
] as const

export const keysHeader = [...advisementKeysHeader, ...legalAgeAdvisementKeyHeader] as const