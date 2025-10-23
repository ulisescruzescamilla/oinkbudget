import { BalanceType } from "@/types/BalanceType"
import { getDBConnection } from "."

export const getTotal = async (): Promise<{total: number} | undefined | null> => {
  const db = getDBConnection()

  try {
    return (await db).getFirstAsync("SELECT SUM(amount) as total FROM accounts;")
  } catch (error) {
    console.error(error)
  }
}

export const getBalance = async () => {
  const db = getDBConnection()

  try {
    return (await db).runAsync("SELECT * FROM balances;")
  } catch (error) {
    console.error(error)
  }
}

export const insertToBalance = async (balance: BalanceType) => {
  const database = await getDBConnection()

  const dateParsed = balance.created_at.toISOString().split('T')[0]

    database.withTransactionAsync(async () => {
      // Insert into history / balance table
      database.runAsync("INSERT INTO balances (amount, description, current_balance, type, account_id, created_at) VALUES (?,?,?,?,?,?);",
        [balance.amount, balance.description, balance.current_balance, balance.type, balance.account_id, dateParsed]);

      // update account
      database.getFirstAsync("SELECT amount FROM accounts WHERE id = ?;", [balance.account_id])
      .then((result) => {
        let amount = parseFloat(result.amount)

        if (balance.type === 'expense') {
          amount = amount - balance.amount
          database.runAsync(`INSERT INTO expenses (amount, description, account_id, created_at) VALUES (?,?,?,?);`, [
            balance.amount,
            balance.description,
            balance.account_id,
            dateParsed
          ])
        }

        if (balance.type === 'income') {
          amount = amount + balance.amount
        }

        database.runAsync("UPDATE accounts SET amount = ? WHERE id = ?;", [amount, balance.account_id])
      })
    })
}