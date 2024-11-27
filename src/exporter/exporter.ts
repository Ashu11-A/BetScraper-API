import { Style, Workbook, Worksheet } from 'exceljs'
import { removeSpecialCharacters } from 'scripts/libs/parser.js'

export type Column = {
  readonly header: string;
  readonly key: string;
};

type ColumnData<T extends readonly Column[]> = {
  [K in Extract<T[number]['key'], string>]?: string | number;
};
// Omitir todas as funções
type OmitAllFunctions<T> = Pick<T, { 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [K in keyof T]: T[K] extends (...args: any[]) => any ? never : K 
}[keyof T]>;

export class Exporter<C extends readonly Column[]> {
  private workbook = new Workbook()
  private worksheets = new Map<string, Worksheet>()
  private worksheet!: Worksheet
  public columns: C
  public style: Style

  constructor(options?: Partial<OmitAllFunctions<Exporter<C>>>) {
    this.columns = (options as unknown as { columns: C })?.columns
    this.style = options?.style as typeof this.style
  }

  setStyle(style: Style) {
    for (const column of this.worksheet.columns) {
      column.style = style
    }
    return this
  }

  addColumn(column: Partial<Column>) {
    this.worksheet.columns = [...this.worksheet.columns, column]

    return this
  }

  setColumns<T extends readonly Column[]>(columns: C | T, ignoreSort?: string[]) {
    this.columns = columns as C

    if (ignoreSort === undefined) {
      this.worksheet.columns = [...columns]
      return this
    }

    const filteredHeader = [...columns].filter(item => !ignoreSort?.includes(item.header))
    const excludeHeader = [...columns].filter(item => ignoreSort?.includes(item.header))
    const sortedHeader = filteredHeader.toSorted((a, b) => a.header.localeCompare(b.header))

    this.worksheet.columns = [...excludeHeader, ...sortedHeader]
    return this
  }

  addRow<T extends readonly Column[] | undefined = undefined>(data: ColumnData<T extends undefined ? C : T>) {
    this.worksheet.addRow({
      ...data,
    })

    return this
  }

  ajustColumn() {
    const colCount = this.worksheet.columnCount // Número de colunas na planilha

    for (let colIndex = 1; colIndex <= colCount; colIndex++) {
      let maxLength = 0
  
      // Percorre todas as células da coluna e encontra o maior comprimento de texto
      this.worksheet.getColumn(colIndex).eachCell({ includeEmpty: true }, (cell) => {
        const cellValue = cell.text || '' // Garantir que a célula tenha um valor de texto
        if (cellValue.length > maxLength) {
          maxLength = cellValue.length
        }
      })
  
      // Define a largura da coluna com base no maior comprimento encontrado
      this.worksheet.getColumn(colIndex).width = maxLength + 2 // Adiciona um pequeno valor para margem
    }
    return this
  }

  createWorksheet(name: string) {
    if (this.worksheets.has(name)) {
      this.useWorkshet(name)
      return this
    }

    const workseet = this.workbook.addWorksheet(removeSpecialCharacters(name))
    this.worksheets.set(name, workseet)
    this.worksheet = workseet

    return this
  }

  useWorkshet(name: string) {
    const workseet = this.worksheets.get(name)
    if (workseet === undefined) throw new Error(`Not found Worksheet with name: ${name}`)
    this.worksheet = workseet

    return this
  }

  async toBuffer () {
    return await this.workbook.xlsx.writeBuffer()
  }

  async toFile(filePath: string) {
    await this.workbook.xlsx.writeFile(filePath)
  }
}