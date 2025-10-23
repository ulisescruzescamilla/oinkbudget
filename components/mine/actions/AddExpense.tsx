import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useEffect, useRef, useState } from "react";
import { ToastAndroid, View } from "react-native";
import type { Item } from "../select";
import type { ExpenseType } from '@/types/ExpenseType';
import { createExpense } from "@/database/expenseRepository";
import { ActionCard } from "./ActionCard";
import { InputText } from "../forms/InputText";
import { InputOptions } from "../forms/InputOptions";
import { InputCalendar } from "../forms/InputCalendar";
import { PrimaryButton } from "../buttons";
import { getAllAccounts } from "@/database/accountRepository";
import { getAllBudgets } from "@/database/budgetRepository";
import { AccountType } from "@/types/AccountType";
import { insertToBalance } from "@/database/balanceRepository";
import { BalanceType } from "@/types/BalanceType";

interface AddExpenseProps {
  isOpen: boolean;
  handleClose: (toggle: boolean) => void;
}

const AddExpense = ({ isOpen, handleClose }: AddExpenseProps) => {

  // form values
  const [amountExpense, setAmountExpense] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [date, setDate] = useState(new Date())
  const [budget, setBudget] = useState<string>()
  const [account, setAccount] = useState<string>()
  // form data
  const [accounts, setAccounts] = useState<AccountType[]>()
  const [accountOptions, setAccountOptions] = useState<Item[]>()
  const [budgetOptions, setBudgetOptions] = useState<Item[]>()
  // errors
  const [accountIsInvalid, setAccountIsInvalid] = useState<boolean>(false);
  const [amonutIsInvalid, setAmountIsInvalid] = useState(false);
  const [descriptionIsInvalid, setDescriptionIsInvalid] = useState(false)
  const [budgetIsInvalid, setBudgetIsInvalid] = useState(false);
  // ref
  const descriptionRef = useRef(null)
  const budgedRef = useRef(null)
  const accountRef = useRef(null)

  const reset = () => {
    setAmountExpense('')
    setDescription('')
    setDate(new Date)
    setBudget('')
    setAccount('')
  }


  const onsubmit = () => {

    // validations
    if (!amountExpense || parseFloat(amountExpense) === 0) {
      setAmountIsInvalid(true)
      return
    }

    if (!description || description.length <= 1 || description.length >= 255) {
      setDescriptionIsInvalid(true)
      return
    }

    if (!budget) {
      setBudgetIsInvalid(true)
      return
    }

    if (!account) {
      setAccountIsInvalid(true)
      return
    }

    const account_id = parseInt(account)
    const expenseAmount = parseFloat(amountExpense)

    const payload: BalanceType = {
      amount: expenseAmount,
      type: 'expense',
      description,
      created_at: date,
      account_id,
      current_balance: 0 // TODO calc current balance
    }

    insertToBalance(payload)
      .then(() => {
        handleClose(false)
        reset()
        ToastAndroid.show("Gasto agregado con éxito", ToastAndroid.BOTTOM)
      })
  }


  useEffect(() => {
    // account options
    getAllAccounts().then(accounts => {
      setAccounts(accounts)
      setAccountOptions(accounts.map(r => ({ value: r.id?.toString(), label: r.name })) as Item[])
    })
    // budget options
    getAllBudgets().then(budgets => {
      setBudgetOptions(budgets.map(r => ({ value: r.id?.toString(), label: r.name })) as Item[])
    })
  }, [isOpen])


  return (
    <ActionCard open={isOpen} handleClose={() => handleClose(!isOpen)}>
      <VStack className="w-full" space='sm'>
        {/* Amount */}
        <InputText
          isInvalid={amonutIsInvalid}
          label="Monto"
          keyboardType="numeric"
          value={amountExpense}
          onEndEditing={() => descriptionRef.current.focus()}
          onChangeText={setAmountExpense}
          errorLabel="El monto debe ser mayor a cero y es requerido"
        />
        {/* Description */}
        <InputText
          isInvalid={descriptionIsInvalid}
          label="Descripción"
          ref={descriptionRef}
          onEndEditing={() => budgedRef.current.focus()}
          keyboardType="numbers-and-punctuation"
          value={description}
          onChangeText={setDescription}
          errorLabel="La descripción es al menos 1 caracter o menos de 255 caracteres"
        />

        {/* Budget */}
        <InputOptions
          isInvalid={budgetIsInvalid}
          defaultValue=""
          label="Presupuesto"
          options={budgetOptions ?? []}
          onValueChange={setBudget}
          errorLabel="El presupuesto es obligatorio"
        />
        {/* Account */}
        <InputOptions
          label="Cuenta"
          defaultValue=""
          isInvalid={accountIsInvalid}
          onValueChange={setAccount}
          options={accountOptions ?? []}
          errorLabel="Seleccione una cuenta"
        />
        {/* Date */}
        <InputCalendar
          label="Fecha"
          date={date}
          setDate={setDate}
        />
        {/* Submit button */}
        <View className="mt-3">
          <PrimaryButton onPress={() => onsubmit()}>
            <Text className="text-2xl text-white">Guardar</Text>
          </PrimaryButton>
        </View>
      </VStack>
    </ActionCard>
  )
}

export default AddExpense