import { VStack } from "@/components/ui/vstack";
import { AccountType, KindOfAccountType } from "@/types/AccountType";
import { useEffect, useRef, useState } from "react";
import { PrimaryButton } from "../buttons";
import * as SQLite from 'expo-sqlite'
import { ActionCard } from "./ActionCard";
import { InputText } from "../forms/InputText";
import { InputOptions } from "../forms/InputOptions";
import { Text, View } from 'react-native'


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
  const [name, setName] = useState<string>(editAccount ? editAccount.name : '')
  const [amount, setAmount] = useState<string>(editAccount ? editAccount.amount.toString() : '')
  const [type, setType] = useState<KindOfAccountType>(editAccount ? editAccount.type : 'debit_card')
  // refs
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

    const account = {
      name: name.trim(),
      amount: parseFloat(amount),
      type
    } as AccountType

    if (editable) {
      updateAccount({ id: editAccount?.id, ...account } as AccountType)
    } else {
      insertAccount(account)
    }

  }

  return (
    <ActionCard open={open} handleClose={handleClose}>
      <VStack className="w-full" space='sm'>
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