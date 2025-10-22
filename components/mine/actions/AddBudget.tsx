import { VStack } from "@/components/ui/vstack"
import { ActionCard } from "./ActionCard"
import { InputText } from "../forms/InputText"
import { useEffect, useState } from "react"
import { InputOptions } from "../forms/InputOptions"
import * as SQLite from 'expo-sqlite'
import { AccountType } from "@/types/AccountType"
import { Item } from "../select"
import { Slider, SliderFilledTrack, SliderThumb, SliderTrack } from "@/components/ui/slider"
import { InputSlider } from "../forms/InputSlider"
import { Text, View } from "@/components/Themed"
import { PrimaryButton } from "../buttons"
import { BudgetType } from "@/types/BudgetType"
import { insertBudget } from "@/database/budgetRepository"

interface AddBudgetProps {
  open: boolean,
  handleClose: () => void,
}

export const AddBudget = ({ open, handleClose }: AddBudgetProps) => {
  const [name, setName] = useState<string>("")
  const [accountSelected, setAccountSelected] = useState<string>('')
  const [accountData, setAccountData] = useState<AccountType | null>(null)
  const [percentage, setPercentage] = useState<number>(30)
  const [maxLimit, setMaxLimit] = useState<number>(0)
  // data
  const [accounts, setAccounts] = useState<AccountType[]>([])
  const [accountItems, setAccountItems] = useState<Item[] | []>([])
  // errors
  const [nameError, setNameError] = useState<boolean>(false)
  const [accountError, setAccountError] = useState<boolean>(false)
  const [percentageError, setPercentageError] = useState<boolean>(false)
  // DB
  const database = SQLite.useSQLiteContext()

  const getAccounts = async () => {
    try {
      return await database.getAllAsync<AccountType>("SELECT * FROM accounts;").then(
        accounts => {
          setAccounts(accounts)
          return accounts.map(account => ({
            value: account.id,
            label: account.name
          }))
        }
      )
    } catch (error) {
      console.error(error)
      // todo make a notification component
    }
  }

  const getMaxPercentage = async (account_id: number) => {
    try {
      return await database.getFirstAsync("SELECT SUM(percentage_value) as sum_percentage FROM budgets WHERE account_id = ?;", [account_id])
    } catch (error) {
      console.error(error)
      // todo make a notification component
    }
  }

  useEffect(() => {
    getAccounts().then(items => setAccountItems(items))
    return () => {
      setName("")
      setAccountSelected("")
      setAccountData(null)
      setPercentage(30)
      setMaxLimit(0)
    }
  }, [open])

  useEffect(() => {
    getMaxPercentage(parseInt(accountSelected))
      .then(row => setMaxLimit(100 - (row?.sum_percentage ?? 0)))
  }, [accountSelected])

  const submit = () => {
    if (name.length === 0 || name.length > 255) {
      setNameError(true)
      return
    }

    if (accountSelected.length === 0) {
      setAccountError(true)
      return
    }

    if (percentage <= 0 || percentage > maxLimit) {
      setPercentageError(true)
      return
    }

    const maxAccount = accountData?.amount ?? 0

    const amountPercentage = (maxAccount * percentage) / 100

    insertBudget({
      name: name.trim(),
      max_limit: amountPercentage,
      expense_amount: 0,
      percentage_value: percentage,
      color: '#8637CF',
      account_id: parseInt(accountSelected),
    } as BudgetType).then((i) => {
      // close action card
      handleClose()
    })
  }

  return (
    <ActionCard open={open} handleClose={handleClose}>
      <VStack className="w-full" space='sm'>
        {/* Name */}
        <InputText
          label="Nombre del presupuesto"
          placeholder="Nombre"
          keyboardType="default"
          autoFocus={true}
          value={name}
          isInvalid={nameError}
          onChangeText={setName}
          errorLabel="El nombre es requerido y menor a 255 caracteres"
        />
        {/* Account */}
        <InputOptions
          defaultValue=""
          options={accountItems}
          onValueChange={value => {
            setAccountData(accounts.find(account => account.id === parseInt(value)) ?? null)
            setAccountSelected(value)
          }}
          label="Cuenta"
          placeholder="Selecciona una cuenta"
          isInvalid={accountError}
          errorLabel="La cuenta es requerida"
        />
        {/* Percentage */}
        <InputSlider
          value={percentage}
          defaultValue={10}
          maxValue={maxLimit}
          onChange={setPercentage}
          label={`Porcentaje asignado de tu ingreso ${percentage}%`}
          errorLabel="La suma de los prespuestos de una cuenta no debe ser mayor a 100%"
          helperText={`Porcentaje máximo disponible ${maxLimit}%`}
          isInvalid={percentageError}
        />
      </VStack>
      <View className='mt-4'>
        <PrimaryButton onPress={() => submit()}>Agregar presupuesto</PrimaryButton>
      </View>
    </ActionCard>
  )
}