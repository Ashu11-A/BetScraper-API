import Database from '@/database/dataSource.js'
import Bet from '@/database/entity/Bet.js'
import { Task } from '@/database/entity/Task.js'
import { Exporter } from '@/exporter/exporter.js'
import { format } from 'date-fns'
import { betsHeader } from './exporter/bets.js'
import { style } from './exporter/style.js'
import { keysHeader } from './exporter/warns.js'
import { ComplianceType } from '@/database/entity/Compliance.js'
// type ComplianceKeys = typeof keysHeader[number]['key']

await Database.initialize()
const table = new Exporter()
  .createWorksheet('Geral')
  .setColumns(betsHeader)
  .ajustColumn()

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

  let pageRendered = 0
  let pageNotRendered = 0
  let pageTop = 0
  let pageEnd = 0
  let lossWarning = 0
  let ageRestriction = 0
  
  for (const column of keysHeader.toSorted((a, b) => a.header.localeCompare(b.header))) {
    const header = [
      { header: 'Bet', key: 'bet' },
      { header: 'URL', key: 'url' },
      { header: `Contém: "${column.header}"?`, key: column.key },
      { header: 'Localização', key: 'localization' },
      { header: 'Porcentagem de scrollagem', key: 'scrollPercentage' },
      { header: 'Proporção', key: 'proportion' },
      { header: 'Contraste', key: 'contrast' },
    ] as const
  
    const foundCompliance = task.compliances.some((compliance) => {
      if (compliance.value === column.header) {
        switch (compliance.type) {
        case ComplianceType.Advisement:{
          lossWarning++
          break
        }
        case ComplianceType.LegalAgeAdvisement: {
          ageRestriction++
        }
        }
        return true
      }
      return false
    })
  
    const property = task.properties?.reduce((smallest, current) => {
      if (
        current.content.includes(column.header) &&
        current.proportionPercentage > 0
      ) {
        if (
          !smallest ||
          current.distanceToTop < smallest.distanceToTop ||
          (current.distanceToTop === smallest.distanceToTop &&
            current.proportionPercentage > smallest.proportionPercentage)
        ) {
          return current
        }
      }
      return smallest
    }, null as typeof task.properties[0] | null)
  
    // Determina a localização com base nas propriedades de scrollPercentage e isInViewport
    const localization = property && property.scrollPercentage !== undefined
      ? property.scrollPercentage <= 10
        ? (pageTop++, 'Topo da página')
        : property.scrollPercentage >= 90
          ? (pageEnd++, 'Final da página')
          : property.isInViewport
            ? (pageRendered++, 'Na página renderizada')
            : (pageNotRendered++, 'Na parte não renderizada')
      : 'Não existe'
    table
      .createWorksheet(column.header)
      .setColumns<typeof header>(header)
      .addRow<typeof header>({
        bet: bet.name,
        url: bet.url,
        [column.key]: foundCompliance ? 'Sim' : 'Não',
        contrast: String(property?.contrast ?? '0'),
        proportion: String(property?.proportionPercentage ?? '0'),
        scrollPercentage: `${property?.scrollPercentage.toFixed(2) ?? '0'}%`,
        localization: localization
          
      })
      .setStyle(style)
      .ajustColumn()
  }

  table
    .createWorksheet('Geral')
    .addRow<typeof betsHeader>({
      bet: bet.name,
      url: bet.url,
      error: task.errorMessage ?? '',
      analysisStart: task.scheduledAt ? format(task.scheduledAt, 'dd/MM/yyyy \'at\' HH:mm:ss') : 'An error occurred in the process',
      analysisEnd: format(task.finishedAt ?? task.updatedAt, 'dd/MM/yyyy \'at\' HH:mm:ss'),
      pageRendered: String(pageRendered),
      pageNotRendered: String(pageNotRendered),
      pageEnd: String(pageEnd),
      pageTop: String(pageTop),
      lossWarning: lossWarning > 0 ? 'Sim' : 'Não',
      ageRestriction: ageRestriction > 0 ? 'Sim' : 'Não'
    })
    .ajustColumn()

}

await table.toFile('table.xlsx')
await Database.destroy()

