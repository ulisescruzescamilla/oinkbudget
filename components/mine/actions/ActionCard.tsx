import { View } from "@/components/Themed"
import { Actionsheet, ActionsheetBackdrop, ActionsheetContent, ActionsheetDragIndicator, ActionsheetDragIndicatorWrapper } from "@/components/ui/actionsheet"
import { useEffect, useState } from "react"
import { Keyboard } from "react-native"

interface ActionCardProps {
  open: boolean,
  handleClose: (open: boolean) => void,
  children: React.ReactNode
}

export const ActionCard = ({ open, handleClose, children }: ActionCardProps) => {

  const [isKeyboardVisible, setIsKeyboardVisible] = useState<boolean>(false)

  const handleKeyboardShow = event => {
    setIsKeyboardVisible(true)
  };

  const handleKeyboardHide = event => {
    setIsKeyboardVisible(false)
  };

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', handleKeyboardShow)
    const hideSubscription = Keyboard.addListener('keyboardDidHide', handleKeyboardHide)

    return () => {
      showSubscription.remove()
      hideSubscription.remove()
    };
  }, [])

  return (
    <Actionsheet isOpen={open} onClose={() => handleClose(!open)}>
      <ActionsheetBackdrop />
      <ActionsheetContent>
        <ActionsheetDragIndicatorWrapper>
          <ActionsheetDragIndicator />
        </ActionsheetDragIndicatorWrapper>
        <View className={isKeyboardVisible ? 'w-full p-4 h-4/5' : 'w-full p-4 min-h-1/2 max-h-3/4'}>
          {children}
        </View>
      </ActionsheetContent>
    </Actionsheet>
  )
}