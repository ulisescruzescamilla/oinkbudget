import { View } from "@/components/Themed";
import { Actionsheet, ActionsheetBackdrop, ActionsheetContent, ActionsheetDragIndicator, ActionsheetDragIndicatorWrapper } from "@/components/ui/actionsheet";
import { FormControl, FormControlError, FormControlErrorIcon, FormControlErrorText, FormControlLabel, FormControlLabelText } from "@/components/ui/form-control";
import { AlertCircleIcon } from "@/components/ui/icon";
import { Input, InputField } from "@/components/ui/input";
import { VStack } from "@/components/ui/vstack";
import { AccountType, KindOfAccountType } from "@/types/AccountType";
import { useEffect, useRef, useState } from "react";
import { Keyboard } from "react-native";
import SelectOptions, { Item } from "../select";
import { PrimaryButton } from "../buttons";
import { createAccount } from "@/database/accountRepository";
import { useSQLiteContext } from "expo-sqlite";
import * as SQLite from 'expo-sqlite'


// TODO refactor Action card with open/handler props

interface AddAccountProps {
  open: boolean,
  handleClose: (open: boolean) => void,
  editAccount?: AccountType,
  editable?: boolean
}

const typeOptions = [
  { value: 'wallet', label: 'Cartera' },
  { value: 'debit_card', label: 'Tarjeta de débito' },
  { value: 'credit_card', label: 'Tarjeta de crédito' },
]

const AddAccount = ({ open, handleClose, editAccount, editable }: AddAccountProps) => {

  // errors
  const [nameError, setNameError] = useState<boolean>(false)
  const [amountError, setAmountError] = useState<boolean>(false)
  const [typeError, setTypeError] = useState<boolean>(false)
  // variables
  const [isKeyboardVisible, setIsKeyboardVisible] = useState<boolean>(false)
  const [name, setName] = useState<string>(editAccount ? editAccount.name : '')
  const [amount, setAmount] = useState<string>(editAccount ? editAccount.amount.toString() : '')
  const [type, setType] = useState<KindOfAccountType>(editAccount ? editAccount.type : 'debit_card')
  // refs
  const nameRef = useRef(null)
  const amountRef = useRef(null)
  const typeRef = useRef(null)
  // DB
  const database = SQLite.useSQLiteContext()

  const insertAccount = async (account: AccountType) => {
    try {
      database.runAsync("INSERT INTO accounts (name, type, amount) VALUES (?,?,?);", [
        account.name,
        account.type,
        account.amount
      ])

    } catch (error) {
      console.error(error)
      // todo make a notification component
    }
  }

  const updateAccount = async (account: AccountType) => {
    try {
      database.runAsync("UPDATE accounts SET name = ?, amount = ?, type = ? WHERE id = ?;", [
        account.name,
        account.amount,
        account.type,
        account.id
      ])

    } catch (error) {
      console.error(error)
      // todo make a notification component
    }
  }

  useEffect(() => {
    if (editable && editAccount) {
      setName(editAccount.name)
      setAmount(editAccount.amount.toString())
      setType(editAccount.type)
    }
  }, [editable, editAccount])

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', handleKeyboardShow)
    const hideSubscription = Keyboard.addListener('keyboardDidHide', handleKeyboardHide)

    return () => {
      // TODO reset values properly
      showSubscription.remove()
      setName('')
      setAmount('')
      setType('debit_card')
      setNameError(false)
      setAmountError(false)
      setTypeError(false)
      hideSubscription.remove()
    };
  }, [])

  const handleKeyboardShow = event => {
    setIsKeyboardVisible(true)
  };

  const handleKeyboardHide = event => {
    setIsKeyboardVisible(false)
  };

  const onSubmit = () => {
    if (!name || name.length > 255) {
      setNameError(true)
    }

    if (!amount || amount === '0') {
      setAmountError(true)
    }

    handleClose(false)

    if (editable) {
      updateAccount({
        id: editAccount.id,
        name: name.trim(),
        amount: parseFloat(amount),
        type
      } as AccountType)
    } else {
      insertAccount({
        name: name.trim(),
        amount: parseFloat(amount),
        type
      } as AccountType)
    }

  }

  return (
    <Actionsheet isOpen={open} onClose={() => handleClose(!open)}>
      <ActionsheetBackdrop />
      <ActionsheetContent>
        <ActionsheetDragIndicatorWrapper>
          <ActionsheetDragIndicator />
        </ActionsheetDragIndicatorWrapper>
        <View className={isKeyboardVisible ? 'w-full p-4 h-4/5' : 'w-full p-4 min-h-1/2 max-h-3/4'}>
          <VStack className="w-full" space='sm'>
            {/* Name */}
            <FormControl
              isInvalid={nameError}
              size="md"
              isDisabled={false}
              isReadOnly={false}
              isRequired={true}
            >
              <FormControlLabel>
                <FormControlLabelText>Nombre de la cuenta</FormControlLabelText>
              </FormControlLabel>
              <Input size="xl" variant="underlined">
                <InputField
                  type='text'
                  autoFocus={true}
                  ref={nameRef}
                  keyboardType="numbers-and-punctuation"
                  placeholder="Nombre"
                  variant={'outline'}
                  value={name}
                  onEndEditing={() => amountRef.current.focus()}
                  onChangeText={setName}
                />
              </Input>
              <FormControlError>
                <FormControlErrorIcon as={AlertCircleIcon} className="text-red-500" />
                <FormControlErrorText className="text-red-500">
                  El nombre es requerido y menor a 255 caracteres
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
                <FormControlLabelText>Monto actual</FormControlLabelText>
              </FormControlLabel>
              <Input size="xl" variant="underlined">
                <InputField
                  autoComplete='off'
                  type='text'
                  ref={amountRef}
                  keyboardType="numeric" // or "number-pad"
                  placeholder="$"
                  variant={'outline'}
                  value={amount}
                  onEndEditing={() => typeRef.current.focus()}
                  onChangeText={setAmount}
                />
              </Input>
              <FormControlError>
                <FormControlErrorIcon as={AlertCircleIcon} className="text-red-500" />
                <FormControlErrorText className="text-red-500">
                  El monto es requerido
                </FormControlErrorText>
              </FormControlError>
            </FormControl>
            {/* Tipo */}
            <FormControl
              isInvalid={typeError}
              size="md"
              isDisabled={false}
              isReadOnly={false}
              isRequired={true}
            >
              <FormControlLabel>
                <FormControlLabelText>Tipo de cuenta</FormControlLabelText>
              </FormControlLabel>
              <SelectOptions defaultValue={editAccount?.name} options={typeOptions} ref={typeRef} onValueChange={setType} variant="underlined" size='lg' />
              <FormControlError>
                <FormControlErrorIcon as={AlertCircleIcon} className="text-red-500" />
                <FormControlErrorText className="text-red-500">
                  El tipo de cuenta es requerido
                </FormControlErrorText>
              </FormControlError>
            </FormControl>
            <View className="mt-4">
              <PrimaryButton onPress={onSubmit} className="w-full mt-4">
                {editable ? 'Guardar cambios' : 'Agregar Cuenta'}
              </PrimaryButton>
            </View>
          </VStack>
        </View>
      </ActionsheetContent>
    </Actionsheet>
  )
}

export default AddAccount