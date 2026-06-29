import { ExpenseType } from "./ExpenseType";

interface graphTrend {
  "d": string,
  "v": number
}
export interface DashboardType {
  "trend": graphTrend[],
  "percentage_expense_today": number,
  "total_expense_today": number,
  "last_moves": ExpenseType[],
  "daily_limit": number
}