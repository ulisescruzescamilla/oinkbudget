import { Button } from "@/components/ui/button"
import { LinearGradient } from "@/components/ui/linear-gradient"
import { Text } from "@/components/ui/text"
import { TouchableOpacity } from "react-native"

interface CancelButtonProps {
  onPress: () => void,
  children: React.ReactNode | string,
  className?: string,
}

export const CancelButton = ({ onPress, children, className = '' }: CancelButtonProps) => {

  return (
    <TouchableOpacity onPress={onPress}>
      <Button className={`bg-fuchsia-600 ${className}`} onPress={onPress}>
        {children}
      </Button>
    </TouchableOpacity >
  )
}