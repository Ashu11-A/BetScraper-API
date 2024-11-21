import Database from '@/database/dataSource.js'
import Bet from '@/database/entity/Bet.js'
import { Property } from '@/database/entity/Property.js'
import { Task } from '@/database/entity/Task.js'
import { Exporter } from '@/exporter/exporter.js'
import { betsHeader } from './exporter/bets.js'
import { style } from './exporter/style.js'
import { advisementKeysHeader, keysHeader } from './exporter/warns.js'
import { writeFile } from 'fs/promises'

type PropKeys = typeof betsHeader[number]['key']

await Database.initialize()
const table = new Exporter()
  .createWorksheet('Geral')
  .setColumns(betsHeader)
  .ajustColumn()

const properties: Array<Partial<Record<PropKeys, string>>> = []
const data: Task[] = []
const keys = new Map<'advisement' | 'legalAgeAdvisement', string[]>([])
const bets = await Bet.find({ order: { name: 'ASC' }})

for (const bet of bets) {
  console.log(`[${bet.id}] Bet ${bet.url}`)
  const task = await Task.findOneOrFail({
    where: { bet: { id: bet.id } },
    relations: {
      properties: {
        compliances: true
      }
    },
    order: { id: 'DESC' }
  })
  data.push(task)

  const keysSorted = keysHeader.toSorted((a, b) => a.header.localeCompare(b.header))

  for (const column of keysSorted) {
    const type = advisementKeysHeader.find((item) => item.key === column.key) ? 'advisement' : 'legalAgeAdvisement'
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

    const foundCompliance = task.properties?.some((properties) => {
      return properties.compliances?.some((compliance) => compliance.value === column.header)
    })

    const property = findMostRelevantProperty(task, column.header)
    const localization = determineLocalization(property ?? undefined)

    table
      .createWorksheet(column.header)
      .setColumns<typeof header>(header)
      .addRow<typeof header>({
        bet: bet.name,
        url: bet.url,
        [column.key]: foundCompliance ? 'Sim' : 'Não',
        scrollPercentage: `${property?.scrollPercentage.toFixed(2) ?? '0'}%`,
        localization: localization,
        ostentatiousness: (property?.contrast ?? 0) >= 4.5 ? 'Sim' : 'Não',
        contrast:  String(property?.contrast ?? 0),
      })
      .setStyle(style)
      .ajustColumn()

    properties.push({
      bet: bet.name,
      url: bet.url,
      error: task.errorMessage,
      ageRestriction: (foundCompliance && type === 'legalAgeAdvisement') ? 'Sim' : 'Não',
      lossWarning: (foundCompliance && type === 'advisement') ? 'Sim' : 'Não',
      [column.key]: foundCompliance ? 'Sim' : 'Não',
      [`scrollPercentage_${type}`]: `${property?.scrollPercentage.toFixed(2) ?? '0'}%`,
      [`localization_${type}`]: localization,
      [`ostentatiousness_${type}`]: (property?.contrast ?? 0) >= 4.5 ? 'Sim' : 'Não',
      [`contrast_${type}`]:  String(property?.contrast ?? 0),
      // proportion: String(property?.proportionPercentage ?? '0'),
    })
    keys.set(type, Object.assign(keys.get(type) ?? [], [column.key]))
  }
}

await writeFile('properties.json', JSON.stringify(properties, null, 2))
await writeFile('tasks.json', JSON.stringify(data, null, 2))

for (const bet of bets) {
  const property = properties.filter((property) => property.url === bet.url)

  const merged = property.reduce((acc, item) => {
    if (!acc.bet) {
      Object.assign(acc, item)
      return acc
    }

    const currentType =
      item.scrollPercentage_legalAgeAdvisement !== undefined
        ? 'legalAgeAdvisement'
        : 'advisement'
    const scrollKey = `scrollPercentage_${currentType}` as const
    const localizationKey = `localization_${currentType}` as const
    const ostentatiousnessKey = `ostentatiousness_${currentType}` as const
    const contrastKey = `contrast_${currentType}` as const

    // Valores de scroll
    const currentScroll = parseFloat(acc[scrollKey] ?? 'Infinity')
    const newScroll = parseFloat(item[scrollKey] ?? 'Infinity')

    // Substituir valores baseados no menor scrollPercentage
    if (newScroll > 0 && newScroll < currentScroll) {
      acc[scrollKey] = item[scrollKey]
      acc[localizationKey] = item[localizationKey]
      acc[ostentatiousnessKey] = item[ostentatiousnessKey]
      acc[contrastKey] = item[contrastKey]
    }

    // Adicionar outras chaves, se não existirem
    Object.keys(item).forEach((key) => {
      // Adiciona a chave se ela não estiver no acc (undefined)
      // não pode ser scrollPercentage, se não a substituição das variaveis fica travada em 0%
      if (acc.ageRestriction === undefined || acc.ageRestriction === 'Não')  acc.ageRestriction = item.ageRestriction
      if (acc.lossWarning === undefined  || acc.lossWarning === 'Não')  acc.lossWarning = item.lossWarning
      if (acc[key as PropKeys] === undefined && !key.includes('scrollPercentage')) {
        console.log(key, acc[key as PropKeys], item[key as PropKeys])
        acc[key as PropKeys] = item[key as PropKeys]
      }
    })

    return acc
  }, {} as Partial<Record<PropKeys, string>>)

  table
    .createWorksheet('Geral')
    .addRow<typeof betsHeader>(merged)
    .ajustColumn()
}

await table.toFile('table.xlsx')
await Database.destroy()

function findMostRelevantProperty(task: Task, columnName: string): Property | null | undefined {
  return task.properties?.reduce((smallest, current) => {
    const compliance = current.compliances?.find((compliance) => compliance.value.includes(columnName))

    if (
      compliance &&
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
}


// Determina a localização com base nas propriedades de scrollPercentage e isInViewport
function determineLocalization(property?: Property) {
  if (!property?.scrollPercentage) return 'Não existe'

  if (property.scrollPercentage <= 5) return 'Topo da página'
  if (property.scrollPercentage >= 95) return 'Final da página'

  return property.isInViewport ? 'Na página renderizada' : 'Na parte não renderizada'
}

