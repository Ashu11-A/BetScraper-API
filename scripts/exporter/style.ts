import { Style } from 'exceljs'

export const style: Style = {
  numFmt: 'General',
  font: {
    size: 12,
    bold: false,
  },
  alignment: {
    horizontal: 'fill',
    vertical: 'justify',
    shrinkToFit: false,
    indent: 0,
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