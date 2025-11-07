import { BalanceType } from "@/types/BalanceType"
import { getDBConnection } from "."
import { AccountType } from "@/types/AccountType"
import { BudgetType } from "@/types/BudgetType"

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
    SELECT * FROM balances
    ORDER BY created_at ASC, id;
    `

    return db.getAllAsync<BalanceType>(query)
  } catch (error) {
    console.error(error)
  }
}

export const getBalanceByDate = async (date: string) => {
  const db = await getDBConnection()

  try {

    const query = `
    SELECT * FROM balances
    WHERE DATE(balances.created_at) = DATE(?)
    ORDER BY balances.id DESC;
    `

    return db.getAllAsync<BalanceType>(query, [date])
  } catch (error) {
    console.error(error)
  }
}

export const insertToBalance = async (balance: BalanceType, account: AccountType, budget?: BudgetType) => {
  const database = await getDBConnection()

  const dateParsed = balance.created_at.toISOString().split('T')[0]
  const timeParsed = balance.created_at.toISOString().split('T')[1]

    database.withTransactionAsync(async () => {
      // Insert into history / balance table
      database.runAsync("INSERT INTO balances (amount, description, current_balance, type, account_name, budget_name, created_at) VALUES (?,?,?,?,?,?,?);",
        [balance.amount, balance.description, balance.current_balance, balance.type, balance.account_name, balance.budget_name, `${dateParsed} ${timeParsed}`]);

      // update account
      database.getFirstAsync("SELECT amount FROM accounts WHERE id = ?;", [account.id])
      .then((result) => {
        let amount = parseFloat(result.amount)

        if (balance.type === 'expense' && budget?.id) {
          amount = amount - balance.amount
          database.runAsync(`INSERT INTO expenses (amount, description, account_id, created_at, budget_id) VALUES (?,?,?,?,?);`, [
            balance.amount,
            balance.description,
            account.id,
            `${dateParsed} ${timeParsed}`,
            budget.id
          ])
        }

        if (balance.type === 'income') {
          amount = amount + balance.amount
          database.runAsync(`INSERT INTO incomes (amount, description, account_id, created_at) VALUES (?,?,?,?);`, [
            balance.amount,
            balance.description,
            account.id,
            `${dateParsed} ${timeParsed}`,
          ])
        }

        database.runAsync("UPDATE accounts SET amount = ? WHERE id = ?;", [amount, account.id])
      })
    })
}