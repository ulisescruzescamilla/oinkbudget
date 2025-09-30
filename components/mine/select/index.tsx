import {
  Select,
  SelectTrigger,
  SelectInput,
  SelectIcon,
  SelectPortal,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicator,
  SelectDragIndicatorWrapper,
  SelectItem,
} from '@/components/ui/select';
import { ChevronDownIcon } from '@/components/ui/icon';

type Item = {
  label: string;
  value: string;
  isDisabled?: boolean;
}

interface SelectOptionsProps {
  options: Item[];
  placeholder?: string | null;
  variant?: 'outline' | 'underlined' | 'rounded',
  size?: 'sm' | 'md' | 'lg' | 'xl',
  onValueChange: (option: string) => any,
  ref?: any | undefined
}

const SelectOptions = ({ options, placeholder, variant = 'outline', size = 'md', onValueChange, ref = null }: SelectOptionsProps) => {
  return (
    <Select ref={ref} onValueChange={onValueChange}>
      <SelectTrigger variant={variant} size={size}>
        <SelectInput placeholder={placeholder || 'Selecciona una opción'} />
        <SelectIcon className="mr-3" as={ChevronDownIcon} />
      </SelectTrigger>
      <SelectPortal>
        <SelectBackdrop />
        <SelectContent>
          <SelectDragIndicatorWrapper>
            <SelectDragIndicator />
          </SelectDragIndicatorWrapper>
          {options.map((item: Item, index: number) => (
            <SelectItem key={index} label={item.label} value={item.value} isDisabled={item?.isDisabled} />
          ))}
        </SelectContent>
      </SelectPortal>
    </Select>
  )
}

export default SelectOptions