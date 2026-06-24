import { ExpenseType } from "./ExpenseType";

export interface DashboardType {
  "total_expense_today": number,
  "last_moves": ExpenseType[],
  "daily_limit": number
}