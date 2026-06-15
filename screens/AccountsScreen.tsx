/**
 * AccountsScreen — total balance hero + per-account cards with masking.
 * Ported from `design/src/accounts.jsx`, wired to the `useAccounts` API hook.
 */
import { useCallback, useMemo, useState } from 'react';
import { Alert, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Button, Card, IconButton, Pill, Sheet, Text } from '@/components/ui';
import { AccountCard, EmptyState, NewAccountForm } from '@/components/features';
import { ScreenLayout } from '@/navigation/ScreenLayout';
import { useAccounts } from '@/hooks/useAccounts';
import { AccountType } from '@/types/AccountType';
import { cashFormat } from '@/utils/formatting';

/** Cuentas tab. */
export function AccountsScreen() {
  const { accounts, loading, fieldErrors, refresh, clearFieldErrors, createAccount, updateAccount, removeAccount } =
    useAccounts();

  const [hideAll, setHideAll] = useState(false);
  const [masked, setMasked] = useState<Record<number, boolean>>({});
  const [selected, setSelected] = useState<AccountType | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AccountType | null>(null);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const total = useMemo(() => accounts.reduce((s, a) => s + a.amount, 0), [accounts]);
  const isMasked = (id: number | null) => hideAll || (id != null && masked[id]);

  const openCreate = () => { setEditing(null); clearFieldErrors(); setFormOpen(true); };
  const openEdit = (a: AccountType) => { setSelected(null); setEditing(a); clearFieldErrors(); setFormOpen(true); };
  const closeForm = () => { setFormOpen(false); clearFieldErrors(); };

  const confirmDelete = (a: AccountType) => {
    setSelected(null);
    Alert.alert('Eliminar cuenta', `¿Eliminar "${a.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => removeAccount(a) },
    ]);
  };

  return (
    <ScreenLayout
      eyebrow="Tu dinero"
      title="Cuentas"
      refreshing={loading}
      onRefresh={refresh}
      footer={
        <Button icon="plus" block size="lg" onPress={openCreate}>
          Crear cuenta
        </Button>
      }
    >
      <Card hero>
        <View className="flex-row items-center justify-between">
          <Text className="text-[13px] font-strong text-white/80">Total de tus cuentas</Text>
          <IconButton
            icon={hideAll ? 'eyeoff' : 'eye'}
            size={34}
            iconSize={18}
            color="#fff"
            onPress={() => setHideAll((v) => !v)}
            className="border-0 bg-white/20 shadow-none"
          />
        </View>
        <Text className="mt-1 font-display text-[40px] text-white">
          {hideAll ? '••••••' : cashFormat(total)}
        </Text>
        <View className="mt-3 flex-row">
          <Pill tone="muted">{accounts.length} cuentas</Pill>
        </View>
      </Card>

      {accounts.length === 0 ? (
        <Card>
          <EmptyState icon="bank" message="Agrega una cuenta para empezar a registrar tu dinero." />
        </Card>
      ) : (
        accounts.map((a) => (
          <AccountCard
            key={a.id}
            account={a}
            total={total}
            masked={!!isMasked(a.id)}
            onToggleMask={() => a.id != null && setMasked((m) => ({ ...m, [a.id as number]: !m[a.id as number] }))}
            onManage={() => setSelected(a)}
          />
        ))
      )}

      <Sheet open={!!selected} onClose={() => setSelected(null)} title={selected?.name ?? ''}>
        {selected && (
          <View className="gap-2">
            <Button variant="ghost" icon="edit" block onPress={() => openEdit(selected)}>
              Editar cuenta
            </Button>
            <Button variant="danger-soft" icon="trash" block onPress={() => confirmDelete(selected)}>
              Eliminar cuenta
            </Button>
          </View>
        )}
      </Sheet>

      <Sheet open={formOpen} onClose={closeForm} title={editing ? 'Editar cuenta' : 'Nueva cuenta'}>
        <NewAccountForm
          account={editing}
          onSubmit={editing ? updateAccount : createAccount}
          onDone={closeForm}
          fieldErrors={fieldErrors}
          loading={loading}
        />
      </Sheet>
    </ScreenLayout>
  );
}

export default AccountsScreen;
