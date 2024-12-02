import Database from '@/database/dataSource.js'
import Bet from '@/database/entity/Bet.js'
import { Property } from '@/database/entity/Property.js'
import { Task } from '@/database/entity/Task.js'
import { Exporter } from '@/exporter/exporter.js'
import { betsHeader } from './exporter/bets.js'
import { style } from './exporter/style.js'
import { advisementKeysHeader, keysHeader } from './exporter/warns.js'
import { writeFile } from 'fs/promises'
import { format } from 'date-fns'
import { OCR } from '@/database/entity/OCR.js'

type PropKeys = typeof betsHeader[number]['key'];
type HeaderKeys = typeof keysHeader[number];
type Prop = Partial<Record<PropKeys, string | number>>;
type PropertyData = ReturnType<DataExporter['getPropertyData']>;

export default class DataExporter {
  private bets: Bet[] = []
  private properties: Prop[] = []
  private ocrs: Prop[] = []
  private data: Task[] = []
  private keys: Map<'advisement' | 'legalAgeAdvisement', Set<string>> = new Map()
  private table = new Exporter()
  private keysSorted = keysHeader.toSorted((a, b) => a.header.localeCompare(b.header))

  async initialize() {
    await Database.initialize()
    this.bets = await this.fetchBets()

    return this
  }

  async exportData() {
    this.table.createWorksheet('Geral')
      .setColumns(betsHeader)
      .ajustColumn()
    
    await Promise.all(this.bets.map((bet) => this.processBet(bet)))
    await this.finalizeExport()
    await Database.destroy()
  }

  private async fetchBets() {
    return Bet.find({ order: { id: 'ASC' } })
  }

  private async processBet(bet: Bet) {
    console.log(`[${bet.id}] Bet ${bet.url}`)
    const task = await this.fetchTask(bet)
    if (!task) return

    this.data.push(task)

    for (const column of this.keysSorted) {
      const type = advisementKeysHeader.find((item) => item.key === column.key) 
        ? 'advisement' 
        : 'legalAgeAdvisement'

      const header = this.createHeader(column.header, column.key)
      const props = this.getPropertyData(task.properties ?? [], column)
      const propsOCR = this.getPropertyData(task.ocrs ?? [], column)

      const row = this.createRow({ bet, task, properties: props, column, type })
      const rowOCR = this.createRow({ bet, task, properties: propsOCR, column, type })

      this.table
        .createWorksheet(column.header)
        .setColumns<typeof header>(header)
        .addRow<typeof header>(row)
        .setStyle(style)
        .ajustColumn()

      this.properties.push(row)
      this.ocrs.push(rowOCR)

      if (!this.keys.has(type)) this.keys.set(type, new Set())
      this.keys.get(type)!.add(column.key)
    }
  }

  private async fetchTask(bet: Bet): Promise<Task | null> {
    return Task.findOne({
      where: { bet: { id: bet.id } },
      relations: {
        ocrs: { compliances: true },
        properties: { compliances: true },
      },
      order: { id: 'DESC' },
    })
  }

  private createHeader(name: HeaderKeys['header'], key: HeaderKeys['key']) {
    return [
      { header: 'Id', key: 'id' },
      { header: 'Bet', key: 'bet' },
      { header: 'URL', key: 'url' },
      { header: `Contém: "${name}"?`, key },
      { header: 'Localização', key: 'localization' },
      { header: 'Porcentagem de scrollagem', key: 'scrollPercentage' },
      { header: 'Ostensividade', key: 'ostentatiousness' },
      { header: 'Contraste', key: 'contrast' },
      { header: 'Proporção', key: 'proportion' },
      { header: 'Início da análise', key: 'dateStart' },
      { header: 'Fim da análise', key: 'dateEnd' },
    ] as const
  }

