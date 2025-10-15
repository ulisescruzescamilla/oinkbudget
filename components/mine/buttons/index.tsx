import { LinearGradient } from "@/components/ui/linear-gradient"
import { Text } from "@/components/ui/text"
import { TouchableOpacity } from "react-native"

interface PrimaryButtonProps {
  onPress: () => void,
  children: React.ReactNode,
  className?: string,
}

export const PrimaryButton = ({ onPress, children, className }: PrimaryButtonProps) => {
  const isChildrenString = typeof children === 'string'

  return (
    <TouchableOpacity onPress={onPress}>
      <LinearGradient
        className="items-center w-full p-3 rounded-full"
        colors={['#8637CF', '#0F55A1']}
        start={[0, 1]}
        end={[1, 0]}
      >
        {isChildrenString ? <Text className="text-2xl text-white">{children}</Text> : { children }}
      </LinearGradient>
    </TouchableOpacity >
  )
}