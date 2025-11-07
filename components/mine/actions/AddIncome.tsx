import { useEffect, useState } from "react";
import { InputText } from "../forms/InputText";
import { ActionCard } from "./ActionCard"
import { PrimaryButton } from "../buttons/PrimaryButton";
import { Text, ToastAndroid, View } from "react-native";
import { VStack } from "@/components/ui/vstack";
import { InputCalendar } from "../forms/InputCalendar";
import { InputOptions } from "../forms/InputOptions";
import { AccountType } from "@/types/AccountType";
import { getAllAccounts } from "@/database/accountRepository";
import type { Item } from "../select";
import { getTotal, insertToBalance } from "@/database/balanceRepository";
import { BalanceType } from "@/types/BalanceType";


interface AddIncomeProps {
  open: boolean;
  handleClose: (toggle: boolean) => void
}

const AddIncome = ({ open, handleClose }: AddIncomeProps) => {

  const [amount, setAmount] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [date, setDate] = useState<Date>(new Date)
  const [accountId, setAccountId] = useState<string | undefined>()

  // form data
  const [accounts, setAccounts] = useState<AccountType[]>()
  const [accountOptions, setAccountOptions] = useState<Item[]>([])
  // erors
  const [amountError, setAmountError] = useState<boolean>(false)
  const [descriptionError, setDescriptionError] = useState<boolean>(false)
  const [accountError, setAccountError] = useState<boolean>(false)

  useEffect(() => {
    getAllAccounts()
      .then(accounts => {
        setAccounts(accounts)
        setAccountOptions(accounts.map(r => ({ value: r.id?.toString(), label: r.name })) as Item[])
      })
  }, [open])

  const reset = () => {
    setAmount('')
    setDescription('')
    setDate(new Date)
    setAccountId(undefined)
  }

  const submit = () => {
    if (!amount || parseInt(amount) <= 0) {
      setAmountError(true)
      return
    }

    if (!description || description.length > 255) {
      setDescriptionError(true)
      return
    }

    if (!accountId) {
      setAccountError(true)
      return
    }

    const selectedAccount = accounts?.find(acc => acc.id === parseInt(accountId))

    let total = 0
    getTotal().then(row => { total = row?.total ?? 0 })

    if (selectedAccount) {
      const payload: BalanceType = {
        id: null,
        amount: parseFloat(amount),
        type: 'income',
        description,
        created_at: date,
        account_name: selectedAccount.name,
        budget_name: '',
        current_balance: total + parseFloat(amount)
      }

      insertToBalance(payload, selectedAccount)
        .then(() => {
          handleClose(false)
          // reset values
          reset()
          ToastAndroid.show('Se ha agregado el ingreso correctamente', ToastAndroid.BOTTOM);
        })
    } else {
      ToastAndroid.show('Error al agregar el ingreso', ToastAndroid.BOTTOM);
    }

  }

  return (
    <ActionCard open={open} handleClose={() => handleClose(!open)}>
      <VStack space={'md'}>
        {/* Amount */}
        <InputText
          label="Monto"
          value={amount}
          placeholder="$"
          isInvalid={amountError}
          keyboardType="numeric"
          errorLabel="El monto es requerido y debe ser mayor a 0"
          onChangeText={setAmount}
        />
        {/* Description */}
        <InputText
          label="Descripción"
          value={description}
          isInvalid={descriptionError}
          errorLabel="La descripción debe ser mayor a 1 caracter"
          onChangeText={setDescription}
        />
        {/* Account */}
        <InputOptions
          options={accountOptions}
          defaultValue=""
          label="Cuenta"
          errorLabel="Seleccione una cuenta"
          isInvalid={accountError}
          onValueChange={setAccountId}
        />
        {/* Date */}
        <InputCalendar label="Fecha" date={date} setDate={setDate} />
        <View className="mt-3">
          <PrimaryButton onPress={submit}><Text className="text-2xl text-white">Agregar Ingreso</Text></PrimaryButton>
        </View>
      </VStack>
    </ActionCard>
  )
}

export default AddIncome