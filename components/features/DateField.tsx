/**
 * DateField — "Fecha" row with Hoy/Ayer presets and a pill that opens the
 * native date picker for any other date. Ported from the date row in
 * `design/src/quickadd.jsx`.
 */
import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import DateTimePicker, { type DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import { Chip, Icon, Text, cn } from '@/components/ui';
import { useTheme } from '@/styles/useTheme';
import { dayLabel, dayOffset, isSameDay } from '@/utils/formatting';

export interface DateFieldProps {
  label?: string;
  value: Date;
  onChange: (date: Date) => void;
  /** Ceiling for the picker; defaults to today (no future dates). */
  maximumDate?: Date;
  className?: string;
}

/** "Fecha" field: Hoy/Ayer preset chips plus a pill that opens the native picker for any other date. */
export function DateField({ label = 'Fecha', value, onChange, maximumDate, className }: DateFieldProps) {
  const t = useTheme();
  const [showPicker, setShowPicker] = useState(false);
  const today = dayOffset(0);
  const yesterday = dayOffset(-1);
  const isPreset = isSameDay(value, today) || isSameDay(value, yesterday);
  const max = maximumDate ?? today;

  const pick = (d: Date) => {
    setShowPicker(false);
    onChange(d);
  };

  const handleValueChange = (_event: DateTimePickerChangeEvent, selected: Date) => {
    if (Platform.OS === 'android') setShowPicker(false);
    onChange(selected);
  };

  const handleDismiss = () => {
    setShowPicker(false);
  };

  return (
    <View className={className}>
      <Text className="mb-[7px] text-[12.5px] font-strong text-muted">{label}</Text>
      <View className="flex-row flex-wrap items-center gap-2">
        <Chip label="Hoy" active={isSameDay(value, today)} onPress={() => pick(today)} />
        <Chip label="Ayer" active={isSameDay(value, yesterday)} onPress={() => pick(yesterday)} />
        <Pressable
          onPress={() => setShowPicker(true)}
          className={cn(
            'flex-row items-center gap-1.5 rounded-pill border px-3.5 py-2 active:scale-95',
            isPreset ? 'bg-card border-border' : 'bg-primary-soft border-transparent'
          )}
        >
          <Icon name="cal" size={15} strokeWidth={2.2} color={isPreset ? t.muted : t.primary} />
          <Text className={cn('text-[13.5px] font-strong', isPreset ? 'text-muted' : 'text-primary')}>
            {isPreset ? 'Otra fecha' : dayLabel(value)}
          </Text>
        </Pressable>
      </View>

      {showPicker ? (
        <View className={Platform.OS === 'ios' ? 'mt-2 items-center' : undefined}>
          <DateTimePicker
            value={value}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            maximumDate={max}
            onValueChange={handleValueChange}
            onDismiss={handleDismiss}
          />
          {Platform.OS === 'ios' ? (
            <Chip label="Listo" active onPress={() => setShowPicker(false)} className="mt-2" />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export default DateField;
