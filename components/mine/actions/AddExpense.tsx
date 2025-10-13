import { View } from "@/components/Themed";
import { Actionsheet, ActionsheetBackdrop, ActionsheetContent, ActionsheetDragIndicator, ActionsheetDragIndicatorWrapper, ActionsheetItem } from "@/components/ui/actionsheet"
import { Button, ButtonText } from "@/components/ui/button";
import { FormControl, FormControlError, FormControlErrorIcon, FormControlErrorText, FormControlLabel, FormControlLabelText } from "@/components/ui/form-control";
import { Input, InputField } from "@/components/ui/input";
import { LinearGradient } from "@/components/ui/linear-gradient";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useEffect, useRef, useState } from "react";
import { Platform, ScrollView, TouchableOpacity, KeyboardAvoidingView, Keyboard } from "react-native";
import SelectOptions from "../select";
import { DatePickerAndroid } from "../date_picker";
import type { ExpenseType } from '@/types/ExpenseType';
import { AlertCircleIcon } from '@/components/ui/icon';
import { createExpense } from "@/database/expenseRepository";

interface AddExpenseProps {
  isOpen: boolean;
  handleClose: (toggle: boolean) => void;
}

const AddExpense = ({ isOpen, handleClose }: AddExpenseProps) => {

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)

  const [accountIsInvalid, setAccountIsInvalid] = useState<boolean>(false);
  const [amontIsInvalid, setAmountIsInvalid] = useState(false);
  const [descriptionIsInvalid, setDescriptionIsInvalid] = useState(false)
  const [budgetIsInvalid, setBudgetIsInvalid] = useState(false);
  const [amountExpense, setAmountExpense] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [dateTouched, setDateTouched] = useState<'today' | 'other'>('today')
  const [date, setDate] = useState(new Date())
  const [budget, setBudget] = useState<string>()
  const [account, setAccount] = useState<string>()
  const [showCalendar, setShowCalendar] = useState<boolean>(false)

  const descriptionRef = useRef(null)
  const budgedRef = useRef(null)
  const accountRef = useRef(null)

  const onChange = (event, selectedDate: Date) => {
    if (Platform.OS === 'android') {
      setShowCalendar(false)
    } else {
      console.error('iOS not supported')
    }

    if (selectedDate) {
      setDate(selectedDate)
    }
  }

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', handleKeyboardShow)
    const hideSubscription = Keyboard.addListener('keyboardDidHide', handleKeyboardHide)

    return () => {
      showSubscription.remove()
    };
  }, [])

  const handleKeyboardShow = event => {
    setIsKeyboardVisible(true)
  };

  const handleKeyboardHide = event => {
    setIsKeyboardVisible(false)
  };


  const handleSubmit = () => {

    // validations
    if (!amountExpense || parseFloat(amountExpense) === 0) {
      setAmountIsInvalid(true)
    }

    if (!description || description.length <= 1 || description.length >= 255) {
      setDescriptionIsInvalid(true)
    }

    if (!budget) {
      setBudgetIsInvalid(true)
    }

    if (!account) {
      setAccountIsInvalid(true)
    }

    // make payload
    const payload: ExpenseType = {
      amount: parseFloat(amountExpense),
      description,
      date,
      account_id: parseInt(account),
      budget_id: parseInt(budget)
    }

    createExpense(payload)
  };


  return (
    <Actionsheet isOpen={isOpen} onClose={() => handleClose(!isOpen)}>
      <ActionsheetBackdrop />
      <ActionsheetContent>
        <ActionsheetDragIndicatorWrapper>
          <ActionsheetDragIndicator />
        </ActionsheetDragIndicatorWrapper>
        <View className={isKeyboardVisible ? 'w-full p-4 h-4/5' : 'w-full p-4 min-h-1/2 max-h-3/4'}>
          <VStack className="w-full" space='sm'>
            {/* Amount */}
            <FormControl
              isInvalid={amontIsInvalid}
              size="md"
              isDisabled={false}
              isReadOnly={false}
              isRequired={true}
            >
              <FormControlLabel>
                <FormControlLabelText>Monto</FormControlLabelText>
              </FormControlLabel>
              <Input size="xl" variant="underlined">
                <InputField
                  type='text'
                  autoFocus={true}
                  keyboardType="numeric" // or "number-pad"
                  placeholder="$"
                  variant={'outline'}
                  value={amountExpense}
                  onEndEditing={() => descriptionRef.current.focus()}
                  onChangeText={(text) => {
                    setAmountExpense(text);
                  }}
                />
              </Input>
              <FormControlError>
                <FormControlErrorIcon as={AlertCircleIcon} className="text-red-500" />
                <FormControlErrorText className="text-red-500">
                  El monto es requerido y debe ser diferente de cero
                </FormControlErrorText>
              </FormControlError>
            </FormControl>

            <FormControl
              isInvalid={descriptionIsInvalid}
              size="md"
              isRequired={false}
            >
              <FormControlLabel>
                <FormControlLabelText>Descripción</FormControlLabelText>
              </FormControlLabel>
              <Input size="xl" variant="underlined">
                <InputField
                  type='text'
                  ref={descriptionRef}
                  onEndEditing={() => budgedRef.current.focus()}
                  keyboardType="numbers-and-punctuation"
                  placeholder="producto/servicio"
                  variant={'outline'}
                  value={description}
                  onChangeText={setDescription}
                />
              </Input>
              <FormControlError>
                <FormControlErrorIcon as={AlertCircleIcon} className="text-red-500" />
                <FormControlErrorText className="text-red-500">
                  La descripción es al menos 1 caracter o menos de 255 caracteres
                </FormControlErrorText>
              </FormControlError>
            </FormControl>

            <FormControl
              isInvalid={budgetIsInvalid}
              size="md"
              isRequired={true}
              ref={budgedRef}
            >
              <FormControlLabel>
                <FormControlLabelText>Presupuesto</FormControlLabelText>
              </FormControlLabel>
              <SelectOptions ref={budgedRef} onValueChange={(op) => { setBudget(op); accountRef.current.focus(); }} options={[{ value: '1', label: 'Ropa' }, { value: '2', label: 'Transporte' }]} variant='underlined' />
              <FormControlError>
                <FormControlErrorIcon as={AlertCircleIcon} className="text-red-500" />
                <FormControlErrorText className="text-red-500">
                  El presupuesto es obligatorio
                </FormControlErrorText>
              </FormControlError>
            </FormControl>


            <FormControl
              isInvalid={accountIsInvalid}
              size="md"
              isRequired={true}
              ref={accountRef}
            >
              <FormControlLabel>
                <FormControlLabelText>Cuenta</FormControlLabelText>
              </FormControlLabel>
              <SelectOptions ref={accountRef} onValueChange={(op) => setAccount(op)} options={[{ value: '1', label: 'Efectivo' }, { value: '2', label: 'TDD BBVA' }]} variant='underlined' />
              <FormControlError>
                <FormControlErrorIcon as={AlertCircleIcon} className="text-red-500" />
                <FormControlErrorText className="text-red-500">
                  Seleccione una cuenta
                </FormControlErrorText>
              </FormControlError>
            </FormControl>

            <FormControl
              size="md"
              isRequired={true}
            >
              <FormControlLabel>
                <FormControlLabelText>Fecha</FormControlLabelText>
              </FormControlLabel>
              {showCalendar && (
                <DatePickerAndroid date={date} onChange={onChange} />
              )}
              <View className="flex flex-row gap-4">
                <Button onPress={() => { setDate(new Date); setDateTouched('today'); }} className={dateTouched == 'today' ? 'bg-violet-600 border-transparent' : ''} variant={'outline'}><Text className={dateTouched == 'today' ? 'text-white' : ''}>Hoy</Text></Button>
                <Button variant={'outline'} onPress={() => { setDateTouched('other'); setShowCalendar(true) }} className={dateTouched == 'other' ? 'bg-violet-600 border-transparent' : ''}><Text className={dateTouched == 'other' ? 'text-white' : ''}>{dateTouched == 'today' ? "Otra fecha" : date.toLocaleDateString()}</Text></Button>
              </View>
            </FormControl>
            {/* Submit button */}
            <View className="mt-3">
              <TouchableOpacity onPress={handleSubmit}>
                <LinearGradient
                  className="items-center w-full p-3 rounded-full"
                  colors={['#8637CF', '#0F55A1']}
                  start={[0, 1]}
                  end={[1, 0]}
                >
                  <Text className="text-2xl text-white">Guardar</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </VStack>
        </View >
      </ActionsheetContent >
    </Actionsheet >
  )
}

export default AddExpense