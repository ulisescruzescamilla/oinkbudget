import { PrimaryButton, SimpleAccordion } from "@/components/mine"
import { StyleSheet, View, Text } from "react-native"
import { Card } from "@/components/ui/card"
import { Heading } from "@/components/ui/heading"
import { LinearGradient } from "@/components/ui/linear-gradient"
import { SafeAreaView } from "react-native-safe-area-context"
import React, { use, useEffect, useState } from "react"
import { AddBudget } from "@/components/mine/actions/AddBudget"
import { BudgetType } from "@/types/BudgetType"
import { deleteBudget, getBudgetByAccountId } from "@/database/budgetRepository"
import { getAllAccounts } from "@/database/accountRepository"
import { AccountType } from "@/types/AccountType"
import { ScrollView } from "react-native-gesture-handler"
import { DeleteValidationModal } from "@/components/mine/actions/DeleteValidationModal"

const Tab = () => {
  const [toogle, setToggle] = useState<boolean>(false)
  const [deleteToggle, setDeleteToggle] = useState<boolean>(false)

  const [accounts, setAccounts] = useState<AccountType[]>([])
  const [budgetSelected, setBudgetSelected] = useState<BudgetType>()

  const onDeleteBudget = () => {
    if (budgetSelected) {
      deleteBudget(budgetSelected)
      setDeleteToggle(false)
    }
  }

  useEffect(() => {
    getAllAccounts().then(fetchedAccounts => setAccounts(fetchedAccounts))
  }, [setToggle, deleteBudget])

  return (
    <SafeAreaView style={styles.content}>
      <AddBudget open={toogle} handleClose={() => setToggle(false)} />
      <DeleteValidationModal showModal={deleteToggle} setShowModal={setDeleteToggle} deleteAction={onDeleteBudget}>
        <Heading>¿Estás seguro de eliminar este presupuesto y sus registros?</Heading>
      </DeleteValidationModal>
      {/* Content */}
      <LinearGradient
        className="w-full p-2"
        colors={['#8637CF', '#0F55A1']}
        start={[0, 1]}
        end={[1, 0]}
      >
        <Heading className="text-2xl color-white">Presupuestos</Heading>
      </LinearGradient>
      <Card size="md" variant="elevated" className="p-2 m-4">
        <ScrollView>
          {accounts.map((account) => (
            <SimpleAccordion key={account.id} title={account.name} fetchData={() => getBudgetByAccountId(account.id)} setItem={setBudgetSelected} toogleItem={setDeleteToggle} />
          )
          )}
        </ScrollView>
      </Card>
      <View style={styles.bottomButtonContainer}>
        <PrimaryButton onPress={() => setToggle(true)}>
          <Text className="text-2xl text-white">Agregar Presupuesto</Text>
        </PrimaryButton>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  bottomButtonContainer: {
    justifyContent: 'flex-end',
    paddingHorizontal: '3%',
  },
})

export default Tab