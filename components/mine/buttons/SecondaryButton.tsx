import { Button } from "@/components/ui/button"
import { LinearGradient } from "@/components/ui/linear-gradient"
import { Text } from "@/components/ui/text"
import { TouchableOpacity } from "react-native"

interface PrimaryButtonProps {
  onPress: () => void,
  children: React.ReactNode | string,
  className?: string,
}

export const SecondaryButton = ({ onPress, children, className = '' }: PrimaryButtonProps) => {

  return (
    <TouchableOpacity onPress={onPress}>
      <Button className={`bg-violet-800 ${className}`} onPress={onPress}>
        {children}
      </Button>
    </TouchableOpacity >
  )
}