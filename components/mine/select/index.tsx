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
import { View } from '@/components/Themed';

export type Item = {
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
  ref?: any | undefined,
  defaultValue?: string | undefined
}

const SelectOptions = ({ options, placeholder, variant = 'outline', size = 'md', onValueChange, ref = null, defaultValue = undefined }: SelectOptionsProps) => {
  return (
    <Select selectedValue={defaultValue} ref={ref} onValueChange={onValueChange}>
      <SelectTrigger className='flex flex-row' variant={variant} size={size}>
        <View className='w-3/4'>
          <SelectInput placeholder={placeholder || 'Selecciona una opción'} />
        </View>
        <View className='items-end w-1/4'>
          <SelectIcon className="mr-3" as={ChevronDownIcon} />
        </View>
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