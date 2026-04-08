import { VStack } from "@/components/ui/vstack";
import { AccountType, KindOfAccountType } from "@/types/AccountType";
import { useEffect, useRef, useState } from "react";
import { PrimaryButton } from "../buttons/PrimaryButton";
import { ActionCard } from "./ActionCard";
import { InputText } from "../forms/InputText";
import { InputOptions } from "../forms/InputOptions";
import { Text, View } from 'react-native'
import { InputCheck } from "../forms/InputCheck";
import { FieldErrors, getFieldError } from "@/utils/errorHandler";
import { Spinner } from "@/components/ui/spinner";

interface AddAccountProps {
  open: boolean;
  handleClose: (open: boolean) => void;
  editAccount?: AccountType;
  editable?: boolean;
  /** Called when the form is submitted with valid local data. */
  onSave: (account: AccountType) => void;
  /** Per-field errors returned by the API (422 response). */
  fieldErrors?: FieldErrors | null;
  loading: boolean;
}

const typeOptions = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'debit_card', label: 'Tarjeta de débito' },
  { value: 'credit_card', label: 'Tarjeta de crédito' },
]

/**
 * Modal form for creating or editing an account.
 * Displays local validation errors and API field errors from 422 responses.
 */
const AddAccount = ({ open, handleClose, editAccount, editable, onSave, fieldErrors, loading }: AddAccountProps) => {

  // local validation errors
  const [nameError, setNameError] = useState<boolean>(false)
  const [amountError, setAmountError] = useState<boolean>(false)
  const [typeError, setTypeError] = useState<boolean>(false)
  // fields
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
      return
    }
    if (!amount || amount === '0') {
      setAmountError(true)
      return
    }
    if (!type) {
      setTypeError(true)
      return
    }

    const account: AccountType = {
      id: editable ? editAccount?.id ?? null : null,
      name: name.trim(),
      amount: parseFloat(amount),
      type,
      hidden: isHidden,
    }

    onSave(account)
  }

  // API field error messages (first message per field)
  const apiErrors = fieldErrors ?? undefined
  const apiNameError = getFieldError(apiErrors, 'name')
  const apiAmountError = getFieldError(apiErrors, 'amount')
  const apiTypeError = getFieldError(apiErrors, 'type')

  return (
    <ActionCard open={open} handleClose={handleClose}>
      <VStack className="w-full" space='md'>
        {/* Name */}
        <InputText
          isInvalid={nameError || !!apiNameError}
          autoFocus={true}
          value={name}
          label="Nombre de la cuenta"
          placeholder="Nombre"
          keyboardType="numbers-and-punctuation"
          onEditing={() => amountRef.current.focus()}
          onChangeText={(v) => { setName(v); setNameError(false) }}
          errorLabel={apiNameError ?? "El nombre es requerido y menor a 255 caracteres"}
        />
        {/* Amount */}
        <InputText
          isInvalid={amountError || !!apiAmountError}
          ref={amountRef}
          value={amount}
          label="Monto de la cuenta"
          placeholder="$"
          keyboardType="numeric"
          onEditing={() => typeRef.current.focus()}
          onChangeText={(v) => { setAmount(v); setAmountError(false) }}
          errorLabel={apiAmountError ?? "El monto es requerido"}
        />
        {/* Tipo */}
        <InputOptions
          defaultValue={editAccount?.type || ''}
          options={typeOptions}
          onValueChange={value => { setType(value as KindOfAccountType); setTypeError(false) }}
          isInvalid={typeError || !!apiTypeError}
          ref={typeRef}
          label="Tipo de cuenta"
          errorLabel={apiTypeError ?? "El tipo de cuenta es requerido"}
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
          <PrimaryButton onPress={onSubmit} loading={loading}>
            <Text className="text-2xl text-white">{editable ? 'Guardar cambios' : 'Agregar Cuenta'}</Text>
          </PrimaryButton>
        </View>
      </VStack>
    </ActionCard>
  )
}

export default AddAccount
