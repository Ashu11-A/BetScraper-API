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
  { header: 'Apenas para maiores de 18 anos', key: 'onlyOverEighteen' },
  { header: 'Somente maiores de 18', key: 'onlyAdultsOverEighteen' },
  { header: 'Idade mínima de 18 anos', key: 'minimumAgeEighteen' },
  { header: 'Permitido apenas para maiores de 18', key: 'allowedOverEighteenOnly' },
  { header: 'Maioridade obrigatória', key: 'mandatoryAdulthood' },
  { header: 'Proibido para menores', key: 'prohibitedForMinors' },
  { header: 'Restrito para maiores de idade', key: 'restrictedToAdults' },
  { header: 'Conteúdo para maiores de 18', key: 'contentOverEighteen' },
  { header: 'Somente para adultos', key: 'adultsOnly' },
  { header: 'Exclusivo para maiores de 18', key: 'exclusiveOverEighteen' },
  { header: 'Necessário ter 18 anos ou mais', key: 'requiredOverEighteen' },
  { header: 'Não permitido para menores de 18', key: 'notAllowedUnderEighteen' },
  { header: 'Restrições para menores de 18', key: 'restrictionsUnderEighteen' },
  { header: 'Conteúdo adulto, maiores de 18', key: 'adultContentOverEighteen' },
  { header: 'Acesso restrito a maiores de 18 anos', key: 'accessRestrictedOverEighteen' },
  { header: 'Apenas 18 anos ou mais', key: 'onlyOverEighteenAge' },
  { header: 'Limite de idade: 18 anos', key: 'ageLimitEighteen' },
  { header: 'Proibido para menores de idade', key: 'prohibitedForUnderage' },
  { header: 'Conteúdo proibido para menores', key: 'contentProhibitedForMinors' },
  { header: 'Permitido apenas para maiores', key: 'allowedForAdultsOnly' },
  { header: 'Exclusivo para adultos (18+)', key: 'adultsOnlyExclusive' },
  { header: 'Acesso somente para maiores de 18 anos', key: 'accessAdultsOnly' },
] as const

export const keysHeader = [...advisementKeysHeader, ...legalAgeAdvisementKeyHeader] as const