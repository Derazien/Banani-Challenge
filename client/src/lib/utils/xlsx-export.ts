import * as XLSX from 'xlsx';
import { TableData } from '@/types/table';

/**
 * Convert a TableData object to an XLSX file and trigger download
 */
export function exportTableToXLSX(tableData: TableData, fileName?: string): void {
  if (!tableData || !tableData.rows || !tableData.columns) {
    console.error('Invalid table data for export');
    return;
  }

  try {
    // Create worksheet data
    const worksheetData = [
      // Header row with column labels
      tableData.columns.map(col => col.label),
      
      // Data rows
      ...tableData.rows.map(row => 
        tableData.columns.map(col => row[col.key])
      )
    ];

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, tableData.title || 'Table');
    
    // Generate file name
    const safeFileName = fileName || 
      `${tableData.title || 'table'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Save and download the file
    XLSX.writeFile(workbook, safeFileName);
  } catch (error) {
    console.error('Error exporting table to XLSX:', error);
  }
}

/**
 * Convert TableData to a format suitable for XLSX export
 * (Can be used if we want to save the table data in XLSX format for more efficient storage)
 */
export function convertTableToXLSXData(tableData: TableData): Uint8Array {
  // Create worksheet data
  const worksheetData = [
    // Header row with column labels
    tableData.columns.map(col => col.label),
    
    // Data rows
    ...tableData.rows.map(row => 
      tableData.columns.map(col => row[col.key])
    )
  ];

  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  
  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, tableData.title || 'Table');
  
  // Convert to binary data
  return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }) as Uint8Array;
}

/**
 * Convert XLSX binary data back to TableData
 */
export function convertXLSXDataToTable(xlsxData: Uint8Array, title: string, key: string): TableData | null {
  try {
    // Read the workbook
    const workbook = XLSX.read(xlsxData, { type: 'array' });
    
    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to array of arrays
    const data = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });
    
    if (data.length < 2) {
      // Need at least header row and one data row
      return null;
    }
    
    // Extract headers (first row)
    const headers = data[0] as string[];
    
    // Create columns
    const columns = headers.map((header, index) => ({
      key: `col${index}`,
      label: header
    }));
    
    // Create rows
    const rows = data.slice(1).map((row, rowIndex) => {
      const rowData: any = {
        id: `row-${rowIndex}`
      };
      
      row.forEach((cell, cellIndex) => {
        rowData[`col${cellIndex}`] = cell;
      });
      
      return rowData;
    });
    
    // Return TableData
    return {
      key,
      title,
      columns,
      rows,
      actions: [] // No actions by default
    };
  } catch (error) {
    console.error('Error converting XLSX data to table:', error);
    return null;
  }
} 