  private getPropertyData(data: Property[] | OCR[], column: HeaderKeys) {
    const property = this.findMostRelevantData(data, column.key)
    const localization = this.getLocalization(property)

    const hasCompliance = data.some((prop) => 
      (prop?.compliances ?? []).some((compliance) => compliance.value === column.header)
    )

    return { property, localization, hasCompliance }
  }

  private mergeProperties(property: Prop[]): Prop {
    return property.reduce((acc, item) => {
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
  
      const currentScroll = parseFloat(String(acc[scrollKey]))
      const newScroll = parseFloat(String(item[scrollKey]))
  
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
  }

  private createRow({
    bet,
    task,
    properties: { localization, property, hasCompliance },
    column,
    type,
  }: {
    bet: Bet;
    task: Task;
    properties: PropertyData;
    column: HeaderKeys;
    type: 'advisement' | 'legalAgeAdvisement';
  }): Prop {
    const scrollPercentageType = `scrollPercentage_${type}` as const
    const localizationType = `localization_${type}` as const
    const ostentatiousnessType = `ostentatiousness_${type}` as const
    const contrastType = `contrast_${type}` as const
    const proportionType = `proportion_${type}` as const

    const isProperty = (obj: Property | OCR | undefined): obj is Property => {
      return !!obj && 'contrast' in obj
    }    

    return {
      id: bet.id,
      bet: bet.name,
      url: bet.url,
      error: task.errorMessage ?? '',
      ageRestriction: hasCompliance && type === 'legalAgeAdvisement' ? 'Sim' : 'Não',
      lossWarning: property && type === 'advisement' ? 'Sim' : 'Não',
      [column.key]: hasCompliance ? 'Sim' : 'Não',
      [scrollPercentageType]: property?.scrollPercentage
        ? `${property.scrollPercentage.toFixed(2)}%`
        : '',
      [localizationType]: localization,
      ...(isProperty(property)
        ? {
          [ostentatiousnessType]: property?.contrast ? (property.contrast >= 4.5 ? 'Sim' : 'Não') : '',
          [contrastType]: property?.contrast ?? '',
        }
        : {}),
      [proportionType]: property?.proportionPercentage
        ? `${property.proportionPercentage.toFixed(2)}%`
        : '',
      dateStart: task.scheduledAt
        ? format(task.scheduledAt, 'dd/MM/yyyy às HH:mm:ss')
        : 'Não inicializado',
      dateEnd: task.finishedAt
        ? format(task.finishedAt, 'dd/MM/yyyy às HH:mm:ss')
        : 'Não finalizado',
    }
  }

  private findMostRelevantData(props: Property[] | OCR[], columnName: string): Property | OCR | undefined {
    return props.reduce((smallest, current) => {
      const compliance = current.compliances?.find((compliance) =>
        compliance.value.includes(columnName)
      )

      if (
        compliance &&
        current.proportionPercentage > 0 &&
        (!smallest || current.distanceToTop < smallest.distanceToTop)
      ) {
        return current
      }
      return smallest
    }, undefined as Property | OCR | undefined)
  }

  private getLocalization(property?: Property | OCR): string {
    if (!property?.scrollPercentage) return 'Não existe'
    if (property.scrollPercentage <= 5) return 'Topo da página'
    if (property.scrollPercentage >= 95) return 'Final da página'
    return property.isInViewport ? 'Na página renderizada' : 'Na parte não renderizada'
  }

  private async finalizeExport() {
    await writeFile('properties.json', JSON.stringify(this.properties, null, 2))
    await writeFile('tasks.json', JSON.stringify(this.data, null, 2))

    await Promise.all(
      this.bets.map(async (bet) => {
        const properties = this.ocrs.filter((item) => item.url === bet.url)
        const merged = this.mergeProperties(properties)
    
        this.table.useWorkshet('Geral').addRow<typeof betsHeader>(merged)
      })
    )

    this.table.useWorkshet('Geral').ajustColumn()
    await this.table.toFile('table.xlsx')
  }
}

const exporter = new DataExporter()
await exporter.initialize()
await exporter.exportData()