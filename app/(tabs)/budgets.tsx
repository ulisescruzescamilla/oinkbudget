import { PrimaryButton, BudgetAccordion, GradientView } from "@/components/mine"
import { StyleSheet, View, Text } from "react-native"
import { Card } from "@/components/ui/card"
import { Heading } from "@/components/ui/heading"
import { LinearGradient } from "@/components/ui/linear-gradient"
import { SafeAreaView } from "react-native-safe-area-context"
import React, { useCallback, useEffect, useState } from "react"
import { AddBudget } from "@/components/mine/actions/AddBudget"
import { BudgetType } from "@/types/BudgetType"
import { deleteBudget, getAllBudgets, getBudgetById } from "@/database/budgetRepository"
import { DeleteValidationModal } from "@/components/mine/actions/DeleteValidationModal"
import { cashFormat } from "@/utils/formatting"
import { useFocusEffect } from "expo-router"

const Tab = () => {
  const [toogle, setToggle] = useState<boolean>(false)
  const [deleteToggle, setDeleteToggle] = useState<boolean>(false)
  const [isEdit, setIsEdit] = useState<boolean>(false)

  // View data
  const [budgets, setBudgets] = useState<BudgetType[]>([])
  console.debug("Budgets:", budgets)
  const [budgetSelected, setBudgetSelected] = useState<BudgetType | null>(null)

  const handleCloseModal = () => {
    setToggle(false)
    setIsEdit(false)
    setBudgetSelected(null)
  }

  const onDeleteBudget = () => {
    if (budgetSelected) {
      deleteBudget(budgetSelected)
      setDeleteToggle(false)
      setBudgetSelected(null)
    }
  }

  useFocusEffect(
    useCallback(() => {
      getAllBudgets().then((data) => setBudgets(data))
    }, [])
  );

  useEffect(() => {
    getAllBudgets().then((data) => setBudgets(data))
  }, [setToggle, onDeleteBudget])

  return (
    <SafeAreaView style={styles.content}>
      {/* Add / Edit Budget Accordion */}
      <AddBudget
        open={toogle}
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