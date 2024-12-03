import Database from '@/database/dataSource.js'
import Bet from '@/database/entity/Bet.js'
import { OCR } from '@/database/entity/OCR.js'
import { Property } from '@/database/entity/Property.js'
import { Task } from '@/database/entity/Task.js'
import { Column, Exporter } from '@/exporter/exporter.js'
import { format } from 'date-fns'
import { writeFile } from 'fs/promises'
import { betsHeader } from './exporter/bets.js'
import { style } from './exporter/style.js'
import { advisementKeysHeader, keysHeader } from './exporter/warns.js'

type PropKeys = typeof betsHeader[number]['key'];
type HeaderKeys = typeof keysHeader[number];
type Prop = Partial<Record<PropKeys, string | number>>;
type PropertyData = ReturnType<DataExporter['getPropertyData']>;
type HeaderType = Partial<Record<ReturnType<DataExporter['createHeader']>[number]['key'], string | number>> & Prop;

export default class DataExporter {
  private bets: Bet[] = []
  private properties: Prop[] = []
  private ocrs: Prop[] = []
  private tasks: Task[] = []
  private tables = new Map<string, Exporter<readonly Column[]>>()
  private keysSorted = keysHeader.toSorted((a, b) => a.header.localeCompare(b.header))

  isProperty = (obj: Property | OCR | undefined): obj is Property => obj instanceof Property

  async initialize() {
    await Database.initialize()
    this.bets = await this.fetchBets()
    this.tables.set('properties', new Exporter()
      .createWorksheet('Geral')
      .setColumns(betsHeader)
      .ajustColumn()
    )
    this.tables.set('ocrs', new Exporter()
      .createWorksheet('Geral')
      .setColumns(betsHeader)
      .ajustColumn()
    )
    this.tables.set('merged', new Exporter()
      .createWorksheet('Geral')
      .setColumns(betsHeader)
      .ajustColumn()
    )

    return this
  }

  async exportData() {
    await Promise.all(this.bets.map((bet) => this.processBet(bet)))
    await this.finalizeExport()
    await Database.destroy()
  }

  private async fetchBets() {
    return Bet.find({ order: { id: 'ASC' } })
  }

  private async processBet(bet: Bet) {
    const props = ['ocrs', 'properties'] as const
    const property = this.tables.get('properties')
    const ocr = this.tables.get('ocrs')

    if (!property || !ocr) throw new Error('Table properties or ocr is undefined!')
  
    console.log(`[${bet.id}] Bet ${bet.url}`)
    const task = await this.fetchTask(bet)
    if (!task) return

    this.tasks.push(task)

    props.forEach((prop) => {
      const table = prop === 'properties' ? property : ocr
      const data = prop === 'properties' ? (task.properties ?? []) : (task.ocrs ?? [])
      if (prop === 'ocrs') console.log(task.ocrs)
        
      for (const column of this.keysSorted) {
        const type = advisementKeysHeader.find((item) => item.key === column.key) 
          ? 'advisement' 
          : 'legalAgeAdvisement'

  
        const header = this.createHeader(column.header, column.key)
        const props = this.getPropertyData(data, column)
        const row = this.createRow({ bet, task, properties: props, column, type })
        
        table
          .createWorksheet(column.header)
          .setColumns<typeof header>(header)
          .addRow<typeof header>(row)
          .setStyle(style)
          .ajustColumn()
  
        this[prop].push(row)
      }
    })
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
    const hasCompliance = data.some((prop) => Array.isArray(prop?.compliances) && prop.compliances.some((compliance) => compliance.value === column.header))
    
    const property = this.findMostRelevantData(data, column.header)
    const localization = this.getLocalization(property)

    return { property, localization, hasCompliance }
  }

