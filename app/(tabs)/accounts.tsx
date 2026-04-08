import { PrimaryButton, SwipeableRow } from "@/components/mine"
import AddAccount from "@/components/mine/actions/AddAccount"
import { View } from "@/components/Themed"
import { Card } from "@/components/ui/card"
import { Heading } from "@/components/ui/heading"
import { LinearGradient } from "@/components/ui/linear-gradient"
import { Text } from "react-native"
import { VStack } from "@/components/ui/vstack"
import { AccountType } from "@/types/AccountType"
import { cashFormat } from "@/utils/formatting"
import { useCallback, useMemo, useState } from "react"
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity } from "react-native"
import Iconify from "react-native-iconify"
import { SafeAreaView } from "react-native-safe-area-context"
import { TransferAccount } from "@/components/mine/actions/TransferAccount"
import { DeleteValidationModal } from "@/components/mine/actions/DeleteValidationModal"
import { useFocusEffect } from "expo-router"
import { HStack } from "@/components/ui/hstack"
import { Grid, GridItem } from "@/components/ui/grid"
import { Divider } from "@/components/ui/divider"
import { useAccounts } from "@/hooks/useAccounts"
import { Spinner } from "@/components/ui/spinner"

const Tab = () => {

  const { accounts, loading, fieldErrors, refresh, clearFieldErrors, createAccount, updateAccount, removeAccount, transferAccounts } = useAccounts()

  const [isActionOpen, setActionOpen] = useState(false)
  const [isTransferOpen, setTransferOpen] = useState(false)
  const [isDeleteOpen, setDeleteOpen] = useState(false)
  const [accountSelected, setAccountSelected] = useState<AccountType | undefined>()
  const [isEditable, setIsEditable] = useState<boolean>(false)

  // Fetch on screen focus
  useFocusEffect(useCallback(() => { refresh() }, [refresh]))

  const totalBalance = useMemo(
    () => accounts.filter((a) => !a.hidden).reduce((sum, a) => parseFloat(sum) + parseFloat(a.amount), 0),
    [accounts]
  )

  const handleSave = async (account: AccountType) => {
    if (isEditable) {
      await updateAccount(account)
    } else {
      await createAccount(account)
    }
    setIsEditable(false)
    setAccountSelected(undefined)

    // hide action card
    setActionOpen(false)
  }

  const handleDelete = async () => {
    if (accountSelected) {
      await removeAccount(accountSelected)
      setDeleteOpen(false)
      setAccountSelected(undefined)
    }
  }

  const handleTransfer = async (to: AccountType, amount: number) => {
    if (accountSelected) {
      await transferAccounts(accountSelected, to, amount)
      setAccountSelected(undefined)
    }
  }

  return (
    <SafeAreaView style={styles.content}>
      {/* Modals */}
      <TransferAccount
        showModal={isTransferOpen}
        setShowModal={setTransferOpen}
        originAccount={accountSelected}
        accounts={accounts}
        onTransfer={handleTransfer}
      />
      <DeleteValidationModal
        showModal={isDeleteOpen}
        setShowModal={setDeleteOpen}
        deleteAction={handleDelete}
      >
        <Heading>¿Estás seguro de eliminar esta cuenta y sus registros?</Heading>
      </DeleteValidationModal>

      {/* Header */}
      <LinearGradient
        className="w-full p-2"
        colors={['#8637CF', '#0F55A1']}
        start={[0, 1]}
        end={[1, 0]}
      >
        <Heading className="text-2xl color-white">Cuentas</Heading>
        {loading && <Spinner size="small" className="mt-1" color="white" />}
      </LinearGradient>

      {/* General balance */}
      <Card size="md" variant="elevated" className="p-3 m-3">
        <VStack>
          <Heading>Total de tus cuentas</Heading>
          <Text className="text-lg">{cashFormat(totalBalance)}</Text>
        </VStack>
      </Card>

      {/* Account list */}
      <Card size="md" variant="elevated" className="p-2 m-4">
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refresh} />
          }
        >
          {!accounts.length && !loading && (
            <View className="flex flex-row items-center justify-center p-4 text-center">
              <Heading size={'xl'}>Ya puedes crear tu nueva cuenta</Heading>
            </View>
          )}
          <VStack space={'lg'}>
            {accounts.map((account, index) => (
              <SwipeableRow
                key={account.id ?? index}
                options={
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
                      setAccountSelected(account)
                      setTransferOpen(true)
                    }}>
                      <Iconify icon='tabler:transfer' width={32} />
                    </TouchableOpacity>
                  </View>
                }
              >
                <View className="w-full p-2">
                  <Grid className="gap-4" _extra={{ className: 'grid-cols-10' }}>
                    <GridItem _extra={{ className: 'col-span-4' }}>
                      <View><Heading>{account.name}</Heading></View>
                    </GridItem>
                    <GridItem _extra={{ className: 'col-span-4' }}>
                      <View><Text>{cashFormat(account.amount)}</Text></View>
                    </GridItem>
                    <GridItem _extra={{ className: 'col-span-1' }}>
                      <View>{account.hidden ? <Iconify icon="tabler:eye-closed" /> : <Iconify icon="tabler:eye" />}</View>
                    </GridItem>
                    <GridItem _extra={{ className: 'col-span-1' }}>
                      <View><Iconify icon='tabler:grip-vertical' size={20} /></View>
                    </GridItem>
                    {(accounts.length > 0 && (index + 1) != accounts.length) && <Divider className="w-full" />}
                  </Grid>
                </View>
              </SwipeableRow>
            ))}
          </VStack>
        </ScrollView>
      </Card>

      <AddAccount
        loading={loading}
        open={isActionOpen}
        handleClose={(open) => {
          setActionOpen(open)
          if (!open) {
            setIsEditable(false)
            setAccountSelected(undefined)
            clearFieldErrors()
          }
        }}
        editAccount={accountSelected}
        editable={isEditable}
        onSave={handleSave}
        fieldErrors={fieldErrors}
      />
      <View style={styles.buttonlayout}>
        <PrimaryButton onPress={() => setActionOpen(true)} loading={loading}>
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
