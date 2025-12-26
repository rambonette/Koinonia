import { GroceryItem } from '../interfaces/IStorageService';

/**
 * Parse plain text into item names.
 * Handles empty lines and whitespace.
 */
export function parseImportText(text: string): string[] {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
}

/**
 * Format grocery items as plain text (one per line).
 */
export function formatExportText(items: GroceryItem[], includeChecked = true): string {
  const filtered = includeChecked ? items : items.filter(item => !item.checked);
  return filtered.map(item => item.name).join('\n');
}
