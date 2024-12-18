import Database from '@/database/dataSource.js'
import Bet from '@/database/entity/Bet.js'
import { OCR } from '@/database/entity/OCR.js'
import { Property } from '@/database/entity/Property.js'
import { Task } from '@/database/entity/Task.js'
import { Column, Exporter } from '@/controllers/exporter.js'
import { format } from 'date-fns'
import { writeFile } from 'fs/promises'
import { betsHeader } from './exporter/bets.js'
import { advisementKeysHeader, keysHeader } from './exporter/warns.js'

type PropKeys = typeof betsHeader[number]['key'];
type Prop = Partial<Record<PropKeys, string | number>>;
type PropertyData = ReturnType<DataExporter['getPropertyData']>;

type HeaderProp = typeof keysHeader[number];
type HeaderKeys = ReturnType<DataExporter['createHeader']>[number]['key']
type HeaderType = Partial<Record<HeaderKeys, string | number>> & Prop;

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

  private createHeader(name: HeaderProp['header'], key: HeaderProp['key']) {
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

  private getPropertyData(data: Property[] | OCR[], column: HeaderProp) {
    const hasCompliance = data.some((prop) => Array.isArray(prop?.compliances) && prop.compliances.some((compliance) => compliance.value === column.header))
    
    const property = this.findMostRelevantData(data, column.header)
    const localization = this.getLocalization(property)

    return { property, localization, hasCompliance }
  }

  private mergeProperties(properties: Prop[]): Prop {
    return properties.sort((a, b) => Number(a.id) - Number(b.id)).reduce((acc, item) => {
      if (!acc.bet) {
        Object.assign(acc, item)
        return acc
      }
  
      const typeKey = item.scrollPercentage_advisement !== undefined
        ? 'legalAgeAdvisement'
        : 'advisement'
  
      const createKey = (base: Exclude<HeaderKeys, PropKeys>) => `${base}_${typeKey}` as const
  
      const scrollKey = createKey('scrollPercentage')
      const localizationKey = createKey('localization')
      const ostentatiousnessKey = createKey('ostentatiousness')
      const contrastKey = createKey('contrast')
  
      const currentScroll = parseFloat(String(acc[scrollKey])) || Infinity
      const newScroll = parseFloat(String(item[scrollKey])) || Infinity
  
      // Atualiza se `newScroll` for menor.
      if (newScroll < currentScroll) {
        acc[scrollKey] = item[scrollKey]
        acc[localizationKey] = item[localizationKey]
        acc[ostentatiousnessKey] = item[ostentatiousnessKey]
        acc[contrastKey] = item[contrastKey]
      }
  
      Object.keys(item).forEach((key) => {
        const typedKey = key as PropKeys
  
        if (
          acc[typedKey] === undefined
          || ['Não encontrada', 'Não'].includes(acc[typedKey].toString())
          // && !key.startsWith('scrollPercentage')
        ) {
          acc[typedKey] = item[typedKey]
        }
      })
  
      return acc
    }, {} as Partial<Record<PropKeys, string | number | undefined>>)
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
    column: HeaderProp;
    type: 'advisement' | 'legalAgeAdvisement';
  }): HeaderType {
    return {
      id: bet.id,
      bet: bet.name,
      url: bet.url,
      [column.key]: hasCompliance ? 'Presente' : 'Não encontrada',

      error: task.errorMessage ?? '',
      ageRestriction: hasCompliance && type === 'legalAgeAdvisement' ? 'Presente' : 'Não encontrada',
      lossWarning: property && type === 'advisement' ? 'Presente' : 'Não encontrada',
      ...(this.isProperty(property)
        ? {
          ostentatiousness: (property?.contrast ?? 0) >= 4.5 ? 'Sim' : 'Não',
          contrast:  String(property?.contrast ?? 0),
          [`ostentatiousness_${type}`]: property?.contrast ? (property.contrast >= 4.5 ? 'Sim' : 'Não') : undefined,
          [`contrast_${type}`]: property?.contrast ?? '',
        }
        : {}),
      
      localization: localization,
      [`localization_${type}`]: localization,

      scrollPercentage: `${property?.scrollPercentage.toFixed(2) ?? '0'}%`,
      [`scrollPercentage_${type}`]: property?.scrollPercentage ? `${property.scrollPercentage.toFixed(2)}%` : undefined,
      
      proportion: `${property?.proportionPercentage.toFixed(2) ?? 0}%`,
      [`proportion_${type}`]: property?.proportionPercentage ? `${property.proportionPercentage.toFixed(2)}%` : undefined,
      
      dateStart: task.scheduledAt ? format(task.scheduledAt, 'dd/MM/yyyy \'às\' HH:mm:ss') : 'Detectou-se um erro.',
      dateEnd: format(task?.finishedAt ?? task.updatedAt, 'dd/MM/yyyy \'às\' HH:mm:ss'),
    }
  }

  private findMostRelevantData(props: Property[] | OCR[], columnName: string): Property | OCR | undefined {
    return props.reduce((smallest, current) => {
      const compliance = current.compliances?.find((compliance) => compliance.value.includes(columnName))

      if (
        compliance &&
        current.proportionPercentage > 0 &&
        current.proportionPercentage < 100 &&
        (!smallest || current.proportionPercentage < smallest.proportionPercentage || current.distanceToTop < smallest.distanceToTop)
      ) {
        return current
      }
      return smallest
    }, undefined as Property | OCR | undefined)
  }
  
  findMostRelevantData2(props: Property[] | OCR[], columnName: string) {
    // Calculate the smallest proportionPercentage and smallest distanceToTop
    const smallestData = props.reduce(
      (smallest, current) => {
        const compliance = current.compliances?.find((compliance) => compliance.value.includes(columnName))
  
        if (
          compliance &&
          current.proportionPercentage > 0 &&
          current.proportionPercentage < 100 &&
          (!smallest || current.proportionPercentage < smallest.proportionPercentage || 
            (current.proportionPercentage === smallest.proportionPercentage && current.distanceToTop < smallest.distanceToTop))
        ) {
          return current
        }
        return smallest
      },
      undefined as Property | OCR | undefined
    )
  
    if (smallestData) {
      // Calculate the average values
      const totalData = props.reduce((acc, current) => {
        const compliance = current.compliances?.find((compliance) => compliance.value.includes(columnName))
        if (compliance && current.proportionPercentage > 0 && current.proportionPercentage < 100) {
          return {
            proportionPercentage: acc.proportionPercentage + current.proportionPercentage,
            distanceToTop: acc.distanceToTop + current.distanceToTop,
            count: acc.count + 1
          }
        }
        return acc
      }, { proportionPercentage: 0, distanceToTop: 0, count: 0 })
  
      const averageProportionPercentage = totalData.proportionPercentage / totalData.count
      const averageDistanceToTop = totalData.distanceToTop / totalData.count
  
      // Return the Property or OCR that matches the average
      return props.find((item) => 
        item.proportionPercentage === averageProportionPercentage && 
        item.distanceToTop === averageDistanceToTop
      )
    }
  
    return undefined
  }  

  private getLocalization(property?: Property | OCR): string {
    if (property === undefined) return 'Não encontrada'
  
    return property.isInViewport ? 'Área renderizada' : 'Área não renderizada'
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