  private mergeProperties(property: Prop[]): Prop {
    return property.reduce((acc, item) => {
      if (!acc.bet) {
        Object.assign(acc, item)
        return acc
      }
  
      const currentType = item.scrollPercentage_legalAgeAdvisement !== undefined
        ? 'legalAgeAdvisement'
        : 'advisement'
  
      const scrollKey = `scrollPercentage_${currentType}` as const
      const localizationKey = `localization_${currentType}` as const
      const ostentatiousnessKey = `ostentatiousness_${currentType}` as const
      const contrastKey = `contrast_${currentType}` as const
  
      const currentScroll = parseFloat(String(acc[scrollKey]))
      const newScroll = parseFloat(String(item[scrollKey]))
  
      if (/*newScroll > 0 && */newScroll < currentScroll) {
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
  }): HeaderType {
    const scrollPercentageType = `scrollPercentage_${type}` as const
    const localizationType = `localization_${type}` as const
    const ostentatiousnessType = `ostentatiousness_${type}` as const
    const contrastType = `contrast_${type}` as const
    const proportionType = `proportion_${type}` as const

    return {
      id: bet.id,
      bet: bet.name,
      url: bet.url,
      [column.key]: hasCompliance ? 'Sim' : 'Não',

      localization: localization,
      scrollPercentage: `${property?.scrollPercentage.toFixed(2) ?? '0'}%`,
      error: task.errorMessage ?? '',
      ageRestriction: hasCompliance && type === 'legalAgeAdvisement' ? 'Sim' : 'Não',
      lossWarning: property && type === 'advisement' ? 'Sim' : 'Não',
      ...(this.isProperty(property)
        ? {
          ostentatiousness: (property?.contrast ?? 0) >= 4.5 ? 'Sim' : 'Não',
          contrast:  String(property?.contrast ?? 0),
          [ostentatiousnessType]: property?.contrast ? (property.contrast >= 4.5 ? 'Sim' : 'Não') : undefined,
          [contrastType]: property?.contrast ?? '',
        }
        : {}),
      [localizationType]: localization,
      [scrollPercentageType]: property?.scrollPercentage ? `${property.scrollPercentage.toFixed(2)}%` : undefined,
      
      proportion: `${property?.proportionPercentage.toFixed(2) ?? 0}%`,
      [proportionType]: property?.proportionPercentage ? `${property.proportionPercentage.toFixed(2)}%` : undefined,
      
      dateStart: task.scheduledAt ? format(task.scheduledAt, 'dd/MM/yyyy às HH:mm:ss') : 'Não inicializado',
      dateEnd: task.finishedAt ? format(task.finishedAt, 'dd/MM/yyyy às HH:mm:ss') : 'Não finalizado',
    }
  }

  private findMostRelevantData(props: Property[] | OCR[], columnName: string): Property | OCR | undefined {
    return props.reduce((smallest, current) => {
      const compliance = current.compliances?.find((compliance) => compliance.value.includes(columnName))

      if (
        compliance &&
        // current.proportionPercentage > 0 &&
        (!smallest || current.distanceToTop < smallest.distanceToTop)
      ) {
        return current
      }
      return smallest
    }, undefined as Property | OCR | undefined)
  }

  private getLocalization(property?: Property | OCR): string {
    if (!property?.scrollPercentage) return 'Não existe'
    if (property.scrollPercentage <= 0) return 'Hidden'
    if (property.scrollPercentage <= 5) return 'Topo da página'
    if (property.scrollPercentage >= 95) return 'Final da página'
  
    return property.isInViewport ? 'Na página renderizada' : 'Na parte não renderizada'
  }

  private async finalizeExport() {
    const props = ['ocrs', 'properties', 'merge'] as const
    const property = this.tables.get('properties')
    const ocr = this.tables.get('ocrs')
    const merged = this.tables.get('merged')
    if (!property || !ocr || !merged) throw new Error('Table property, ocr or merged is undefined!')
  
    await writeFile('properties.json', JSON.stringify(this.properties, null, 2))
    await writeFile('tasks.json', JSON.stringify(this.tasks, null, 2))


    props.forEach(async (prop) => {
      const table = prop === 'properties'
        ? property
        : prop === 'ocrs'
          ? ocr
          : merged
        
      this.bets.forEach((bet) => {
        const table = prop === 'properties'
          ? property
          : prop === 'ocrs'
            ? ocr
            : merged
  
        const properties = prop === 'merge'
          ? [
            ...this.properties.filter((item) => item.url === bet.url),
            ...this.ocrs.filter((item) => item.url === bet.url),
          ]
          : this[prop].filter((item) => item.url === bet.url)

        // if (prop === 'merge') console.log(properties)

        const data = this.mergeProperties(properties)
    
        table.useWorkshet('Geral')
          .addRow<typeof betsHeader>(data)
      })
        
      table.useWorkshet('Geral').ajustColumn()
      await table.toFile(`${prop}.xlsx`)
    })
  }
}

const exporter = new DataExporter()
await exporter.initialize()
await exporter.exportData()