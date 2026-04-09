import { PrimaryButton, BudgetAccordion, GradientView } from "@/components/mine"
import { StyleSheet, View, Text } from "react-native"
import { Card } from "@/components/ui/card"
import { Heading } from "@/components/ui/heading"
import { Spinner } from "@/components/ui/spinner"
import { SafeAreaView } from "react-native-safe-area-context"
import React, { useCallback } from "react"
import { AddBudget } from "@/components/mine/actions/AddBudget"
import { BudgetType } from "@/types/BudgetType"
import { DeleteValidationModal } from "@/components/mine/actions/DeleteValidationModal"
import { useFocusEffect } from "expo-router"
import { ScrollView, RefreshControl } from "react-native"
import { useBudgets } from "@/hooks/useBudgets"
import { useState } from "react"

const Tab = () => {
  const {
    budgets,
    loading,
    fieldErrors,
    allocatedPercentage,
    refresh,
    clearFieldErrors,
    createBudget,
    updateBudget,
    removeBudget,
  } = useBudgets()

  const [toggle, setToggle] = useState<boolean>(false)
  const [deleteToggle, setDeleteToggle] = useState<boolean>(false)
  const [isEdit, setIsEdit] = useState<boolean>(false)
  const [budgetSelected, setBudgetSelected] = useState<BudgetType | null>(null)

  // Fetch on screen focus
  useFocusEffect(useCallback(() => { refresh() }, [refresh]))

  const handleCloseModal = () => {
    setToggle(false)
    setIsEdit(false)
    setBudgetSelected(null)
    clearFieldErrors()
  }

  const handleSave = async (budget: BudgetType) => {
    const result = isEdit
      ? await updateBudget(budget)
      : await createBudget(budget)
    // Mutations return undefined on error (fieldErrors is populated); close only on success
    if (result) {
      handleCloseModal()
    }
  }

  const handleDelete = async () => {
    if (budgetSelected) {
      await removeBudget(budgetSelected)
      setDeleteToggle(false)
      setBudgetSelected(null)
    }
  }

  return (
    <SafeAreaView style={styles.content}>
      {/* Add / Edit Budget modal */}
      <AddBudget
        open={toggle}
        handleClose={handleCloseModal}
        budget={budgetSelected}
        isEdit={isEdit}
        onSave={handleSave}
        allocatedPercentage={allocatedPercentage}
        fieldErrors={fieldErrors}
      />
      {/* Delete confirmation modal */}
      <DeleteValidationModal
        showModal={deleteToggle}
        setShowModal={setDeleteToggle}
        deleteAction={handleDelete}
      >
        <Heading>¿Estás seguro de eliminar este presupuesto y sus registros?</Heading>
      </DeleteValidationModal>

      {/* Header */}
      <GradientView>
        <Heading className="text-2xl color-white">Presupuestos</Heading>
        {loading && <Spinner size="small" className="mt-1" color="white" />}
      </GradientView>

      {/* Budget list */}
      <Card size="md" variant="elevated" className="p-2 m-4" style={{ flex: 1 }}>
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refresh} />
          }
        >
          {!budgets.length && !loading && (
            <View className="flex flex-row justify-center">
              <Heading>Ya puedes agregar tus presupuestos</Heading>
            </View>
          )}
          {budgets.map((budget) => (
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
        </ScrollView>
      </Card>

      <View style={styles.bottomButtonContainer}>
        <PrimaryButton loading={loading} onPress={() => {
          setIsEdit(false)
          setBudgetSelected(null)
          setToggle(true)
        }}>
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
