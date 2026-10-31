/** Whether a category classifies expenses or incomes. */
export type CategoryKind = 'expense' | 'income';

export interface CategoryType {
  id: number;
  name: string;
  /** Icon glyph name (matches the app's Icon set). */
  icon_code: string;
  /** Solid hex color. */
  color: string;
  /** Expense or income category; fixed once created. */
  type: CategoryKind;
}
