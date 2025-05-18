export interface TableData {
  title: string;
  columns: TableColumn[];
  rows: TableRow[];
  actions: TableAction[];
}

export interface TableColumn {
  key: string;
  label: string;
  icon?: string;
}

export interface TableRow {
  id: string;
  [key: string]: any;
}

export interface TableAction {
  type: string;
  label: string;
  icon?: string;
} 