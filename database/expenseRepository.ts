import { getDBConnection } from "./index"
import { ExpenseType } from "@/types/ExpenseType"

export const createExpense = async (expense: ExpenseType): Promise<number | undefined> => {
  const db = getDBConnection()

  try {
    const query = `INSERT INTO expenses (amount, description, budget_id, account_id, created_at) VALUES (${expense.amount}, "${expense.description}", ${expense.budget_id}, ${expense.account_id}, "${expense.date.toISOString().split('T')[0]}")`
    
    const result = (await db).execAsync(query)
    const lastRow = result.lastInsertRowId as number;
    return lastRow
  } catch (error) {
    console.error(error)
  }
}

export const getExpenses = async () => {
  const db = getDBConnection()

  const result = await db.getAllAsync<ExpenseType>(`SELECT * FROM expenses;`);
  return result;

}