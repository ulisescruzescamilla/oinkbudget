import { Text } from "@/components/Themed";
import { Button, ButtonText } from "@/components/ui/button";
import { FormControl, FormControlError, FormControlErrorIcon, FormControlErrorText, FormControlLabel, FormControlLabelText } from "@/components/ui/form-control";
import { Heading } from "@/components/ui/heading";
import { Icon, CloseIcon, AlertCircleIcon } from '@/components/ui/icon';
import { Input, InputField } from "@/components/ui/input";
import { Modal, ModalBackdrop, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader } from "@/components/ui/modal";
import { AccountType } from "@/types/AccountType";
import { useEffect, useState } from "react";
import SelectOptions from "../select";
import type { Item } from "../select";

interface TransferAccountProps {
  showModal: boolean;
  setShowModal: (toggle: boolean) => void;
  originAccount: AccountType | undefined;
  accounts: AccountType[];
  onTransfer: (to: AccountType, amount: number) => void;
}

export const TransferAccount = ({ showModal, setShowModal, originAccount, accounts, onTransfer }: TransferAccountProps) => {

  const [destinationId, setDestinationId] = useState<string>('')
  const [amount, setAmount] = useState<string>('0')
  const [submit, setSubmit] = useState<boolean>(false)

  // errors
  const [amountError, setAmountError] = useState<boolean>(false)
  const [destinationError, setDestinationError] = useState<boolean>(false)

  const accountItems: Item[] = accounts
    .filter((a) => a.id !== originAccount?.id)
    .map((a) => ({ value: String(a.id), label: a.name }))

  const onSubmit = () => {
    const parsedAmount = parseFloat(amount)
    if (parsedAmount <= 0 || parsedAmount > (originAccount?.amount ?? 0)) {
      setAmountError(true)
      return
    }
    if (!destinationId) {
      setDestinationError(true)
      return
    }

    const destination = accounts.find((a) => String(a.id) === destinationId)
    if (!destination) return

    onTransfer(destination, parsedAmount)
    setShowModal(false)
  }

  useEffect(() => {
    // reset values when modal closes
    if (!showModal) {
      setAmount('0')
      setDestinationId('')
      setSubmit(false)
      setAmountError(false)
      setDestinationError(false)
    }
  }, [showModal])

  useEffect(() => {
    setSubmit(!!destinationId && parseFloat(amount) > 0)
  }, [amount, destinationId])

  return (
    <Modal
      isOpen={showModal}
      onClose={() => setShowModal(false)}
      size="md"
    >
      <ModalBackdrop />
      <ModalContent>
        <ModalHeader>
          <Heading size="lg">Transferir desde {originAccount?.name}</Heading>
          <ModalCloseButton>
            <Icon as={CloseIcon} />
          </ModalCloseButton>
        </ModalHeader>
        <ModalBody>
          <FormControl
            isInvalid={destinationError}
            size="md"
            isDisabled={false}
            isReadOnly={false}
            isRequired={true}
          >
            <FormControlLabel>
              <FormControlLabelText>Cuenta Destino</FormControlLabelText>
            </FormControlLabel>
            <SelectOptions options={accountItems} onValueChange={setDestinationId} variant="underlined" size='lg' />
            <FormControlError>
              <FormControlErrorIcon as={AlertCircleIcon} className="text-red-500" />
              <FormControlErrorText className="text-red-500">
                Seleccione una cuenta
              </FormControlErrorText>
            </FormControlError>
          </FormControl>
          {/* Amount */}
          <FormControl
            isInvalid={amountError}
            size="md"
            isDisabled={false}
            isReadOnly={false}
            isRequired={true}
          >
            <FormControlLabel>
              <FormControlLabelText>Monto a transferir</FormControlLabelText>
            </FormControlLabel>
            <Input size="xl" variant="underlined">
              <InputField
                autoComplete='off'
                type='text'
                keyboardType="numeric"
                placeholder="$"
                variant={'outline'}
                value={amount}
                onChangeText={setAmount}
              />
            </Input>
            <FormControlError>
              <FormControlErrorIcon as={AlertCircleIcon} className="text-red-500" />
              <FormControlErrorText className="text-red-500">
                El monto es requerido, mayor a 0 y menor o igual a {originAccount?.amount}
              </FormControlErrorText>
            </FormControlError>
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="outline"
            action="secondary"
            className="mr-3"
            onPress={() => setShowModal(false)}
          >
            <ButtonText>Cancelar</ButtonText>
          </Button>
          <Button
            className={submit ? 'bg-violet-600' : 'bg-violet-200'}
            onPress={onSubmit}
            disabled={!submit}
          >
            <ButtonText>Transferir</ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
