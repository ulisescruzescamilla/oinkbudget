import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useEffect, useRef, useState } from "react";
import { ToastAndroid, View } from "react-native";
import type { Item } from "../select";
import { ActionCard } from "./ActionCard";
import { InputText } from "../forms/InputText";
import { InputOptions } from "../forms/InputOptions";
import { InputCalendar } from "../forms/InputCalendar";
import { PrimaryButton } from "../buttons/PrimaryButton";
import { getAllAccounts } from "@/database/accountRepository";
import { getAllBudgets } from "@/database/budgetRepository";
import { AccountType } from "@/types/AccountType";
import { getTotal, insertToBalance } from "@/database/balanceRepository";
import { BalanceType } from "@/types/BalanceType";
import { BudgetType } from "@/types/BudgetType";
import { ConfirmationModal } from "./ConfirmationModal";

interface AddExpenseProps {
  isOpen: boolean;
  handleClose: (toggle: boolean) => void;
}

const AddExpense = ({ isOpen, handleClose }: AddExpenseProps) => {

  // form values
  const [amountExpense, setAmountExpense] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [date, setDate] = useState(new Date())
  const [budgetId, setBudgetId] = useState<string | undefined>()
  const [accountId, setAccountId] = useState<string | undefined>()
  // form data
  const [accounts, setAccounts] = useState<AccountType[]>()
  const [accountOptions, setAccountOptions] = useState<Item[]>()
  const [budgets, setBudgets] = useState<BudgetType[]>()
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
  // toggle
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false)

  const reset = () => {
    setAmountExpense('')
    setDescription('')
    setDate(new Date)
    setBudgetId(undefined)
    setAccountId(undefined)
  }

  const saveExpense = (selectedAccount: AccountType, selectedBudget: BudgetType) => {

    const expenseAmount = parseFloat(amountExpense)
    let total = 0
    getTotal().then(row => { total = row?.total ?? 0 })

    if (selectedAccount && selectedBudget) {
      const payload: BalanceType = {
        id: null,
        amount: expenseAmount,
        type: 'expense',
        description,
        created_at: date,
        account_name: selectedAccount?.name,
        budget_name: selectedBudget?.name,
        current_balance: total - expenseAmount
      }

      insertToBalance(payload, selectedAccount, selectedBudget)
        .then(() => {
          handleClose(false)
          reset()
          ToastAndroid.show("Gasto agregado con éxito", ToastAndroid.BOTTOM)
        })
    } else {
      ToastAndroid.show("Error al agregar el gasto", ToastAndroid.BOTTOM)
    }
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

    if (!budgetId) {
      setBudgetIsInvalid(true)
      return
    }

    if (!accountId) {
      setAccountIsInvalid(true)
      return
    }

    // find budget and account objects
    const selectedBudget = budgets?.find(budget => budget.id?.toString() === budgetId)
    const selectedAccount = accounts?.find(account => account.id?.toString() === accountId)

    // make an latest validation if expese amount reaches the maximum budget amount
    if (selectedBudget) {
      const restBudged = selectedBudget.max_limit - selectedBudget.expense_amount
      if (selectedBudget && (parseFloat(amountExpense) > restBudged)) {
        setShowConfirmModal(true)
        return
      }
    }

    if (selectedAccount && selectedBudget) {
      saveExpense(selectedAccount, selectedBudget)
    }
  }


  useEffect(() => {
    // account options
    getAllAccounts().then(accounts => {
      setAccounts(accounts)
      setAccountOptions(accounts.map(r => ({ value: r.id?.toString(), label: r.name })) as Item[])
    })
    // budget options
    getAllBudgets().then(budgets => {
      setBudgets(budgets)
      setBudgetOptions(budgets.map(r => ({ value: r.id?.toString(), label: r.name })) as Item[])
    })
  }, [isOpen])


  return (
    <ActionCard open={isOpen} handleClose={() => handleClose(!isOpen)}>
      <ConfirmationModal
        toggle={showConfirmModal}
        setToggle={setShowConfirmModal}
        title="Confirmar gasto"
        message="El monto del gasto excede el límite del presupuesto. ¿Desea continuar?"
        onConfirm={() => {
          setShowConfirmModal(false);
          const selectedBudget = budgets?.find(budget => budget.id?.toString() === budgetId)
          const selectedAccount = accounts?.find(account => account.id?.toString() === accountId)

          if (selectedAccount && selectedBudget) {
            saveExpense(selectedAccount, selectedBudget)
          }
        }}
      />
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
          onValueChange={setBudgetId}
          errorLabel="El presupuesto es obligatorio"
        />
        {/* Account */}
        <InputOptions
          label="Cuenta"
          defaultValue=""
          isInvalid={accountIsInvalid}
          onValueChange={setAccountId}
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