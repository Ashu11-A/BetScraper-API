import * as excel from 'excel4node'
import { format } from 'date-fns'

import { Infos } from '@/types/exporterInfos.js'

export class Exporter {
  private workbook: excel.Workbook
  private worksheet: excel.Worksheet
  private headerStyle: excel.Style
  private cellStyle: excel.Style
  private advertencesList: string[]
  private columns: string[]

  constructor(private data: { betName: string; betUrl: string; startDate: Date; endDate: Date; infos: Infos[] }[]) {
    this.workbook = new excel.Workbook()
    this.worksheet = this.workbook.addWorksheet('Relatório')
    this.headerStyle = this.createHeaderStyle()
    this.cellStyle = this.createCellStyle()
    this.advertencesList = [
      'símbolo "18+"',
      'aviso "proibido para menores de 18 anos"',
      'Jogue com responsabilidade',
      'Apostas são atividades com riscos de perdas financeiras.',
      'Apostar pode levar à perda de dinheiro.',
      'As chances são de que você está prestes a perder',
      'Aposta não é investimento.',
      'Apostar pode causar dependência.',
      'Apostas esportivas: pratique o jogo seguro.',
      'Apostar não deixa ninguém rico.',
      'Saiba quando apostar e quando parar.',
      'Aposta é assunto para adultos.',
    ]
    this.columns = ['Nome da Bet', 'URL', 'Data de Início da análise', 'Data de Fim da análise']
  }

  private createHeaderStyle(): excel.Style {
    return this.workbook.createStyle({
      font: {
        bold: true,
        color: '#FFFFFF',
      },
      alignment: {
        horizontal: 'center',
        vertical: 'center',
      },
      fill: {
        type: 'pattern',
        patternType: 'solid',
        bgColor: '#4F81BD',
        fgColor: '#4F81BD',
      },
      border: {
        left: { style: 'thin' },
        right: { style: 'thin' },
        top: { style: 'thin' },
        bottom: { style: 'thin' },
      },
    })
  }

  private createCellStyle(): excel.Style {
    return this.workbook.createStyle({
      alignment: {
        horizontal: 'left',
        vertical: 'center',
      },
      border: {
        left: { style: 'thin' },
        right: { style: 'thin' },
        top: { style: 'thin' },
        bottom: { style: 'thin' },
      },
    })
  }

  private processCell(value: unknown): string | number {
    if (value instanceof Date) {
      return format(value, 'dd/MM/yyyy \'às\' HH:mm')
    }

    if (typeof value === 'boolean') {
      return value ? 'Sim' : 'Não'
    }

    return (value ?? '-') as string | number
  }

  private addHeader(columns: string[]): void {
    let colIndex = 1
    columns.forEach((col) => {
      this.worksheet.cell(1, colIndex).string(col).style(this.headerStyle)
      this.worksheet.column(colIndex).setWidth(35)
      colIndex++
    })

    this.advertencesList.forEach((advertence) => {
      this.worksheet.cell(1, colIndex).string(advertence).style(this.headerStyle)
      this.worksheet.column(colIndex).setWidth(35)
      this.worksheet.cell(1, colIndex + 1).string(`${advertence} - Localização`).style(this.headerStyle)
      this.worksheet.column(colIndex + 1).setWidth(35)
      this.worksheet.cell(1, colIndex + 2).string(`${advertence} - Contraste`).style(this.headerStyle)
      this.worksheet.column(colIndex + 2).setWidth(35)
      this.worksheet.cell(1, colIndex + 3).string(`${advertence} - Render`).style(this.headerStyle)
      this.worksheet.column(colIndex + 3).setWidth(35)
      colIndex += 4
    })
  }

  private addData(): void {
    this.data.forEach((row, rowIndex) => {
      const currentRow = rowIndex + 2

      this.worksheet.cell(currentRow, 1).string(row.betName).style(this.cellStyle)
      this.worksheet.cell(currentRow, 2).string(row.betUrl).style(this.cellStyle)
      this.worksheet.cell(currentRow, 3).string(this.processCell(row.startDate) as string).style(this.cellStyle)
      this.worksheet.cell(currentRow, 4).string(this.processCell(row.endDate) as string).style(this.cellStyle)

      const infosMap = new Map(row.infos.map((info) => [info.advertence, info]))

      let infoColIndex = 5
      this.advertencesList.forEach((advertence) => {
        const info = infosMap.get(advertence)
        this.worksheet.cell(currentRow, infoColIndex).string(this.processCell(info?.value ?? false) as string).style(this.cellStyle)
        this.worksheet.cell(currentRow, infoColIndex + 1).string(info?.location ?? '-').style(this.cellStyle)
        this.worksheet.cell(currentRow, infoColIndex + 2).string(info?.contrast ?? '-').style(this.cellStyle)
        this.worksheet.cell(currentRow, infoColIndex + 3).string(info?.render ?? '-').style(this.cellStyle)
        infoColIndex += 4
      })
    })
  }

  public generate(): void {
    this.addHeader(this.columns)
    this.addData()
    this.workbook.write(`bets-report-${format(new Date(), 'dd-MM-yyyy-HH-mm')}.xlsx`)
  }
}

export function generateReport(
  data: { betName: string; betUrl: string; startDate: Date; endDate: Date; infos: Infos[] }[]
) {
  const reportGenerator = new Exporter(data)
  reportGenerator.generate()
}
