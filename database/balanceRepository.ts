import { getDBConnection } from "."

export const getTotal = async (): Promise<{total: number} | undefined | null> => {
  const db = getDBConnection()

  try {
    return (await db).getFirstAsync("SELECT SUM(amount) as total FROM accounts;")
  } catch (error) {
    console.error(error)
  }
}