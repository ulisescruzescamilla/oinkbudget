import { ColorAccordion } from "@/components/mine"
import { Badge, BadgeText } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Divider } from "@/components/ui/divider"
import { Heading } from "@/components/ui/heading"
import { LinearGradient } from "@/components/ui/linear-gradient"
import { getBalance, getBalanceByDate, getBalanceByDateDetails } from "@/database/balanceRepository"
import { BalanceType } from "@/types/BalanceType"
import { cashFormat } from "@/utils/formatting"
import { useFocusEffect } from "expo-router"
import { useCallback, useState } from "react"
import { Text, View } from "react-native"
import { ScrollView } from "react-native-gesture-handler"
import Iconify from "react-native-iconify"
import { SafeAreaView } from "react-native-safe-area-context"
import { TouchableOpacity } from "react-native"

const Tab = () => {

  const [dates, setDate] = useState<string[]>([])
  const [filter, setFilter] = useState<'date' | 'account' | 'type'>('date')

  useFocusEffect(
    useCallback(() => {
      getBalanceByDate().then(rows => {
        if (rows) {
          const dateStrings = rows.map(r => r.date)
          setDate(dateStrings)
        }
      })
    }, [])
  );

  return (
    <SafeAreaView style={styles.content}>
      {/* Content */}
      <LinearGradient
        className="w-full p-2"
        colors={['#8637CF', '#0F55A1']}
        start={[0, 1]}
        end={[1, 0]}
      >
        <Heading className="text-2xl color-white">Movimientos</Heading>
      </LinearGradient>
      {/* Filters */}
      <Card size={'md'} variant={'elevated'} className="flex flex-row items-center gap-3 p-4 m-4 mb-0">
        <View>
          <TouchableOpacity>
            <Badge size="lg" className={filter === 'date' ? 'bg-[#8637CF] text-white rounded-md px-4 py-1' : ''}>
              <BadgeText className={filter === 'date' ? 'text-white' : ''}>Por fecha</BadgeText>
            </Badge>
          </TouchableOpacity>
        </View>
        <View>
          <TouchableOpacity>
            <Badge size="lg" className={filter === 'account' ? 'bg-[#8637CF] text-white rounded-md px-4 py-1' : ''}>
              <BadgeText className={filter === 'account' ? 'text-white' : ''}>Por cuentas</BadgeText>
            </Badge>
          </TouchableOpacity>
        </View>
      </Card>
      {/* Content */}
      <Card size="md" variant="elevated" className="p-2 m-4">
        <ScrollView>
          {dates.map((dateStr, index) => (
            <ColorAccordion
              key={index}
              heading={dateStr}
              fetchData={() => {
                const str = dateStr === 'HOY' ? new Date().toISOString().split('T')[0] : dateStr.split('/').reverse().join('-')
                return getBalanceByDateDetails(str)
              }} />
          ))}
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