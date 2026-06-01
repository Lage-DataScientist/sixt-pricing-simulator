"use client"

import { useCallback, useRef } from "react"
import { Upload, FileSpreadsheet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { buildMatrixDataFromExcel } from "@/lib/excel-parser"
import type { MatrixData } from "@/lib/pricing-engine"

interface FileUploadProps {
  sheetName: string
  onDataLoaded: (data: MatrixData, fileName: string) => void
  onError: (error: string) => void
}

export function FileUpload({ sheetName, onDataLoaded, onError }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    async (file: File) => {
      try {
        const buffer = await file.arrayBuffer()
        const data = buildMatrixDataFromExcel(buffer, sheetName)
        onDataLoaded(data, file.name)
      } catch (err) {
        onError(err instanceof Error ? err.message : "Erro ao processar ficheiro")
      }
    },
    [sheetName, onDataLoaded, onError]
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div
      className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleChange}
        className="hidden"
      />
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center">
          <FileSpreadsheet className="w-7 h-7 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-200 mb-1">
            Arraste o ficheiro Excel ou clique para selecionar
          </p>
          <p className="text-xs text-slate-400">
            Formatos aceites: .xlsx, .xls
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Upload className="w-4 h-4" />
          Carregar ficheiro
        </Button>
      </div>
    </div>
  )
}
