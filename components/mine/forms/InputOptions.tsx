import { FormControl, FormControlError, FormControlErrorIcon, FormControlErrorText, FormControlLabel, FormControlLabelText } from "@/components/ui/form-control"
import { AlertCircleIcon } from "@/components/ui/icon"
import { Input, InputField } from "@/components/ui/input"
import SelectOptions, { Item } from "../select"

interface InputOptionsProps {
  label: string,
  ref?: any,
  isInvalid?: boolean,
  defaultValue: string,
  errorLabel?: string,
  placeholder?: string,
  options: Item[],
  onValueChange: (option: string) => any,
}

export const InputOptions = ({ label, ref, isInvalid, defaultValue, onValueChange, options, errorLabel, }: InputOptionsProps) => {
  return (
    <FormControl
      isInvalid={isInvalid}
      size="md"
      isDisabled={false}
      isReadOnly={false}
      isRequired={true}
    >
      <FormControlLabel>
        <FormControlLabelText>{label}</FormControlLabelText>
      </FormControlLabel>
      <SelectOptions
        defaultValue={defaultValue}
        options={options}
        ref={ref}
        onValueChange={onValueChange}
        variant="underlined"
        size='lg'
      />
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