import { LinearGradient } from "@/components/ui/linear-gradient"
import { Text } from "@/components/ui/text"
import { TouchableOpacity } from "react-native"

interface PrimaryButtonProps {
  onPress: () => void,
  children: React.ReactNode | string,
  className?: string,
  size?: 'sm' | 'md' | 'lg'
}

export const PrimaryButton = ({ onPress, children, className = '', size = 'md' }: PrimaryButtonProps) => {
  const isChildrenString = typeof children === 'string'

  switch (size) {
    case 'sm':
      className += isChildrenString ? ' px-3 py-2 text-sm' : ' p-2'
      break;
    case 'lg':
      className += isChildrenString ? ' px-6 py-4 text-lg' : ' p-4'
      break;
    case 'md':
      className += isChildrenString ? ' px-4 py-3 text-base' : ' p-3'
      break;

    default:
      className += isChildrenString ? ' px-4 py-3 text-base' : ' p-3'
      break;
  }

  return (
    <TouchableOpacity onPress={onPress}>
      <LinearGradient
        className={`items-center w-full p-3 rounded-full ${className}`}
        colors={['#8637CF', '#0F55A1']}
        start={[0, 1]}
        end={[1, 0]}
      >
        {children}
      </LinearGradient>
    </TouchableOpacity >
  )
}