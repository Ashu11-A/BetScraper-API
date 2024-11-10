import Database from '@/database/dataSource.js'
import Bet from '@/database/entity/Bet.js'
import { Task } from '@/database/entity/Task.js'
import { Exporter } from '@/exporter/exporter.js'
import { format } from 'date-fns'
import { Style } from 'exceljs'

const style: Style = {
  numFmt: 'General',
  font: {
    size: 12,  // Ajuste o tamanho da fonte para garantir que o texto seja legível.
    bold: false,
  },
  alignment: {
    horizontal: 'fill',  // Faz com que o texto preencha a largura da célula.
    vertical: 'justify', // Centraliza o texto verticalmente.
    shrinkToFit: false,  // Não encolhe o texto automaticamente.
    indent: 0,           // Sem indentação para maximizar a área útil.
  },
  protection: {},
  border: {
    top: { style: 'thin', color: { argb: 'FF000000' } },
    left: { style: 'thin', color: { argb: 'FF000000' } },
    bottom: { style: 'thin', color: { argb: 'FF000000' } },
    right: { style: 'thin', color: { argb: 'FF000000' } },
  },
  fill: {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFFFFF' },
  },
}

const betsHeader = [
  { header: 'Bet', key: 'bet' },
  { header: 'URL', key: 'url' },
  { header: 'Erro', key: 'erro' },
  { header: 'Contém aviso de restrição etária?', key: 'restricaoEtaria' },
  { header: 'Contém aviso de perdas?', key: 'avisoPerdas' },
  { header: 'Avisos no topo da página', key: 'topoPagina' },
  { header: 'Avisos na página inicial', key: 'paginaInicial' },
  { header: 'Avisos no final da página', key: 'finalPagina' },
  { header: 'Início da análise', key: 'inicioAnalise' },
  { header: 'Fim da análise', key: 'fimAnalise' }
] as const
const keysHeader = [
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
// type ComplianceKeys = typeof keysHeader[number]['key']

await Database.initialize()
const table = new Exporter()
  .createWorksheet('Geral')
  .setColumns<typeof betsHeader>(betsHeader)

const bets = await Bet.find({
  order: {
    name: 'ASC'
  }
})
for (const bet of bets) {
  const task = await Task.findOneOrFail({
    where: {
      bet: { id: bet.id }
    },
    relations: ['properties', 'compliances'],
    order: { 
      id: 'DESC',
    }
  })

  table
    .useWorkshet('Geral')
    .addRow({
      bet: bet.name,
      url: bet.url,
      erro: task.errorMessage ?? '',
      inicioAnalise: task.scheduledAt ? format(task.scheduledAt, 'dd/MM/yyyy \'às\' HH:mm:ss') : 'Houve um erro no processo',
      fimAnalise: format(task.finishedAt ?? task.updatedAt, 'dd/MM/yyyy \'às\' HH:mm:ss'),

    })
    .setStyle(style)
    .ajustColumn()
  for (const column of keysHeader) {
    const header = [
      { header: 'Bet', key: 'bet' },
      { header: 'URL', key: 'url' },
      { header: `Contém: "${column.header}"?`, key: column.key },
      { header: 'Localização', key: 'localization' },
      { header: 'Porcentagem de scrollagem', key: 'scrollPercentage' },
      { header: 'Proporção', key: 'proportion' },
      { header: 'Contraste', key: 'contrast' },
    ] as const
    const foundCompliance = task.compliances.some((compliance) => compliance.value === column.header)
    // const property = task.properties?.find((property) => property.content.includes(column.header) && property.hasChildNodes === false)
    const property = task.properties?.reduce((smallest, current) => {
      // Verifica se 'current.content' inclui 'column.header' e 'proportionPercentage' é maior que 0
      if (current.content.includes(column.header) && current.proportionPercentage > 0) {
        // Se 'smallest' não estiver definido, ou se 'current.distanceToTop' for menor que 'smallest.distanceToTop'
        // ou, em caso de empate em 'distanceToTop', 'current.proportionPercentage' for maior que 'smallest.proportionPercentage'
        if (!smallest || 
            current.distanceToTop < smallest.distanceToTop || 
            (current.distanceToTop === smallest.distanceToTop && current.proportionPercentage > smallest.proportionPercentage)) {
          return current
        }
      }
      return smallest
    }, null as typeof task.properties[0] | null) // O valor inicial pode ser 'null'

    table
      .createWorksheet(column.key)
      .setColumns<typeof header>(header)
      .addRow<typeof header>({
        bet: bet.name,
        url: bet.url,
        [column.key]: foundCompliance ? 'Sim' : 'Não',
        contrast: String(property?.contrast ?? '0'),
        proportion: String(property?.proportionPercentage ?? '0'),
        scrollPercentage: `${property?.scrollPercentage.toFixed(2) ?? '0'}%`,
        localization: property && property.scrollPercentage !== undefined
          ? property.scrollPercentage <= 10
            ? 'Topo da página'
            : property.scrollPercentage >= 90
              ? 'Final da página'
              : property.distanceToTop < property.viewport.height === true
                ? 'Na página rederizada'
                : 'Na parte não renderizada'
          : 'Não existe',
      })
      .setStyle(style)
      .ajustColumn()
  }
}

await table.toFile('table.xlsx')
await Database.destroy()

