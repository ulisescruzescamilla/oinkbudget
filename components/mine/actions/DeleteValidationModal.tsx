import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { CloseIcon, Icon } from "@/components/ui/icon";
import { Modal, ModalBackdrop, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader } from "@/components/ui/modal";

interface DeleteValidationModalProps {
  showModal: boolean;
  setShowModal: (toggle: boolean) => void;
  deleteAction: () => void;
  children?: React.ReactNode;
}

export const DeleteValidationModal = ({ showModal, setShowModal, deleteAction, children }: DeleteValidationModalProps) => {
  return (
    <Modal
      isOpen={showModal}
      onClose={() => {
        setShowModal(false);
      }}
      size="md"
    >
      <ModalBackdrop />
      <ModalContent>
        <ModalBody>
          <Heading size="lg">{children}</Heading>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="outline"
            action="secondary"
            className="mr-3"
            onPress={() => {
              setShowModal(false);
            }}
          >
            <ButtonText>Cancelar</ButtonText>
          </Button>
          <Button
            className={'bg-violet-600'}
            onPress={deleteAction}
          >
            <ButtonText>Borrar</ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}