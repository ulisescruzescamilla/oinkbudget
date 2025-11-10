import { VStack } from "@/components/ui/vstack";
import { AccountType, KindOfAccountType } from "@/types/AccountType";
import { useEffect, useRef, useState } from "react";
import { PrimaryButton } from "../buttons/PrimaryButton";
import * as SQLite from 'expo-sqlite'
import { ActionCard } from "./ActionCard";
import { InputText } from "../forms/InputText";
import { InputOptions } from "../forms/InputOptions";
import { Text, View } from 'react-native'
import { InputCheck } from "../forms/InputCheck";
import { createAccount, updateAccount } from "@/database/accountRepository";


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
  const [name, setName] = useState<string>(editAccount ? editAccount.name : '')
  const [amount, setAmount] = useState<string>(editAccount ? editAccount.amount.toString() : '')
  const [type, setType] = useState<KindOfAccountType>(editAccount ? editAccount.type : 'debit_card')
  const [isHidden, setIsHidden] = useState<boolean>(editAccount ? editAccount.hidden : false)
  // refs
  const amountRef = useRef(null)
  const typeRef = useRef(null)

  useEffect(() => {
    if (editable && editAccount) {
      setName(editAccount.name)
      setAmount(editAccount.amount.toString())
      setType(editAccount.type)
    }
  }, [editable, editAccount])

  const onSubmit = () => {
    if (!name || name.length > 255) {
      setNameError(true)
    }

    if (!amount || amount === '0') {
      setAmountError(true)
    }

    if (!type) {
      setTypeError(true)
    }

    handleClose(false)

    const account: AccountType = {
      name: name.trim(),
      amount: parseFloat(amount),
      type,
      hidden: isHidden
    } as AccountType

    if (editable) {
      updateAccount({ id: editAccount?.id, ...account } as AccountType)
    } else {
      createAccount(account)
    }

  }

  return (
    <ActionCard open={open} handleClose={handleClose}>
      <VStack className="w-full" space='md'>
        {/* Name */}
        <InputText
          isInvalid={nameError}
          autoFocus={true}
          value={name}
          label="Nombre de la cuenta"
          placeholder="Nombre"
          keyboardType="numbers-and-punctuation"
          onEditing={() => amountRef.current.focus()}
          onChangeText={setName}
          errorLabel="El nombre es requerido y menor a 255 caracteres"
        />
        {/* Amount */}
        <InputText
          isInvalid={amountError}
          ref={amountRef}
          value={amount}
          label="Monto de la cuenta"
          placeholder="$"
          keyboardType="numeric"
          onEditing={() => typeRef.current.focus()}
          onChangeText={setAmount}
          errorLabel="El monto es requerido"
        />
        {/* Tipo */}
        <InputOptions
          defaultValue={editAccount?.type || ''}
          options={typeOptions}
          onValueChange={value => setType(value as KindOfAccountType)}
          isInvalid={typeError}
          ref={typeRef}
          label="Tipo de cuenta"
          errorLabel="El tipo de cuenta es requerido"
        />
        {/* Is Hidden */}
        <InputCheck
          isDisabled={false}
          isInvalid={false}
          value={isHidden ? 'true' : 'false'}
          onChange={setIsHidden}
          label="Ocultar cuenta del total general"
        />
        <View className="mt-4">
          <PrimaryButton onPress={onSubmit}>
            <Text className="text-2xl text-white">{editable ? 'Guardar cambios' : 'Agregar Cuenta'}</Text>
          </PrimaryButton>
        </View>
      </VStack>
    </ActionCard>
  )
}

export default AddAccount