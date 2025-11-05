import { VStack } from "@/components/ui/vstack"
import { ActionCard } from "./ActionCard"
import { InputText } from "../forms/InputText"
import { useEffect, useState } from "react"
import { AccountType } from "@/types/AccountType"
import { InputSlider } from "../forms/InputSlider"
import { Text, View } from "react-native"
import { PrimaryButton } from "../buttons/PrimaryButton"
import { BudgetType } from "@/types/BudgetType"
import { getMaxPercentage, insertBudget, updateBudget } from "@/database/budgetRepository"
import { getTotal } from "@/database/balanceRepository"

interface AddBudgetProps {
  open: boolean,
  handleClose: () => void,
  budget?: BudgetType | null,
  isEdit?: boolean,
}

export const AddBudget = ({ open, handleClose, budget = null, isEdit = false }: AddBudgetProps) => {
  const [name, setName] = useState<string>("")
  const [percentage, setPercentage] = useState<number>(30)
  const [maxLimit, setMaxLimit] = useState<number>(0)
  console.debug("Max limit:", maxLimit)
  // errors
  const [nameError, setNameError] = useState<boolean>(false)
  const [percentageError, setPercentageError] = useState<boolean>(false)

  // Reset form when modal opens/closes or when budget changes
  useEffect(() => {
    if (open) {
      if (isEdit && budget) {
        // Fill form with existing budget data
        setName(budget.name)
        setPercentage(budget.percentage_value)
      } else {
        // Reset form for new budget
        setName("")
        setPercentage(30)
      }
      // Reset errors
      setNameError(false)
      setPercentageError(false)
    }
  }, [open, isEdit, budget])

  useEffect(() => {
    getMaxPercentage()
      .then((row: any) => {
        const currentPercentage = isEdit && budget ? budget.percentage_value : 0
        setMaxLimit(100 - ((row?.sum_percentage ?? 0) - currentPercentage))
      })
  }, [open, isEdit, budget])

  const submit = () => {
    if (name.length === 0 || name.length > 255) {
      setNameError(true)
      return
    }

    if (percentage <= 0 || percentage > maxLimit) {
      setPercentageError(true)
      return
    }

    let total = 0
    getTotal().then(r => {
      total = r?.total ?? 0
      const amountPercentage = (total * percentage) / 100

      const budgetData: BudgetType = {
        id: isEdit && budget ? budget.id : null,
        name: name.trim(),
        max_limit: amountPercentage,
        expense_amount: isEdit && budget ? budget.expense_amount : 0,
        percentage_value: percentage,
        color: isEdit && budget ? budget.color : '#8637CF', // TODO add a color picker
      }

      if (isEdit && budget) {
        updateBudget(budgetData).then(() => {
          handleClose()
        })
      } else {
        insertBudget(budgetData).then(() => {
          handleClose()
        })
      }
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
        <PrimaryButton onPress={() => submit()}>
          <Text className="text-2xl text-white">
            {isEdit ? "Actualizar presupuesto" : "Agregar presupuesto"}
          </Text>
        </PrimaryButton>
      </View>
    </ActionCard>
  )
}