import { AlertDialog, AlertDialogBackdrop, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader } from "@/components/ui/alert-dialog"
import { Button, ButtonText } from "@/components/ui/button"
import { Heading } from "@/components/ui/heading"
import { Text } from "react-native";

interface ConfirmationModalProps {
  toggle: boolean;
  setToggle: (value: boolean) => void;
  title: string;
  message: string;
  onConfirm: () => void;
}

export const ConfirmationModal = ({ toggle, setToggle, title, message, onConfirm }: ConfirmationModalProps) => {
  return (
    <>
      <AlertDialog isOpen={toggle} onClose={() => setToggle(false)} size="md">
        <AlertDialogBackdrop />
        <AlertDialogContent>
          <AlertDialogHeader>
            <Heading className="font-semibold text-typography-950" size="md">
              {title}
            </Heading>
          </AlertDialogHeader>
          <AlertDialogBody className="mt-3 mb-4">
            <Text>
              {message}
            </Text>
          </AlertDialogBody>
          <AlertDialogFooter className="">
            <Button
              variant="outline"
              action="secondary"
              onPress={() => setToggle(false)}
              size="sm"
            >
              <ButtonText>Cancelar</ButtonText>
            </Button>
            <Button size="sm" onPress={onConfirm}>
              <ButtonText>Aceptar</ButtonText>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}