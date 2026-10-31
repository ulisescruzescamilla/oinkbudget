/**
 * CategoriesScreen — expense / income category list with create/edit/delete.
 * Ported from `TxCategories` in `design/src/txcats.jsx`, wired to the
 * `useCategories` API hook. Opened from the "Categorías" row in the settings
 * drawer.
 */
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { askConfirm, Button, Card, Icon, IconTile, Sheet, Text, type IconName } from '@/components/ui';
import { CategoryForm, EmptyState, TypeTabs, notifySuccess, type CategoryFormPayload } from '@/components/features';
import { ScreenLayout } from '@/navigation/ScreenLayout';
import { useCategories } from '@/hooks/useCategories';
import { CategoryKind, CategoryType } from '@/types/CategoryType';
import { categorySoft, isDefaultCategory } from '@/styles/categories';
import { useIsDark, useTheme } from '@/styles/useTheme';

const TAB_LABELS = { expense: 'Gastos', income: 'Ingresos' };

/** Categorías screen. */
export function CategoriesScreen() {
  const router = useRouter();
  const t = useTheme();
  const dark = useIsDark();
  const {
    categories,
    loading,
    error,
    fieldErrors,
    refresh,
    clearFieldErrors,
    createCategory,
    updateCategory,
    removeCategory,
  } = useCategories();

  const [kind, setKind] = useState<CategoryKind>('expense');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryType | null>(null);
  // Bumped on every open so the form remounts with fresh values.
  const [formKey, setFormKey] = useState(0);

  const openForm = (c: CategoryType | null) => {
    setEditing(c);
    clearFieldErrors();
    setFormKey((k) => k + 1);
    setFormOpen(true);
  };
  const openCreate = () => openForm(null);
  const openEdit = (c: CategoryType) => openForm(c);
  const closeForm = () => { setFormOpen(false); clearFieldErrors(); };

  // Defaults last, as in the design.
  const list = categories
    .filter((c) => c.type === kind)
    .sort((a, b) => Number(isDefaultCategory(a.name)) - Number(isDefaultCategory(b.name)));

  /** Saves the form's category and confirms the change. */
  const submit = async (values: CategoryFormPayload) => {
    const payload = { ...values, type: values.type ?? editing?.type ?? kind };
    const saved = await (editing ? updateCategory({ ...payload, id: editing.id }) : createCategory(payload));
    if (saved) {
      notifySuccess({
        title: editing ? 'Cambios guardados' : 'Categoría creada',
        subtitle: saved.name,
        tone: saved.type === 'income' ? 'income' : 'primary',
      });
      // Show the tab the new category landed in.
      setKind(saved.type);
    }
    return saved;
  };

  const confirmDelete = (c: CategoryType) => {
    askConfirm({
      title: `¿Eliminar la categoría ${c.name}?`,
      message: 'Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar categoría',
      onConfirm: async () => {
        const ok = await removeCategory(c);
        if (ok) notifySuccess({ title: 'Categoría eliminada', subtitle: c.name, tone: 'expense' });
        else Alert.alert('No se pudo eliminar la categoría', 'Inténtalo de nuevo más tarde.');
      },
    });
  };

  return (
    <ScreenLayout
      eyebrow="Organiza"
      title="Categorías"
      onBack={() => router.back()}
      refreshing={loading && !formOpen}
      onRefresh={refresh}
      footer={
        <Button icon="plus" block size="lg" onPress={openCreate}>
          Nueva categoría
        </Button>
      }
    >
      <TypeTabs value={kind} onChange={setKind} labels={TAB_LABELS} />

      {list.length === 0 ? (
        <Card>
          <EmptyState
            icon="tag"
            message={
              kind === 'income'
                ? 'Crea una categoría para clasificar tus ingresos.'
                : 'Crea una categoría para clasificar tus gastos.'
            }
          />
        </Card>
      ) : (
        <Card flush className="py-1">
          {list.map((c, i) => {
            const locked = isDefaultCategory(c.name);
            return (
              <Pressable
                key={c.id}
                onPress={() => openEdit(c)}
                accessibilityRole="button"
                accessibilityLabel={`Editar ${c.name}`}
                className={`flex-row items-center gap-3 px-4 py-[11px] active:bg-card-2 ${i > 0 ? 'border-t border-border' : ''}`}
              >
                <IconTile icon={c.icon_code as IconName} bg={categorySoft(c.color, dark)} color={c.color} />
                <View className="min-w-0 flex-1">
                  <Text className="font-strong text-[14.5px]" numberOfLines={1}>
                    {c.name}
                  </Text>
                  {locked ? (
                    <Text className="mt-px text-[12.5px] font-semi text-muted">Predeterminada</Text>
                  ) : null}
                </View>
                {!locked && (
                  <Pressable
                    onPress={() => confirmDelete(c)}
                    accessibilityRole="button"
                    accessibilityLabel={`Eliminar ${c.name}`}
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

      <Sheet open={formOpen} onClose={closeForm} title={editing ? 'Editar categoría' : 'Nueva categoría'}>
        <CategoryForm
          key={formKey}
          category={editing}
          categories={categories}
          kind={kind}
          onSubmit={submit}
          onDone={closeForm}
          fieldErrors={fieldErrors}
          errorMessage={error?.message}
          loading={loading}
        />
      </Sheet>
    </ScreenLayout>
  );
}

export default CategoriesScreen;
