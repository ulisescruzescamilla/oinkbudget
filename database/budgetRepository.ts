import type { BudgetType } from "@/types/BudgetType"
import type * as SQLite from "expo-sqlite"
import { getDBConnection } from "."

export const getAllBudgets = async (): Promise<BudgetType[]> => {
  const db = await getDBConnection()
  try {
    return await db.getAllAsync<BudgetType>("SELECT * FROM budgets ORDER BY account_id DESC;")
  } catch (error) {
    console.error(error)
    return []
  }
}

export const getBudgetByAccountId = async (account_id: number): Promise<BudgetType[]> => {
  const db = await getDBConnection()
  try {
    return await db.getAllAsync<BudgetType>("SELECT * FROM budgets WHERE account_id = ? ORDER BY account_id DESC;", [account_id])
  } catch (error) {
    console.error(error)
    return []
  }
}

export const insertBudget = async (budget: BudgetType) => {
  const db = await getDBConnection()
    try {
      return await db.runAsync("INSERT INTO budgets (name, max_limit, expense_amount, percentage_value, color, account_id) VALUES (?,?,?,?,?,?);", [
        budget.name,
        budget.max_limit,
        budget.expense_amount,
        budget.percentage_value,
        budget.color,
        budget.account_id,
      ])
    } catch (error) {
      console.error(error)
    }
}

export const deleteBudget = async (budget: BudgetType) => {
  const db = await getDBConnection()

  try {
    return await db.runAsync("DELETE FROM budgets WHERE id = ?;", [
        budget.id
      ])
  } catch (error) {
    console.error(error)
  }
}