import { FormControl, FormControlError, FormControlErrorIcon, FormControlErrorText, FormControlLabel, FormControlLabelText } from "@/components/ui/form-control"
import { AlertCircleIcon } from "@/components/ui/icon"
import { Input, InputField } from "@/components/ui/input"


interface InputTextProps {
  label: string,
  ref?: any,
  isInvalid?: boolean,
  value: string,
  onEditing?: () => void | undefined,
  onChangeText: (text: string) => void,
  errorLabel?: string,
  keyboardType: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'numbers-and-punctuation' | 'url' | 'decimal-pad' | 'visible-password',
  placeholder?: string,
  autoComplete?: 'off' | 'username' | 'password' | 'email' | 'name' | 'tel' | 'street-address' | 'postal-code' | 'cc-number' | 'cc-csc' | 'cc-exp' | 'cc-exp-month' | 'cc-exp-year',
  autoFocus?: boolean
}

export const InputText = ({ label, ref, isInvalid, value, onEditing, onChangeText, autoComplete = 'off', errorLabel, keyboardType = 'default', placeholder, autoFocus = false }: InputTextProps) => {
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
      <Input size="xl" variant="underlined">
        <InputField
          type='text'
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          ref={ref}
          keyboardType={keyboardType}
          placeholder={placeholder || undefined}
          variant={'outline'}
          value={value}
          onEndEditing={onEditing}
          onChangeText={onChangeText}
        />
      </Input>
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
