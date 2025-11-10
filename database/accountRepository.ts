import { AccountType } from "@/types/AccountType"
import { getDBConnection } from "."

export const createAccount = async (account: AccountType) => {
  const db = await getDBConnection()

  try {
      db.runAsync("INSERT INTO accounts (name, type, amount, hidden) VALUES (?, ?, ?, ?);", [
        account.name,
        account.type,
        account.amount,
        account.hidden
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

export const deleteAccount = async(account: AccountType) => {
  const db = await getDBConnection()

  try {
    if (account?.id) {
      return (await db).runAsync("DELETE FROM accounts WHERE id = ?;", [
          account.id
        ])
    }
  } catch (error) {
    console.error(error)
  }
}

export const updateAccount = async(newData: AccountType) => {
  const db = await getDBConnection()

  try {
    if (newData?.id) {
      db.runAsync("UPDATE accounts SET name = ?, amount = ?, type = ?, hidden = ? WHERE id = ?;", [
          newData.name,
          newData.amount,
          newData.type,
          newData.hidden,
          newData.id
        ])
    }
  } catch (error) {
    console.error(error)
  }
}