import { useState } from "react"
import { FormControl, FormControlError, FormControlErrorIcon, FormControlErrorText, FormControlHelper, FormControlHelperText, FormControlLabel, FormControlLabelText } from "@/components/ui/form-control"
import { AlertCircleIcon } from "@/components/ui/icon"
import { Slider, SliderFilledTrack, SliderThumb, SliderTrack } from "@/components/ui/slider"
import { Input, InputField } from "@/components/ui/input"
import { Button, ButtonText } from "@/components/ui/button"
import { View } from "@/components/Themed"

export type SliderMode = 'porcentaje' | 'cantidad'

interface InputSliderProps {
  isInvalid?: boolean,
  label: string,
  defaultValue: number,
  errorLabel?: string,
  // Porcentaje mode
  value: number,
  onChange: (value: number) => any,
  maxValue?: number,
  minValue?: number,
  helperText?: string,
  // Cantidad mode
  amountValue?: number,
  onAmountChange?: (amount: number) => void,
  /** Called when the user switches modes */
  onModeChange?: (mode: SliderMode) => void,
}

/**
 * A form control that lets the user input a value either as a percentage
 * (via a slider) or as a fixed amount (via a currency text input).
 * The "Porcentaje" mode is selected by default.
 */
export const InputSlider = ({
  label,
  value,
  defaultValue,
  onChange,
  errorLabel,
  maxValue,
  minValue,
  helperText,
  isInvalid,
  amountValue = 0,
  onAmountChange,
  onModeChange,
}: InputSliderProps) => {
  const [mode, setMode] = useState<SliderMode>('porcentaje')
  const [rawAmount, setRawAmount] = useState<string>(amountValue > 0 ? String(amountValue) : '')

  const handleModeChange = (next: SliderMode) => {
    setMode(next)
    onModeChange?.(next)
  }

  const handleAmountChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '')
    setRawAmount(cleaned)
    const parsed = parseFloat(cleaned)
    if (!isNaN(parsed)) {
      onAmountChange?.(parsed)
    }
  }

  const isPorcentaje = mode === 'porcentaje'

  return (
    <FormControl
      size="md"
      isDisabled={false}
      isReadOnly={false}
      isRequired={true}
      isInvalid={isInvalid}
    >
      <FormControlLabel>
        <FormControlLabelText>{label}</FormControlLabelText>
      </FormControlLabel>

      {/* Mode toggle */}
      <View className="flex flex-row gap-2 mt-2 mb-1">
        <Button
          variant="outline"
          size="sm"
          className={isPorcentaje ? "bg-violet-600 border-transparent" : "border-violet-600"}
          onPress={() => handleModeChange('porcentaje')}
        >
          <ButtonText className={isPorcentaje ? "text-white" : "text-violet-600"}>
            Porcentaje
          </ButtonText>
        </Button>

        <Button
          variant="outline"
          size="sm"
          className={!isPorcentaje ? "bg-violet-600 border-transparent" : "border-violet-600"}
          onPress={() => handleModeChange('cantidad')}
        >
          <ButtonText className={!isPorcentaje ? "text-white" : "text-violet-600"}>
            Cantidad
          </ButtonText>
        </Button>
      </View>

      {
        isPorcentaje ? (
          <View className="mt-4 mb-4">
            <Slider
              defaultValue={defaultValue}
              value={value}
              size="md"
              orientation="horizontal"
              isDisabled={false}
              isReversed={false}
              onChange={onChange}
              minValue={minValue}
              maxValue={maxValue}
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb />
            </Slider>
          </View>
        ) : (
          <Input size="xl" variant="underlined" className="mt-2 mb-2">
            <InputField
              type="text"
              keyboardType="decimal-pad"
              placeholder="$ 0.00"
              value={rawAmount}
              onChangeText={handleAmountChange}
            />
          </Input>
        )
      }

      {
        helperText && isPorcentaje && (
          <FormControlHelper>
            <FormControlHelperText>{helperText}</FormControlHelperText>
          </FormControlHelper>
        )
      }

      {
        errorLabel && (
          <FormControlError>
            <FormControlErrorIcon as={AlertCircleIcon} className="text-red-500" />
            <FormControlErrorText className="text-red-500">
              {errorLabel}
            </FormControlErrorText>
          </FormControlError>
        )
      }
    </FormControl >
  )
}
