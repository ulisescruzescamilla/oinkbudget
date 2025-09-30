import { View } from "@/components/Themed";
import { Actionsheet, ActionsheetBackdrop, ActionsheetContent, ActionsheetDragIndicator, ActionsheetDragIndicatorWrapper, ActionsheetItem } from "@/components/ui/actionsheet"
import { Button, ButtonText } from "@/components/ui/button";
import { FormControl, FormControlLabel, FormControlLabelText } from "@/components/ui/form-control";
import { Input, InputField } from "@/components/ui/input";
import { LinearGradient } from "@/components/ui/linear-gradient";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useRef, useState } from "react";
import { Platform, ScrollView, TouchableOpacity } from "react-native";
import SelectOptions from "../select";
import { DatePickerAndroid } from "../date_picker";

interface AddExpenseProps {
  isOpen: boolean;
  handleClose: (toggle: boolean) => void;
}

const AddExpense = ({ isOpen, handleClose }: AddExpenseProps) => {

  const [isInvalid, setIsInvalid] = useState(false);
  const [amountExpense, setAmountExpense] = useState<string>('')
  const [formatted, setFormatted] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [dateTouched, setDateTouched] = useState<'today' | 'other'>('today')
  const [date, setDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState<boolean>(false)

  const descriptionRef = useRef(null)
  const budgedRef = useRef(null)

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

  const handleSubmit = (data) => {
    console.debug(data)
  };


  return (
    <Actionsheet isOpen={isOpen} onClose={() => handleClose(!isOpen)}>
      <ActionsheetBackdrop />
      <ActionsheetContent>
        <ActionsheetDragIndicatorWrapper>
          <ActionsheetDragIndicator />
        </ActionsheetDragIndicatorWrapper>
        <ScrollView className="w-full">
          <View className="w-full p-4 min-h-1/2 max-h-3/4">
            <VStack>
              {/* Amount */}
              <FormControl
                isInvalid={isInvalid}
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
              </FormControl>

              <FormControl
                isInvalid={isInvalid}
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
              </FormControl>

              <FormControl
                isInvalid={isInvalid}
                size="md"
                isRequired={true}
                ref={budgedRef}
              >
                <FormControlLabel>
                  <FormControlLabelText>Presupuesto</FormControlLabelText>
                </FormControlLabel>
                <SelectOptions ref={budgedRef} onValueChange={(op) => console.debug(op)} options={[{ value: '1', label: 'Ropa' }, { value: '2', label: 'Transporte' }]} variant='underlined' />
              </FormControl>

              <FormControl
                isInvalid={isInvalid}
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
        </ScrollView>
      </ActionsheetContent >
    </Actionsheet >
  )
}

export default AddExpense