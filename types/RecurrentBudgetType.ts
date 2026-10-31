/** A recurrent budget ("presupuesto recurrente"), managed through `/recurrent-budgets`. */
export interface RecurrentBudgetType {
  id: number;
  name: string;
  /** Icon glyph name (matches the app's Icon set). */
  icon_code: string;
  /** Solid hex color. */
  color: string;
}
