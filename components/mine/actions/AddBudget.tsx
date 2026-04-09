import { VStack } from "@/components/ui/vstack"
import { ActionCard } from "./ActionCard"
import { InputText } from "../forms/InputText"
import { useEffect, useState } from "react"
import { InputSlider, SliderMode } from "../forms/InputSlider"
import { InputDateRange } from "../forms/InputDateRange"
import { InputColorPicker } from "../forms/InputColorPicker"
import { Text, View } from "react-native"
import { PrimaryButton } from "../buttons/PrimaryButton"
import { BudgetType } from "@/types/BudgetType"
import { FieldErrors, getFieldError } from "@/utils/errorHandler"

interface AddBudgetProps {
  open: boolean;
  handleClose: () => void;
  budget?: BudgetType | null;
  isEdit?: boolean;
  /** Called when the form is submitted with valid local data. */
  onSave: (budget: BudgetType) => void;
  /** Percentage points already allocated by other budgets, used to cap the slider. */
  allocatedPercentage: number;
  /** Per-field errors returned by the API (422 response). */
  fieldErrors?: FieldErrors | null;
}

const DEFAULT_COLOR = '#8637CF';

/**
 * Modal form for creating or editing a budget.
 * Displays local validation errors and API field errors from 422 responses.
 */
export const AddBudget = ({
  open,
  handleClose,
  budget = null,
  isEdit = false,
  onSave,
  allocatedPercentage,
  fieldErrors,
}: AddBudgetProps) => {
  const [name, setName] = useState<string>('')
  const [percentage, setPercentage] = useState<number>(10)
  const [amount, setAmount] = useState<number>(0)
  const [sliderMode, setSliderMode] = useState<SliderMode>('porcentaje')
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [endDate, setEndDate] = useState<Date>(new Date())
  const [graphColor, setGraphColor] = useState<string>(DEFAULT_COLOR)

  // local validation errors
  const [nameError, setNameError] = useState<boolean>(false)
  const [percentageError, setPercentageError] = useState<boolean>(false)

  /**
   * Available percentage for the slider:
   * excludes the current budget's own allocation when editing.
   */
  const maxAvailablePercentage = isEdit && budget
    ? 100 - (allocatedPercentage - budget.percentage_value)
    : 100 - allocatedPercentage

  useEffect(() => {
    if (open) {
      if (isEdit && budget) {
        setName(budget.name)
        setPercentage(budget.percentage_value)
        setStartDate(budget.start_date ?? new Date())
        setEndDate(budget.end_date ?? new Date())
        setGraphColor(budget.graph_color ?? DEFAULT_COLOR)
      } else {
        setName('')
        setPercentage(10)
        setStartDate(new Date())
        setEndDate(new Date())
        setGraphColor(DEFAULT_COLOR)
      }
      setNameError(false)
      setPercentageError(false)
    }
  }, [open])

  const submit = () => {
    if (name.length === 0 || name.length > 255) {
      setNameError(true)
      return
    }

    if (sliderMode === 'porcentaje' && (percentage <= 0 || percentage > maxAvailablePercentage)) {
      setPercentageError(true)
      return
    }

    if (sliderMode === 'cantidad' && amount <= 0) {
      setPercentageError(true)
      return
    }

    const budgetData: BudgetType = {
      id: isEdit && budget ? budget.id : null,
      name: name.trim(),
      max_limit: sliderMode === 'cantidad' ? amount : 0,
      percentage_value: sliderMode === 'porcentaje' ? percentage : 0,
      color: isEdit && budget ? budget.color : '',
      graph_color: graphColor,
      start_date: startDate,
      end_date: endDate,
    }

    onSave(budgetData)
  }

  // API field error messages (first message per field)
  const apiErrors = fieldErrors ?? undefined
  const apiNameError = getFieldError(apiErrors, 'name')
  const apiPercentageError = getFieldError(apiErrors, 'percentage_value')

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
          isInvalid={nameError || !!apiNameError}
          onChangeText={(v) => { setName(v); setNameError(false) }}
          errorLabel={apiNameError ?? "El nombre es requerido y menor a 255 caracteres"}
        />
        {/* Percentage / Amount */}
        <InputSlider
          value={percentage}
          defaultValue={10}
          maxValue={maxAvailablePercentage}
          onChange={(v) => { setPercentage(v); setPercentageError(false) }}
          label={sliderMode === 'porcentaje'
            ? `Porcentaje asignado de tu ingreso ${percentage}%`
            : 'Cantidad máxima del presupuesto'}
          errorLabel={apiPercentageError ?? (sliderMode === 'porcentaje'
            ? "La suma de los presupuestos no debe ser mayor a 100%"
            : "Ingresa una cantidad mayor a 0")}
          helperText={`Porcentaje máximo disponible ${maxAvailablePercentage}%`}
          isInvalid={percentageError || !!apiPercentageError}
          amountValue={amount}
          onAmountChange={(v) => { setAmount(v); setPercentageError(false) }}
          onModeChange={setSliderMode}
        />
        {/* Date range */}
        <InputDateRange
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />
        {/* Color */}
        <InputColorPicker
          value={graphColor}
          onChange={setGraphColor}
        />
      </VStack>
      <View className='mt-4'>
        <PrimaryButton loading={false} onPress={submit}>
          <Text className="text-2xl text-white">
            {isEdit ? "Actualizar presupuesto" : "Agregar presupuesto"}
          </Text>
        </PrimaryButton>
      </View>
    </ActionCard>
  )
}
