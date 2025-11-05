import { BalanceType } from "@/types/BalanceType"
import { getDBConnection } from "."

export const getTotal = async (): Promise<{total: number} | undefined | null> => {
  const db = await getDBConnection()

  try {
    return db.getFirstAsync("SELECT SUM(amount) as total FROM accounts;")
  } catch (error) {
    console.error(error)
  }
}

export const getBalance = async () => {
  const db = await getDBConnection()

  try {

    const query = `
    SELECT balances.*, accounts.name as account_name FROM balances
    JOIN accounts ON balances.account_id = accounts.id
    ORDER BY created_at ASC, id;
    `

    return db.getAllAsync<BalanceType>(query)
  } catch (error) {
    console.error(error)
  }
}

export const getBalanceByDate = async () => {
  const db = await getDBConnection()
  try {
    const query = `
    SELECT 
      CASE 
      WHEN DATE(created_at) = DATE('now') THEN 'HOY'
      ELSE strftime('%d/%m/%Y', created_at)
      END as date
    FROM balances
    GROUP BY DATE(created_at)
    ORDER BY DATE(created_at) DESC;
    `
    return db.getAllAsync<{date: string}>(query)
  } catch (error) {
    console.error(error)
  }
}

export const getBalanceByDateDetails = async (date: string) => {
  const db = await getDBConnection()

  try {

    const query = `
    SELECT balances.*, accounts.name as account_name FROM balances
    JOIN accounts ON balances.account_id = accounts.id
    WHERE DATE(balances.created_at) = DATE(?)
    ORDER BY balances.id DESC;
    `

    return db.getAllAsync<BalanceType>(query, [date])
  } catch (error) {
    console.error(error)
  }
}

export const insertToBalance = async (balance: BalanceType) => {
  const database = await getDBConnection()

  const dateParsed = balance.created_at.toISOString().split('T')[0]

    database.withTransactionAsync(async () => {
      // Insert into history / balance table
      database.runAsync("INSERT INTO balances (amount, description, current_balance, type, account_id, budget_id, created_at) VALUES (?,?,?,?,?,?,?);",
        [balance.amount, balance.description, balance.current_balance, balance.type, balance.account_id, balance.budget_id, dateParsed]);

      // update account
      database.getFirstAsync("SELECT amount FROM accounts WHERE id = ?;", [balance.account_id])
      .then((result) => {
        let amount = parseFloat(result.amount)

        if (balance.type === 'expense' && balance.budget_id) {
          amount = amount - balance.amount
          database.runAsync(`INSERT INTO expenses (amount, description, account_id, created_at, budget_id) VALUES (?,?,?,?,?);`, [
            balance.amount,
            balance.description,
            balance.account_id,
            dateParsed,
            balance.budget_id
          ])
        }

        if (balance.type === 'income') {
          amount = amount + balance.amount
        }

        database.runAsync("UPDATE accounts SET amount = ? WHERE id = ?;", [amount, balance.account_id])
      })
    })
}