export interface TableData {
  key: string;
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
  icon: string;
  [key: string]: any;
}

export interface TableAction {
  type: string;
  label: string;
  icon?: string;
}

// New DTO for editing tables
export interface EditTableDto {
  prompt: string;
  existingTable: TableData;
} 