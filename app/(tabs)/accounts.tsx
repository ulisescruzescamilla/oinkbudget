import { PrimaryButton } from "@/components/mine"
import AddAccount from "@/components/mine/actions/AddAccount"
import { View } from "@/components/Themed"
import { Card } from "@/components/ui/card"
import { Heading } from "@/components/ui/heading"
import { LinearGradient } from "@/components/ui/linear-gradient"
import { Text } from "@/components/ui/text"
import { getAllAccounts } from "@/database/accountRepository"
import { AccountType } from "@/types/AccountType"
import { useEffect, useState } from "react"
import { ScrollView, StyleSheet } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

const accounts: AccountType[] = [
  { id: 1, name: 'Efectivo', amount: 500, type: 'wallet' },
  { id: 2, name: 'TDC BBVA', amount: -600, type: 'credit_card' },
  { id: 3, name: 'TDD BBVA', amount: 7000, type: 'debit_card' },
  { id: 4, name: 'TDD Banamex', amount: 1500, type: 'debit_card' },
]

const Tab = () => {

  const [isActionOpen, setActionOpen] = useState(false)

  const [accounts, setAccounts] = useState<AccountType[]>([])

  useEffect(() => {
    getAllAccounts().then((data) => {
      setAccounts(data)
    })
  }, [])

  return (
    <SafeAreaView style={styles.content}>
      <View style={styles.layout}>
        <LinearGradient
          className="w-full p-2"
          colors={['#8637CF', '#0F55A1']}
          start={[0, 1]}
          end={[1, 0]}
        >
          <Heading className="text-2xl color-white">Cuentas</Heading>
        </LinearGradient>
        <Card size="md" variant="elevated" className="p-2 m-4">
          <ScrollView>
            {accounts.map((account) => (
              <View key={account.id} className="flex flex-row w-full">
                <Text>{account.name}</Text>
                <Text>{account.amount}</Text>
                <Text>{account.type}</Text>
              </View>
            ))}
          </ScrollView>
        </Card>
      </View>
      <AddAccount open={isActionOpen} handleClose={setActionOpen} />
      <View style={styles.buttonlayout}>
        <PrimaryButton onPress={() => setActionOpen(true)}>
          {'Crear Cuenta'}
        </PrimaryButton>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    flexDirection: 'column'
  },
  layout: {
    flex: 9,
  },
  buttonlayout: {
    flex: 1,
    paddingHorizontal: '3%'
  },
})

export default Tab