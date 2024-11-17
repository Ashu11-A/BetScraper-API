import Database from '@/database/dataSource.js'
import Bet from '@/database/entity/Bet.js'
import { ComplianceType } from '@/database/entity/Compliance.js'
import { Task } from '@/database/entity/Task.js'
import { Exporter } from '@/exporter/exporter.js'
import { betsHeader } from './exporter/bets.js'
import { style } from './exporter/style.js'
import { keysHeader } from './exporter/warns.js'
// type ComplianceKeys = typeof keysHeader[number]['key']
type PropKeys = typeof betsHeader[number]['key']

await Database.initialize()
const table = new Exporter()
  .createWorksheet('Geral')
  .setColumns(betsHeader)
  .ajustColumn()

  
const properties: Array<Record<Partial<PropKeys>, string>> = []
const bets = await Bet.find({ order: { name: 'ASC' }})

for (const bet of bets) {
  const task = await Task.findOneOrFail({
    where: { bet: { id: bet.id } },
    relations: ['properties', 'compliances'],
    order: { id: 'DESC' }
  })

  // const pageRendered = 0
  // const pageNotRendered = 0
  // const pageTop = 0
  // const pageEnd = 0
  let lossWarning = 0
  let ageRestriction = 0

  const keysSorted = keysHeader.toSorted((a, b) => a.header.localeCompare(b.header))
  for (const column of keysSorted) {
    const header = [
      { header: 'Bet', key: 'bet' },
      { header: 'URL', key: 'url' },
      { header: `Contém: "${column.header}"?`, key: column.key },
      { header: 'Localização', key: 'localization' },
      { header: 'Porcentagem de scrollagem', key: 'scrollPercentage' },
      { header: 'Ostensividade', key: 'ostentatiousness' },
      { header: 'Contraste', key: 'contrast' },
      // { header: 'Proporção', key: 'proportion' },
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
        current.compliance.value.includes(column.header) &&
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
    if (!property) continue

    // Determina a localização com base nas propriedades de scrollPercentage e isInViewport
    const localization = property && property.scrollPercentage !== undefined
      ? property.scrollPercentage <= 5
        ? 'Topo da página'
        : property.scrollPercentage >= 95
          ? 'Final da página'
          : property.isInViewport
            ?  'Na página renderizada'
            :  'Na parte não renderizada'
      : 'Não existe'

    properties.push({
      bet: bet.name,
      url: bet.url,
      [column.key]: foundCompliance ? 'Sim' : 'Não',
      // proportion: String(property?.proportionPercentage ?? '0'),
      scrollPercentage: `${property?.scrollPercentage.toFixed(2) ?? '0'}%`,
      localization: localization,
      ostentatiousness: (property?.contrast ?? 0) >= 4.5 ? 'Sim' : 'Não',
      contrast: String(property?.contrast ?? '0'),
    })

    table
      .createWorksheet(column.header)
      .setColumns<typeof header>(header)
      .addRow<typeof header>({

      })
      .setStyle(style)
      .ajustColumn()
  }
}

for (const prop of properties) {
  table
    .createWorksheet('Geral')
    .addRow<typeof betsHeader>(prop)
    .ajustColumn()
}

await table.toFile('table.xlsx')
await Database.destroy()

