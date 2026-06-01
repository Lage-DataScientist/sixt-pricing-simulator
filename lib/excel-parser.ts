import * as XLSX from "xlsx"
import type { MatrixData, MatrixRow } from "./pricing-engine"

const PRODUCTS_TO_KEEP = new Set(["LD", "BF", "BQ", "TG", "BE", "I", "BC"])

function findRow(worksheet: XLSX.WorkSheet, label: string, range: XLSX.Range): number {
  const lowerLabel = label.toLowerCase()
  
  for (let row = range.s.r; row <= range.e.r; row++) {
    const cellAddress = XLSX.utils.encode_cell({ r: row, c: 0 })
    const cell = worksheet[cellAddress]
    if (cell && String(cell.v).trim().toLowerCase() === lowerLabel) {
      return row
    }
  }
  
  throw new Error(`Nao encontrei a linha '${label}' no ficheiro Excel.`)
}

export function buildMatrixDataFromExcel(
  fileBuffer: ArrayBuffer,
  sheetName: string
): MatrixData {
  const workbook = XLSX.read(fileBuffer, { type: "array" })
  
  if (!workbook.SheetNames.includes(sheetName)) {
    throw new Error(
      `Folha '${sheetName}' nao encontrada. Folhas disponiveis: ${workbook.SheetNames.join(", ")}`
    )
  }
  
  const worksheet = workbook.Sheets[sheetName]
  const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1")
  
  const rowProduct = findRow(worksheet, "chco", range)
  const rowStartDay = findRow(worksheet, "vont", range)
  const rowEndDay = findRow(worksheet, "bist", range)
  const rowCart = findRow(worksheet, "cart", range)
  
  interface ProductColumn {
    col: number
    product: string
    sd: number
    ed: number
  }
  
  const productColumns: ProductColumn[] = []
  
  for (let col = 1; col <= range.e.c; col++) {
    const productCell = worksheet[XLSX.utils.encode_cell({ r: rowProduct, c: col })]
    const startDayCell = worksheet[XLSX.utils.encode_cell({ r: rowStartDay, c: col })]
    const endDayCell = worksheet[XLSX.utils.encode_cell({ r: rowEndDay, c: col })]
    
    if (!productCell || !startDayCell || !endDayCell) continue
    
    const product = String(productCell.v).trim()
    if (!product) continue
    
    const sd = Number(startDayCell.v)
    const ed = Number(endDayCell.v)
    
    if (isNaN(sd) || isNaN(ed)) continue
    
    productColumns.push({ col, product, sd, ed })
  }
  
  if (productColumns.length === 0) {
    throw new Error("Nao foram encontradas colunas de produtos validas na matriz.")
  }
  
  const groups: string[] = []
  const data: Record<string, Record<string, MatrixRow[]>> = {}
  
  for (let row = rowCart + 1; row <= range.e.r; row++) {
    const groupCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 0 })]
    if (!groupCell) continue
    
    const group = String(groupCell.v).trim()
    if (!group) continue
    
    groups.push(group)
    data[group] = {}
    
    for (const spec of productColumns) {
      if (!PRODUCTS_TO_KEEP.has(spec.product)) continue
      
      const valueCell = worksheet[XLSX.utils.encode_cell({ r: row, c: spec.col })]
      if (!valueCell) continue
      
      const value = Number(valueCell.v)
      if (isNaN(value)) continue
      
      if (!data[group][spec.product]) {
        data[group][spec.product] = []
      }
      
      data[group][spec.product].push({
        sd: spec.sd,
        ed: spec.ed,
        v: value,
      })
    }
  }
  
  if (groups.length === 0) {
    throw new Error("Nao foram encontrados grupos ACRISS na matriz.")
  }
  
  return { groups, data }
}

export function exportToExcel(
  data: Array<Record<string, unknown>>,
  sheetName: string = "Data"
): Blob {
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
  return new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
}
