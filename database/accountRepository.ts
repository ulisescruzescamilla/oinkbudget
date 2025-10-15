import { AccountType } from "@/types/AccountType"
import { getDBConnection } from "."

export const createAccount = async (account: AccountType) => {
  const db = getDBConnection()

  try {
      db.runAsync("INSERT INTO accounts (name, type, amount) VALUES (?,?,?);", [
        account.name,
        account.type,
        account.amount
      ])

    } catch (error) {
      console.error(error)
    }
}

export const getAllAccounts = async () => {
  const db = await getDBConnection()
  const result = await db.getAllAsync(
    `SELECT * 
    FROM accounts;`
  )
  return result as AccountType[]
}