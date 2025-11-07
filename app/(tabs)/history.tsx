import { ColorAccordion, GradientView, InputCalendar, ThemedAccordion } from "@/components/mine"
import { Badge, BadgeText } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Heading } from "@/components/ui/heading"
import { LinearGradient } from "@/components/ui/linear-gradient"
import { getBalanceByDate } from "@/database/balanceRepository"
import { useFocusEffect } from "expo-router"
import { use, useCallback, useEffect, useState } from "react"
import { Text, View } from "react-native"
import { ScrollView } from "react-native-gesture-handler"
import { SafeAreaView } from "react-native-safe-area-context"
import { TouchableOpacity } from "react-native"
import { VStack } from "@/components/ui/vstack"
import { cashFormat } from "@/utils/formatting"
import Iconify from "react-native-iconify"

const Tab = () => {
  const [date, setDate] = useState<Date>(new Date())
  const [dateString, setDateString] = useState<string>(date.toISOString().split('T')[0])
  const [data, setData] = useState<any[] | undefined>([])

  useFocusEffect(
    useCallback(() => {
      getBalanceByDate(dateString).then(rows => {
        setData(rows)
      })
    }, [])
  );

  useEffect(() => {
    setDateString(date.toISOString().split('T')[0])
  }, [date])

  useEffect(() => {
    getBalanceByDate(dateString).then(rows => {
      setData(rows)
    })
  }, [dateString])

  return (
    <SafeAreaView style={styles.content}>
      {/* Content */}
      <GradientView>
        <Heading className="text-2xl color-white">Movimientos</Heading>
      </GradientView>
      {/* Filters */}
      <Card size={'md'} variant={'elevated'} className="flex flex-row p-4 m-4">
        <InputCalendar date={date} setDate={setDate} isForm={false} />
      </Card>
      {/* Content */}
      <Card size="md" variant="elevated" className="p-2 m-4">
        {!data || data.length === 0 && (
          <View className="flex flex-row items-center justify-center p-4">
            <Heading>No hay movimientos para mostrar</Heading>
          </View>
        )}
        <ScrollView>
          <VStack>
            <View className="flex flex-row p-2">
              <Text className="flex-1 font-bold">Monto</Text>
              <Text className="flex-1 font-bold">Cuenta</Text>
              <Text className="flex-1 font-bold">Descripción</Text>
              <Text className="font-bold flex-4">I/O</Text>
            </View>
            <ScrollView>
              {data?.map((data, index) => (
                <View className="flex flex-row p-2" key={index}>
                  <Text className="flex-1">{data.type === 'income' ? cashFormat(data.amount) : `-${cashFormat(data.amount)}`}</Text>
                  <Text className="flex-1">{data.account_name}</Text>
                  <Text className="flex-1">{data.description}</Text>
                  <View className="flex-4">
                    {data.type === 'income' ? (
                      <Iconify icon="raphael:arrowup" color="green" />
                    ) : (
                      <Iconify icon="raphael:arrowdown" color="red" />
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
          </VStack>
        </ScrollView>
      </Card>
    </SafeAreaView >
  )
}

const styles = {
  content: {
    flex: 1,
  },
}

export default Tab