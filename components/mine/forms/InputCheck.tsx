import { Checkbox, CheckboxIcon, CheckboxIndicator, CheckboxLabel } from "@/components/ui/checkbox"
import { FormControl } from "@/components/ui/form-control"
import { CheckIcon } from '@/components/ui/icon'

interface InputCheckProps {
  onChange: (checked: boolean) => void;
  value: string;
  label: string;
  isDisabled?: boolean;
  isInvalid?: boolean;
}

export const InputCheck = ({ isDisabled = false, isInvalid = false, value, label, onChange }: InputCheckProps) => {
  return (
    <FormControl
      isInvalid={isInvalid}
      size="md"
      isDisabled={isDisabled}
      isReadOnly={false}
      isRequired={true}
    >
      <Checkbox onChange={onChange} value={value} isDisabled={isDisabled} isInvalid={isInvalid} size="md">
        <CheckboxIndicator>
          <CheckboxIcon as={CheckIcon} />
        </CheckboxIndicator>
        <CheckboxLabel>{label}</CheckboxLabel>
      </Checkbox>
    </FormControl>
  )
}