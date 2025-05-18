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
  [key: string]: any
  icon?: string
}

export interface TableData {
  title: string
  columns: TableColumn[]
  rows: TableRow[]
  actions: TableAction[]
} 