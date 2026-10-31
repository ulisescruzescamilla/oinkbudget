/**
 * RecurrentBudgetsScreen — recurrent budget list with create/edit/delete.
 * Ported from `Categories` in `design/src/categories.jsx` ("Presupuestos
 * recurrentes"), wired to the `useRecurrentBudgets` API hook. Opened from the
 * "Presupuestos recurrentes" row in the settings drawer.
 */
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { askConfirm, Button, Card, Heading, Icon, IconTile, Sheet, Text, type IconName } from '@/components/ui';
import { CategoryForm, EmptyState, notifySuccess, type CategoryFormCopy } from '@/components/features';
import { ScreenLayout } from '@/navigation/ScreenLayout';
import { useRecurrentBudgets } from '@/hooks/useRecurrentBudgets';
import { RecurrentBudgetType } from '@/types/RecurrentBudgetType';
import { RecurrentBudgetPayload } from '@/services/recurrentBudgetService';
import { categorySoft, isDefaultCategory } from '@/styles/categories';
import { useIsDark, useTheme } from '@/styles/useTheme';

const FORM_COPY: CategoryFormCopy = {
  placeholder: 'Nuevo presupuesto recurrente',
  duplicate: 'Ya existe un presupuesto recurrente con ese nombre',
  create: 'Crear presupuesto recurrente',
};

/** Presupuestos recurrentes screen. */
export function RecurrentBudgetsScreen() {
  const router = useRouter();
  const t = useTheme();
  const dark = useIsDark();
  const {
    recurrentBudgets,
    loading,
    error,
    fieldErrors,
    refresh,
    clearFieldErrors,
    createRecurrentBudget,
    updateRecurrentBudget,
    removeRecurrentBudget,
  } = useRecurrentBudgets();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RecurrentBudgetType | null>(null);
  // Bumped on every open so the form remounts with fresh values.
  const [formKey, setFormKey] = useState(0);

  const openForm = (r: RecurrentBudgetType | null) => {
    setEditing(r);
    clearFieldErrors();
    setFormKey((k) => k + 1);
    setFormOpen(true);
  };
  const openCreate = () => openForm(null);
  const openEdit = (r: RecurrentBudgetType) => openForm(r);
  const closeForm = () => { setFormOpen(false); clearFieldErrors(); };

  /** Saves the form's recurrent budget and confirms the change. */
  const submit = async (payload: RecurrentBudgetPayload) => {
    const saved = await (editing
      ? updateRecurrentBudget({ ...payload, id: editing.id })
      : createRecurrentBudget(payload));
    if (saved) notifySuccess({ title: editing ? 'Cambios guardados' : 'Presupuesto recurrente creado', subtitle: saved.name });
    return saved;
  };

  const confirmDelete = (r: RecurrentBudgetType) => {
    askConfirm({
      title: `¿Eliminar el presupuesto recurrente ${r.name}?`,
      message: 'Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar presupuesto recurrente',
      onConfirm: async () => {
        const ok = await removeRecurrentBudget(r);
        if (ok) notifySuccess({ title: 'Presupuesto recurrente eliminado', subtitle: r.name, tone: 'expense' });
        else Alert.alert('No se pudo eliminar el presupuesto recurrente', 'Inténtalo de nuevo más tarde.');
      },
    });
  };

  return (
    <ScreenLayout
      eyebrow="Organiza"
      title="Presupuestos recurrentes"
      onBack={() => router.back()}
      refreshing={loading && !formOpen}
      onRefresh={refresh}
      footer={
        <Button icon="plus" block size="lg" onPress={openCreate}>
          Nuevo presupuesto recurrente
        </Button>
      }
    >
      <View className="flex-row items-center justify-between px-1 pt-1">
        <Heading size="sm" className="text-[14.5px] text-muted">
          Registrados
        </Heading>
        <Text className="text-[12px] font-strong text-faint">{recurrentBudgets.length}</Text>
      </View>

      {recurrentBudgets.length === 0 ? (
        <Card>
          <EmptyState
            icon="tag"
            message={!formOpen && error ? error.message : 'Crea un presupuesto recurrente para organizar tu plan.'}
          />
        </Card>
      ) : (
        <Card flush className="py-1">
          {recurrentBudgets.map((r, i) => {
            const locked = isDefaultCategory(r.name);
            return (
              <Pressable
                key={r.id}
                onPress={() => openEdit(r)}
                accessibilityRole="button"
                accessibilityLabel={`Editar ${r.name}`}
                className={`flex-row items-center gap-3 px-4 py-[11px] active:bg-card-2 ${i > 0 ? 'border-t border-border' : ''}`}
              >
                <IconTile icon={r.icon_code as IconName} bg={categorySoft(r.color, dark)} color={r.color} />
                <View className="min-w-0 flex-1">
                  <Text className="font-strong text-[14.5px]" numberOfLines={1}>
                    {r.name}
                  </Text>
                  {locked ? (
                    <Text className="mt-px text-[12.5px] font-semi text-muted">Predeterminada</Text>
                  ) : null}
                </View>
                {!locked && (
                  <Pressable
                    onPress={() => confirmDelete(r)}
                    accessibilityRole="button"
                    accessibilityLabel={`Eliminar ${r.name}`}
                    hitSlop={4}
                    className="h-9 w-9 items-center justify-center rounded-[11px] bg-expense-soft active:scale-[0.92]"
                  >
                    <Icon name="trash" size={17} strokeWidth={2.2} color={t.expense} />
                  </Pressable>
                )}
                <Icon name="chev" size={18} color={t.faint} />
              </Pressable>
            );
          })}
        </Card>
      )}

      <Sheet
        open={formOpen}
        onClose={closeForm}
        title={editing ? 'Editar presupuesto recurrente' : 'Nuevo presupuesto recurrente'}
      >
        <CategoryForm
          key={formKey}
          category={editing}
          categories={recurrentBudgets}
          onSubmit={submit}
          onDone={closeForm}
          fieldErrors={fieldErrors}
          errorMessage={error?.message}
          loading={loading}
          copy={FORM_COPY}
        />
      </Sheet>
    </ScreenLayout>
  );
}

export default RecurrentBudgetsScreen;
