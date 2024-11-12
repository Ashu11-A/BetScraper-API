import { Style } from 'exceljs'

export const style: Style = {
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