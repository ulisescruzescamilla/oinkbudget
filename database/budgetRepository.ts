import type { BudgetType } from "@/types/BudgetType"
import type * as SQLite from "expo-sqlite"
import { getDBConnection } from "."

export const getAllBudgets = async (): Promise<BudgetType[]> => {
  const db = await getDBConnection()
  try {
    return await db.getAllAsync<BudgetType>("SELECT * FROM budgets ORDER BY budgets.name DESC;")
  } catch (error) {
    console.error(error)
    return []
  }
}

export const insertBudget = async (budget: BudgetType) => {
  const db = await getDBConnection()
    try {
      return await db.runAsync("INSERT INTO budgets (name, max_limit, expense_amount, percentage_value, color) VALUES (?,?,?,?,?);", [
        budget.name,
        budget.max_limit,
        budget.expense_amount,
        budget.percentage_value,
        budget.color,
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

export const getMaxPercentage = async () => {
  const db = await getDBConnection()
  try {
    return db.getFirstAsync("SELECT SUM(percentage_value) as sum_percentage FROM budgets;")
  } catch (error) {
    console.error(error)
  }
}

export const updateBudget = async (budget: BudgetType) => {
  const db = await getDBConnection()
  try {
    return await db.runAsync("UPDATE budgets SET name = ?, max_limit = ?, expense_amount = ?, percentage_value = ?, color = ? WHERE id = ?;", [
      budget.name,
      budget.max_limit,
      budget.expense_amount,
      budget.percentage_value,
      budget.color,
      budget.id
    ])
  } catch (error) {
    console.error(error)
  }
}

export const getBudgetById = async (id: number): Promise<BudgetType | null> => {
  const db = await getDBConnection()
  try {
    const budget = await db.getFirstAsync<BudgetType>("SELECT * FROM budgets WHERE id = ?;", [id])
    return budget || null
  } catch (error) {
    console.error(error)
    return null
  }
}