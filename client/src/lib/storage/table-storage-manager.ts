import { TableData } from '@/types/table';

const TABLE_STORAGE_KEY = 'stored_tables';

/**
 * TableStorageManager handles storing and retrieving tables from local storage
 */
export class TableStorageManager {
  private static instance: TableStorageManager;
  private storageKey: string;
  private storage: Storage | null = null;
  private tables: TableData[] = [];
  private listeners: Array<(tables: TableData[]) => void> = [];

  private constructor(storageKey: string = TABLE_STORAGE_KEY) {
    this.storageKey = storageKey;
    
    // Initialize storage if in browser
    if (typeof window !== 'undefined') {
      this.storage = window.localStorage;
      this.loadTablesFromStorage();
    }
  }

  /**
   * Get singleton instance of TableStorageManager
   */
  public static getInstance(storageKey?: string): TableStorageManager {
    if (!TableStorageManager.instance) {
      TableStorageManager.instance = new TableStorageManager(storageKey);
    }
    return TableStorageManager.instance;
  }

  /**
   * Load tables from local storage
   */
  private loadTablesFromStorage(): void {
    if (!this.storage) return;

    try {
      const tablesJson = this.storage.getItem(this.storageKey);
      if (tablesJson) {
        this.tables = JSON.parse(tablesJson);
      } else {
        // Initialize with empty array if no tables found
        this.tables = [];
        this.saveToStorage();
      }
    } catch (error) {
      console.error('Error loading tables from storage:', error);
      this.tables = [];
      this.saveToStorage();
    }
  }

  /**
   * Save current tables to storage
   */
  private saveToStorage(): void {
    if (!this.storage) return;
    
    try {
      this.storage.setItem(this.storageKey, JSON.stringify(this.tables));
    } catch (error) {
      console.error('Error saving tables to storage:', error);
    }
  }

  /**
   * Get all stored tables
   */
  public getTables(): TableData[] {
    return [...this.tables];
  }

  /**
   * Add or update a table
   */
  public saveTable(table: TableData): void {
    if (!table || !table.key) return;

    const existingIndex = this.tables.findIndex(t => t.key === table.key);
    
    if (existingIndex >= 0) {
      // Update existing table
      this.tables[existingIndex] = table;
    } else {
      // Add new table
      this.tables.push(table);
    }
    
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * Remove a table by key
   */
  public removeTable(key: string): void {
    this.tables = this.tables.filter(table => table.key !== key);
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * Check if a table exists by key
   */
  public hasTable(key: string): boolean {
    return this.tables.some(table => table.key === key);
  }

  /**
   * Get a table by key
   */
  public getTableByKey(key: string): TableData | null {
    const table = this.tables.find(table => table.key === key);
    return table || null;
  }

  /**
   * Get a table by title (legacy method)
   * @deprecated Use getTableByKey instead
   */
  public getTableByTitle(title: string): TableData | null {
    const table = this.tables.find(table => table.title === title);
    return table || null;
  }

  /**
   * Clear all stored tables
   */
  public clearAllTables(): void {
    this.tables = [];
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * Add a listener for table changes
   */
  public addListener(listener: (tables: TableData[]) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners of table changes
   */
  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener([...this.tables]);
    }
  }
}

export default TableStorageManager; 