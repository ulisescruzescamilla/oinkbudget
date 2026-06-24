/**
 * DashboardScreen — "Inicio": today's spending ring + trend, quick capture
 * shortcuts, available-per-budget summary and latest movements.
 * Ported from `design/src/dashboard.jsx`, reading the local data layer.
 */
import { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Card, CardHeader, Icon, IconTile, Pill, ProgressBar, Ring, Text, TrendBars } from '@/components/ui';
import { EmptyState, TransactionRow, balanceSignedAmount } from '@/components/features';
import { ScreenLayout } from '@/navigation/ScreenLayout';
import { useQuickAdd } from '@/navigation/QuickAddProvider';
import { getAllBudgets } from '@/database/budgetRepository';
import { getBalance } from '@/database/balanceRepository';
import { BudgetType } from '@/types/BudgetType';
import { BalanceType } from '@/types/BalanceType';
import { cashFormat } from '@/utils/formatting';
import { useTheme } from '@/styles/useTheme';
import { useDashboard } from '@/hooks/useDashboard';

const WEEKDAY = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

/** Inicio tab. */
export function DashboardScreen() {
  const t = useTheme();
  const router = useRouter();
  const { open, version } = useQuickAdd();

  const [budgets, setBudgets] = useState<BudgetType[]>([]);
  const [balances, setBalances] = useState<BalanceType[]>([]);
  const { dashboard, loading: loadingDashboard, fieldErrors, refresh, clearFieldErrors } =
    useDashboard();

  const load = useCallback(async () => {
    refresh()
  }, [refresh]);

  useFocusEffect(useCallback(() => { load(); }, [load, version]));

  const today = new Date().toISOString().slice(0, 10);

  const pct = 0;

  // 7-day expense trend (oldest -> today).
  const trend = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    const v = balances
      .filter((x) => x.type === 'expense' && String(x.created_at).slice(0, 10) === key)
      .reduce((s, x) => s + Math.abs(x.amount), 0);
    return { d: WEEKDAY[d.getDay()], v };
  });

  const withAvail = budgets.map((b) => ({ b, avail: b.max_limit - (b.expense_amount ?? 0) }));
  const totalAvail = withAvail.reduce((s, x) => s + x.avail, 0);
  const top = [...withAvail]
    .sort((a, b) => (b.b.expense_amount ?? 0) / (b.b.max_limit || 1) - (a.b.expense_amount ?? 0) / (a.b.max_limit || 1))
    .slice(0, 3);

  const recent = [...balances].reverse().slice(0, 4);

  return (
    <ScreenLayout eyebrow="Tu resumen" title="Inicio" refreshing={loadingDashboard} onRefresh={load}>
      {/* Gastos de hoy */}
      <Card>
        <CardHeader title="Gastos de hoy" right={<Pill tone="primary">Hoy</Pill>} />
        <View className="flex-row items-center gap-3.5">
          <Ring pct={pct} size={128} stroke={13}>
            <Text className="font-display text-[26px]">{pct}%</Text>
            <Text className="text-[11px] font-semi text-muted">del límite</Text>
          </Ring>
          <View className="flex-1 gap-3.5">
            <View>
              <Text className="text-[13px] font-strong text-muted">Total gastado hoy</Text>
              <Text className="font-display text-[34px]">{cashFormat(dashboard?.total_expense_today)}</Text>
            </View>
            <View>
              <Text className="text-[13px] font-strong text-muted">Límite diario</Text>
              <Text className="font-display text-[19px]">{cashFormat(dashboard?.daily_limit)}</Text>
            </View>
          </View>
        </View>
        <View className="my-3.5 h-px bg-border" />
        <CardHeader title="Últimos 7 días" />
        <TrendBars data={trend} />
      </Card>

      {/* Captura rápida */}
      <View className="flex-row gap-3">
        <Pressable
          onPress={() => open('expense')}
          className="flex-1 items-center rounded-pill bg-expense-soft py-4 active:scale-95"
        >
          <View className="flex-row items-center gap-2">
            <Icon name="down" size={19} strokeWidth={2.4} color={t.expense} />
            <Text className="font-display text-[15px]" style={{ color: t.expense }}>Gasto</Text>
          </View>
        </Pressable>
        <Pressable
          onPress={() => open('income')}
          className="flex-1 items-center rounded-pill bg-income-soft py-4 active:scale-95"
        >
          <View className="flex-row items-center gap-2">
            <Icon name="up" size={19} strokeWidth={2.4} color={t.income} />
            <Text className="font-display text-[15px]" style={{ color: t.income }}>Ingreso</Text>
          </View>
        </Pressable>
      </View>

      {/* Disponible por presupuesto */}
      <Card>
        <CardHeader title="Disponible por presupuesto" linkLabel="Ver todos" onLinkPress={() => router.push('/budgets')} />
        {top.length === 0 ? (
          <Text className="py-2 text-sm font-semi text-muted">Aún no tienes presupuestos.</Text>
        ) : (
          <View className="gap-4">
            {top.map(({ b, avail }) => {
              const over = avail <= 0;
              return (
                <View key={b.id} className="gap-2">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <IconTile category={b.name} size={26} />
                      <Text className="font-display text-[14px]">{b.name}</Text>
                    </View>
                    <Text className="font-display text-[14px]" style={{ color: over ? t.expense : t.income }}>
                      {over ? 'Sin disponible' : `${cashFormat(avail)} libre`}
                    </Text>
                  </View>
                  <ProgressBar value={b.expense_amount ?? 0} max={b.max_limit} />
                  <Text className="text-[12px] font-strong text-faint">
                    {cashFormat(b.expense_amount ?? 0)} de {cashFormat(b.max_limit)}
                  </Text>
                </View>
              );
            })}
            <View className="h-px bg-border" />
            <View className="flex-row items-center justify-between">
              <Text className="text-[14px] font-strong text-muted">Total disponible</Text>
              <Text className="font-display text-[19px]" style={{ color: t.income }}>{cashFormat(totalAvail)}</Text>
            </View>
          </View>
        )}
      </Card>

      {/* Últimos movimientos */}
      <Card flush>
        <View className="px-[18px] pb-1.5 pt-[18px]">
          <CardHeader title="Últimos movimientos" linkLabel="Ver todo" onLinkPress={() => router.push('/history')} className="mb-0" />
        </View>
        {recent.length === 0 ? (
          <EmptyState icon="swap" message="Aún no hay movimientos. Agrega tu primer gasto o ingreso." />
        ) : (
          recent.map((tx, i) => (
            <TransactionRow
              key={`${i}-${tx.id ?? ''}`}
              item={tx}
              subtitle={`${tx.budget_name || (balanceSignedAmount(tx) > 0 ? 'Ingreso' : 'Otro')} · ${tx.account_name}`}
              onPress={() => router.push('/history')}
            />
          ))
        )}
      </Card>
    </ScreenLayout>
  );
}

export default DashboardScreen;
