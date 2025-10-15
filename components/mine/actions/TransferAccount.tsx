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
import * as SQLite from 'expo-sqlite';

interface TransferAccountProps {
  showModal: boolean;
  setShowModal: (toggle: boolean) => void,
  originAccount: AccountType | undefined
}

export const TransferAccount = ({ showModal, setShowModal, originAccount }: TransferAccountProps) => {

  const [destinationAccount, setDestinationAccount] = useState<string>('')
  const [amount, setAmount] = useState<string>('0')
  const [submit, setSubmit] = useState<boolean>(false)
  const [accounts, setAccounts] = useState<AccountType[]>([])
  const [accountItems, setAccountItems] = useState<Item[] | []>([])

  // errors
  const [amountError, setAmountError] = useState<boolean>(false)
  const [destinationError, setDestinationError] = useState<boolean>(false)

  // DB
  const database = SQLite.useSQLiteContext()

  const transferBtwAccount = async (origin: AccountType, destination: AccountType, amount: number) => {
    try {
      await database.withTransactionAsync(async () => {

        await database.runAsync("UPDATE accounts SET amount = ? WHERE id = ?;", [
          origin.amount - amount,
          origin.id
        ])

        await database.runAsync("UPDATE accounts SET amount = ? WHERE id = ?;", [
          destination.amount + amount,
          destination.id
        ])
      })
    } catch (error) {
      console.error(error)
    }
  }

  const getAccounts = async () => {
    try {
      return await database.getAllAsync<AccountType>("SELECT * FROM accounts;").then(
        accounts => {
          setAccounts(accounts)
          return accounts.map(account => ({
            value: account.id,
            label: account.name
          }))
        }
      )
    } catch (error) {
      console.error(error)
      // todo make a notification component
    }
  }

  const onSubmit = () => {
    if (parseInt(amount) <= 0 || parseInt(amount) > originAccount?.amount) {
      setAmountError(true)
      return
    }

    if (!destinationAccount) {
      setDestinationError(true)
      return
    }
    setShowModal(false)

    transferBtwAccount(originAccount as AccountType, accounts.find(a => a.id === destinationAccount) as AccountType, parseFloat(amount))
  }

  useEffect(() => {
    // fill select input
    getAccounts().then(a => setAccountItems(a))

    // reset values
    return () => {
      setAmount('0')
      setDestinationAccount('')
      setSubmit(false)
    }
  }, [showModal])

  useEffect(() => {
    if (destinationAccount && parseInt(amount) >= 0) {
      setSubmit(true)
    }
  }, [amount, destinationAccount])


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
            <SelectOptions options={accountItems} onValueChange={setDestinationAccount} variant="underlined" size='lg' />
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
                keyboardType="numeric" // or "number-pad"
                placeholder="$"
                variant={'outline'}
                value={amount}
                onChangeText={setAmount}
              />
            </Input>
            <FormControlError>
              <FormControlErrorIcon as={AlertCircleIcon} className="text-red-500" />
              <FormControlErrorText className="text-red-500">
                El monto es requerido y debe ser mayor a 0 y menor o igual a {originAccount?.amount}
              </FormControlErrorText>
            </FormControlError>
          </FormControl>
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