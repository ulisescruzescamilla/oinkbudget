/**
 * BudgetsScreen — monthly income allocation + per-budget accordion cards.
 * Ported from `design/src/budgets.jsx`, wired to the `useBudgets` API hook.
 */
import { useCallback, useState } from 'react';
import { Alert, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { askConfirm, Button, Card, CardHeader, Pill, Sheet, Text } from '@/components/ui';
import { AllocationBar, BudgetAccordionCard, EmptyState, NewBudgetForm, notifySuccess } from '@/components/features';
import { ScreenLayout } from '@/navigation/ScreenLayout';
import { useBudgets } from '@/hooks/useBudgets';
import { BudgetType } from '@/types/BudgetType';
import { cashFormat } from '@/utils/formatting';

/** Presupuestos tab. */
export function BudgetsScreen() {
  const router = useRouter();
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
  } = useBudgets();

  const [openId, setOpenId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BudgetType | null>(null);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const openCreate = () => { setEditing(null); clearFieldErrors(); setFormOpen(true); };
  const openEdit = (b: BudgetType) => { setEditing(b); clearFieldErrors(); setFormOpen(true); };
  const closeForm = () => { setFormOpen(false); clearFieldErrors(); };

  /** Saves the form's budget and confirms the change. */
  const saveBudget = async (b: BudgetType) => {
    const saved = await (editing ? updateBudget(b) : createBudget(b));
    if (saved) {
      notifySuccess({
        title: editing ? 'Presupuesto actualizado' : 'Presupuesto creado',
        subtitle: `${cashFormat(saved.max_limit)} · ${saved.name}`,
      });
    }
    return saved;
  };

  const confirmDelete = (b: BudgetType) => {
    askConfirm({
      title: `¿Eliminar el presupuesto ${b.name}?`,
      message: 'Tus movimientos se conservan, pero dejarán de contar contra este presupuesto. Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar presupuesto',
      onConfirm: async () => {
        try {
          await removeBudget(b);
          notifySuccess({ title: 'Presupuesto eliminado', subtitle: b.name, tone: 'expense' });
        } catch {
          Alert.alert('No se pudo eliminar el presupuesto', 'Inténtalo de nuevo más tarde.');
        }
      },
    });
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

      <Button variant="soft" icon="bolt" block size="lg" onPress={() => router.push('/plan-wizard')}>
        Armar mi plan con el asistente
      </Button>

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
          onSubmit={saveBudget}
          onDone={closeForm}
          fieldErrors={fieldErrors}
          loading={loading}
          allocatedPercentage={allocatedPercentage}
        />
      </Sheet>
    </ScreenLayout>
  );
}

export default BudgetsScreen;
