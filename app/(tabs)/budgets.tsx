import { PrimaryButton, BudgetAccordion, GradientView } from "@/components/mine"
import { StyleSheet, View, Text } from "react-native"
import { Card } from "@/components/ui/card"
import { Heading } from "@/components/ui/heading"
import { SafeAreaView } from "react-native-safe-area-context"
import React, { useCallback, useEffect, useState } from "react"
import { AddBudget } from "@/components/mine/actions/AddBudget"
import { BudgetType } from "@/types/BudgetType"
import { deleteBudget, getAllBudgets, getBudgetById } from "@/database/budgetRepository"
import { DeleteValidationModal } from "@/components/mine/actions/DeleteValidationModal"
import { useFocusEffect } from "expo-router"
import { ScrollView } from "react-native-gesture-handler"

const Tab = () => {
  const [toggle, setToggle] = useState<boolean>(false)
  const [deleteToggle, setDeleteToggle] = useState<boolean>(false)
  const [isEdit, setIsEdit] = useState<boolean>(false)

  // View data
  const [budgets, setBudgets] = useState<BudgetType[]>([])
  const [budgetSelected, setBudgetSelected] = useState<BudgetType | null>(null)

  const handleCloseModal = () => {
    setToggle(false)
    setIsEdit(false)
    setBudgetSelected(null)
  }

  const onDeleteBudget = async () => {
    if (budgetSelected) {
      await deleteBudget(budgetSelected)
      setDeleteToggle(false)
      setBudgetSelected(null)
      // Refresh budgets list after deletion
      const data = await getAllBudgets()
      setBudgets(data)
    }
  }

  const refreshBudgets = useCallback(async () => {
    const data = await getAllBudgets()
    setBudgets(data)
  }, [])

  useFocusEffect(
    useCallback(() => {
      refreshBudgets()
    }, [refreshBudgets])
  )

  // Refresh budgets when modal closes (after add/edit operations)
  useEffect(() => {
    if (!toggle) {
      refreshBudgets()
    }
  }, [toggle, refreshBudgets])

  return (
    <SafeAreaView style={styles.content}>
      {/* Add / Edit Budget Accordion */}
      <AddBudget
        open={toggle}
        handleClose={handleCloseModal}
        budget={budgetSelected}
        isEdit={isEdit}
      />
      {/* Modal delete confirmation */}
      <DeleteValidationModal showModal={deleteToggle} setShowModal={setDeleteToggle} deleteAction={onDeleteBudget}>
        <Heading>¿Estás seguro de eliminar este presupuesto y sus registros?</Heading>
      </DeleteValidationModal>
      {/* Content */}
      <GradientView>
        <Heading className="text-2xl color-white">Presupuestos</Heading>
      </GradientView>
      <Card size="md" variant="elevated" className="p-2 m-4" style={{ flex: 1 }}>
        <ScrollView>
          {budgets.length === 0 && (
            <View className="flex flex-row justify-center">
              <Heading>Ya puedes agregar tus presupuestos</Heading>
            </View>
          )}
          {budgets.length > 0 && budgets.map((budget) => (
            <BudgetAccordion
              key={budget.id}
              budget={budget}
              onDelete={() => {
                setBudgetSelected(budget)
                setDeleteToggle(true)
              }}
              onEdit={() => {
                setBudgetSelected(budget)
                setIsEdit(true)
                setToggle(true)
              }}
            />
          ))}
        </ScrollView>;
      </Card>
      <View style={styles.bottomButtonContainer}>
        <PrimaryButton onPress={() => {
          setIsEdit(false)
          setBudgetSelected(null)
          setToggle(true)
        }}>
          <Text className="text-2xl text-white">Agregar Presupuesto</Text>
        </PrimaryButton>
      </View>
    </SafeAreaView >
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