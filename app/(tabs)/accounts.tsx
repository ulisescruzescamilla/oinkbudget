import { PrimaryButton, SwipeableRow } from "@/components/mine"
import AddAccount from "@/components/mine/actions/AddAccount"
import { View } from "@/components/Themed"
import { Card } from "@/components/ui/card"
import { Heading } from "@/components/ui/heading"
import { LinearGradient } from "@/components/ui/linear-gradient"
import { Text } from "react-native"
import { VStack } from "@/components/ui/vstack"
import { deleteAccount, getAllAccounts } from "@/database/accountRepository"
import { AccountType } from "@/types/AccountType"
import { cashFormat } from "@/utils/formatting"
import { useCallback, useEffect, useState } from "react"
import { ScrollView, StyleSheet, TouchableOpacity } from "react-native"
import Iconify from "react-native-iconify"
import { SafeAreaView } from "react-native-safe-area-context"
import { TransferAccount } from "@/components/mine/actions/TransferAccount"
import * as SQLite from 'expo-sqlite';
import { DeleteValidationModal } from "@/components/mine/actions/DeleteValidationModal"
import { getTotal } from "@/database/balanceRepository"
import AddIncome from "@/components/mine/actions/AddIncome"
import { useFocusEffect } from "expo-router"


interface BalanceType {
  total: number;
}

const Tab = () => {

  const [isActionOpen, setActionOpen] = useState(false)
  const [isTransferOpen, setTransferOpen] = useState(false)
  const [isDeleteOpen, setDeleteOpen] = useState(false)

  const [accounts, setAccounts] = useState<AccountType[]>([])

  const [accountSelected, setAccountSelected] = useState<AccountType | undefined>()
  const [balance, setBalance] = useState<BalanceType>()
  const [isEditable, setIsEditable] = useState<boolean>(false)

  useFocusEffect(
    useCallback(() => {
      getAllAccounts().then(fetchedAccounts => setAccounts(fetchedAccounts))
      getTotal().then(r => setBalance({ ...balance, total: r.total }))

      return () => {
        // This code will run when the screen blurs (e.g., navigating away)
        console.log('Screen blurred!');
      };
    }, [])
  );

  useEffect(() => {
    getAllAccounts().then(fetchedAccounts => setAccounts(fetchedAccounts))
    getTotal().then(r => setBalance({ ...balance, total: r.total }))
  }, [isActionOpen, isTransferOpen, isDeleteOpen])

  return (
    <SafeAreaView style={styles.content}>
      {/* Modals */}
      <TransferAccount showModal={isTransferOpen} setShowModal={setTransferOpen} originAccount={accountSelected} />
      <DeleteValidationModal showModal={isDeleteOpen} setShowModal={setDeleteOpen} deleteAction={() => {
        if (accountSelected) {
          deleteAccount(accountSelected)
          setDeleteOpen(false)
        }
      }}>
        <Heading>¿Estás seguro de eliminar esta cuenta y sus registros?</Heading>
      </DeleteValidationModal>
      {/* Content */}
      <LinearGradient
        className="w-full p-2"
        colors={['#8637CF', '#0F55A1']}
        start={[0, 1]}
        end={[1, 0]}
      >
        <Heading className="text-2xl color-white">Cuentas</Heading>
      </LinearGradient>
      {/* General balance */}
      <Card size="md" variant="elevated" className="p-3 m-3">
        <VStack>
          <Heading>Total de tus cuentas</Heading>
          <Text className="text-lg">{cashFormat(balance?.total)}</Text>
        </VStack>
      </Card>

      {/* Account list */}
      <Card size="md" variant="elevated" className="p-2 m-4">
        <ScrollView>
          {!accounts.length && (
            <View className="flex flex-row items-center justify-center p-4 text-center">
              <Heading size={'xl'}>Ya puedes crear tu nueva cuenta</Heading>
            </View>
          )}
          <VStack space={'lg'} className="">
            {accounts.map((account, index) => (
              <SwipeableRow key={index} options={
                <View className="flex flex-row gap-2 bg-transparent">
                  <TouchableOpacity onPress={() => {
                    setIsEditable(true)
                    setAccountSelected(account)
                    setActionOpen(true)
                  }}>
                    <Iconify icon='fe:pencil' width={32} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => {
                    setAccountSelected(account)
                    setDeleteOpen(true)
                  }}>
                    <Iconify icon='tabler:trash' width={32} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => {
                    setTransferOpen(true)
                    setAccountSelected(account)
                  }}>
                    <Iconify icon='tabler:transfer' width={32} />
                  </TouchableOpacity>
                </View>
              }>
                <View key={index} className="w-full p-3">
                  <View className="flex flex-row items-center gap-4 ">
                    <View className="w-1/4"><Heading>{account.name}</Heading></View>
                    <View className="w-1/4"><Text>{cashFormat(account.amount)}</Text></View>
                    <View className="w-1/4"><Text>{account.type}</Text></View>
                    <Iconify icon='tabler:grip-vertical' size={20} />
                  </View>
                </View>
              </SwipeableRow>
            ))}
          </VStack>
        </ScrollView>
      </Card>
      <AddAccount open={isActionOpen} handleClose={setActionOpen} editAccount={accountSelected} editable={isEditable} />
      <View style={styles.buttonlayout}>
        <PrimaryButton onPress={() => setActionOpen(true)}>
          <Text className="text-2xl text-white">Crear cuenta</Text>
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
  buttonlayout: {
    paddingHorizontal: '3%'
  }
})

export default Tab