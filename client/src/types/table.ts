export interface TableColumn {
  key: string
  label: string
  icon?: string
}

export interface TableAction {
  type: string
  label: string
  icon?: string
}

export interface TableRow {
  id: string
  icon: string
  [key: string]: string | number | boolean | null | undefined
}

export interface TableData {
  key: string
  title: string
  columns: TableColumn[]
  rows: TableRow[]
  actions: TableAction[]
} 