import { useState } from "react";
import { Keyboard, Pressable, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { FormControl, FormControlLabel, FormControlLabelText } from "@/components/ui/form-control";
import { Button } from "@/components/ui/button";
import { Calendar, CalendarTheme, toDateId, fromDateId } from "@marceloterreiro/flash-calendar";

const accent = "#8637CF";

const calendarTheme: CalendarTheme = {
  rowMonth: {
    content: {
      textAlign: "left",
      color: "rgba(0, 0, 0, 0.7)",
      fontWeight: "700",
    },
  },
  rowWeek: {
    container: {
      borderBottomWidth: 1,
      borderBottomColor: "rgba(0, 0, 0, 0.1)",
      borderStyle: "solid",
    },
  },
  itemWeekName: { content: { color: "rgba(0, 0, 0, 0.5)" } },
  itemDayContainer: {
    activeDayFiller: {
      backgroundColor: accent,
    },
  },
  itemDay: {
    idle: ({ isPressed, isWeekend }) => ({
      container: {
        backgroundColor: isPressed ? accent : "transparent",
        borderRadius: 4,
      },
      content: {
        color: isWeekend && !isPressed ? "rgba(0, 0, 0, 0.4)" : isPressed ? "#ffffff" : "#000000",
      },
    }),
    today: ({ isPressed }) => ({
      container: {
        borderColor: accent,
        borderRadius: isPressed ? 4 : 30,
        backgroundColor: isPressed ? accent : "transparent",
      },
      content: {
        color: isPressed ? "#ffffff" : accent,
      },
    }),
    active: ({ isEndOfRange, isStartOfRange }) => ({
      container: {
        backgroundColor: accent,
        borderTopLeftRadius: isStartOfRange ? 4 : 0,
        borderBottomLeftRadius: isStartOfRange ? 4 : 0,
        borderTopRightRadius: isEndOfRange ? 4 : 0,
        borderBottomRightRadius: isEndOfRange ? 4 : 0,
      },
      content: {
        color: "#ffffff",
      },
    }),
  },
};

/** Returns a new Date shifted by `delta` months, clamped to the last valid day. */
const shiftMonth = (date: Date, delta: number): Date => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + delta);
  return d;
};

interface InputDateRangeProps {
  startDate: Date;
  endDate: Date;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
  label?: string;
}

/**
 * A single form control for selecting a date range (start + end).
 * Tapping either date button toggles an inline flash-calendar.
 * First tap sets the start date; second tap sets the end date.
 * Swipe left/right or tap the arrow buttons to navigate months.
 */
export const InputDateRange = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  label = "Rango de fechas",
}: InputDateRangeProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(startDate);
  // Tracks the pending start while the user is picking the end date
  const [pendingStartId, setPendingStartId] = useState<string | null>(null);

  const startId = toDateId(startDate);
  const endId = toDateId(endDate);
  const currentMonthId = toDateId(currentMonth);

  const calendarActiveDateRanges = pendingStartId
    ? [{ startId: pendingStartId, endId: undefined }]
    : [{ startId, endId }];

  const goToPrevMonth = () => setCurrentMonth((d) => shiftMonth(d, -1));
  const goToNextMonth = () => setCurrentMonth((d) => shiftMonth(d, +1));

  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-10, 10])
    .runOnJS(true)
    .onEnd((e) => {
      if (e.translationX < -20) goToNextMonth();
      else if (e.translationX > 20) goToPrevMonth();
    });

  const handleDayPress = (dateId: string) => {
    if (!pendingStartId) {
      // First tap: record start, wait for end
      setPendingStartId(dateId);
      onStartDateChange(fromDateId(dateId));
    } else {
      // Second tap: finalize range (swap if needed)
      if (dateId < pendingStartId) {
        onStartDateChange(fromDateId(dateId));
        onEndDateChange(fromDateId(pendingStartId));
      } else {
        onEndDateChange(fromDateId(dateId));
      }
      setPendingStartId(null);
      // setIsOpen(false);
    }
  };

  const toggleCalendar = () => {
    Keyboard.dismiss();
    setIsOpen((prev) => !prev);
    setPendingStartId(null);
  };

  return (
    <FormControl size="md">
      <FormControlLabel>
        <FormControlLabelText>{label}</FormControlLabelText>
      </FormControlLabel>

      <View className="flex flex-row items-center gap-3 mb-2">
        <View className="flex-1">
          <Text className="text-xs text-gray-500 mb-1">Inicio</Text>
          <Button
            variant="outline"
            className={isOpen ? "bg-violet-600 border-transparent" : ""}
            onPress={toggleCalendar}
          >
            <Text className={isOpen ? "text-white" : ""}>
              {startDate.toLocaleDateString("es-MX")}
            </Text>
          </Button>
        </View>

        <Text className="text-gray-400 mt-4">—</Text>

        <View className="flex-1">
          <Text className="text-xs text-gray-500 mb-1">Fin</Text>
          <Button
            variant="outline"
            className={isOpen ? "bg-violet-600 border-transparent" : ""}
            onPress={toggleCalendar}
          >
            <Text className={isOpen ? "text-white" : ""}>
              {endDate.toLocaleDateString("es-MX")}
            </Text>
          </Button>
        </View>
      </View>

      {isOpen && (
        <GestureDetector gesture={swipeGesture}>
          <View>
            <View className="flex flex-row justify-between items-center mb-1 px-1">
              <Pressable onPress={goToPrevMonth} hitSlop={8}>
                <Text className="text-violet-600 text-lg font-bold">‹</Text>
              </Pressable>
              <Pressable onPress={goToNextMonth} hitSlop={8}>
                <Text className="text-violet-600 text-lg font-bold">›</Text>
              </Pressable>
            </View>

            <Calendar
              calendarMonthId={currentMonthId}
              calendarActiveDateRanges={calendarActiveDateRanges}
              calendarFirstDayOfWeek="monday"
              calendarFormatLocale="es-MX"
              onCalendarDayPress={handleDayPress}
              theme={calendarTheme}
            />
          </View>
        </GestureDetector>
      )}
    </FormControl>
  );
};
