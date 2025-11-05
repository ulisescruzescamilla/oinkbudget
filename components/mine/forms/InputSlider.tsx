import { FormControl, FormControlError, FormControlErrorIcon, FormControlErrorText, FormControlHelper, FormControlHelperText, FormControlLabel, FormControlLabelText } from "@/components/ui/form-control"
import { AlertCircleIcon } from "@/components/ui/icon"
import { Slider, SliderFilledTrack, SliderThumb, SliderTrack } from "@/components/ui/slider"
import { View } from "@/components/Themed"

interface InputSliderProps {
  isInvalid?: boolean,
  label: string,
  defaultValue: number,
  errorLabel?: string,
  // values
  value: number,
  onChange: (option: number) => any,
  maxValue?: number,
  minValue?: number,
  helperText?: string,
}

export const InputSlider = ({ label, value, defaultValue, onChange, errorLabel, maxValue, minValue, helperText, isInvalid }: InputSliderProps) => {
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
      {helperText && (
        <FormControlHelper>
          <FormControlHelperText>
            {helperText}
          </FormControlHelperText>
        </FormControlHelper>
      )}
      {errorLabel && (
        <FormControlError>
          <FormControlErrorIcon as={AlertCircleIcon} className="text-red-500" />
          <FormControlErrorText className="text-red-500">
            {errorLabel}
          </FormControlErrorText>
        </FormControlError>
      )}
    </FormControl>
  )
}