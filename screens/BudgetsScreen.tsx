/**
 * BudgetsScreen — monthly income allocation + per-budget accordion cards.
 * Ported from `design/src/budgets.jsx`, wired to the `useBudgets` API hook.
 */
import { useCallback, useState } from 'react';
import { Alert, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Button, Card, CardHeader, Pill, Sheet, Text } from '@/components/ui';
import { AllocationBar, BudgetAccordionCard, EmptyState, NewBudgetForm } from '@/components/features';
import { ScreenLayout } from '@/navigation/ScreenLayout';
import { useBudgets } from '@/hooks/useBudgets';
import { BudgetType } from '@/types/BudgetType';

/** Presupuestos tab. */
export function BudgetsScreen() {
  const { budgets, loading, fieldErrors, refresh, clearFieldErrors, createBudget, updateBudget, removeBudget } =
    useBudgets();

  console.debug('budgets: ', budgets);

  const [openId, setOpenId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BudgetType | null>(null);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const openCreate = () => { setEditing(null); clearFieldErrors(); setFormOpen(true); };
  const openEdit = (b: BudgetType) => { setEditing(b); clearFieldErrors(); setFormOpen(true); };
  const closeForm = () => { setFormOpen(false); clearFieldErrors(); };

  const confirmDelete = (b: BudgetType) => {
    Alert.alert('Eliminar presupuesto', `¿Eliminar "${b.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => removeBudget(b) },
    ]);
  };

  return (
    <ScreenLayout
      eyebrow="Plan mensual"
      title="Presupuestos"
      refreshing={loading}
      onRefresh={refresh}
      footer={
        <Button icon="plus" block size="lg" variant='primary' onPress={openCreate}>
          Agregar presupuesto
        </Button>
      }
    >
      <Card>
        <CardHeader title="Cómo divides tu ingreso" right={<Pill tone="primary">Este mes</Pill>} />
        {budgets.length > 0 ? (
          <AllocationBar budgets={budgets} />
        ) : (
          <Text className="py-2 text-sm font-semi text-muted">
            Aún no tienes presupuestos asignados.
          </Text>
        )}
      </Card>

      <View className="flex-row items-center justify-between px-1 pt-1">
        <Text className="font-display text-[14.5px] text-muted">Tus presupuestos</Text>
        <Text className="text-[12px] font-strong text-faint">{budgets.length} activos</Text>
      </View>

      {budgets.length === 0 ? (
        <Card>
          <EmptyState icon="chart" message="Crea tu primer presupuesto para controlar tus gastos." />
        </Card>
      ) : (
        budgets.map((b) => (
          <BudgetAccordionCard
            key={b.id}
            budget={b}
            open={openId === b.id}
            onToggle={() => setOpenId(openId === b.id ? null : b.id)}
            onEdit={() => openEdit(b)}
            onDelete={() => confirmDelete(b)}
          />
        ))
      )}

      <Sheet open={formOpen} onClose={closeForm} title={editing ? 'Editar presupuesto' : 'Nuevo presupuesto'}>
        <NewBudgetForm
          budget={editing}
          onSubmit={editing ? updateBudget : createBudget}
          onDone={closeForm}
          fieldErrors={fieldErrors}
          loading={loading}
        />
      </Sheet>
    </ScreenLayout>
  );
}

export default BudgetsScreen;
