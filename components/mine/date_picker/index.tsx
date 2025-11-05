import DateTimePicker from '@react-native-community/datetimepicker'
import {
  DAY_OF_WEEK,
} from '@react-native-community/datetimepicker/src/constants'

interface DatePickerAndroidProps {
  date: Date;
  onChange: (event: any, date?: Date | undefined) => void
}

export const DatePickerAndroid = ({ date, onChange }: DatePickerAndroidProps) => {

  const firstDayOfWeek = DAY_OF_WEEK.monday

  return (
    <DateTimePicker
      testID="dateTimePicker"
      // timeZoneOffsetInMinutes={tzOffsetInMinutes}
      // maximumDate={maximumDate}
      value={date}
      locale="es-MX"
      // display={display}
      onChange={onChange}
      // neutralButton={{ label: neutralButtonLabel }}
      firstDayOfWeek={firstDayOfWeek}
    // title={isMaterialDesign ? title : undefined}
    // initialInputMode={isMaterialDesign ? inputMode : undefined}
    // design={design}
    // fullscreen={isMaterialDesign ? isFullscreen : undefined}
    />
  )
}