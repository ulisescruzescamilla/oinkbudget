import { Text, View } from "react-native";
import { FormControl, FormControlLabel, FormControlLabelText } from "@/components/ui/form-control";
import { DatePickerAndroid } from "@/components/mine/date_picker";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Platform } from "react-native";

interface InputCalendarProps {
  date: Date;
  setDate: (selectedDate: Date) => void;
  label: string;
}

export const InputCalendar = ({ label, date, setDate }: InputCalendarProps) => {

  const [dateTouched, setDateTouched] = useState<'today' | 'other'>('today')
  const [showCalendar, setShowCalendar] = useState<boolean>(false)

  const onChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowCalendar(false)
    } else {
      console.error('iOS not supported')
    }

    if (selectedDate) {
      setDate(selectedDate)
    }
  }

  return (
    <FormControl
      size="md"
      isRequired={true}
    >
      <FormControlLabel>
        <FormControlLabelText>{label}</FormControlLabelText>
      </FormControlLabel>
      {showCalendar && (
        <DatePickerAndroid date={date} onChange={onChange} />
      )}
      <View className="flex flex-row gap-4">
        <Button onPress={() => { setDate(new Date); setDateTouched('today'); }} className={dateTouched == 'today' ? 'bg-violet-600 border-transparent' : ''} variant={'outline'}><Text className={dateTouched == 'today' ? 'text-white' : ''}>Hoy</Text></Button>
        <Button variant={'outline'} onPress={() => { setDateTouched('other'); setShowCalendar(true) }} className={dateTouched == 'other' ? 'bg-violet-600 border-transparent' : ''}><Text className={dateTouched == 'other' ? 'text-white' : ''}>{dateTouched == 'today' ? "Otra fecha" : date.toLocaleDateString()}</Text></Button>
      </View>
    </FormControl>
  )
}